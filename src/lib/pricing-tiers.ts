// Founding price logic: $20/month before cutoff, $30/month after
// March 2026 subscribers lock in $20/month forever via Stripe

const FOUNDING_PRICE_ENDS_AT = process.env.FOUNDING_PRICE_ENDS_AT || '2026-04-01T04:00:00.000Z'

export interface PricingInfo {
  currentPrice: number
  standardPrice: number
  isFoundingPrice: boolean
  daysUntilPriceIncrease: number
  foundingPriceEndsAt: Date
}

export function getPricingInfo(now: Date = new Date()): PricingInfo {
  const endsAt = new Date(FOUNDING_PRICE_ENDS_AT)
  const isFoundingPrice = now < endsAt
  const msRemaining = Math.max(0, endsAt.getTime() - now.getTime())
  const daysUntilPriceIncrease = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

  return {
    currentPrice: isFoundingPrice ? 20 : 30,
    standardPrice: 30,
    isFoundingPrice,
    daysUntilPriceIncrease,
    foundingPriceEndsAt: endsAt,
  }
}

export function formatPrice(price: number): string {
  return price === 0 ? '$0' : `$${price}`
}
