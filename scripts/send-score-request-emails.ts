/**
 * Score-request resurrection campaign — CLI sender (preview / test / canary / manual send).
 *
 * The shared logic (A/B variants, name-guessing, render, batch send) lives in src/lib/score-request.ts
 * so this CLI and the daily Vercel cron (src/app/api/cron/score-request-drip) never drift. The daily
 * automated drip is the cron; use this CLI to preview copy, send yourself a test, or run a canary.
 *
 * Usage (run from repo root):
 *   npx tsx scripts/send-score-request-emails.ts --preview           # render each variant to a file; no DB, no send
 *   npx tsx scripts/send-score-request-emails.ts --dry-run           # full pool query + report; no send, no DB writes
 *   npx tsx scripts/send-score-request-emails.ts --test[=you@x.com]  # send all 3 variants to yourself; no pool, no DB
 *   npx tsx scripts/send-score-request-emails.ts --limit=10          # canary/manual: send to N eligible
 *
 * Requires: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSUBSCRIBE_SECRET
 *
 * Recipients: free + (had-trial OR ex-stripe) + not deleted, MINUS suppressed, already-reported,
 * anyone already sent THIS campaign, and anyone who got any campaign email TODAY (founder's "1 email
 * per person per day" cap). Tracked via funnel_events 'score_request_sent'.
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { VARIANTS, renderHtml, unsubUrl, runScoreRequestBatch } from '../src/lib/score-request'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
const FROM_EMAIL = process.env.NOTIFY_EMAIL_FROM || 'Dr. Anders Chan <DrChan@thepsychology.ai>'

const isDryRun = process.argv.includes('--dry-run')
const isPreview = process.argv.includes('--preview')
const testArg = process.argv.find((a) => a.startsWith('--test'))
const isTest = !!testArg
const TEST_EMAIL = testArg && testArg.includes('=') ? testArg.split('=')[1] : 'dranders@drinzinna.com'
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : (isDryRun ? Infinity : 0)

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!UNSUBSCRIBE_SECRET) {
  console.error('Missing UNSUBSCRIBE_SECRET — unsubscribe links cannot be signed (CAN-SPAM). Aborting.')
  process.exit(1)
}

async function main() {
  // Preview: render each variant to a file and sanity-check it. No DB, no network.
  if (isPreview) {
    console.log('Preview mode — rendering each variant (no DB, no sends).\n')
    for (const v of VARIANTS) {
      const html = renderHtml('Dr. Wendy', 'preview@example.com', v)
      const path = join(tmpdir(), `score-request-${v.key}.html`)
      writeFileSync(path, html)
      const ok = !html.includes('undefined') && html.includes('/passed?') && html.includes('share=result') && html.includes('Unsubscribe')
      console.log(`variant ${v.key}: subj="${v.subject}"  bytes=${html.length}  ${ok ? 'OK' : 'PROBLEM'}\n  -> ${path}`)
    }
    console.log(`\nSample unsubscribe URL: ${unsubUrl('preview@example.com')}`)
    return
  }

  // Test: send all 3 variants to the founder. No pool query, no DB writes.
  if (isTest) {
    console.log(`TEST mode — sending all 3 variants to ${TEST_EMAIL}. Pool NOT queried, no DB writes.\n`)
    for (const v of VARIANTS) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: TEST_EMAIL,
          subject: `[TEST ${v.key}] ${v.subject}`,
          html: renderHtml('Anders', TEST_EMAIL, v),
          headers: { 'List-Unsubscribe': `<${unsubUrl(TEST_EMAIL)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        }),
      })
      if (res.ok) console.log(`  sent variant ${v.key} -> ${TEST_EMAIL}`)
      else console.error(`  FAILED variant ${v.key}: ${await res.text()}`)
      await new Promise((r) => setTimeout(r, 500))
    }
    console.log('\nTest done. Check your inbox for [TEST A], [TEST B], [TEST C].')
    return
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)
  console.log(`Score-request sender ${isDryRun ? '(DRY RUN — no sends, no DB writes)' : `(LIVE)  limit=${LIMIT}`}\n`)
  if (!isDryRun && LIMIT === 0) {
    console.log('No --limit given for a live run. Pass --limit=N (e.g. --limit=10) or --dry-run. Aborting.')
    return
  }

  const r = await runScoreRequestBatch({ supabase, limit: LIMIT, dryRun: isDryRun })

  console.log(`Candidate pool (free + had-trial-or-stripe + not deleted): ${r.pool}`)
  console.log(`Eligible recipients (after 1/day cap + already-sent + reported + suppressed): ${r.eligible}`)
  console.log(`  variant A: ${r.byVariant.A}   B: ${r.byVariant.B}   C: ${r.byVariant.C}`)
  console.log(`  greeting from profile: ${r.nameSrc.profile}   guessed from email: ${r.nameSrc.guess}   generic "there": ${r.nameSrc.fallback}`)
  console.log('Skipped:')
  for (const [reason, n] of Object.entries(r.skipCounts)) console.log(`  ${reason}: ${n}`)
  console.log('')
  for (const rec of r.recipients) console.log(`${isDryRun ? '[DRY RUN] ' : 'Sent '}-> ${rec.email}  variant=${rec.variant}  greeting="${rec.greeting}"`)
  console.log(`\nDone. ${isDryRun ? 'Would send' : 'Sent'}: ${r.sent}, Failed: ${r.failed}`)
}

main()
