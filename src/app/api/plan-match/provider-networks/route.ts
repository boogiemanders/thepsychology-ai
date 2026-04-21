import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserWithRole } from '@/lib/supabase-matching'
import { getSupabaseClient } from '@/lib/supabase-server'
import { INSURANCE_PAYERS, LAUNCH_STATES } from '@/lib/matching-constants'

function getAuthToken(request: NextRequest) {
  return request.headers.get('authorization')?.split('Bearer ')[1]
}

export async function GET(request: NextRequest) {
  try {
    const authToken = getAuthToken(request)
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('provider_profiles')
      .select('insurance_networks, telehealth_states, status, bio_text, license_type')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('plan-match provider-networks GET error:', error)
      return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
    }

    return NextResponse.json({
      networks: data?.insurance_networks ?? [],
      states: data?.telehealth_states ?? [],
      status: data?.status ?? null,
      hasProfile: !!data,
      bio_text: data?.bio_text ?? null,
      license_type: data?.license_type ?? null,
    })
  } catch (err) {
    console.error('plan-match provider-networks GET exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const updateSchema = z.object({
  networks: z.array(z.enum(INSURANCE_PAYERS)),
  states: z.array(z.enum(LAUNCH_STATES)),
})

export async function POST(request: NextRequest) {
  try {
    const authToken = getAuthToken(request)
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid networks or states' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('provider_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('provider_profiles')
        .update({
          insurance_networks: parsed.data.networks,
          telehealth_states: parsed.data.states,
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('plan-match provider-networks update error:', error)
        return NextResponse.json({ error: 'Save failed' }, { status: 500 })
      }
    } else {
      // Lab demo: brand-new profiles from this tool go straight to active
      // so the search works end-to-end without the full onboarding wizard.
      const { error } = await supabase.from('provider_profiles').insert({
        user_id: user.id,
        status: 'active',
        insurance_networks: parsed.data.networks,
        telehealth_states: parsed.data.states,
      })

      if (error) {
        console.error('plan-match provider-networks insert error:', error)
        return NextResponse.json({ error: 'Save failed' }, { status: 500 })
      }

      // Tag this user as also a provider (keep their primary role intact)
      if (!user.secondaryRoles.includes('provider')) {
        await supabase
          .from('users')
          .update({ secondary_roles: [...user.secondaryRoles, 'provider'] })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('plan-match provider-networks POST exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
