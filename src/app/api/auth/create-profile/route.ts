import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface CreateProfileRequest {
  userId: string
  email: string
  fullName?: string
  subscriptionTier: string
  promoCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProfileRequest = await request.json()

    // Validate required fields
    if (!body.userId || !body.email || !body.subscriptionTier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, subscriptionTier' },
        { status: 400 }
      )
    }

    // Create a service role client (server-side only)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'To get this: 1) Go to Supabase project settings 2) Click "API" 3) Copy the "service_role" key ' +
        '4) Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY='
      )
      return NextResponse.json(
        {
          error: 'Server configuration error. Service role key not configured. ' +
          'Contact administrator to configure SUPABASE_SERVICE_ROLE_KEY',
          code: 'MISSING_SERVICE_KEY'
        },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Create user profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: body.userId,
          email: body.email,
          full_name: body.fullName || null,
          subscription_tier: body.subscriptionTier,
          promo_code_used: body.promoCode || null,
          subscription_started_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json(
        { error: `Failed to create profile: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
        message: 'Profile created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
