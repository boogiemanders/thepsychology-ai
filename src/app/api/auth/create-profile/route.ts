import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

type SignupDevice = 'phone' | 'desktop' | 'unknown'

function inferSignupDevice(headers: Headers): { device: SignupDevice; userAgent: string | null } {
  const userAgent = headers.get('user-agent')
  const chMobile = headers.get('sec-ch-ua-mobile')

  if (chMobile === '?1') return { device: 'phone', userAgent }
  if (chMobile === '?0') return { device: 'desktop', userAgent }
  if (!userAgent) return { device: 'unknown', userAgent: null }

  const ua = userAgent.toLowerCase()
  const isMobile =
    ua.includes('mobi') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('android') ||
    ua.includes('ipad') ||
    ua.includes('tablet')

  return { device: isMobile ? 'phone' : 'desktop', userAgent }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      email,
      fullName,
      subscriptionTier,
      promoCodeUsed,
      referralSource,
      // UTM tracking params
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = body

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
    const supabase = getSupabaseClient(
      authToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          }
        : undefined,
      { requireServiceRole: true }
    )

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

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

    const { device: signupDevice, userAgent: signupUserAgent } = inferSignupDevice(request.headers)

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
          referral_source: referralSource || null,
          subscription_started_at: new Date().toISOString(),
          signup_device: signupDevice,
          signup_user_agent: signupUserAgent,
          // UTM tracking for marketing attribution
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
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
