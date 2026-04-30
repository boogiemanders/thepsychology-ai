import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { getUserWithRole, getClientIntake, logPhiAccess } from '@/lib/supabase-matching'
import { rankMatches } from '@/lib/matching/score-engine'
import type { ProviderProfile } from '@/types/matching'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const intake = await getClientIntake(user.id)
    if (!intake || !intake.state_of_residence) {
      return NextResponse.json(
        { error: 'Complete intake first', redirect: '/find-therapist/intake' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data: providers, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('status', 'active')
      .contains('telehealth_states', [intake.state_of_residence])
      .limit(200)

    if (error) {
      console.error('find-matches query error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const ranked = rankMatches(intake, (providers ?? []) as ProviderProfile[])
      .slice(0, 20)
      .map(({ provider, score }) => ({
        id: provider.id,
        license_type: provider.license_type,
        bio_text: provider.bio_text,
        approach_text: provider.approach_text,
        modalities: provider.modalities,
        conditions_treated: provider.conditions_treated,
        populations_served: provider.populations_served,
        languages_spoken: provider.languages_spoken,
        insurance_networks: provider.insurance_networks,
        self_pay_rate_cents: provider.self_pay_rate_cents,
        sliding_scale_available: provider.sliding_scale_available,
        lgbtq_affirming: provider.lgbtq_affirming,
        score: Math.round(score.total * 100),
        breakdown: {
          specialization: Math.round(score.breakdown.specialization * 100),
          modality: Math.round(score.breakdown.modality * 100),
          style: Math.round(score.breakdown.style * 100),
          cultural: Math.round(score.breakdown.cultural * 100),
          practical: Math.round(score.breakdown.practical * 100),
        },
        insurance_match: score.insurance_match,
        reasons: score.reasons,
      }))

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = request.headers.get('user-agent') ?? null
    await logPhiAccess({
      accessorId: user.id,
      accessorRole: user.role,
      clientId: user.id,
      accessType: 'profile_match_view',
      resourceTable: 'provider_profiles',
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ matches: ranked, intake_state: intake.state_of_residence })
  } catch (err) {
    console.error('find-matches exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
