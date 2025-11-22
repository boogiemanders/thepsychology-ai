import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

/**
 * Cron endpoint for periodic background exam generation
 * This should be called by a cron service (e.g., Vercel Cron, Upstash, etc.)
 *
 * Functionality:
 * 1. Find users who don't have pre-generated exams
 * 2. Generate exams for them in the background
 * 3. Clean up expired exams
 * 4. Return statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    // Verify the cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting scheduled exam generation and cleanup')

    // Step 1: Get all active users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1000)

    if (usersError) {
      console.error('[Cron] Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', stats: null },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('[Cron] No users found')
      return NextResponse.json(
        { success: true, stats: { usersProcessed: 0, generationTriggered: 0, cleanupCompleted: 0 } },
        { status: 200 }
      )
    }

    let generationTriggered = 0
    let generationErrors = 0

    // Step 2: For each user, check if they need pre-generated exams
    console.log(`[Cron] Processing ${users.length} users...`)

    for (const user of users) {
      try {
        // Check if user has valid pre-generated exams for both types
        const { data: diagnosticExam } = await supabase
          .from('pre_generated_exams')
          .select('id')
          .eq('user_id', user.id)
          .eq('exam_type', 'diagnostic')
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .limit(1)

        const { data: practiceExam } = await supabase
          .from('pre_generated_exams')
          .select('id')
          .eq('user_id', user.id)
          .eq('exam_type', 'practice')
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .limit(1)

        // Generate exams if they don't exist
        if (!diagnosticExam || diagnosticExam.length === 0) {
          await triggerPreGeneration(user.id, 'diagnostic')
          generationTriggered++
        }

        if (!practiceExam || practiceExam.length === 0) {
          await triggerPreGeneration(user.id, 'practice')
          generationTriggered++
        }
      } catch (error) {
        console.error(`[Cron] Error processing user ${user.id}:`, error)
        generationErrors++
      }
    }

    // Step 3: Clean up expired exams
    console.log('[Cron] Starting cleanup of expired exams...')
    const cleanupCount = await cleanupExpiredExams()

    console.log('[Cron] Scheduled job completed successfully')

    return NextResponse.json(
      {
        success: true,
        stats: {
          usersProcessed: users.length,
          generationTriggered,
          generationErrors,
          cleanupCompleted: cleanupCount,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', stats: null },
      { status: 500 }
    )
  }
}

/**
 * Trigger pre-generation for a user by calling the pre-generate endpoint
 */
async function triggerPreGeneration(userId: string, examType: 'diagnostic' | 'practice'): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL}`
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/pre-generate-exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        examType,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`[Cron] Failed to trigger pre-generation for user ${userId}, exam type ${examType}:`, error)
    } else {
      const result = await response.json()
      console.log(`[Cron] Triggered pre-generation for user ${userId}, exam type ${examType}:`, result)
    }
  } catch (error) {
    console.error(`[Cron] Error triggering pre-generation for user ${userId}:`, error)
  }
}

/**
 * Clean up expired and used exams
 */
async function cleanupExpiredExams(): Promise<number> {
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
      console.error('[Cron] Error deleting used exams:', usedError)
    }
    if (expiredError) {
      console.error('[Cron] Error deleting expired exams:', expiredError)
    }

    const count = (usedDeleted?.length ?? 0) + (expiredDeleted?.length ?? 0)
    console.log(`[Cron] Cleaned up ${count} pre-generated exams`)
    return count
  } catch (error) {
    console.error('[Cron] Error in cleanup:', error)
    return 0
  }
}
