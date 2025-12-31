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
  'price_1SaZDyAHUPMmLYsCpskaQ7eU': 'pro_coaching',
}

// Admin secret for protecting this endpoint
const ADMIN_SECRET = process.env.ADMIN_API_SECRET

export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const { email, userId, stripeCustomerId } = await request.json()

    if (!email && !userId && !stripeCustomerId) {
      return NextResponse.json(
        { error: 'Provide at least one of: email, userId, stripeCustomerId' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Find the user
    let userQuery = supabase.from('users').select('*')
    if (userId) {
      userQuery = userQuery.eq('id', userId)
    } else if (email) {
      userQuery = userQuery.eq('email', email)
    } else if (stripeCustomerId) {
      userQuery = userQuery.eq('stripe_customer_id', stripeCustomerId)
    }

    const { data: user, error: userError } = await userQuery.single()

    if (userError || !user) {
      console.error('[Admin Sync] User lookup failed:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[Admin Sync] Found user:', { id: user.id, email: user.email })

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this email', email: user.email },
        { status: 404 }
      )
    }

    const customer = customers.data[0]
    console.log('[Admin Sync] Found Stripe customer:', customer.id)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // No active subscription - check for completed checkout sessions instead
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 5,
      })

      const paidSession = sessions.data.find((s) => s.payment_status === 'paid')

      if (!paidSession) {
        return NextResponse.json({
          message: 'No active subscription or completed payment found',
          user: {
            id: user.id,
            email: user.email,
            subscription_tier: user.subscription_tier,
          },
          stripeCustomer: { id: customer.id, email: customer.email },
        })
      }

      // Found a paid session - get tier from line items
      const lineItems = await stripe.checkout.sessions.listLineItems(paidSession.id, { limit: 1 })
      const priceId = lineItems.data[0]?.price?.id
      const tier = priceId ? PRICE_TO_TIER[priceId] : null

      if (!tier) {
        return NextResponse.json({
          message: 'Paid session found but price ID not recognized',
          priceId,
          recognizedPrices: Object.keys(PRICE_TO_TIER),
          user: { id: user.id, email: user.email },
        })
      }

      // Update from checkout session
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_started_at: new Date(paidSession.created * 1000).toISOString(),
          stripe_customer_id: customer.id,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('[Admin Sync] Failed to update user:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Synced subscription from checkout session for ${user.email}`,
        source: 'checkout_session',
        before: {
          subscription_tier: user.subscription_tier,
          stripe_customer_id: user.stripe_customer_id,
        },
        after: {
          subscription_tier: updatedUser.subscription_tier,
          stripe_customer_id: updatedUser.stripe_customer_id,
        },
      })
    }

    // Has active subscription
    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price.id
    const tier = priceId ? PRICE_TO_TIER[priceId] : null

    if (!tier) {
      return NextResponse.json({
        message: 'Active subscription found but price ID not recognized',
        priceId,
        recognizedPrices: Object.keys(PRICE_TO_TIER),
        user: { id: user.id, email: user.email },
        subscription: { id: subscription.id, status: subscription.status },
      })
    }

    // Update the user's subscription
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_started_at: new Date(subscription.created * 1000).toISOString(),
        stripe_customer_id: customer.id,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Admin Sync] Failed to update user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    console.log('[Admin Sync] Successfully synced:', { userId: user.id, tier })

    return NextResponse.json({
      success: true,
      message: `Synced subscription for ${user.email}`,
      source: 'active_subscription',
      before: {
        subscription_tier: user.subscription_tier,
        stripe_customer_id: user.stripe_customer_id,
      },
      after: {
        subscription_tier: updatedUser.subscription_tier,
        stripe_customer_id: updatedUser.stripe_customer_id,
      },
      stripeSubscription: {
        id: subscription.id,
        status: subscription.status,
        priceId,
        tier,
      },
    })
  } catch (error) {
    console.error('[Admin Sync] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
