import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let body: { status?: 'new' | 'read' | 'responded' } = {}
  try {
    body = await req.json()
  } catch {}

  const status = body.status
  if (!status || !['new', 'read', 'responded'].includes(status)) {
    return NextResponse.json({ error: 'status must be new|read|responded' }, { status: 400 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('inzi_messages')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: data })
}
