import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export interface ResearchProfile {
  graduate_program_id: string | null
  graduate_program_name: string | null
  graduate_program_type: 'PhD' | 'PsyD' | 'EdD' | 'Other' | null
  graduation_year: number | null
  program_accreditation: 'APA' | 'PCSAS' | 'Both' | 'Neither' | 'Unknown' | null
  undergraduate_major: string | null
  years_clinical_experience: number | null
  practicum_settings: string[] | null
  self_assessed_readiness: number | null
  previous_exam_attempts: number | null
  study_hours_per_week: number | null
  preferred_study_time: 'morning' | 'afternoon' | 'evening' | 'night' | 'varies' | null
  preferred_study_duration: number | null
  age_range: '18-24' | '25-34' | '35-44' | '45-54' | '55+' | null
  gender: string | null
  ethnicity: string[] | null
  first_generation_graduate: boolean | null
}

// GET - Retrieve research profile
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

    // Check if user has research consent enabled
    const { data: consent } = await supabase
      .from('user_consent_preferences')
      .select('consent_research_contribution')
      .eq('user_id', user.id)
      .single()

    if (!consent?.consent_research_contribution) {
      return NextResponse.json(
        { error: 'Research contribution not enabled. Enable it in Privacy settings first.' },
        { status: 403 }
      )
    }

    // Fetch research profile
    const { data: profile, error } = await supabase
      .from('user_research_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching research profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({
      profile: profile || null,
      is_new: !profile,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update research profile
export async function PATCH(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

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

    // Check if user has research consent enabled
    const { data: consent } = await supabase
      .from('user_consent_preferences')
      .select('consent_research_contribution')
      .eq('user_id', user.id)
      .single()

    if (!consent?.consent_research_contribution) {
      return NextResponse.json(
        { error: 'Research contribution not enabled. Enable it in Privacy settings first.' },
        { status: 403 }
      )
    }

    // Validate and sanitize input
    const allowedFields: (keyof ResearchProfile)[] = [
      'graduate_program_id',
      'graduate_program_name',
      'graduate_program_type',
      'graduation_year',
      'program_accreditation',
      'undergraduate_major',
      'years_clinical_experience',
      'practicum_settings',
      'self_assessed_readiness',
      'previous_exam_attempts',
      'study_hours_per_week',
      'preferred_study_time',
      'preferred_study_duration',
      'age_range',
      'gender',
      'ethnicity',
      'first_generation_graduate',
    ]

    const updateData: Partial<ResearchProfile> & { user_id: string; updated_at: string } = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        ;(updateData as Record<string, unknown>)[field] = body[field]
      }
    }

    // Check if this completes the profile
    const { data: existingProfile } = await supabase
      .from('user_research_profile')
      .select('profile_completed_at')
      .eq('user_id', user.id)
      .single()

    // Mark profile as completed if key fields are filled
    const isProfileComplete =
      body.graduate_program_name || body.graduate_program_id || body.graduation_year

    if (isProfileComplete && !existingProfile?.profile_completed_at) {
      ;(updateData as Record<string, unknown>).profile_completed_at = new Date().toISOString()
    }

    // Upsert the profile
    const { data: profile, error } = await supabase
      .from('user_research_profile')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating research profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
