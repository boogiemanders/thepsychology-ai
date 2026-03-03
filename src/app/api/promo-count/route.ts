import { NextResponse } from 'next/server'
import { getPricingInfo } from '@/lib/pricing-tiers'

export const revalidate = 60

/**
 * Promo count endpoint — deprecated.
 * Returns current pricing info for backwards compatibility.
 */
export async function GET() {
  const info = getPricingInfo()
  return NextResponse.json({
    promoCount: 0,
    tier: 1,
    price: info.currentPrice,
    discount: 0,
    remaining: 0,
    nextTierPrice: null,
    fullPrice: info.standardPrice,
  })
}
