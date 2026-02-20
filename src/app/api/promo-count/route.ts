import { getSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getPricingTier, PROMO_START_DATE, FULL_PRICE } from '@/lib/pricing-tiers'

export const revalidate = 60 // Cache for 60 seconds
const DISPLAY_FREE_SPOTS_CAP = 37

function applyDisplayRemainingCap(tier: ReturnType<typeof getPricingTier>) {
  if (tier.tier !== 1) return tier
  return {
    ...tier,
    remaining: Math.min(tier.remaining, DISPLAY_FREE_SPOTS_CAP),
  }
}

export async function GET() {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

  if (!supabase) {
    // Default to tier 1 if we can't get the count
    const tier = applyDisplayRemainingCap(getPricingTier(0))
    return NextResponse.json({
      promoCount: 0,
      ...tier,
      fullPrice: FULL_PRICE,
    })
  }

  // Count users created after promo start date
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    console.error('Promo count error:', error)
    const tier = applyDisplayRemainingCap(getPricingTier(0))
    return NextResponse.json({
      promoCount: 0,
      ...tier,
      fullPrice: FULL_PRICE,
    })
  }

  // Filter users created after promo start
  const promoUsers = data.users.filter((user) => {
    const createdAt = new Date(user.created_at)
    return createdAt >= PROMO_START_DATE
  })

  const promoCount = promoUsers.length
  const tier = applyDisplayRemainingCap(getPricingTier(promoCount))

  return NextResponse.json({
    promoCount,
    ...tier,
    fullPrice: FULL_PRICE,
  })
}
