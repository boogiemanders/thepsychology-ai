export interface SubscriptionLike {
  subscription_tier?: string | null
  created_at?: string | null
  subscription_started_at?: string | null
  stripe_customer_id?: string | null
}

// Promo users get 1 year of pro access from their signup date
const PROMO_DURATION_DAYS = 365

export function isFreeTier(user?: SubscriptionLike | null): boolean {
  if (!user) return true
  return user.subscription_tier === 'free'
}

export function isStripeSubscriber(user?: SubscriptionLike | null): boolean {
  return Boolean(user?.stripe_customer_id)
}

export function getPromoExpirationDate(user?: SubscriptionLike | null): Date | null {
  if (!user?.subscription_started_at) return null
  const startDate = new Date(user.subscription_started_at)
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + PROMO_DURATION_DAYS)
  return expirationDate
}

export function isPromoExpired(user?: SubscriptionLike | null): boolean {
  // Stripe subscribers never expire
  if (isStripeSubscriber(user)) return false

  // Free tier users are not on promo
  if (isFreeTier(user)) return false

  // Check if promo period has expired
  const expirationDate = getPromoExpirationDate(user)
  if (!expirationDate) return false

  return new Date() > expirationDate
}

export function getEntitledSubscriptionTier(
  user?: SubscriptionLike | null
): string | null {
  if (!user) return null

  // Stripe subscribers keep their tier indefinitely
  if (isStripeSubscriber(user)) {
    return user.subscription_tier === 'pro_coaching' ? 'pro_coaching' : 'pro'
  }

  // Free tier users stay on free
  if (user.subscription_tier === 'free') {
    return 'free'
  }

  // Promo users: check if their promo period has expired
  if (isPromoExpired(user)) {
    return 'free' // Downgrade to free after promo expires
  }

  return user.subscription_tier === 'pro_coaching' ? 'pro_coaching' : 'pro'
}

export function hasProAccess(user?: SubscriptionLike | null): boolean {
  const tier = getEntitledSubscriptionTier(user)
  return tier === 'pro' || tier === 'pro_coaching'
}

export function getPromoStatus(user?: SubscriptionLike | null) {
  if (!user) {
    return {
      isFreeTier: true,
      isPromo: false,
      isStripeSubscriber: false,
      expired: false,
      daysRemaining: 0,
      expiresAt: null as string | null,
    }
  }

  const stripeSubscriber = isStripeSubscriber(user)
  const freeTier = isFreeTier(user)
  const expirationDate = getPromoExpirationDate(user)
  const expired = isPromoExpired(user)

  let daysRemaining = Infinity
  if (!stripeSubscriber && !freeTier && expirationDate) {
    const now = new Date()
    daysRemaining = Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  return {
    isFreeTier: freeTier || expired,
    isPromo: !stripeSubscriber && !freeTier,
    isStripeSubscriber: stripeSubscriber,
    expired,
    daysRemaining: stripeSubscriber ? Infinity : daysRemaining,
    expiresAt: expirationDate?.toISOString() ?? null,
  }
}

// Legacy function for compatibility
export function getFreeTrialStatus(user?: SubscriptionLike | null) {
  const status = getPromoStatus(user)
  return {
    isFreeTier: status.isFreeTier,
    expired: status.expired,
    daysRemaining: status.daysRemaining,
    expiresAt: status.expiresAt,
  }
}
