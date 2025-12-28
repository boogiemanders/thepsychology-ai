export interface SubscriptionLike {
  subscription_tier?: string | null
  created_at?: string | null
  subscription_started_at?: string | null
}

export function isFreeTier(_user?: SubscriptionLike | null): boolean {
  return false
}

export function getEntitledSubscriptionTier(
  user?: SubscriptionLike | null
): string | null {
  if (!user) return null
  return user.subscription_tier === 'pro_coaching' ? 'pro_coaching' : 'pro'
}

export function hasProAccess(user?: SubscriptionLike | null): boolean {
  return Boolean(user)
}

export function getFreeTrialStatus(_user?: SubscriptionLike | null) {
  return {
    isFreeTier: false,
    expired: false,
    daysRemaining: Infinity,
    expiresAt: null as string | null,
  }
}
