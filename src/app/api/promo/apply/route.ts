import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { validatePromoCode } from '@/lib/promo-codes'

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json()

    if (!userId || !code) {
      return NextResponse.json({ error: 'Missing userId or code' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const validation = await validatePromoCode(code)

    if (!validation.isValid || !validation.tier) {
      return NextResponse.json({ error: validation.error || 'Invalid promo code' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('promo_code_used')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Unable to verify user' }, { status: 400 })
    }

    if (userData?.promo_code_used) {
      return NextResponse.json({ error: 'Promo code already applied' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        promo_code_used: code.toUpperCase(),
        subscription_tier: validation.tier,
        subscription_started_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to apply promo code' }, { status: 500 })
    }

    await supabase.rpc('increment_promo_usage', {
      promo_code: code.toUpperCase(),
    }).catch(() => {
      // Ignore errors from the RPC; usage counts can be updated manually.
    })

    return NextResponse.json({
      success: true,
      tier: validation.tier,
      message: validation.message,
    })
  } catch (error) {
    console.error('Promo apply API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
