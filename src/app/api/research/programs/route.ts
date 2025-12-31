import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Search graduate programs
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

    // Get search params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const state = searchParams.get('state')
    const programType = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Build query
    let dbQuery = supabase
      .from('graduate_programs')
      .select('id, name, institution, program_type, accreditation, state, country')
      .order('institution', { ascending: true })
      .limit(limit)

    // Apply filters
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,institution.ilike.%${query}%`)
    }

    if (state) {
      dbQuery = dbQuery.eq('state', state)
    }

    if (programType) {
      dbQuery = dbQuery.eq('program_type', programType)
    }

    const { data: programs, error } = await dbQuery

    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    return NextResponse.json({
      programs: programs || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit a new graduate program (for admin review)
export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, institution, program_type, accreditation, state, country } = body

    if (!name || !institution) {
      return NextResponse.json(
        { error: 'Program name and institution are required' },
        { status: 400 }
      )
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

    // Check for duplicate
    const { data: existing } = await supabase
      .from('graduate_programs')
      .select('id')
      .eq('name', name)
      .eq('institution', institution)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        program: existing,
        message: 'Program already exists',
      })
    }

    // Insert new program (unverified by default)
    const { data: program, error } = await supabase
      .from('graduate_programs')
      .insert({
        name,
        institution,
        program_type: program_type || null,
        accreditation: accreditation || 'Unknown',
        state: state || null,
        country: country || 'USA',
        verified: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      program,
      message: 'Program submitted for review',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
