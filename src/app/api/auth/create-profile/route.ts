import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, fullName, subscriptionTier, promoCodeUsed } = body

    // Validate required fields
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      )
    }

    // Get the auth token from headers (optional for new signups)
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    // Create Supabase client for profile insertion
    // Use service role key for backend operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      authToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          }
        : undefined
    )

    // If we have an auth token, verify it matches
    if (authToken) {
      // Verify the user is authenticated and the token is valid
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        )
      }

      // Ensure the user can only create their own profile
      if (user.id !== userId) {
        return NextResponse.json(
          { error: 'Cannot create profile for another user' },
          { status: 403 }
        )
      }
    }

    // For requests without auth token, we trust the userId from the request
    // This is acceptable for new signups where auth context isn't available yet

    // Create the user profile
    const { error: profileError, data } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName || null,
          subscription_tier: subscriptionTier || 'free',
          promo_code_used: promoCodeUsed || null,
          subscription_started_at: new Date().toISOString(),
        },
      ])
      .select()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
