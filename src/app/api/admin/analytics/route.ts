import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const QuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
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

function getDateRangeFilter(range: string): Date {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'all':
    default:
      return new Date('2020-01-01')
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = QuerySchema.safeParse({
      range: searchParams.get('range') || undefined,
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { range } = parsedQuery.data
    const rangeStart = getDateRangeFilter(range)
    const rangeStartISO = rangeStart.toISOString()

    // ============ ENGAGEMENT METRICS ============

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Active users in range (had study sessions)
    const { data: activeUserData } = await supabase
      .from('study_sessions')
      .select('user_id')
      .gte('started_at', rangeStartISO)

    const activeUserIds = new Set(activeUserData?.map(s => s.user_id) || [])
    const activeUsersInRange = activeUserIds.size

    // Sessions per user
    const { data: sessionData } = await supabase
      .from('study_sessions')
      .select('user_id, feature, duration_seconds')
      .gte('started_at', rangeStartISO)

    const userSessionCounts: Record<string, number> = {}
    const featureStats: Record<string, { totalSeconds: number; sessionCount: number; userIds: Set<string> }> = {}

    for (const session of sessionData || []) {
      // Count sessions per user
      userSessionCounts[session.user_id] = (userSessionCounts[session.user_id] || 0) + 1

      // Aggregate by feature
      const feature = session.feature || 'unknown'
      if (!featureStats[feature]) {
        featureStats[feature] = { totalSeconds: 0, sessionCount: 0, userIds: new Set() }
      }
      featureStats[feature].totalSeconds += session.duration_seconds || 0
      featureStats[feature].sessionCount += 1
      featureStats[feature].userIds.add(session.user_id)
    }

    const sessionCounts = Object.values(userSessionCounts)
    const avgSessionsPerUser = sessionCounts.length > 0
      ? sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length
      : 0

    const timeByFeature = Object.entries(featureStats)
      .map(([feature, stats]) => ({
        feature,
        totalMinutes: Math.round(stats.totalSeconds / 60),
        avgMinutesPerUser: stats.userIds.size > 0
          ? Math.round(stats.totalSeconds / 60 / stats.userIds.size)
          : 0,
        sessionCount: stats.sessionCount,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)

    // Daily active users (for chart)
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('user_id, started_at')
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const dailyActiveMap: Record<string, Set<string>> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      dailyActiveMap[date.toISOString().split('T')[0]] = new Set()
    }

    for (const session of allSessions || []) {
      const dateStr = new Date(session.started_at).toISOString().split('T')[0]
      if (dailyActiveMap[dateStr]) {
        dailyActiveMap[dateStr].add(session.user_id)
      }
    }

    const dailyActiveUsers = Object.entries(dailyActiveMap)
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ============ LEARNING OUTCOMES ============

    // Diagnostic score improvement (first vs latest)
    const { data: diagnosticExams } = await supabase
      .from('exam_history')
      .select('user_id, score, total_questions, created_at')
      .eq('exam_type', 'diagnostic')
      .order('created_at', { ascending: true })

    const userDiagnostics: Record<string, { first: { score: number; total: number }; latest: { score: number; total: number } }> = {}

    for (const exam of diagnosticExams || []) {
      if (!userDiagnostics[exam.user_id]) {
        userDiagnostics[exam.user_id] = {
          first: { score: exam.score, total: exam.total_questions },
          latest: { score: exam.score, total: exam.total_questions },
        }
      } else {
        userDiagnostics[exam.user_id].latest = { score: exam.score, total: exam.total_questions }
      }
    }

    // Calculate improvements for users with multiple diagnostics
    const improvements: number[] = []
    let totalFirstScore = 0
    let totalLatestScore = 0
    let usersWithMultiple = 0

    for (const data of Object.values(userDiagnostics)) {
      const firstPct = (data.first.score / data.first.total) * 100
      const latestPct = (data.latest.score / data.latest.total) * 100
      totalFirstScore += firstPct
      totalLatestScore += latestPct

      if (data.first.score !== data.latest.score || data.first.total !== data.latest.total) {
        improvements.push(latestPct - firstPct)
        usersWithMultiple++
      }
    }

    const usersWithDiagnostic = Object.keys(userDiagnostics).length
    const avgFirstScore = usersWithDiagnostic > 0 ? totalFirstScore / usersWithDiagnostic : 0
    const avgLatestScore = usersWithDiagnostic > 0 ? totalLatestScore / usersWithDiagnostic : 0
    const avgImprovement = improvements.length > 0
      ? improvements.reduce((a, b) => a + b, 0) / improvements.length
      : 0

    // Quiz trends
    const { data: quizData } = await supabase
      .from('quiz_attempts')
      .select('user_id, score, total_questions')
      .gte('created_at', rangeStartISO)

    const quizScores = (quizData || []).map(q => (q.score / q.total_questions) * 100)
    const avgQuizScore = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : 0
    const quizPassRate = quizScores.length > 0
      ? (quizScores.filter(s => s >= 70).length / quizScores.length) * 100
      : 0

    const quizUserIds = new Set((quizData || []).map(q => q.user_id))
    const avgQuizzesPerUser = quizUserIds.size > 0
      ? (quizData?.length || 0) / quizUserIds.size
      : 0

    // Topic mastery stats
    const { data: masteryData } = await supabase
      .from('topic_mastery')
      .select('user_id, topic, total_attempts, correct_attempts')

    const userTopicCounts: Record<string, number> = {}
    let totalAccuracy = 0
    let accuracyCount = 0

    for (const mastery of masteryData || []) {
      userTopicCounts[mastery.user_id] = (userTopicCounts[mastery.user_id] || 0) + 1
      if (mastery.total_attempts > 0) {
        totalAccuracy += (mastery.correct_attempts / mastery.total_attempts) * 100
        accuracyCount++
      }
    }

    const topicCounts = Object.values(userTopicCounts)
    const avgTopicsMastered = topicCounts.length > 0
      ? topicCounts.reduce((a, b) => a + b, 0) / topicCounts.length
      : 0
    const avgAccuracyRate = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0

    // ============ SATISFACTION METRICS ============

    // Topic Teacher ratings
    const { data: topicTeacherRatings } = await supabase
      .from('feature_ratings')
      .select('rating_value, comment, created_at')
      .eq('feature', 'topic_teacher')
      .eq('rating_type', 'stars')
      .gte('created_at', rangeStartISO)
      .order('created_at', { ascending: false })

    const ttRatings = topicTeacherRatings || []
    const ttAvgRating = ttRatings.length > 0
      ? ttRatings.reduce((sum, r) => sum + r.rating_value, 0) / ttRatings.length
      : 0

    const ttDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of ttRatings) {
      ttDistribution[r.rating_value] = (ttDistribution[r.rating_value] || 0) + 1
    }

    const ttRecentComments = ttRatings
      .filter(r => r.comment)
      .slice(0, 10)
      .map(r => ({
        rating: r.rating_value,
        comment: r.comment,
        createdAt: r.created_at,
      }))

    // Quizzer ratings
    const { data: quizzerRatings } = await supabase
      .from('feature_ratings')
      .select('rating_value, comment, created_at')
      .eq('feature', 'quizzer')
      .eq('rating_type', 'thumbs')
      .gte('created_at', rangeStartISO)
      .order('created_at', { ascending: false })

    const qzRatings = quizzerRatings || []
    const thumbsUpCount = qzRatings.filter(r => r.rating_value === 1).length
    const thumbsDownCount = qzRatings.filter(r => r.rating_value === 0).length
    const qzSatisfactionRate = qzRatings.length > 0
      ? (thumbsUpCount / qzRatings.length) * 100
      : 0

    const qzRecentComments = qzRatings
      .filter(r => r.comment)
      .slice(0, 10)
      .map(r => ({
        isPositive: r.rating_value === 1,
        comment: r.comment,
        createdAt: r.created_at,
      }))

    // ============ AI METRICS ============

    const { data: usageEvents } = await supabase
      .from('usage_events')
      .select('event_name, endpoint, model, input_tokens, output_tokens')
      .gte('created_at', rangeStartISO)

    const aiByFeature: Record<string, { callCount: number; inputTokens: number; outputTokens: number }> = {}

    for (const event of usageEvents || []) {
      const feature = event.event_name?.split('.')[0] || event.endpoint || 'unknown'
      if (!aiByFeature[feature]) {
        aiByFeature[feature] = { callCount: 0, inputTokens: 0, outputTokens: 0 }
      }
      aiByFeature[feature].callCount += 1
      aiByFeature[feature].inputTokens += event.input_tokens || 0
      aiByFeature[feature].outputTokens += event.output_tokens || 0
    }

    const callsByFeature = Object.entries(aiByFeature)
      .map(([feature, stats]) => ({
        feature,
        callCount: stats.callCount,
        avgInputTokens: stats.callCount > 0 ? Math.round(stats.inputTokens / stats.callCount) : 0,
        avgOutputTokens: stats.callCount > 0 ? Math.round(stats.outputTokens / stats.callCount) : 0,
      }))
      .sort((a, b) => b.callCount - a.callCount)

    const totalAICalls = usageEvents?.length || 0

    // Daily AI calls
    const { data: allUsageEvents } = await supabase
      .from('usage_events')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const dailyAICallsMap: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      dailyAICallsMap[date.toISOString().split('T')[0]] = 0
    }

    for (const event of allUsageEvents || []) {
      const dateStr = new Date(event.created_at).toISOString().split('T')[0]
      if (dailyAICallsMap[dateStr] !== undefined) {
        dailyAICallsMap[dateStr]++
      }
    }

    const dailyCalls = Object.entries(dailyAICallsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ============ RESPONSE ============

    return NextResponse.json({
      engagement: {
        totalUsers: totalUsers || 0,
        activeUsersInRange,
        avgSessionsPerUser: Math.round(avgSessionsPerUser * 10) / 10,
        timeByFeature,
        dailyActiveUsers,
      },
      learning: {
        diagnosticCompletion: {
          usersWithFirstDiagnostic: usersWithDiagnostic,
          usersWithMultipleDiagnostics: usersWithMultiple,
          avgFirstScore: Math.round(avgFirstScore * 10) / 10,
          avgLatestScore: Math.round(avgLatestScore * 10) / 10,
          avgImprovement: Math.round(avgImprovement * 10) / 10,
        },
        quizTrends: {
          avgQuizScore: Math.round(avgQuizScore * 10) / 10,
          avgQuizzesPerUser: Math.round(avgQuizzesPerUser * 10) / 10,
          passRate: Math.round(quizPassRate * 10) / 10,
          totalQuizzes: quizData?.length || 0,
        },
        topicMasteryStats: {
          avgTopicsMastered: Math.round(avgTopicsMastered * 10) / 10,
          avgAccuracyRate: Math.round(avgAccuracyRate * 10) / 10,
        },
      },
      satisfaction: {
        topicTeacher: {
          avgRating: Math.round(ttAvgRating * 10) / 10,
          totalRatings: ttRatings.length,
          distribution: ttDistribution,
          recentComments: ttRecentComments,
        },
        quizzer: {
          thumbsUpCount,
          thumbsDownCount,
          satisfactionRate: Math.round(qzSatisfactionRate * 10) / 10,
          totalRatings: qzRatings.length,
          recentComments: qzRecentComments,
        },
      },
      aiMetrics: {
        totalCalls: totalAICalls,
        callsByFeature,
        dailyCalls,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
