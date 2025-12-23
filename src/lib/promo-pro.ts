export type ProPromoConfig = {
  startsAtMs: number
  endsAtMs: number
  trialEndSeconds: number
}

function parseMs(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

/**
 * Pro promo window:
 * - Default: Dec 22, 2025 00:00:00 EST -> Jan 31, 2026 23:59:59 EST
 * - Configure via env in production:
 *   - PROMO_PRO_START_AT (ISO string)
 *   - PROMO_PRO_END_AT (ISO string)
 *
 * Note: EST in winter is UTC-5, so:
 * - 2025-12-22T00:00:00-05:00 == 2025-12-22T05:00:00Z
 * - 2026-01-31T23:59:59-05:00 == 2026-02-01T04:59:59Z
 */
export function getProPromoConfig(nowMs: number = Date.now()): ProPromoConfig | null {
  const defaultStartMs = Date.parse('2025-12-22T05:00:00.000Z')
  const defaultEndMs = Date.parse('2026-02-01T04:59:59.000Z')

  const startMs = parseMs(process.env.PROMO_PRO_START_AT) ?? defaultStartMs
  const endMs = parseMs(process.env.PROMO_PRO_END_AT) ?? defaultEndMs

  if (endMs <= startMs) return null
  if (nowMs < startMs || nowMs > endMs) return null

  return {
    startsAtMs: startMs,
    endsAtMs: endMs,
    trialEndSeconds: Math.floor(endMs / 1000),
  }
}
