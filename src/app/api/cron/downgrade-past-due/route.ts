import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

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

  for (const user of expiredUsers) {
    if (!user.email || !isNotificationEmailConfigured(user.email)) continue

    let portalUrl = 'https://thepsychology.ai/dashboard'
    if (stripe && user.stripe_customer_id) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripe_customer_id,
          return_url: 'https://thepsychology.ai/dashboard',
        })
        portalUrl = portalSession.url
      } catch (err) {
        console.warn('[Downgrade Past Due] Could not create billing portal session', err)
      }
    }

    const firstName = user.full_name?.split(' ')[0] || 'there'
    const html = `
<p>Hi ${firstName},</p>
<p>Your <strong>thePsychology.ai Pro</strong> subscription has been moved to the Free plan because we weren't able to process your payment in the last 7 days.</p>
<p>Your study progress is safe. Everything you've completed is still there. You can keep studying on the Free plan (10 lessons, 3 quizzes/day).</p>
<p>To restore Pro access, update your payment method:</p>
<p><a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Restore Pro</a></p>
<p>Reply to this email if you want help. Anders will get back to you.</p>
<p>The thePsychology.ai Team</p>
`.trim()

    const text = [
      `Hi ${firstName},`,
      '',
      "Your thePsychology.ai Pro subscription has been moved to the Free plan because we weren't able to process your payment in the last 7 days.",
      '',
      "Your study progress is safe. Everything you've completed is still there. You can keep studying on the Free plan (10 lessons, 3 quizzes/day).",
      '',
      'To restore Pro access, update your payment method:',
      portalUrl,
      '',
      'Reply to this email if you want help. Anders will get back to you.',
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
