import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function db() {
  if (!supabaseUrl || !serviceKey) return null
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(req: NextRequest) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const url = new URL(req.url)
  const key = url.searchParams.get('key') || 'inzinna-leadership'

  const { data, error } = await supabase
    .from('timeline_projects')
    .select('*')
    .eq('timeline_key', key)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[timeline] GET error:', error)
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 })
  }

  // Also load collaborators
  const { data: collaborators } = await supabase
    .from('timeline_collaborators')
    .select('*')
    .order('initials')

  return NextResponse.json({ projects: data ?? [], collaborators: collaborators ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const body = await req.json()
  const contributor = typeof body.contributor === 'string' ? body.contributor : 'AC'
  const key = typeof body.key === 'string' && body.key ? body.key : 'inzinna-leadership'

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Auto-assign next num
  const { data: existing } = await supabase
    .from('timeline_projects')
    .select('num, sort_order')
    .eq('timeline_key', key)
    .order('sort_order', { ascending: false })
    .limit(1)

  const lastNum = existing?.[0]?.num ? parseInt(existing[0].num, 10) : 0
  const lastOrder = existing?.[0]?.sort_order ?? 0

  const contributors = Array.isArray(body.contributors) ? body.contributors : [contributor]
  const project = {
    timeline_key: key,
    num: String(lastNum + 1).padStart(2, '0'),
    name,
    one_liner: body.one_liner ?? '',
    priority: ['high', 'medium', 'low'].includes(body.priority) ? body.priority : 'medium',
    status: ['live', 'building', 'blocked', 'idea'].includes(body.status) ? body.status : 'idea',
    stage_line: body.stage_line ?? '',
    contributors,
    lead: typeof body.lead === 'string' && body.lead ? body.lead : (contributors[0] ?? contributor),
    phases: Array.isArray(body.phases) ? body.phases : [],
    milestone: body.milestone ?? null,
    steps: Array.isArray(body.steps) ? body.steps : [],
    support: body.support ?? '',
    href: body.href ?? null,
    sort_order: lastOrder + 10,
    updated_by: contributor,
  }

  const { data, error } = await supabase
    .from('timeline_projects')
    .insert(project)
    .select()
    .single()

  if (error) {
    console.error('[timeline] POST error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  return NextResponse.json({ project: data })
}
