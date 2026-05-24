import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const anon = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }
  const userId = await requireAuthedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('paused_exams')
    .select('exam_state, submitted_result_id, paused_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ paused_exam: null }, { status: 200 })
  }
  return NextResponse.json({ paused_exam: data }, { status: 200 })
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }
  const userId = await requireAuthedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { exam_state?: unknown; submitted_result_id?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.exam_state || typeof body.exam_state !== 'object') {
    return NextResponse.json({ error: 'exam_state required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('paused_exams')
    .upsert(
      {
        user_id: userId,
        exam_state: body.exam_state,
        submitted_result_id: body.submitted_result_id ?? null,
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 200 })
}

export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }
  const userId = await requireAuthedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('paused_exams')
    .delete()
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 200 })
}
