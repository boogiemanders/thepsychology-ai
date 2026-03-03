import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

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
    // Find users with expired trials who are still on pro and have no Stripe subscription
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, trial_ends_at')
      .lt('trial_ends_at', new Date().toISOString())
      .eq('subscription_tier', 'pro')
      .is('stripe_customer_id', null)

    if (fetchError) {
      console.error('[Expire Trials] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch expired trials' }, { status: 500 })
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ message: 'No expired trials', downgraded: 0 })
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
      downgraded: userIds.length,
    })
  } catch (error) {
    console.error('[Expire Trials] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
