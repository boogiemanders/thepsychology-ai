import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const endSchema = z.object({
  session_id: z.string().uuid(),
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

  const body = await request.json().catch(() => null)
  const parsed = endSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('therapy_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', parsed.data.session_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    console.error('therapy_sessions end error:', error)
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
  }

  // Phase 4: generate structured summary here (Haiku) and persist summary + themes + homework.
  return NextResponse.json({ session: data })
}
