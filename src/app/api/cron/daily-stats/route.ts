import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Daily stats cron endpoint.
 * Sends a summary of daily metrics to Slack.
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
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    // Get signups today
    const { count: signupsToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    // Get exams taken today
    const { count: examsToday } = await supabase
      .from('exam_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    // Get quiz attempts today
    const { count: quizzesToday } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    // Get active users (last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity_at', yesterday)

    // Get subscription tier counts for revenue estimate
    const { data: tierCounts } = await supabase
      .from('users')
      .select('subscription_tier')

    const tiers = tierCounts || []
    const proCount = tiers.filter(u => u.subscription_tier === 'pro').length
    const proCoachingCount = tiers.filter(u => u.subscription_tier === 'pro_coaching').length

    // Estimate monthly revenue (Pro: $29/mo, Pro+Coaching: $99/mo)
    const estimatedMRR = (proCount * 29) + (proCoachingCount * 99)

    // Format message
    const message = [
      `📊 *Daily Stats* (${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`,
      '',
      `🆕 New signups: ${signupsToday ?? 0}`,
      `📝 Exams taken: ${examsToday ?? 0}`,
      `❓ Quizzes taken: ${quizzesToday ?? 0}`,
      `👥 Active users (24h): ${activeUsers ?? 0}`,
      '',
      `💰 MRR: $${estimatedMRR.toLocaleString()} (${proCount} Pro + ${proCoachingCount} Pro+Coaching)`,
    ].join('\n')

    await sendSlackNotification(message, 'metrics')

    return NextResponse.json({
      success: true,
      stats: {
        signupsToday: signupsToday ?? 0,
        examsToday: examsToday ?? 0,
        quizzesToday: quizzesToday ?? 0,
        activeUsers: activeUsers ?? 0,
        proCount,
        proCoachingCount,
        estimatedMRR,
      },
    })
  } catch (error) {
    console.error('[daily-stats] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
