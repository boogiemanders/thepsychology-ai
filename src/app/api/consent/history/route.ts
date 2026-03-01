import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Retrieve consent audit history for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: false }
    )

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const parsedLimit = parseInt(searchParams.get('limit') || '50')
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50
    const parsedOffset = parseInt(searchParams.get('offset') || '0')
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0

    // Fetch consent audit history
    const { data: history, error, count } = await supabase
      .from('consent_audit_log')
      .select('id, consent_type, old_value, new_value, consent_method, consent_version, created_at', {
        count: 'exact',
      })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching consent history:', error)
      return NextResponse.json({ error: 'Failed to fetch consent history' }, { status: 500 })
    }

    return NextResponse.json({
      history: history || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
