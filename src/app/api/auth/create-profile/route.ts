import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
      referredByCode,
      authCreatedAt,
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

    // Prefer explicit payload values, but backfill from auth user metadata when missing.
    // This prevents lost attribution if profile creation races with auth-trigger insertion.
    let resolvedFullName = (typeof fullName === 'string' && fullName.trim().length > 0) ? fullName.trim() : null
    let resolvedReferralSource = (typeof referralSource === 'string' && referralSource.trim().length > 0)
      ? referralSource.trim()
      : null
    let resolvedUtmSource = (typeof utm_source === 'string' && utm_source.trim().length > 0) ? utm_source.trim() : null
    let resolvedUtmMedium = (typeof utm_medium === 'string' && utm_medium.trim().length > 0) ? utm_medium.trim() : null
    let resolvedUtmCampaign = (typeof utm_campaign === 'string' && utm_campaign.trim().length > 0) ? utm_campaign.trim() : null
    let resolvedUtmContent = (typeof utm_content === 'string' && utm_content.trim().length > 0) ? utm_content.trim() : null
    let resolvedUtmTerm = (typeof utm_term === 'string' && utm_term.trim().length > 0) ? utm_term.trim() : null

    let resolvedAuthCreatedAt = (typeof authCreatedAt === 'string' && authCreatedAt.trim().length > 0)
      ? authCreatedAt.trim()
      : null

    if (
      !resolvedFullName ||
      !resolvedReferralSource ||
      !resolvedUtmSource ||
      !resolvedUtmMedium ||
      !resolvedUtmCampaign ||
      !resolvedUtmContent ||
      !resolvedUtmTerm ||
      !resolvedAuthCreatedAt
    ) {
      try {
        const { data: adminUserData, error: adminUserError } = await supabase.auth.admin.getUserById(userId)
        if (!adminUserError && adminUserData?.user) {
          const meta = adminUserData.user.user_metadata || {}
          resolvedFullName = resolvedFullName || (typeof meta.full_name === 'string' ? meta.full_name : null)
          resolvedReferralSource =
            resolvedReferralSource || (typeof meta.referral_source === 'string' ? meta.referral_source : null)
          resolvedUtmSource = resolvedUtmSource || (typeof meta.utm_source === 'string' ? meta.utm_source : null)
          resolvedUtmMedium = resolvedUtmMedium || (typeof meta.utm_medium === 'string' ? meta.utm_medium : null)
          resolvedUtmCampaign = resolvedUtmCampaign || (typeof meta.utm_campaign === 'string' ? meta.utm_campaign : null)
          resolvedUtmContent = resolvedUtmContent || (typeof meta.utm_content === 'string' ? meta.utm_content : null)
          resolvedUtmTerm = resolvedUtmTerm || (typeof meta.utm_term === 'string' ? meta.utm_term : null)
          resolvedAuthCreatedAt =
            resolvedAuthCreatedAt ||
            (typeof adminUserData.user.created_at === 'string' ? adminUserData.user.created_at : null)
        }
      } catch (metadataError) {
        console.warn('[create-profile] Failed to backfill from auth metadata:', metadataError)
      }
    }

    const { device: signupDevice, userAgent: signupUserAgent } = inferSignupDevice(request.headers)

    // All new signups get 7-day Pro trial
    const now = new Date()
    const subscriptionStart = resolvedAuthCreatedAt ? new Date(resolvedAuthCreatedAt) : now
    const safeSubscriptionStart = Number.isNaN(subscriptionStart.getTime()) ? now : subscriptionStart
    const trialEndsAt = new Date(safeSubscriptionStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Generate referral code for new user
    const referralCode = crypto
      .createHash('md5')
      .update(Math.random().toString() + userId)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase()

    // Look up referrer if referral code provided
    let referredBy: string | null = null
    if (referredByCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referredByCode.toUpperCase())
        .single()

      // Block self-referral
      if (referrer && referrer.id !== userId) {
        referredBy = referrer.id
      }
    }

    // Create the user profile (upsert to handle race with on_auth_user_created trigger)
    const { error: profileError, data } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: resolvedFullName,
          subscription_tier: 'pro',
          trial_ends_at: trialEndsAt.toISOString(),
          promo_code_used: promoCodeUsed || null,
          referral_source: resolvedReferralSource,
          referred_by: referredBy,
          referral_code: referralCode,
          subscription_started_at: safeSubscriptionStart.toISOString(),
          signup_device: signupDevice,
          signup_user_agent: signupUserAgent,
          // UTM tracking for marketing attribution
          utm_source: resolvedUtmSource,
          utm_medium: resolvedUtmMedium,
          utm_campaign: resolvedUtmCampaign,
          utm_content: resolvedUtmContent,
          utm_term: resolvedUtmTerm,
        },
        { onConflict: 'id' }
      )
      .select()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // If referred by someone, auto-create approved referral reward + extend their trial
    if (referredBy) {
      const { error: rewardError } = await supabase
        .from('user_rewards')
        .insert({
          user_id: referredBy,
          reward_type: 'referral',
          status: 'approved',
          submission_data: { referred_user_email: email, referred_user_id: userId },
          reviewed_at: now.toISOString(),
          reviewed_by: 'system',
        })

      if (!rewardError) {
        await supabase.rpc('extend_trial', { p_user_id: referredBy, p_days: 7 })

        const { data: referrerUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', referredBy)
          .single()

        await sendSlackNotification(
          `🎉 Referral reward: ${referrerUser?.email ?? referredBy} referred ${email} — +7 days Pro`,
          'feedback'
        )
      }
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
