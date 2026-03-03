export interface SubscriptionLike {
  subscription_tier?: string | null
  created_at?: string | null
  subscription_started_at?: string | null
  stripe_customer_id?: string | null
  trial_ends_at?: string | null
}

export function isFreeTier(user?: SubscriptionLike | null): boolean {
  if (!user) return true
  return user.subscription_tier === 'free'
}

export function isStripeSubscriber(user?: SubscriptionLike | null): boolean {
  return Boolean(user?.stripe_customer_id)
}

export function isTrialExpired(user?: SubscriptionLike | null): boolean {
  if (!user?.trial_ends_at) return false
  return new Date() > new Date(user.trial_ends_at)
}

export function getTrialDaysRemaining(user?: SubscriptionLike | null): number {
  if (!user?.trial_ends_at) return 0
  const endsAt = new Date(user.trial_ends_at)
  const now = new Date()
  const msRemaining = endsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
}

export function getEntitledSubscriptionTier(
  user?: SubscriptionLike | null
): string | null {
  if (!user) return null

  // Stripe subscribers keep their tier indefinitely
  if (isStripeSubscriber(user)) {
    return 'pro'
  }

  // Free tier users stay on free
  if (user.subscription_tier === 'free') {
    return 'free'
  }

  // Trial users: check if their trial has expired
  if (user.trial_ends_at && isTrialExpired(user)) {
    return 'free'
  }

  // Active trial or legacy pro user
  return 'pro'
}

export function hasProAccess(user?: SubscriptionLike | null): boolean {
  const tier = getEntitledSubscriptionTier(user)
  return tier === 'pro'
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
  const expired = isTrialExpired(user)
  const daysRemaining = getTrialDaysRemaining(user)

  return {
    isFreeTier: freeTier || expired,
    isPromo: !stripeSubscriber && !freeTier && Boolean(user.trial_ends_at),
    isStripeSubscriber: stripeSubscriber,
    expired,
    daysRemaining: stripeSubscriber ? Infinity : daysRemaining,
    expiresAt: user.trial_ends_at ?? null,
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
