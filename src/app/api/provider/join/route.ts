import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current profile
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('user_role, secondary_roles')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Already a provider
    if (profile.user_role === 'provider') {
      return NextResponse.json({ success: true, alreadyProvider: true })
    }

    // Add provider to secondary_roles if not already there
    const currentRoles: string[] = profile.secondary_roles || []
    if (currentRoles.includes('provider')) {
      return NextResponse.json({ success: true, alreadyProvider: true })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ secondary_roles: [...currentRoles, 'provider'] })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error adding provider role:', updateError)
      return NextResponse.json({ error: 'Failed to add provider role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Provider join error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
