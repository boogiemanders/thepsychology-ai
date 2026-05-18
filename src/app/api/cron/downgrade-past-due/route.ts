import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

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

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  const nowIso = new Date().toISOString()

  const { data: expiredUsers, error: fetchError } = await supabase
    .from('users')
    .select('id, email, full_name, stripe_customer_id, grace_period_ends_at')
    .lt('grace_period_ends_at', nowIso)
    .eq('subscription_tier', 'pro')
    .not('grace_period_ends_at', 'is', null)

  if (fetchError) {
    console.error('[Downgrade Past Due] Fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch past-due users' }, { status: 500 })
  }

  if (!expiredUsers || expiredUsers.length === 0) {
    return NextResponse.json({ message: 'No past-due users to downgrade', downgraded: 0 })
  }

  const userIds = expiredUsers.map((u) => u.id)

  const { error: updateError } = await supabase
    .from('users')
    .update({ subscription_tier: 'free', grace_period_ends_at: null })
    .in('id', userIds)

  if (updateError) {
    console.error('[Downgrade Past Due] Update error:', updateError)
    return NextResponse.json({ error: 'Failed to downgrade users' }, { status: 500 })
  }

  // Stable, never-expiring URL. The dashboard settings page has an
  // "Update Payment Method" button that mints a fresh Stripe portal
  // session at click time.
  const settingsUrl = 'https://thepsychology.ai/dashboard/settings'

  for (const user of expiredUsers) {
    if (!user.email || !isNotificationEmailConfigured(user.email)) continue

    const firstName = user.full_name?.split(' ')[0] || 'there'
    const html = `
<p>Hi ${firstName},</p>
<p>Your <strong>thePsychology.ai Pro</strong> subscription has been moved to the Free plan because we weren't able to process your payment in the last 7 days.</p>
<p>Your study progress is safe. Everything you've completed is still there. You can keep studying on the Free plan (10 lessons, 3 quizzes/day).</p>
<p>To restore Pro access, go to your settings page and click the <strong>Update Payment Method</strong> button:</p>
<p><a href="${settingsUrl}" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;border:1px solid #111827;mso-padding-alt:0;"><span style="color:#ffffff;">Open Settings</span></a></p>
<p>Or paste this link into your browser: <a href="${settingsUrl}">${settingsUrl}</a></p>
<p>You can reply to this email if you want help. Anders will get back to you.</p>
<p>The thePsychology.ai Team</p>
`.trim()

    const text = [
      `Hi ${firstName},`,
      '',
      "Your thePsychology.ai Pro subscription has been moved to the Free plan because we weren't able to process your payment in the last 7 days.",
      '',
      "Your study progress is safe. Everything you've completed is still there. You can keep studying on the Free plan (10 lessons, 3 quizzes/day).",
      '',
      'To restore Pro access, go to your settings page and click the "Update Payment Method" button:',
      settingsUrl,
      '',
      'You can reply to this email if you want help. Anders will get back to you.',
      '',
      'The thePsychology.ai Team',
    ].join('\n')

    try {
      await sendNotificationEmail({
        to: user.email,
        cc: 'DrChan@thepsychology.ai',
        subject: 'Your thePsychology.ai Pro access has moved to Free',
        text,
        html,
      })
    } catch (err) {
      console.error('[Downgrade Past Due] Failed to send email:', { userId: user.id, err })
    }
  }

  await sendSlackNotification(
    `⏰ Past-due grace expired: ${userIds.length} user(s) downgraded to free`,
    'payments'
  )

  return NextResponse.json({
    message: `Downgraded ${userIds.length} past-due users`,
    downgraded: userIds.length,
  })
}
