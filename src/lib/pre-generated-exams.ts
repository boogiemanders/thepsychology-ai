'use client'

import { createClient } from '@supabase/supabase-js'

// Types
interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  domain: string
  difficulty: 'easy' | 'medium' | 'hard'
  isScored?: boolean
  knId?: string
  type?: string
}

interface ExamQuestions {
  questions: Question[]
}

interface PreGeneratedExam {
  id: string
  user_id: string
  exam_type: 'diagnostic' | 'practice'
  questions: ExamQuestions
  generated_at: string
  expires_at: string
  used: boolean
  created_at: string
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing - pre-generated exams will not work')
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

/**
 * Get a pre-generated exam for a user
 * Returns null if no valid pre-gen exists
 * Marks exam as used when retrieved
 */
export async function getPreGeneratedExam(
  userId: string,
  examType: 'diagnostic' | 'practice'
): Promise<ExamQuestions | null> {
  if (!supabase) {
    console.warn('Supabase not initialized - cannot fetch pre-generated exam')
    return null
  }

  try {
    // Fetch unused, non-expired exam
    const { data, error } = await supabase
      .from('pre_generated_exams')
      .select('id, questions, expires_at')
      .eq('user_id', userId)
      .eq('exam_type', examType)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is normal
        return null
      }
      console.error('Error fetching pre-generated exam:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Mark as used
    await supabase.from('pre_generated_exams').update({ used: true }).eq('id', data.id)

    return data.questions
  } catch (err) {
    console.error('Error in getPreGeneratedExam:', err)
    return null
  }
}

/**
 * Save a pre-generated exam for a user
 */
export async function savePreGeneratedExam(
  userId: string,
  examType: 'diagnostic' | 'practice',
  questions: ExamQuestions
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not initialized - cannot save pre-generated exam')
    return false
  }

  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiration

    const { error } = await supabase.from('pre_generated_exams').insert({
      user_id: userId,
      exam_type: examType,
      questions,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (error) {
      console.error('Error saving pre-generated exam:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in savePreGeneratedExam:', err)
    return false
  }
}

/**
 * Check if a valid pre-generated exam exists for a user
 */
export async function hasValidPreGeneratedExam(
  userId: string,
  examType: 'diagnostic' | 'practice'
): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('pre_generated_exams')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('exam_type', examType)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    if (error) {
      console.error('Error checking for pre-generated exam:', error)
      return false
    }

    return (data?.length ?? 0) > 0
  } catch (err) {
    console.error('Error in hasValidPreGeneratedExam:', err)
    return false
  }
}

/**
 * Trigger background pre-generation of next exam
 * Called from the prioritizer page after exam completion
 * Uses improved job queue for better reliability
 */
export async function triggerBackgroundPreGeneration(
  userId: string,
  lastExamType: 'diagnostic' | 'practice'
): Promise<void> {
  try {
    // Determine next exam type
    const nextExamType = lastExamType === 'diagnostic' ? 'practice' : 'diagnostic'

    // Check if we already have a valid pre-gen for this type
    const hasExisting = await hasValidPreGeneratedExam(userId, nextExamType)
    if (hasExisting) {
      console.log(`Pre-generated ${nextExamType} exam already exists`)
      return
    }

    // Use improved job queue handler if available (client-side)
    if (typeof window !== 'undefined') {
      try {
        const { enqueueExamGeneration } = await import('./background-job-handler')
        enqueueExamGeneration(userId, nextExamType)
        console.log(`[Pre-Gen] Queued ${nextExamType} exam generation for user ${userId}`)
        return
      } catch (err) {
        console.warn('Job queue handler not available, falling back to direct fetch')
      }
    }

    // Fire-and-forget background generation (fallback)
    // DISABLED: This tries to write to filesystem which doesn't work on Vercel
    // Exams are now pre-generated and committed to git in /exams directory
    console.log('[Pre-Gen] Background generation disabled - using pre-generated exams from /exams directory')
    // fetch('/api/pre-generate-exam', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     userId,
    //     examType: nextExamType,
    //   }),
    // }).catch((err) => {
    //   console.error('Background pre-generation failed (non-critical):', err)
    // })
  } catch (err) {
    console.error('Error triggering background pre-generation:', err)
  }
}

/**
 * Clean up expired exams (should be called periodically or via cron)
 * Deletes exams that are:
 * 1. Marked as used AND created more than 1 day ago
 * 2. Expired (expires_at < now)
 */
export async function cleanupExpiredExams(): Promise<number> {
  if (!supabase) {
    console.warn('Supabase not initialized - cannot cleanup exams')
    return 0
  }

  try {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const now = new Date()

    // Delete used exams older than 1 day
    const { data: usedDeleted, error: usedError } = await supabase
      .from('pre_generated_exams')
      .delete()
      .eq('used', true)
      .lt('created_at', oneDayAgo.toISOString())

    // Delete expired exams
    const { data: expiredDeleted, error: expiredError } = await supabase
      .from('pre_generated_exams')
      .delete()
      .lt('expires_at', now.toISOString())

    if (usedError) {
      console.error('Error deleting used exams:', usedError)
    }
    if (expiredError) {
      console.error('Error deleting expired exams:', expiredError)
    }

    const count = (usedDeleted?.length ?? 0) + (expiredDeleted?.length ?? 0)
    if (count > 0) {
      console.log(`Cleaned up ${count} pre-generated exams`)
    }
    return count
  } catch (err) {
    console.error('Error in cleanupExpiredExams:', err)
    return 0
  }
}

/**
 * Mark a specific exam as used
 * (utility function for more control)
 */
export async function markExamAsUsed(examId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not initialized')
    return false
  }

  try {
    const { error } = await supabase
      .from('pre_generated_exams')
      .update({ used: true })
      .eq('id', examId)

    if (error) {
      console.error('Error marking exam as used:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in markExamAsUsed:', err)
    return false
  }
}

/**
 * Get pre-generation stats for a user (for analytics/debugging)
 */
export async function getPreGenStats(userId: string): Promise<{
  totalGenerated: number
  totalUsed: number
  unexpiredUnused: number
  expiredCount: number
} | null> {
  if (!supabase) {
    return null
  }

  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase.from('pre_generated_exams').select('*').eq('user_id', userId)

    if (error) {
      console.error('Error fetching pre-gen stats:', error)
      return null
    }

    if (!data) {
      return { totalGenerated: 0, totalUsed: 0, unexpiredUnused: 0, expiredCount: 0 }
    }

    const totalGenerated = data.length
    const totalUsed = data.filter((e) => e.used).length
    const unexpiredUnused = data.filter((e) => !e.used && e.expires_at > now).length
    const expiredCount = data.filter((e) => e.expires_at <= now).length

    return {
      totalGenerated,
      totalUsed,
      unexpiredUnused,
      expiredCount,
    }
  } catch (err) {
    console.error('Error in getPreGenStats:', err)
    return null
  }
}
