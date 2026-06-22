// Price step-up logic: $30/month before cutoff, $40/month after
// June 2026 subscribers lock in $30/month forever via Stripe (earlier $20 founders keep $20)

const FOUNDING_PRICE_ENDS_AT = process.env.FOUNDING_PRICE_ENDS_AT || '2026-07-01T04:00:00.000Z'

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
    currentPrice: isFoundingPrice ? 30 : 40,
    standardPrice: 40,
    isFoundingPrice,
    daysUntilPriceIncrease,
    foundingPriceEndsAt: endsAt,
  }
}

export function formatPrice(price: number): string {
  return price === 0 ? '$0' : `$${price}`
}
