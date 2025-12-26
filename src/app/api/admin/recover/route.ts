import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'
import { calculatePriorities } from '@/lib/priority-calculator'

type AdminUserSummary = {
  userId: string
  email: string | null
  fullName: string | null
  subscriptionTier: string | null
  lastMessageAt: string | null
  sessionsCount: number
  messagesCount: number
  hasHarmAlert: boolean
  hasStressAlert: boolean
  latestPracticeExam?: {
    score: number
    totalQuestions: number
    createdAt: string
  } | null
}

type AdminUserDetail = {
  user: {
    id: string
    email: string | null
    full_name: string | null
    subscription_tier: string | null
    exam_date: string | null
    created_at: string | null
  } | null
  sessions: Array<{
    id: string
    created_at: string
    last_message_at: string | null
    message_count: number
    has_harm_alert: boolean
    has_stress_alert: boolean
    last_alert_reason: string | null
    last_alert_at: string | null
  }>
  practiceExams: Array<{
    id: string
    created_at: string
    exam_mode: string
    score: number
    total_questions: number
  }>
  latestPracticeRecommendations: Array<{ label: string; priorityScore: number; percentageWrong: number }>
  topicMasteryRecent: Array<{
    topic: string
    section: string
    total_attempts: number
    correct_attempts: number
    wrong_attempts: number
    last_attempted: string | null
  }>
  topicMasteryCount: number
}

type AdminSessionMessage = {
  id: string
  session_id: string
  user_id: string
  message_index: number
  role: 'user' | 'assistant'
  content: string
  sources: unknown | null
  alert_reason: string | null
  created_at: string
}

const QuerySchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
})

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || ''
  if (!header.toLowerCase().startsWith('bearer ')) return null
  return header.slice(7).trim() || null
}

function getAdminEmailAllowlist(): string[] {
  const raw = process.env.RECOVER_ADMIN_EMAILS || process.env.ADMIN_EMAILS || 'chanders0@yahoo.com'
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function requireAdmin(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = getBearerToken(req)
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user?.id || !data.user.email) return null

  const allowlist = getAdminEmailAllowlist()
  const email = data.user.email.toLowerCase()
  if (!allowlist.includes(email)) return null

  return { id: data.user.id, email }
}

