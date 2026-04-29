import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const clinician = url.searchParams.get('clinician') || undefined
  const intent = url.searchParams.get('intent') || undefined
  const status = url.searchParams.get('status') || undefined

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  let query = supabase.from('inzi_messages').select('*').order('created_at', { ascending: false }).limit(100)
  if (clinician) query = query.eq('assigned_clinician', clinician)
  if (intent) query = query.eq('intent', intent)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ messages: data || [] })
}
