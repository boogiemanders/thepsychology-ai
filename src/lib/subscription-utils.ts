import { getProPromoConfig } from '@/lib/promo-pro'

export interface SubscriptionLike {
  subscription_tier?: string | null
  created_at?: string | null
  subscription_started_at?: string | null
}

export const FREE_TRIAL_LENGTH_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export function isFreeTier(user?: SubscriptionLike | null): boolean {
  if (!user) return false
  return !user.subscription_tier || user.subscription_tier === 'free'
}

export function isProPromoActive(nowMs: number = Date.now()): boolean {
  return Boolean(getProPromoConfig(nowMs))
}

export function getEntitledSubscriptionTier(
  user?: SubscriptionLike | null,
  nowMs: number = Date.now()
): string | null {
  if (!user) return null
  if (isFreeTier(user) && isProPromoActive(nowMs)) return 'pro'
  return user.subscription_tier || 'free'
}

export function hasProAccess(user?: SubscriptionLike | null, nowMs: number = Date.now()): boolean {
  const tier = getEntitledSubscriptionTier(user, nowMs)
  return tier === 'pro' || tier === 'pro_coaching'
}

export function getFreeTrialStatus(user?: SubscriptionLike | null) {
  if (!user || !isFreeTier(user)) {
    return {
      isFreeTier: false,
      expired: false,
      daysRemaining: Infinity,
      expiresAt: null as string | null,
    }
  }

  if (isProPromoActive()) {
    return {
      isFreeTier: true,
      expired: false,
      daysRemaining: Infinity,
      expiresAt: null as string | null,
    }
  }

  const start =
    user.subscription_started_at ||
    user.created_at ||
    new Date().toISOString()

  const startDate = new Date(start)
  const expiry = new Date(startDate.getTime() + FREE_TRIAL_LENGTH_DAYS * DAY_MS)
  const now = new Date()

  const msRemaining = expiry.getTime() - now.getTime()
  const daysRemaining = Math.max(Math.ceil(msRemaining / DAY_MS), 0)
  const expired = msRemaining <= 0

  return {
    isFreeTier: true,
    expired,
    daysRemaining,
    expiresAt: expiry.toISOString(),
  }
}
