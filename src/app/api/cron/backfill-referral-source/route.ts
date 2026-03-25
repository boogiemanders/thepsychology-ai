import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const BATCH_SIZE = 200

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Backfill referral_source from auth.user_metadata when users row is missing it.
 *
 * Schedule: hourly
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
    const { data: candidates, error: fetchError } = await supabase
      .from('users')
      .select('id, email, created_at, referral_source')
      .is('referral_source', null)
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error('[Backfill Referral Source] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        message: 'No users need referral_source backfill',
        scanned: 0,
        updated: 0,
      })
    }

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const candidate of candidates) {
      try {
        const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(candidate.id)
        if (authUserError || !authUserData?.user) {
          errors += 1
          console.warn('[Backfill Referral Source] Auth user lookup failed:', {
            userId: candidate.id,
            authUserError,
          })
          continue
        }

        const referralSource = asNonEmptyString(authUserData.user.user_metadata?.referral_source)
        if (!referralSource) {
          skipped += 1
          continue
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({ referral_source: referralSource })
          .eq('id', candidate.id)

        if (updateError) {
          errors += 1
          console.warn('[Backfill Referral Source] Update failed:', {
            userId: candidate.id,
            updateError,
          })
          continue
        }

        updated += 1
      } catch (error) {
        errors += 1
        console.warn('[Backfill Referral Source] Unexpected candidate error:', {
          userId: candidate.id,
          error,
        })
      }
    }

    return NextResponse.json({
      message: 'Referral source backfill complete',
      scanned: candidates.length,
      updated,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('[Backfill Referral Source] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
