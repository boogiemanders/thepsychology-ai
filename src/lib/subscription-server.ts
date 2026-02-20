import { getSupabaseClient } from '@/lib/supabase-server'
import { getEntitledSubscriptionTier, hasProAccess, getPromoStatus } from '@/lib/subscription-utils'

export interface ServerSubscriptionStatus {
  userId: string
  email: string
  subscription_tier: string
  isTrialExpired: boolean
  daysRemaining: number
  hasAccess: boolean
  stripe_customer_id?: string
  isPromo: boolean
  isStripeSubscriber: boolean
}

/**
 * Get server-side verified subscription status for a user.
 * Unlike client-side checks, this fetches directly from the database.
 */
export async function getServerSubscriptionStatus(
  userId: string
): Promise<ServerSubscriptionStatus | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    console.error('[Subscription Server] Supabase client not available')
    return null
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, subscription_tier, created_at, subscription_started_at, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('[Subscription Server] User not found:', userId, error)
    return null
  }

  const promoStatus = getPromoStatus(user)
  const entitledTier = getEntitledSubscriptionTier(user) || 'free'
  const hasAccess = hasProAccess(user)

  return {
    userId: user.id,
    email: user.email,
    subscription_tier: entitledTier,
    isTrialExpired: promoStatus.expired,
    daysRemaining: promoStatus.daysRemaining,
    hasAccess,
    stripe_customer_id: user.stripe_customer_id,
    isPromo: promoStatus.isPromo,
    isStripeSubscriber: promoStatus.isStripeSubscriber,
  }
}

export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  status?: ServerSubscriptionStatus
}

/**
 * Check if a user has access to paid features.
 * @param userId - The user ID to check
 * @param allowPromo - Whether to allow access during promo period (default: true)
 * @returns Object with allowed boolean, optional reason, and status details
 */
export async function requireActiveSubscription(
  userId: string,
  allowPromo: boolean = true
): Promise<AccessCheckResult> {
  const status = await getServerSubscriptionStatus(userId)

  if (!status) {
    return { allowed: false, reason: 'User not found' }
  }

  // Check if user has pro access
  if (!status.hasAccess) {
    if (status.isTrialExpired) {
      return { allowed: false, reason: 'Promo period expired', status }
    }
    return { allowed: false, reason: 'Subscription required', status }
  }

  // If promo access is not allowed and user is on promo (not Stripe), deny
  if (!allowPromo && status.isPromo && !status.isStripeSubscriber) {
    return { allowed: false, reason: 'Paid subscription required', status }
  }

  return { allowed: true, status }
}

/**
 * Middleware helper for API routes that require subscription access.
 * Returns null if access is granted, or a NextResponse if access is denied.
 *
 * @example
 * ```typescript
 * import { checkSubscriptionAccess } from '@/lib/subscription-server'
 *
 * export async function POST(request: NextRequest) {
 *   const body = await request.json()
 *   const { userId } = body
 *
 *   const accessDenied = await checkSubscriptionAccess(userId)
 *   if (accessDenied) return accessDenied
 *
 *   // ... rest of handler
 * }
 * ```
 */
export async function checkSubscriptionAccess(
  userId: string | undefined,
  allowTrial: boolean = true
): Promise<Response | null> {
  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { allowed, reason } = await requireActiveSubscription(userId, allowTrial)

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: reason || 'Subscription required',
        code: reason === 'Trial expired' ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_REQUIRED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return null
}