function compareNullableIsoDesc(a: string | null, b: string | null): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a < b ? 1 : a > b ? -1 : 0
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = QuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      sessionId: searchParams.get('sessionId') || undefined,
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { userId, sessionId } = parsedQuery.data

    if (sessionId) {
      const { data, error } = await supabase
        .from('admin_recover_chat_messages')
        .select('id, session_id, user_id, message_index, role, content, sources, alert_reason, created_at')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: true })

      if (error) {
        console.error('[admin/recover] messages error:', error)
        return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
      }

      return NextResponse.json({ messages: (data || []) as AdminSessionMessage[] })
    }

    if (userId) {
      const [userProfileResult, sessionsResult, practiceExamsResult, latestPracticeResult, topicRecentResult, topicCountResult] =
        await Promise.all([
          supabase
            .from('users')
            .select('id, email, full_name, subscription_tier, exam_date, created_at')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('admin_recover_chat_sessions')
            .select(
              'id, created_at, last_message_at, message_count, has_harm_alert, has_stress_alert, last_alert_reason, last_alert_at'
            )
            .eq('user_id', userId)
            .order('last_message_at', { ascending: false, nullsFirst: false }),
          supabase
            .from('exam_results')
            .select('id, created_at, exam_mode, score, total_questions')
            .eq('user_id', userId)
            .eq('exam_type', 'practice')
            .order('created_at', { ascending: false })
            .limit(25),
          supabase
            .from('exam_results')
            .select('questions, selected_answers, total_questions, created_at')
            .eq('user_id', userId)
            .eq('exam_type', 'practice')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('topic_mastery')
            .select('topic, section, total_attempts, correct_attempts, wrong_attempts, last_attempted')
            .eq('user_id', userId)
            .order('last_attempted', { ascending: false, nullsFirst: false })
            .limit(20),
          supabase
            .from('topic_mastery')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
        ])

      if (userProfileResult.error) {
        console.error('[admin/recover] user profile error:', userProfileResult.error)
      }

      if (sessionsResult.error) {
        console.error('[admin/recover] sessions error:', sessionsResult.error)
        return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
      }

      if (practiceExamsResult.error) {
        console.error('[admin/recover] practice exams error:', practiceExamsResult.error)
      }

      if (latestPracticeResult.error) {
        console.error('[admin/recover] latest practice exam error:', latestPracticeResult.error)
      }

      if (topicRecentResult.error) {
        console.error('[admin/recover] topic mastery error:', topicRecentResult.error)
      }

      let latestPracticeRecommendations: Array<{ label: string; priorityScore: number; percentageWrong: number }> = []

      const latest = latestPracticeResult.data
      if (latest && Array.isArray((latest as any).questions) && (latest as any).selected_answers) {
        try {
          const priorities = calculatePriorities({
            questions: (latest as any).questions,
            selectedAnswers: (latest as any).selected_answers,
            totalQuestions: (latest as any).total_questions ?? (latest as any).questions.length,
          })

          latestPracticeRecommendations = (priorities.topPriorityAreas || []).slice(0, 3).map((area: any) => ({
            label: String(area.label),
            priorityScore: Number(area.priorityScore),
            percentageWrong: Number(area.percentageWrong),
          }))
        } catch (calcError) {
          console.error('[admin/recover] Failed to calculate priorities:', calcError)
        }
      }

      const detail: AdminUserDetail = {
        user: userProfileResult.data ?? null,
        sessions: (sessionsResult.data || []) as AdminUserDetail['sessions'],
        practiceExams: (practiceExamsResult.data || []) as AdminUserDetail['practiceExams'],
        latestPracticeRecommendations,
        topicMasteryRecent: (topicRecentResult.data || []) as AdminUserDetail['topicMasteryRecent'],
        topicMasteryCount: topicCountResult.count ?? 0,
      }

      return NextResponse.json(detail)
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('admin_recover_chat_sessions')
      .select(
        'id, user_id, last_message_at, message_count, has_harm_alert, has_stress_alert, email, full_name, subscription_tier'
      )
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(500)

    if (sessionsError) {
      console.error('[admin/recover] sessions list error:', sessionsError)
      return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
    }

    const summaryByUser = new Map<string, AdminUserSummary>()
    for (const row of sessions || []) {
      const userKey = String((row as any).user_id)
      const existing = summaryByUser.get(userKey)
      const lastMessageAt = (row as any).last_message_at ? String((row as any).last_message_at) : null

      if (!existing) {
        summaryByUser.set(userKey, {
          userId: userKey,
          email: (row as any).email ?? null,
          fullName: (row as any).full_name ?? null,
          subscriptionTier: (row as any).subscription_tier ?? null,
          lastMessageAt,
          sessionsCount: 1,
          messagesCount: Number((row as any).message_count ?? 0),
          hasHarmAlert: Boolean((row as any).has_harm_alert),
          hasStressAlert: Boolean((row as any).has_stress_alert),
          latestPracticeExam: null,
        })
        continue
      }

      existing.sessionsCount += 1
      existing.messagesCount += Number((row as any).message_count ?? 0)
      existing.hasHarmAlert = existing.hasHarmAlert || Boolean((row as any).has_harm_alert)
      existing.hasStressAlert = existing.hasStressAlert || Boolean((row as any).has_stress_alert)
      if (compareNullableIsoDesc(lastMessageAt, existing.lastMessageAt) < 0) {
        existing.lastMessageAt = lastMessageAt
      }
    }

    const userIds = Array.from(summaryByUser.keys())
    if (userIds.length > 0) {
      const { data: practiceSummaries, error: examError } = await supabase
        .from('exam_results')
        .select('user_id, score, total_questions, created_at')
        .in('user_id', userIds)
        .eq('exam_type', 'practice')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (examError) {
        console.error('[admin/recover] latest practice summary error:', examError)
      } else {
        const seen = new Set<string>()
        for (const row of practiceSummaries || []) {
          const id = String((row as any).user_id)
          if (seen.has(id)) continue
          seen.add(id)
          const entry = summaryByUser.get(id)
          if (!entry) continue
          entry.latestPracticeExam = {
            score: Number((row as any).score ?? 0),
            totalQuestions: Number((row as any).total_questions ?? 0),
            createdAt: String((row as any).created_at),
          }
        }
      }
    }

    const users = Array.from(summaryByUser.values()).sort((a, b) => compareNullableIsoDesc(a.lastMessageAt, b.lastMessageAt))
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[admin/recover] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

