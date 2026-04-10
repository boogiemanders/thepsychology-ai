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

    // Cancel immediately in Stripe — this triggers customer.subscription.deleted webhook
    // which the existing handler uses to downgrade the user in the DB
    await stripe.subscriptions.cancel(subscription.id)

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

    // Atomically look up user name and interest in a single query
    let userInterest: string | null = null
    let firstName: string | null = null
    const { data: dbUser } = await supabase
      .from('users')
      .select('full_name, user_current_interest(interest)')
      .eq('email', email)
      .single()

    if (dbUser) {
      firstName = dbUser.full_name?.split(' ')[0] ?? null
      const interestRows = dbUser.user_current_interest
      userInterest = Array.isArray(interestRows)
        ? (interestRows[0]?.interest ?? null)
        : ((interestRows as { interest?: string } | null)?.interest ?? null)
    }

    // Send customer-facing email
    if (sendEmail && isNotificationEmailConfigured(email)) {
      const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
      const interestLine = userInterest
        ? `<p>We know you've been using thePsychology.ai to explore topics connected to <strong>${userInterest}</strong> — we'd hate to lose you.</p>`
        : ''

      const html = `
<p>${greeting}</p>
<p>We weren't able to process your payment for your <strong>thePsychology.ai Pro</strong> subscription, so your account has been downgraded to the free plan.</p>
${interestLine}
<p>If you'd like to reactivate your Pro access, you can update your payment method and resubscribe:</p>
<p><a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Manage Billing →</a></p>
<p>– The thePsychology.ai Team</p>
`.trim()

      const text = [
        greeting,
        '',
        "We weren't able to process your payment for your thePsychology.ai Pro subscription, so your account has been downgraded to the free plan.",
        ...(userInterest
          ? [`We know you've been using thePsychology.ai to explore topics connected to ${userInterest} — we'd hate to lose you.`]
          : []),
        '',
        "If you'd like to reactivate your Pro access, you can update your payment method and resubscribe:",
        portalUrl,
        '',
        '– The thePsychology.ai Team',
      ].join('\n')

      await sendNotificationEmail({
        to: email,
        subject: 'Your thePsychology.ai Pro subscription has been cancelled',
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
      emailSent: sendEmail,
    })
  } catch (error) {
    console.error('[Admin] Error cancelling subscription:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
