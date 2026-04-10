import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'
import { sendSlackNotification } from '@/lib/notify-slack'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const ADMIN_SECRET = process.env.ADMIN_API_SECRET

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const email: string | undefined = body.email
    const sendEmail: boolean = body.sendEmail !== false

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 })
    const customer = customers.data[0]
    if (!customer) {
      return NextResponse.json({ error: `No Stripe customer found for ${email}` }, { status: 404 })
    }

    // Find active or past_due subscription
    let subscription: Stripe.Subscription | null = null
    for (const status of ['active', 'past_due'] as Stripe.Subscription.Status[]) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status, limit: 1 })
      if (subs.data.length > 0) {
        subscription = subs.data[0]
        break
      }
    }

    if (!subscription) {
      return NextResponse.json(
        { error: `No active or past_due subscription found for ${email}` },
        { status: 404 }
      )
    }

    // Schedule cancellation in 7 days — gives the customer a grace period to update payment.
    // When the date arrives, Stripe fires customer.subscription.deleted and the existing
    // webhook handler downgrades the user in the DB.
    const cancelAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    await stripe.subscriptions.update(subscription.id, { cancel_at: cancelAt })

    // Generate billing portal URL for the email
    let portalUrl = 'https://thepsychology.ai'
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: 'https://thepsychology.ai/dashboard',
      })
      portalUrl = portalSession.url
    } catch {
      // Portal not configured — fall back to site URL
    }

    // Look up user name and recent topic
    let recentTopic: string | null = null
    let firstName: string | null = null
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single()

    if (dbUser) {
      firstName = dbUser.full_name?.split(' ')[0] ?? null
      const { data: topicRow } = await supabase
        .from('topic_mastery')
        .select('topic')
        .eq('user_id', dbUser.id)
        .order('last_attempted', { ascending: false, nullsFirst: false })
        .limit(1)
        .single()
      recentTopic = topicRow?.topic ?? null
    }

    // Send customer-facing email
    if (sendEmail && isNotificationEmailConfigured(email)) {
      const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
      const topicLine = recentTopic
        ? `<p>Your lessons on <strong>${recentTopic}</strong> have been tailored to your interests. We'd love to keep that going.</p>`
        : ''

      const html = `
<p>${greeting}</p>
<p>We weren't able to process your payment for your <strong>thePsychology.ai Pro</strong> subscription. You have 7 days to update your payment method before your account is downgraded to the free plan.</p>
${topicLine}
<p>To keep your Pro access, please update your payment method:</p>
<p><a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Update Payment Method</a></p>
<p>This is an automated message. If you have any questions, you can reply to this email and Anders will get back to you.</p>
<p>The thePsychology.ai Team</p>
`.trim()

      const text = [
        greeting,
        '',
        "We weren't able to process your payment for your thePsychology.ai Pro subscription. You have 7 days to update your payment method before your account is downgraded to the free plan.",
        ...(recentTopic
          ? [`Your lessons on ${recentTopic} have been tailored to your interests. We'd love to keep that going.`]
          : []),
        '',
        'To keep your Pro access, please update your payment method:',
        portalUrl,
        '',
        'This is an automated message. If you have any questions, you can reply to this email and Anders will get back to you.',
        '',
        'The thePsychology.ai Team',
      ].join('\n')

      await sendNotificationEmail({
        to: email,
        cc: 'DrChan@thepsychology.ai',
        subject: 'Action required: Payment failed for your thePsychology.ai Pro subscription',
        text,
        html,
      })
    }

    await sendSlackNotification(
      `🚫 Admin manually cancelled subscription for ${email} (sub: ${subscription.id})`,
      'payments'
    )

    return NextResponse.json({
      success: true,
      email,
      subscriptionId: subscription.id,
      scheduledCancelAt: new Date(cancelAt * 1000).toISOString(),
      emailSent: sendEmail,
    })
  } catch (error) {
    console.error('[Admin] Error cancelling subscription:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
