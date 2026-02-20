import { getSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getPricingTier, PROMO_START_DATE, FULL_PRICE } from '@/lib/pricing-tiers'

export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

  if (!supabase) {
    // Default to tier 1 if we can't get the count
    const tier = getPricingTier(0)
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
    const tier = getPricingTier(0)
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
  const tier = getPricingTier(promoCount)

  return NextResponse.json({
    promoCount,
    ...tier,
    fullPrice: FULL_PRICE,
  })
}
