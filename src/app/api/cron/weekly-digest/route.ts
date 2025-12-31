import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Weekly digest cron endpoint.
 * Sends a summary of weekly metrics to Slack.
 *
 * Schedule: Monday 9am EST (0 14 * * 1 in UTC)
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
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekAgoISO = weekAgo.toISOString()
    const twoWeeksAgoISO = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // Signups this week
    const { count: signupsThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgoISO)

    // Signups last week (for comparison)
    const { count: signupsLastWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgoISO)
      .lt('created_at', weekAgoISO)

    // Exams this week
    const { count: examsThisWeek } = await supabase
      .from('exam_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgoISO)

    // Quizzes this week
    const { count: quizzesThisWeek } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgoISO)

    // Get subscription tier counts
    const { data: tierCounts } = await supabase
      .from('users')
      .select('subscription_tier')

    const tiers = tierCounts || []
    const proCount = tiers.filter(u => u.subscription_tier === 'pro').length
    const proCoachingCount = tiers.filter(u => u.subscription_tier === 'pro_coaching').length
    const estimatedMRR = (proCount * 29) + (proCoachingCount * 99)

    // New paid subscribers this week
    const { count: newPaidThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('subscription_started_at', weekAgoISO)
      .neq('subscription_tier', 'free')

    // Cancellations this week (funnel events)
    const { count: cancellationsThisWeek } = await supabase
      .from('funnel_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', 'subscription_cancelled')
      .gte('created_at', weekAgoISO)

    // Most active users this week (by exam count)
    const { data: topUsers } = await supabase
      .from('exam_history')
      .select('user_id')
      .gte('created_at', weekAgoISO)

    const userExamCounts: Record<string, number> = {}
    for (const exam of topUsers || []) {
      userExamCounts[exam.user_id] = (userExamCounts[exam.user_id] || 0) + 1
    }

    const topUserIds = Object.entries(userExamCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ id, count }))

    // Get emails for top users
    const topUserEmails: string[] = []
    if (topUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', topUserIds.map(u => u.id))

      const userMap = new Map((users || []).map(u => [u.id, u.email]))
      for (const u of topUserIds) {
        const email = userMap.get(u.id) || 'Unknown'
        topUserEmails.push(`${email} (${u.count} exams)`)
      }
    }

    // Calculate week-over-week change
    const signupChange = signupsLastWeek && signupsLastWeek > 0
      ? Math.round(((signupsThisWeek ?? 0) - signupsLastWeek) / signupsLastWeek * 100)
      : 0
    const signupTrend = signupChange > 0 ? `+${signupChange}%` : signupChange < 0 ? `${signupChange}%` : '—'

    // Format message
    const message = [
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
      '',
      `*Revenue*`,
      `💰 MRR: $${estimatedMRR.toLocaleString()} (${proCount} Pro + ${proCoachingCount} Pro+Coaching)`,
      '',
      topUserEmails.length > 0 ? `*Top Users*\n${topUserEmails.map((e, i) => `${i + 1}. ${e}`).join('\n')}` : '',
    ].filter(Boolean).join('\n')

    await sendSlackNotification(message, 'metrics')

    return NextResponse.json({
      success: true,
      stats: {
        signupsThisWeek: signupsThisWeek ?? 0,
        signupsLastWeek: signupsLastWeek ?? 0,
        examsThisWeek: examsThisWeek ?? 0,
        quizzesThisWeek: quizzesThisWeek ?? 0,
        newPaidThisWeek: newPaidThisWeek ?? 0,
        cancellationsThisWeek: cancellationsThisWeek ?? 0,
        estimatedMRR,
      },
    })
  } catch (error) {
    console.error('[weekly-digest] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
