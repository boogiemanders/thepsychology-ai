import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

const ERROR_RATE_THRESHOLD = 0.7
const MIN_ATTEMPTS = 5

/**
 * Combined daily/weekly stats cron endpoint.
 * - Daily: signups, exams, active users, MRR
 * - Weekly (Monday): digest + question error alerts
 *
 * Schedule: 9am EST daily (0 14 * * * in UTC)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    const now = new Date()
    const isMonday = now.getDay() === 1
    const sendMonthly = request.nextUrl.searchParams.get('monthly') === 'true'

    // === MONTHLY STATS (on-demand) ===
    if (sendMonthly) {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const monthAgoISO = monthAgo.toISOString()

      const { count: signupsMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgoISO)

      const { count: examsMonth } = await supabase
        .from('exam_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgoISO)

      const { count: quizzesMonth } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgoISO)

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsersMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity_at', monthAgoISO)

      const { data: tierCounts } = await supabase
        .from('users')
        .select('subscription_tier')

      const tiers = tierCounts || []
      const proCount = tiers.filter(u => u.subscription_tier === 'pro').length
      const proCoachingCount = tiers.filter(u => u.subscription_tier === 'pro_coaching').length
      const paidCount = proCount + proCoachingCount

      const { count: newPaidMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('subscription_started_at', monthAgoISO)
        .neq('subscription_tier', 'free')

      const monthlyMessage = [
        `📈 *Monthly Stats* (Last 30 days)`,
        '',
        `*Users*`,
        `👥 Total users: ${totalUsers ?? 0}`,
        `🆕 New signups: ${signupsMonth ?? 0}`,
        `🔥 Active users (30d): ${activeUsersMonth ?? 0}`,
        '',
        `*Engagement*`,
        `📝 Exams taken: ${examsMonth ?? 0}`,
        `❓ Quizzes taken: ${quizzesMonth ?? 0}`,
        '',
        `*Revenue*`,
        `💳 Total paid subscribers: ${paidCount} (${proCount} Pro + ${proCoachingCount} Pro+Coaching)`,
        `🆕 New paid (30d): ${newPaidMonth ?? 0}`,
      ].join('\n')

      await sendSlackNotification(monthlyMessage, 'metrics')

      return NextResponse.json({
        success: true,
        type: 'monthly',
        stats: {
          totalUsers: totalUsers ?? 0,
          signupsMonth: signupsMonth ?? 0,
          activeUsersMonth: activeUsersMonth ?? 0,
          examsMonth: examsMonth ?? 0,
          quizzesMonth: quizzesMonth ?? 0,
          paidCount,
          newPaidMonth: newPaidMonth ?? 0,
        },
      })
    }

    // === DAILY STATS ===
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    const { count: signupsToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    const { count: examsToday } = await supabase
      .from('exam_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    const { count: quizzesToday } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_at', yesterday)

    const { data: tierCounts } = await supabase
      .from('users')
      .select('subscription_tier')

    const tiers = tierCounts || []
    const proCount = tiers.filter(u => u.subscription_tier === 'pro').length
    const proCoachingCount = tiers.filter(u => u.subscription_tier === 'pro_coaching').length
    const estimatedMRR = (proCount * 29) + (proCoachingCount * 99)

    const dailyMessage = [
      `📊 *Daily Stats* (${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`,
      '',
      `🆕 New signups: ${signupsToday ?? 0}`,
      `📝 Exams taken: ${examsToday ?? 0}`,
      `❓ Quizzes taken: ${quizzesToday ?? 0}`,
      `👥 Active users (24h): ${activeUsers ?? 0}`,
      '',
      `💰 MRR: $${estimatedMRR.toLocaleString()} (${proCount} Pro + ${proCoachingCount} Pro+Coaching)`,
    ].join('\n')

    await sendSlackNotification(dailyMessage, 'metrics')

    // === WEEKLY DIGEST (Monday only) ===
    if (isMonday) {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const weekAgoISO = weekAgo.toISOString()
      const twoWeeksAgoISO = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const { count: signupsThisWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoISO)

      const { count: signupsLastWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twoWeeksAgoISO)
        .lt('created_at', weekAgoISO)

      const { count: examsThisWeek } = await supabase
        .from('exam_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoISO)

      const { count: quizzesThisWeek } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoISO)

      const { count: newPaidThisWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('subscription_started_at', weekAgoISO)
        .neq('subscription_tier', 'free')

      const { count: cancellationsThisWeek } = await supabase
        .from('funnel_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'subscription_cancelled')
        .gte('created_at', weekAgoISO)

      const signupChange = signupsLastWeek && signupsLastWeek > 0
        ? Math.round(((signupsThisWeek ?? 0) - signupsLastWeek) / signupsLastWeek * 100)
        : 0
      const signupTrend = signupChange > 0 ? `+${signupChange}%` : signupChange < 0 ? `${signupChange}%` : '—'

      const weeklyMessage = [
        `📅 *Weekly Digest* (Week of ${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        '',
        `*Growth*`,
        `🆕 New signups: ${signupsThisWeek ?? 0} (${signupTrend} vs last week)`,
        `💳 New paid: ${newPaidThisWeek ?? 0}`,
        `❌ Cancellations: ${cancellationsThisWeek ?? 0}`,
        '',
        `*Engagement*`,
        `📝 Exams taken: ${examsThisWeek ?? 0}`,
        `❓ Quizzes taken: ${quizzesThisWeek ?? 0}`,
      ].join('\n')

      await sendSlackNotification(weeklyMessage, 'metrics')

      // === RESEARCH METRICS (Monday only) ===
      // Topic Teacher ratings
      const { data: ttRatings } = await supabase
        .from('feature_ratings')
        .select('rating_value')
        .eq('feature', 'topic_teacher')
        .eq('rating_type', 'stars')
        .gte('created_at', weekAgoISO)

      const ttAvgRating = ttRatings && ttRatings.length > 0
        ? (ttRatings.reduce((sum, r) => sum + r.rating_value, 0) / ttRatings.length).toFixed(1)
        : '—'
      const ttRatingCount = ttRatings?.length ?? 0

      // Quizzer satisfaction
      const { data: qzRatings } = await supabase
        .from('feature_ratings')
        .select('rating_value')
        .eq('feature', 'quizzer')
        .eq('rating_type', 'thumbs')
        .gte('created_at', weekAgoISO)

      const qzThumbsUp = qzRatings?.filter(r => r.rating_value === 1).length ?? 0
      const qzTotal = qzRatings?.length ?? 0
      const qzSatisfaction = qzTotal > 0 ? Math.round((qzThumbsUp / qzTotal) * 100) : 0

      // Diagnostic improvement (users with 2+ diagnostics)
      const { data: diagnostics } = await supabase
        .from('exam_history')
        .select('user_id, score, total_questions, created_at')
        .eq('exam_type', 'diagnostic')
        .order('created_at', { ascending: true })

      const userDiagnostics: Record<string, { first: number; latest: number }> = {}
      for (const exam of diagnostics || []) {
        const pct = (exam.score / exam.total_questions) * 100
        if (!userDiagnostics[exam.user_id]) {
          userDiagnostics[exam.user_id] = { first: pct, latest: pct }
        } else {
          userDiagnostics[exam.user_id].latest = pct
        }
      }

      const improvements = Object.values(userDiagnostics)
        .filter(d => d.first !== d.latest)
        .map(d => d.latest - d.first)
      const avgImprovement = improvements.length > 0
        ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
        : 0

      // Topics studied this week
      const { count: topicsStudied } = await supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('feature', 'topic-teacher')
        .gte('started_at', weekAgoISO)

      const researchMessage = [
        `📚 *Research Metrics* (Last 7 days)`,
        '',
        `⭐ Topic Teacher: ${ttAvgRating}/5 avg (${ttRatingCount} ratings)`,
        `👍 Quizzer: ${qzSatisfaction}% satisfaction (${qzTotal} ratings)`,
        `📈 Diagnostic improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement}% avg (${improvements.length} users with 2+ attempts)`,
        `🎯 Topic lessons: ${topicsStudied ?? 0}`,
      ].join('\n')

      await sendSlackNotification(researchMessage, 'metrics')

      // === QUESTION ERROR ALERTS (Monday only) ===
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: feedback, error: feedbackError } = await supabase
        .from('question_feedback')
        .select('question_key, question, was_correct, exam_type')
        .gte('created_at', thirtyDaysAgo)
        .not('was_correct', 'is', null)

      if (!feedbackError && feedback && feedback.length > 0) {
        const questionStats: Record<string, {
          key: string
          question: string
          examType: string
          total: number
          wrong: number
        }> = {}

        for (const item of feedback) {
          const key = item.question_key
          if (!questionStats[key]) {
            questionStats[key] = {
              key,
              question: item.question || '',
              examType: item.exam_type || 'unknown',
              total: 0,
              wrong: 0,
            }
          }
          questionStats[key].total++
          if (item.was_correct === false) {
            questionStats[key].wrong++
          }
        }

        const flaggedQuestions = Object.values(questionStats)
          .filter(q => q.total >= MIN_ATTEMPTS && (q.wrong / q.total) >= ERROR_RATE_THRESHOLD)
          .sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total))
          .slice(0, 5)

        if (flaggedQuestions.length > 0) {
          const questionList = flaggedQuestions.map((q, i) => {
            const errorRate = Math.round((q.wrong / q.total) * 100)
            const preview = q.question.slice(0, 50) + (q.question.length > 50 ? '...' : '')
            return `${i + 1}. [${q.examType}] ${errorRate}% wrong - "${preview}"`
          }).join('\n')

          const errorMessage = [
            `⚠️ *Question Error Alert*`,
            `${flaggedQuestions.length} question(s) with >${ERROR_RATE_THRESHOLD * 100}% wrong:`,
            '',
            questionList,
          ].join('\n')

          await sendSlackNotification(errorMessage, 'metrics')
        }
      }
    }

    return NextResponse.json({
      success: true,
      isMonday,
      stats: {
        signupsToday: signupsToday ?? 0,
        examsToday: examsToday ?? 0,
        quizzesToday: quizzesToday ?? 0,
        activeUsers: activeUsers ?? 0,
        estimatedMRR,
      },
    })
  } catch (error) {
    console.error('[daily-stats] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
