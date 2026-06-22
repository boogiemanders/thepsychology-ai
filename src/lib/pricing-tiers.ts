// Founding price logic: $20/month before cutoff, $30/month after.
// March 2026 subscribers lock in $20/month forever via Stripe.
//
// Step-up: the standard Pro price rises $30 -> $40 at STANDARD_PRICE_INCREASES_AT
// (default 2026-07-01). Existing $20 and $30 subscribers keep their rate forever
// because Stripe never migrates a live subscription's price; only NEW checkouts
// pay the higher price. Three time-states: $20 founding (already ended
// 2026-04-01) -> $30 standard -> $40 current (from July 1).

const FOUNDING_PRICE_ENDS_AT = process.env.FOUNDING_PRICE_ENDS_AT || '2026-04-01T04:00:00.000Z'
const STANDARD_PRICE_INCREASES_AT = process.env.STANDARD_PRICE_INCREASES_AT || '2026-07-01T04:00:00.000Z'

export interface PricingInfo {
  currentPrice: number
  standardPrice: number
  isFoundingPrice: boolean
  priceHasIncreased: boolean
  daysUntilPriceIncrease: number
  foundingPriceEndsAt: Date
  priceIncreasesAt: Date
}

export function getPricingInfo(now: Date = new Date()): PricingInfo {
  const endsAt = new Date(FOUNDING_PRICE_ENDS_AT)
  const increasesAt = new Date(STANDARD_PRICE_INCREASES_AT)
  const isFoundingPrice = now < endsAt
  const priceHasIncreased = now >= increasesAt
  const msUntilIncrease = Math.max(0, increasesAt.getTime() - now.getTime())
  const daysUntilPriceIncrease = Math.ceil(msUntilIncrease / (1000 * 60 * 60 * 24))

  return {
    currentPrice: isFoundingPrice ? 20 : priceHasIncreased ? 40 : 30,
    standardPrice: priceHasIncreased ? 40 : 30,
    isFoundingPrice,
    priceHasIncreased,
    daysUntilPriceIncrease,
    foundingPriceEndsAt: endsAt,
    priceIncreasesAt: increasesAt,
  }
}

export function formatPrice(price: number): string {
  return price === 0 ? '$0' : `$${price}`
}
