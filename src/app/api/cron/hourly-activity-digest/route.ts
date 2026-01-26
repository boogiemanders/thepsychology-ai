import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

// Map page paths to friendly names
function getFeatureName(pagePath: string): string {
  if (pagePath.includes('/practice-exam') || pagePath.includes('/exam')) return 'Practice Exams'
  if (pagePath.includes('/flashcards')) return 'Flashcards'
  if (pagePath.includes('/quizzer') || pagePath.includes('/quiz')) return 'Quizzer'
  if (pagePath.includes('/topic-teacher') || pagePath.includes('/learn')) return 'Topic Teacher'
  if (pagePath.includes('/mfa') || pagePath.includes('/audio')) return 'MFA Audio'
  if (pagePath.includes('/recover')) return 'Recover'
  if (pagePath.includes('/diagnostic')) return 'Diagnostic'
  if (pagePath.includes('/dashboard')) return 'Dashboard'
  if (pagePath.includes('/settings')) return 'Settings'
  return 'Other'
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return '<1 min'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

/**
 * Hourly Activity Digest
 * Sends a summary of new signups and active users from the past hour
 *
 * Schedule: Every hour from 8am to 10pm EST (0 13-23,0-3 * * * in UTC)
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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneHourAgoISO = oneHourAgo.toISOString()

    // Format time range for display (e.g., "2:00 PM - 3:00 PM EST")
    const formatHour = (date: Date) =>
      date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
      })
    const timeRange = `${formatHour(oneHourAgo)} - ${formatHour(now)} EST`

    // Query new signups in the past hour
    const { data: newSignups } = await supabase
      .from('users')
      .select('email')
      .gte('created_at', oneHourAgoISO)
      .order('created_at', { ascending: false })

    // Query active users in the past hour
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id, email, last_activity_at')
      .gte('last_activity_at', oneHourAgoISO)
      .order('last_activity_at', { ascending: false })

    // Skip if no activity
    if ((!newSignups || newSignups.length === 0) && (!activeUsers || activeUsers.length === 0)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No activity in the past hour',
      })
    }

    // Get page view data for active users to calculate time spent and features used
    const userActivityMap: Record<
      string,
      { email: string; totalSeconds: number; features: Set<string> }
    > = {}

    if (activeUsers && activeUsers.length > 0) {
      const activeUserIds = activeUsers.map(u => u.id)

      // Get page views for active users in the past hour
      const { data: pageViews } = await supabase
        .from('user_page_views')
        .select('user_id, page_path, duration_seconds')
        .in('user_id', activeUserIds)
        .gte('entered_at', oneHourAgoISO)

      // Get study sessions for active users in the past hour
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('user_id, feature, duration_seconds')
        .in('user_id', activeUserIds)
        .gte('started_at', oneHourAgoISO)

      // Initialize activity map with all active users
      for (const user of activeUsers) {
        userActivityMap[user.id] = {
          email: user.email,
          totalSeconds: 0,
          features: new Set(),
        }
      }

      // Aggregate page views
      if (pageViews) {
        for (const view of pageViews) {
          if (userActivityMap[view.user_id]) {
            userActivityMap[view.user_id].totalSeconds += view.duration_seconds || 0
            userActivityMap[view.user_id].features.add(getFeatureName(view.page_path))
          }
        }
      }

      // Aggregate study sessions
      if (studySessions) {
        for (const session of studySessions) {
          if (userActivityMap[session.user_id]) {
            userActivityMap[session.user_id].totalSeconds += session.duration_seconds || 0
            // Map feature names from study sessions
            const featureName =
              session.feature === 'topic-teacher'
                ? 'Topic Teacher'
                : session.feature === 'quizzer'
                  ? 'Quizzer'
                  : session.feature === 'flashcards'
                    ? 'Flashcards'
                    : session.feature
            userActivityMap[session.user_id].features.add(featureName)
          }
        }
      }
    }

    // Build the Slack message
    const messageParts: string[] = [`📊 *Hourly Activity* (${timeRange})`]

    // New signups section
    if (newSignups && newSignups.length > 0) {
      messageParts.push('')
      messageParts.push(`🆕 *New Signups (${newSignups.length}):*`)
      for (const signup of newSignups.slice(0, 10)) {
        messageParts.push(`  • ${signup.email}`)
      }
      if (newSignups.length > 10) {
        messageParts.push(`  ... and ${newSignups.length - 10} more`)
      }
    }

    // Active users section
    const activeUsersList = Object.values(userActivityMap)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .filter(u => !newSignups?.some(s => s.email === u.email)) // Exclude new signups from active list

    if (activeUsersList.length > 0) {
      messageParts.push('')
      messageParts.push(`👥 *Active Users (${activeUsersList.length}):*`)

      for (const user of activeUsersList.slice(0, 10)) {
        const duration = formatDuration(user.totalSeconds)
        const features = Array.from(user.features).slice(0, 3).join(', ')
        messageParts.push(
          `  • ${user.email} - ${duration}${features ? ` (${features})` : ''}`
        )
      }
      if (activeUsersList.length > 10) {
        messageParts.push(`  ... and ${activeUsersList.length - 10} more`)
      }
    }

    // Total engagement summary
    const totalEngagementSeconds = Object.values(userActivityMap).reduce(
      (sum, u) => sum + u.totalSeconds,
      0
    )
    const uniqueActiveCount = activeUsersList.length + (newSignups?.length || 0)

    if (totalEngagementSeconds > 0) {
      messageParts.push('')
      messageParts.push(
        `📈 Total engagement: ${formatDuration(totalEngagementSeconds)} across ${uniqueActiveCount} user${uniqueActiveCount !== 1 ? 's' : ''}`
      )
    }

    const message = messageParts.join('\n')
    await sendSlackNotification(message, 'signups')

    return NextResponse.json({
      success: true,
      stats: {
        newSignups: newSignups?.length ?? 0,
        activeUsers: activeUsersList.length,
        totalEngagementSeconds,
      },
    })
  } catch (error) {
    console.error('[hourly-activity-digest] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
