import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })

    const { data, error } = await supabase
      .from('recover_insights')
      .select('id, draft_message, approved_message, created_at')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(5)

    if (error) {
      // Table may not exist yet - return empty insights gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ insights: [] })
      }
      console.error('[recover-insights] failed to load insights:', error)
      return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 })
    }

    const insights = (data || [])
      .map((row: any) => ({
        id: String(row.id),
        message: String(row.approved_message || row.draft_message || '').trim(),
        createdAt: row.created_at,
      }))
      .filter((row) => row.message.length > 0)

    if (insights.length > 0) {
      const ids = insights.map((row) => row.id)
      const { error: updateError } = await supabase
        .from('recover_insights')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', ids)

      if (updateError) {
        console.error('[recover-insights] failed to mark sent:', updateError)
      }
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('[recover-insights] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
