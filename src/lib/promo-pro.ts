export type ProPromoConfig = {
  startsAtMs: number
  endsAtMs: number
  trialEndSeconds: number
}

/**
 * Pro promo window — DISABLED.
 * Replaced by 7-day trial + founding price system (March 2026).
 */
export function getProPromoConfig(): ProPromoConfig | null {
  return null
}
