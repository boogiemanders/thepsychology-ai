import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Daily digest cron endpoint for Recover insights.
 * Sends one email per user with pending insights to the admin.
 *
 * Schedule: 8am EST daily (0 13 * * * in UTC)
 *
 * Security: Requires CRON_SECRET header or Vercel cron authorization
 */
export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = CRON_SECRET

  // Allow Vercel cron (no auth needed) or manual trigger with secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  if (!isNotificationEmailConfigured()) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    // Get today's date for digest log check
    const today = new Date().toISOString().split('T')[0]

    // Find users with pending insights that haven't been included in today's digest
    const { data: pendingInsights, error: fetchError } = await supabase
      .from('recover_insights')
      .select(`
        id,
        user_id,
        source_type,
        draft_message,
        insight_data,
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (fetchError) {
      // Table may not exist yet
      if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
        return NextResponse.json({ message: 'No insights table yet', sent: 0 })
      }
      console.error('[recover-digest] Failed to fetch insights:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    if (!pendingInsights || pendingInsights.length === 0) {
      return NextResponse.json({ message: 'No pending insights', sent: 0 })
    }

    // Group insights by user
    const insightsByUser = new Map<string, typeof pendingInsights>()
    for (const insight of pendingInsights) {
      const userId = insight.user_id
      if (!insightsByUser.has(userId)) {
        insightsByUser.set(userId, [])
      }
      insightsByUser.get(userId)!.push(insight)
    }

    // Check which users already got a digest today
    const userIds = Array.from(insightsByUser.keys())
    const { data: existingDigests } = await supabase
      .from('recover_daily_digest_log')
      .select('user_id')
      .eq('digest_date', today)
      .in('user_id', userIds)

    const alreadySentUserIds = new Set((existingDigests || []).map(d => d.user_id))

    // Filter to users who haven't received today's digest
    const usersToNotify = userIds.filter(uid => !alreadySentUserIds.has(uid))

    if (usersToNotify.length === 0) {
      return NextResponse.json({ message: 'All users already notified today', sent: 0 })
    }

    // Get user emails for the digest
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', usersToNotify)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    let sentCount = 0
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://thepsychology.ai'

    for (const userId of usersToNotify) {
      const userInsights = insightsByUser.get(userId) || []
      const user = userMap.get(userId)
      const userEmail = user?.email || 'Unknown'
      const userName = user?.name || userEmail

      // Build email content
      const insightSummaries = userInsights.map((insight, idx) => {
        const sourceLabel = insight.source_type === 'exam' ? 'Practice Exam' : 'Quiz'
        const preview = insight.draft_message
          ? insight.draft_message.slice(0, 150) + (insight.draft_message.length > 150 ? '...' : '')
          : '(No draft message)'
        return `${idx + 1}. [${sourceLabel}] ${preview}`
      }).join('\n\n')

      const adminUrl = `${baseUrl}/admin/recover?userId=${userId}`

      const subject = `[Recover Digest] ${userInsights.length} new insight${userInsights.length > 1 ? 's' : ''} for ${userName}`

      const text = `
Recover Insights Digest
=======================

User: ${userName} (${userEmail})
New Insights: ${userInsights.length}

${insightSummaries}

---
Review and approve: ${adminUrl}

This is an automated daily digest from ThePsychology.AI
`.trim()

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #6a9bcc; padding-bottom: 10px; margin-bottom: 20px; }
    .insight { background: #f8f9fa; border-left: 4px solid #6a9bcc; padding: 12px; margin: 12px 0; border-radius: 4px; }
    .insight-type { font-size: 12px; color: #666; text-transform: uppercase; }
    .cta { display: inline-block; background: #6a9bcc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #333;">Recover Insights Digest</h1>
    </div>

    <p><strong>User:</strong> ${userName} (${userEmail})</p>
    <p><strong>New Insights:</strong> ${userInsights.length}</p>

    ${userInsights.map((insight, idx) => {
      const sourceLabel = insight.source_type === 'exam' ? 'Practice Exam' : 'Quiz'
      const preview = insight.draft_message
        ? insight.draft_message.slice(0, 200) + (insight.draft_message.length > 200 ? '...' : '')
        : '(No draft message)'
      return `
        <div class="insight">
          <div class="insight-type">${sourceLabel}</div>
          <p>${preview}</p>
        </div>
      `
    }).join('')}

    <a href="${adminUrl}" class="cta">Review &amp; Approve Insights</a>

    <div class="footer">
      <p>This is an automated daily digest from ThePsychology.AI</p>
    </div>
  </div>
</body>
</html>
`.trim()

      try {
        await sendNotificationEmail({ subject, text, html })

        // Log the digest
        const insightIds = userInsights.map(i => i.id)
        await supabase.from('recover_daily_digest_log').insert({
          user_id: userId,
          digest_date: today,
          insight_ids: insightIds,
          insights_count: insightIds.length,
        })

        sentCount++
      } catch (emailError) {
        console.error(`[recover-digest] Failed to send email for user ${userId}:`, emailError)
      }
    }

    return NextResponse.json({
      message: `Digest sent for ${sentCount} user(s)`,
      sent: sentCount,
      totalPending: pendingInsights.length,
    })
  } catch (error) {
    console.error('[recover-digest] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
