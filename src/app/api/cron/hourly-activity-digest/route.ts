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

interface QuizAttempt {
  user_id: string
  topic: string
  score: number
  total_questions: number
}

interface StudySession {
  user_id: string
  feature: string
  duration_seconds: number | null
  metadata: { topic?: string } | null
}

/**
 * Hourly Activity Digest
 * Sends a daily activity summary (cumulative for the day) every hour
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

    // Get start of today in EST
    const todayStart = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    )
    todayStart.setHours(0, 0, 0, 0)
    // Convert back to UTC for database queries
    const todayStartISO = new Date(
      todayStart.toLocaleString('en-US', { timeZone: 'UTC' })
    ).toISOString()

    // Format current time for display (e.g., "3:00 PM EST")
    const currentTime = now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    })

    // Query new signups today
    const { data: newSignups } = await supabase
      .from('users')
      .select('email')
      .gte('created_at', todayStartISO)
      .order('created_at', { ascending: false })

    // Query active users today
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id, email, last_activity_at')
      .gte('last_activity_at', todayStartISO)
      .order('last_activity_at', { ascending: false })

    // Skip if no activity
    if ((!newSignups || newSignups.length === 0) && (!activeUsers || activeUsers.length === 0)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No activity today',
      })
    }

    // Get page view and study session data for active users
    const userActivityMap: Record<
      string,
      {
        email: string
        totalSeconds: number
        features: Set<string>
        topics: Set<string>
        quizResults: { topic: string; score: number; total: number }[]
      }
    > = {}

    if (activeUsers && activeUsers.length > 0) {
      const activeUserIds = activeUsers.map(u => u.id)

      // Get page views for active users today
      const { data: pageViews } = await supabase
        .from('user_page_views')
        .select('user_id, page_path, duration_seconds')
        .in('user_id', activeUserIds)
        .gte('entered_at', todayStartISO)

      // Get study sessions for active users today (with metadata for topic names)
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('user_id, feature, duration_seconds, metadata')
        .in('user_id', activeUserIds)
        .gte('started_at', todayStartISO)

      // Get quiz attempts for active users today
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, topic, score, total_questions')
        .in('user_id', activeUserIds)
        .gte('created_at', todayStartISO)

      // Initialize activity map with all active users
      for (const user of activeUsers) {
        userActivityMap[user.id] = {
          email: user.email,
          totalSeconds: 0,
          features: new Set(),
          topics: new Set(),
          quizResults: [],
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

      // Aggregate study sessions and extract topic names
      if (studySessions) {
        for (const session of studySessions as StudySession[]) {
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

            // Extract topic from metadata
            const topicName = session.metadata?.topic
            if (topicName) {
              userActivityMap[session.user_id].topics.add(topicName)
            }
          }
        }
      }

      // Aggregate quiz attempts
      if (quizAttempts) {
        for (const attempt of quizAttempts as QuizAttempt[]) {
          if (userActivityMap[attempt.user_id]) {
            userActivityMap[attempt.user_id].quizResults.push({
              topic: attempt.topic,
              score: attempt.score,
              total: attempt.total_questions,
            })
          }
        }
      }
    }

    // Build the Slack message
    const messageParts: string[] = [`📊 *Daily Activity Summary* (as of ${currentTime} EST)`]

    // New signups section
    if (newSignups && newSignups.length > 0) {
      messageParts.push('')
      messageParts.push(`🆕 *New Signups Today (${newSignups.length}):*`)
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
      messageParts.push(`👥 *Active Users Today (${activeUsersList.length}):*`)

      for (const user of activeUsersList.slice(0, 15)) {
        const duration = formatDuration(user.totalSeconds)
        messageParts.push(`  • ${user.email} - ${duration}`)

        // Add topics studied
        const topics = Array.from(user.topics)
        if (topics.length > 0) {
          const topicsList = topics.slice(0, 5).join(', ')
          const moreTopics = topics.length > 5 ? ` +${topics.length - 5} more` : ''
          messageParts.push(`    📚 Topics: ${topicsList}${moreTopics}`)
        }

        // Add quiz results
        if (user.quizResults.length > 0) {
          const quizStrings = user.quizResults.slice(0, 3).map(q => {
            const pct = Math.round((q.score / q.total) * 100)
            return `${q.topic} ${q.score}/${q.total} (${pct}%)`
          })
          const moreQuizzes = user.quizResults.length > 3 ? ` +${user.quizResults.length - 3} more` : ''
          messageParts.push(`    📝 Quiz: ${quizStrings.join(', ')}${moreQuizzes}`)
        }
      }
      if (activeUsersList.length > 15) {
        messageParts.push(`  ... and ${activeUsersList.length - 15} more`)
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
        `📈 Total engagement today: ${formatDuration(totalEngagementSeconds)} across ${uniqueActiveCount} user${uniqueActiveCount !== 1 ? 's' : ''}`
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
