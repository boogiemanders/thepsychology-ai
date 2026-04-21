import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const startSchema = z.object({
  agenda: z.string().trim().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseClient(
    { global: { headers: { Authorization: `Bearer ${authToken}` } } },
    { requireServiceRole: true }
  )
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  // Gate on consent before creating a session.
  const { data: consent } = await supabase
    .from('therapy_consent')
    .select('consented_to_ai_disclosure, consented_to_crisis_escalation_protocol, age_verified_adult')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasConsent =
    consent?.consented_to_ai_disclosure === true &&
    consent?.consented_to_crisis_escalation_protocol === true &&
    consent?.age_verified_adult === true

  if (!hasConsent) {
    return NextResponse.json({ error: 'Consent required before starting a session' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agenda' }, { status: 400 })
  }

  const { count } = await supabase
    .from('therapy_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const { data, error } = await supabase
    .from('therapy_sessions')
    .insert({
      user_id: user.id,
      session_number: (count ?? 0) + 1,
      modality: 'cbt',
      agenda: parsed.data.agenda ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('therapy_sessions insert error:', error)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }

  return NextResponse.json({ session: data })
}
