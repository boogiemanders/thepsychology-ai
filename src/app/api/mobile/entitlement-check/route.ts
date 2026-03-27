import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth, getServiceClient } from '@/lib/server/mobile-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request)
    if ('error' in auth) return auth.error

    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const userId = auth.userId

    // Check for Stripe subscription
    const { data: stripeSubscription } = await supabase
      .from('subscriptions')
      .select('status,current_period_end,plan_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single()

    if (stripeSubscription) {
      return NextResponse.json({
        has_access: true,
        source: stripeSubscription.status === 'trialing' ? 'trial' : 'stripe',
        expires_at: stripeSubscription.current_period_end || null,
        tier: stripeSubscription.plan_id || 'pro',
      })
    }

    // Check for StoreKit (iOS IAP) subscription
    const { data: storekitSubscription } = await supabase
      .from('storekit_subscriptions')
      .select('status,expires_at,product_id')
      .eq('user_id', userId)
      .in('status', ['active', 'grace_period'])
      .order('expires_at', { ascending: false })
      .limit(1)
      .single()

    if (storekitSubscription) {
      return NextResponse.json({
        has_access: true,
        source: 'storekit',
        expires_at: storekitSubscription.expires_at || null,
        tier: storekitSubscription.product_id || 'pro',
      })
    }

    // Check for free/trial access grants (e.g., manual overrides, promo codes)
    const { data: accessGrant } = await supabase
      .from('access_grants')
      .select('grant_type,expires_at,tier')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single()

    if (accessGrant) {
      return NextResponse.json({
        has_access: true,
        source: accessGrant.grant_type || 'free',
        expires_at: accessGrant.expires_at || null,
        tier: accessGrant.tier || 'free',
      })
    }

    // No active subscription found
    return NextResponse.json({
      has_access: false,
      source: 'free',
      expires_at: null,
      tier: 'free',
    })
  } catch (error) {
    console.error('[mobile/entitlement-check] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
