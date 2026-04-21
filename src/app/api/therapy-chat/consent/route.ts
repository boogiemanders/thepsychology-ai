import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const consentSchema = z.object({
  consented_to_ai_disclosure: z.boolean(),
  consented_to_crisis_escalation_protocol: z.boolean(),
  age_verified_adult: z.boolean(),
  allow_session_data_for_improvement: z.boolean().optional(),
  allow_research_contribution: z.boolean().optional(),
})

async function authedClient(request: NextRequest) {
  const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
  if (!authToken) return { error: 'Unauthorized', status: 401 as const }

  const supabase = getSupabaseClient(
    { global: { headers: { Authorization: `Bearer ${authToken}` } } },
    { requireServiceRole: true }
  )
  if (!supabase) return { error: 'Supabase not configured', status: 500 as const }

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Invalid token', status: 401 as const }

  return { supabase, user }
}

export async function GET(request: NextRequest) {
  const ctx = await authedClient(request)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const { supabase, user } = ctx
  const { data, error } = await supabase
    .from('therapy_consent')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('therapy_consent fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch consent' }, { status: 500 })
  }

  return NextResponse.json(
    data ?? {
      consented_to_ai_disclosure: false,
      consented_to_crisis_escalation_protocol: false,
      age_verified_adult: false,
      allow_session_data_for_improvement: false,
      allow_research_contribution: false,
      consented_at: null,
    }
  )
}

export async function POST(request: NextRequest) {
  const ctx = await authedClient(request)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const { supabase, user } = ctx

  const body = await request.json().catch(() => null)
  const parsed = consentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid consent payload' }, { status: 400 })
  }

  const input = parsed.data
  const hasAllRequired =
    input.consented_to_ai_disclosure &&
    input.consented_to_crisis_escalation_protocol &&
    input.age_verified_adult

  if (!hasAllRequired) {
    return NextResponse.json(
      { error: 'All three required consents must be accepted' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('therapy_consent')
    .upsert(
      {
        user_id: user.id,
        consented_to_ai_disclosure: input.consented_to_ai_disclosure,
        consented_to_crisis_escalation_protocol: input.consented_to_crisis_escalation_protocol,
        age_verified_adult: input.age_verified_adult,
        allow_session_data_for_improvement: input.allow_session_data_for_improvement ?? false,
        allow_research_contribution: input.allow_research_contribution ?? false,
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('therapy_consent upsert error:', error)
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 })
  }

  return NextResponse.json({ success: true, consent: data })
}
