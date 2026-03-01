import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Admin emails check
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const raw = process.env.RECOVER_ADMIN_EMAILS || process.env.ADMIN_EMAILS || 'chanders0@yahoo.com'
  const adminEmails = raw.split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

// GET - List programs (with filter for pending/verified)
export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true }
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

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const verified = searchParams.get('verified')
    const parsedLimit = parseInt(searchParams.get('limit') || '100')
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 100

    // Build query
    let query = supabase
      .from('graduate_programs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (verified === 'true') {
      query = query.eq('verified', true)
    } else if (verified === 'false') {
      query = query.eq('verified', false)
    }

    const { data: programs, error } = await query

    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Get count of pending programs
    const { count: pendingCount } = await supabase
      .from('graduate_programs')
      .select('*', { count: 'exact', head: true })
      .eq('verified', false)

    return NextResponse.json({
      programs: programs || [],
      pendingCount: pendingCount || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Verify or update a program
export async function PATCH(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, verified, name, institution, program_type, accreditation, state } = body

    if (!id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true }
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

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (verified !== undefined) updates.verified = verified
    if (name !== undefined) updates.name = name
    if (institution !== undefined) updates.institution = institution
    if (program_type !== undefined) updates.program_type = program_type
    if (accreditation !== undefined) updates.accreditation = accreditation
    if (state !== undefined) updates.state = state

    const { data: program, error } = await supabase
      .from('graduate_programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating program:', error)
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      program,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a program
export async function DELETE(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true }
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

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { error } = await supabase.from('graduate_programs').delete().eq('id', id)

    if (error) {
      console.error('Error deleting program:', error)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
