import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'
import { INSURANCE_PAYERS, LAUNCH_STATES } from '@/lib/matching-constants'

const searchSchema = z.object({
  payer: z.enum(INSURANCE_PAYERS),
  state: z.enum(LAUNCH_STATES),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = searchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payer or state' }, { status: 400 })
    }

    const { payer, state } = parsed.data

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('provider_profiles')
      .select(
        'id, license_type, bio_text, approach_text, modalities, conditions_treated, populations_served, languages_spoken, insurance_networks, telehealth_states, self_pay_rate_cents, sliding_scale_available'
      )
      .eq('status', 'active')
      .contains('insurance_networks', [payer])
      .contains('telehealth_states', [state])
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('plan-match search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    return NextResponse.json({ providers: data ?? [] })
  } catch (err) {
    console.error('plan-match search exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
