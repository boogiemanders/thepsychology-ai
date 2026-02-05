import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

// Price IDs to determine plan tier
const PRICE_TO_TIER: Record<string, 'pro' | 'pro_coaching'> = {
  // Live price IDs
  'price_1SWv6wAHUPMmLYsCy5yObtDu': 'pro',
  'price_1SWv6IAHUPMmLYsCa98Z3Po6': 'pro_coaching',
  // Test price IDs
  'price_1SaZCyAHUPMmLYsChA0LhNDs': 'pro',
  'price_1SxOOQAHUPMmLYsCIsVx16ln': 'pro_coaching',
}

// In-memory rate limiting: one sync per user per minute
const syncAttempts = new Map<string, number>()

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Rate limiting - 1 request per minute per user
    const lastAttempt = syncAttempts.get(userId) || 0
    const now = Date.now()
    if (now - lastAttempt < 60000) {
      const waitTime = Math.ceil((60000 - (now - lastAttempt)) / 1000)
      return NextResponse.json(
        { error: `Please wait ${waitTime} seconds before trying again` },
        { status: 429 }
      )
    }
    syncAttempts.set(userId, now)

    // Clean up old entries periodically
    if (syncAttempts.size > 1000) {
      const cutoff = now - 60000
      for (const [key, time] of syncAttempts.entries()) {
        if (time < cutoff) syncAttempts.delete(key)
      }
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_tier, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[Stripe Sync] User not found:', userId, userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Already has paid subscription - no sync needed
    if (user.subscription_tier && user.subscription_tier !== 'free') {
      return NextResponse.json({
        success: true,
        message: 'Subscription already active',
        subscription_tier: user.subscription_tier,
      })
    }

    console.log('[Stripe Sync] Looking for payment for user:', { userId, email: user.email })

    // Look for recent checkout sessions for this user (last 24 hours)
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      created: {
        gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Last 24 hours
      },
    })

    // Find session matching this user by client_reference_id, metadata, or email
    const matchingSession = sessions.data.find(
      (s) =>
        s.payment_status === 'paid' &&
        (s.client_reference_id === userId ||
          s.metadata?.userId === userId ||
          s.customer_email === user.email)
    )

    if (!matchingSession) {
      console.log('[Stripe Sync] No matching paid session found for user:', userId)
      return NextResponse.json({
        success: false,
        message: 'No completed payment found. Please wait a few minutes and try again.',
      })
    }

    console.log('[Stripe Sync] Found matching session:', matchingSession.id)

    // Get tier from line items
    const lineItems = await stripe.checkout.sessions.listLineItems(matchingSession.id, { limit: 1 })
    const priceId = lineItems.data[0]?.price?.id
    const tier = priceId ? PRICE_TO_TIER[priceId] : null

    if (!tier) {
      console.error('[Stripe Sync] Unrecognized price ID:', priceId)
      return NextResponse.json({
        success: false,
        message: 'Could not determine subscription tier. Please contact support.',
      })
    }

    // Extract stripe customer ID
    const stripeCustomerId =
      typeof matchingSession.customer === 'string'
        ? matchingSession.customer
        : (matchingSession.customer as { id?: string } | null)?.id

    // Update user subscription
    const updateData: Record<string, unknown> = {
      subscription_tier: tier,
      subscription_started_at: new Date().toISOString(),
    }

    if (stripeCustomerId && !user.stripe_customer_id) {
      updateData.stripe_customer_id = stripeCustomerId
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('[Stripe Sync] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    console.log('[Stripe Sync] Successfully synced subscription:', { userId, tier })

    return NextResponse.json({
      success: true,
      message: 'Subscription activated',
      subscription_tier: tier,
    })
  } catch (error) {
    console.error('[Stripe Sync] Error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
