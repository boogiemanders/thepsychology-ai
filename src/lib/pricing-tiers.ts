// Tiered scarcity pricing configuration
// Track signups from launch date of this promo

export const PROMO_START_DATE = new Date('2026-02-06T00:00:00Z')
export const TIER_SIZE = 100
export const FULL_PRICE = 100 // $100/mo value anchor

export type PricingTier = {
  tier: 1 | 2 | 3 | 4
  price: number
  discount: number
  remaining: number
  nextTierPrice: number | null
}

export function getPricingTier(promoSignupCount: number): PricingTier {
  if (promoSignupCount < 100) {
    return {
      tier: 1,
      price: 0,
      discount: 100,
      remaining: 100 - promoSignupCount,
      nextTierPrice: 20,
    }
  }
  if (promoSignupCount < 200) {
    return {
      tier: 2,
      price: 20,
      discount: 80,
      remaining: 200 - promoSignupCount,
      nextTierPrice: 50,
    }
  }
  if (promoSignupCount < 300) {
    return {
      tier: 3,
      price: 50,
      discount: 50,
      remaining: 300 - promoSignupCount,
      nextTierPrice: 100,
    }
  }
  return {
    tier: 4,
    price: 100,
    discount: 0,
    remaining: 0,
    nextTierPrice: null,
  }
}

export function formatPrice(price: number): string {
  return price === 0 ? '$0' : `$${price}`
}

export function getTierLabel(tier: PricingTier): string {
  if (tier.tier === 1) return 'First 100 spots'
  if (tier.tier === 2) return 'Next 100 spots'
  if (tier.tier === 3) return 'Next 100 spots'
  return 'Full price'
}
