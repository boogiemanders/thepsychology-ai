import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function db() {
  if (!supabaseUrl || !serviceKey) return null
  return createClient(supabaseUrl, serviceKey)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const { id } = await params
  const body = await req.json()
  const contributor = typeof body.contributor === 'string' ? body.contributor : 'AC'

  // Allowed fields to update
  const allowed = [
    'name', 'one_liner', 'priority', 'status', 'stage_line',
    'contributors', 'phases', 'milestone', 'steps', 'support', 'href',
  ] as const

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: contributor,
  }

  for (const key of allowed) {
    if (key in body) {
      update[key] = body[key]
    }
  }

  const { data, error } = await supabase
    .from('timeline_projects')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[timeline] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }

  return NextResponse.json({ project: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const { id } = await params

  const { error } = await supabase
    .from('timeline_projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[timeline] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
