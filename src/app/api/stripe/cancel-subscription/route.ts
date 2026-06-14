import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

// Maps our reasons to Stripe's fixed cancellation feedback enum so the
// reason also shows up in the Stripe dashboard.
const CANCEL_REASONS: Record<string, Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback> = {
  passed_exam: 'other',
  content_quality: 'low_quality',
  too_expensive: 'too_expensive',
  switched_service: 'switched_service',
  not_studying: 'unused',
  other: 'other',
}

// Warm check-in email auto-sent on cancel. Passed-the-exam gets a congrats
// opener; everyone else gets a sorry-to-see-you-go. Both invite a reply,
// which lands in DrChan@thepsychology.ai (the from address).
function buildCancelEmail(reason: string | null, fullName: string | null, cancelAt: Date) {
  const firstName = fullName?.trim().split(/\s+/)[0] || ''
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
  const accessEnds = cancelAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (reason === 'passed_exam') {
    return {
      subject: 'congrats on passing the EPPP',
      text: `${greeting}

Saw you cancelled and that you passed the EPPP. Congratulations, that's the whole point.

You're good through ${accessEnds}. If anything would've made the prep better, just hit reply, it comes straight to me.

All the best,

Anders
thePsychology.ai`,
    }
  }

  return {
    subject: 'sorry to see you go',
    text: `${greeting}

Saw you cancelled. Totally fine. You're good through ${accessEnds}.

If there's anything we could've done better, just hit reply, it comes straight to me.

Good luck with everything,

Anders
thePsychology.ai`,
  }
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const userId = await requireAuthedUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { reason?: string; comment?: string } | null
  const reason = body?.reason && CANCEL_REASONS[body.reason] ? body.reason : null
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 1000) : ''

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user with Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, stripe_customer_id, subscription_tier')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Find active subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const subscription = subscriptions.data[0]

    // Cancel at end of billing period (graceful cancellation)
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      ...(reason
        ? {
            cancellation_details: {
              feedback: CANCEL_REASONS[reason],
              comment: [reason, comment].filter(Boolean).join(': '),
            },
          }
        : {}),
    })

    if (reason) {
      // Feedback is a bonus, never block the cancellation on it
      const { error: feedbackError } = await supabase.from('cancellation_feedback').insert({
        user_id: userId,
        user_email: user.email,
        reason,
        comment: comment || null,
      })
      if (feedbackError) {
        console.error('[Stripe] Failed to store cancellation feedback:', feedbackError)
      }
    }

    // Auto-send a warm check-in to the user, CC'd to us. Never block cancel on it.
    if (user.email && isNotificationEmailConfigured(user.email)) {
      try {
        const cancelAt = new Date(updatedSubscription.current_period_end * 1000)
        const { subject, text } = buildCancelEmail(reason, user.full_name, cancelAt)
        await sendNotificationEmail({
          to: user.email,
          cc: 'DrChan@thepsychology.ai',
          subject,
          text,
        })
      } catch (emailError) {
        console.error('[Stripe] Failed to send cancellation email:', emailError)
      }
    }

    console.log('[Stripe] Subscription set to cancel at period end:', {
      userId,
      subscriptionId: subscription.id,
      reason,
      cancelAt: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      cancelAt: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('[Stripe] Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
