import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { runScoreRequestBatch } from '@/lib/score-request'

// Daily "how did the EPPP go?" score-request drip. Sends a small batch (default 10) to the churned
// pool, one email per person ever (skips anyone who already got win-back or a prior score-request),
// suppression-aware, and skips anyone who already reported a result. Idempotent: a recorded send is
// never re-selected, so the drip safely drains the pool over ~N/10 days.
//
// Vercel cron fires a GET. Manual canary:
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://<deployment>/api/cron/score-request-drip?dryRun=true&limit=5"

export const runtime = 'nodejs'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dryRun = searchParams.get('dryRun') === 'true'
  const limitParam = parseInt(searchParams.get('limit') || '', 10)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    const r = await runScoreRequestBatch({ supabase, limit, dryRun })
    return NextResponse.json({
      ok: true,
      dryRun,
      limit,
      pool: r.pool,
      eligible: r.eligible,
      sent: r.sent,
      failed: r.failed,
      byVariant: r.byVariant,
      nameSrc: r.nameSrc,
      skipCounts: r.skipCounts,
    })
  } catch (err) {
    console.error('[score-request-drip] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'send failed' }, { status: 500 })
  }
}
