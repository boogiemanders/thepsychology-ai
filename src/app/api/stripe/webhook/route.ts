import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeSecretKey || !webhookSecret) {
  console.warn('[Stripe] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET; webhook events cannot be processed.')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' }) : null

// Price IDs to determine plan tier (live mode)
const PRICE_TO_TIER: Record<string, 'pro' | 'pro_coaching'> = {
  // Live price IDs
  'price_1SWv6wAHUPMmLYsCy5yObtDu': 'pro',
  'price_1SWv6IAHUPMmLYsCa98Z3Po6': 'pro_coaching',
  // Test price IDs
  'price_1SaZCyAHUPMmLYsChA0LhNDs': 'pro',
  'price_1SaZDyAHUPMmLYsCpskaQ7eU': 'pro_coaching',
}

async function updateUserSubscription(userId: string, tier: 'pro' | 'pro_coaching') {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    throw new Error('Supabase service role client is not configured')
  }

  // First check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, subscription_tier')
    .eq('id', userId)
    .single()

  console.log('[Stripe] User lookup result:', { userId, existingUser, fetchError })

  if (fetchError || !existingUser) {
    throw new Error(`User not found in database: ${userId}`)
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_started_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  console.log('[Stripe] Supabase update result:', { data, error, userId, tier })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error(`Update returned no rows for userId: ${userId}`)
  }
}

async function getTierFromSession(session: Stripe.Checkout.Session): Promise<'pro' | 'pro_coaching' | null> {
  // First check metadata
  if (session.metadata?.planTier) {
    console.log('[Stripe] Got tier from metadata:', session.metadata.planTier)
    return session.metadata.planTier as 'pro' | 'pro_coaching'
  }

  // Otherwise, try to determine from line items
  if (!stripe) {
    console.error('[Stripe] Stripe client not initialized')
    return null
  }

  try {
    console.log('[Stripe] Fetching line items for session:', session.id)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
    const priceId = lineItems.data[0]?.price?.id
    const mappedTier = priceId ? PRICE_TO_TIER[priceId] : null

    console.log('[Stripe] Line items result:', {
      lineItemsCount: lineItems.data.length,
      priceId,
      mappedTier,
      availablePriceIds: Object.keys(PRICE_TO_TIER),
    })

    if (priceId && mappedTier) {
      return mappedTier
    }
  } catch (err) {
    console.error('[Stripe] Error fetching line items:', err)
  }

  console.error('[Stripe] Could not determine tier from session')
  return null
}

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const signature = headers().get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = (session.metadata?.userId || session.client_reference_id) as string | undefined
      const planTier = await getTierFromSession(session)

      console.log('[Stripe] Processing checkout.session.completed', {
        sessionId: session.id,
        userId,
        planTier,
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
        clientReferenceId: session.client_reference_id,
      })

      if (!userId || !planTier) {
        console.error('[Stripe] Missing critical metadata on checkout session', {
          sessionId: session.id,
          customerEmail: session.customer_email,
          userId,
          planTier,
          metadata: session.metadata,
          clientReferenceId: session.client_reference_id,
          note: 'Cannot update subscription without userId and planTier',
        })
        // Still return success so Stripe doesn't retry
        return NextResponse.json({ received: true })
      }

      console.log('[Stripe] Updating subscription for user', { userId, planTier })
      await updateUserSubscription(userId, planTier)
      console.log('[Stripe] Subscription updated successfully', { userId, planTier })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe] Error handling webhook event:', {
      error,
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
