import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const TRIAL_DAYS = 7

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const addDaysIso = (baseIso: string, days: number) => {
  const d = new Date(baseIso)
  if (Number.isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

/**
 * Expire trials cron: downgrades users whose 7-day Pro trial has ended.
 * Only affects non-Stripe users (paying subscribers are never downgraded).
 *
 * Schedule: hourly (0 * * * *)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  try {
    const nowIso = new Date().toISOString()
    const recentSignupThresholdIso = new Date(Date.now() - TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Backstop repair: if a recent signup somehow landed as free with no trial window,
    // restore the intended 7-day Pro trial and recover referral/full name from auth metadata.
    const { data: repairCandidates, error: repairFetchError } = await supabase
      .from('users')
      .select('id, email, full_name, referral_source, created_at, subscription_tier, trial_ends_at, subscription_started_at, stripe_customer_id')
      .in('subscription_tier', ['free', 'pro'])
      .is('stripe_customer_id', null)
      .is('trial_ends_at', null)
      .gte('created_at', recentSignupThresholdIso)

    if (repairFetchError) {
      console.error('[Expire Trials] Repair candidate fetch error:', repairFetchError)
      return NextResponse.json({ error: 'Failed to fetch trial repair candidates' }, { status: 500 })
    }

    let repairedCount = 0
    for (const candidate of repairCandidates || []) {
      const updateData: Record<string, string> = {}

      let subscriptionStartedAt = asNonEmptyString(candidate.subscription_started_at)
      let referralSource = asNonEmptyString(candidate.referral_source)
      let fullName = asNonEmptyString(candidate.full_name)

      try {
        const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(candidate.id)
        if (!authUserError && authUserData?.user) {
          const meta = authUserData.user.user_metadata || {}
          subscriptionStartedAt =
            subscriptionStartedAt ||
            asNonEmptyString(authUserData.user.created_at) ||
            asNonEmptyString(candidate.created_at)
          referralSource = referralSource || asNonEmptyString(meta.referral_source)
          fullName = fullName || asNonEmptyString(meta.full_name)
        }
      } catch (metadataError) {
        console.warn('[Expire Trials] Metadata lookup failed during trial repair:', {
          userId: candidate.id,
          metadataError,
        })
      }

      subscriptionStartedAt = subscriptionStartedAt || asNonEmptyString(candidate.created_at) || nowIso
      const repairedTrialEndsAt = addDaysIso(subscriptionStartedAt, TRIAL_DAYS)

      if (candidate.subscription_tier !== 'pro') updateData.subscription_tier = 'pro'
      if (!asNonEmptyString(candidate.subscription_started_at)) updateData.subscription_started_at = subscriptionStartedAt
      if (repairedTrialEndsAt) updateData.trial_ends_at = repairedTrialEndsAt
      if (!asNonEmptyString(candidate.referral_source) && referralSource) updateData.referral_source = referralSource
      if (!asNonEmptyString(candidate.full_name) && fullName) updateData.full_name = fullName

      if (Object.keys(updateData).length === 0) continue

      const { error: repairUpdateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', candidate.id)

      if (repairUpdateError) {
        console.warn('[Expire Trials] Failed to repair trial defaults:', {
          userId: candidate.id,
          repairUpdateError,
        })
        continue
      }

      repairedCount += 1
    }

    // Find users with expired trials who are still on pro and have no Stripe subscription
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, trial_ends_at')
      .lt('trial_ends_at', nowIso)
      .eq('subscription_tier', 'pro')
      .is('stripe_customer_id', null)

    if (fetchError) {
      console.error('[Expire Trials] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch expired trials' }, { status: 500 })
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({
        message: repairedCount > 0 ? 'Repaired trial defaults; no expired trials' : 'No expired trials',
        repaired: repairedCount,
        downgraded: 0,
      })
    }

    const userIds = expiredUsers.map(u => u.id)

    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_tier: 'free' })
      .in('id', userIds)

    if (updateError) {
      console.error('[Expire Trials] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to downgrade users' }, { status: 500 })
    }

    console.log(`[Expire Trials] Downgraded ${userIds.length} users`)

    if (userIds.length > 0) {
      await sendSlackNotification(
        `⏰ Trial expired: ${userIds.length} user(s) downgraded to free`,
        'payments'
      )
    }

    return NextResponse.json({
      message: `Downgraded ${userIds.length} expired trial users`,
      repaired: repairedCount,
      downgraded: userIds.length,
    })
  } catch (error) {
    console.error('[Expire Trials] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
