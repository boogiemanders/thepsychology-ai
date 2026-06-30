/**
 * Win-back resurrection campaign — A/B testimonial-driven re-engagement of churned users.
 *
 * (Started life as the one-time "downgrade" email; now a variant-aware sender that mirrors the
 *  DCT A/B follow-up sender: stable hash-bucketed variants, funnel_events tracking, CAN-SPAM
 *  unsubscribe via the shared dct_suppressions list + signed /api/dct-unsubscribe link.)
 *
 * Usage:
 *   npx tsx scripts/send-downgrade-emails.ts --dry-run            # preview only; no send, no DB writes
 *   npx tsx scripts/send-downgrade-emails.ts --limit=20           # canary: cap the send count
 *   npx tsx scripts/send-downgrade-emails.ts                      # live send to all eligible
 *
 * Requires: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSUBSCRIBE_SECRET
 *
 * Recipients (the spec query): subscription_tier='free'
 *   AND (trial_ends_at IS NOT NULL OR stripe_customer_id IS NOT NULL)  -- lapsed trials + ex-payers
 *   AND deleted_at IS NULL                                             -- never email deleted accounts
 *
 * Skipped (each logged with a reason):
 *   - SKIP_EMAILS               hard-coded excludes (verified against the live DB by email)
 *   - still-Pro                 stripe_customer_id set => getEntitledSubscriptionTier()==='pro';
 *                               the app still grants them Pro, so a "Get Pro Back" email is wrong.
 *   - suppressed                already in dct_suppressions (a prior unsubscribe; sticks forever)
 *   - already-sent              already has a 'winback_sent' funnel_event (idempotent re-runs)
 *   - no-email                  null/empty email
 *
 * Tracking: each send writes funnel_events { event_name:'winback_sent', metadata:{ variant, utm_campaign, subject } }.
 *   Reconversion = a later 'checkout_completed' for the same user. Read it with scripts/winback-scorecard.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac } from 'crypto'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
const FROM_EMAIL = process.env.NOTIFY_EMAIL_FROM || 'Dr. Anders Chan <DrChan@thepsychology.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thepsychology.ai'

// CAN-SPAM: an honest physical postal address (matches the DCT cold-outreach footer).
const POSTAL_ADDRESS = 'thePsychology.ai, 760 Harrison Ave, #HC 603, Boston, MA 02118'

const isDryRun = process.argv.includes('--dry-run')
const isPreview = process.argv.includes('--preview')
const testArg = process.argv.find((a) => a.startsWith('--test'))
const isTest = !!testArg
const TEST_EMAIL = testArg && testArg.includes('=') ? testArg.split('=')[1] : 'dranders@drinzinna.com'
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity

// Hard-coded excludes. Verified against the live DB by EMAIL (name-only matching would have missed
// Neha — full_name is null — and Ronnie Blackwell — stored as "Ronnie B."). Lowercased for compare.
const SKIP_EMAILS = new Set(
  [
    'drnehamenon@gmail.com', // Neha
    'sergioescobedo1992@gmail.co', // Sergio Escobedo
    'rblackwell32@outlook.com', // Ronnie Blackwell ("Ronnie B.")
    'drdesireecurcio@gmail.com', // Desiree Curcio
    'yaeldror.id@gmail.com', // Yael Dror (also an active Pro member, so not in the pool anyway)
    // pre-existing excludes carried over from the original downgrade script:
    'support@prepjet.net',
    'israhibrahim23@gmai.com',
  ].map((e) => e.toLowerCase())
)

// Secondary safety net: case-insensitive full_name substrings (belt-and-suspenders on top of the
// verified email list, per the founder's instruction to also match on full_name).
const SKIP_NAME_SUBSTRINGS = ['neha', 'sergio escobedo', 'ronnie blackwell', 'desiree curcio', 'escobedo', 'curcio', 'yael dror', 'yael']

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!UNSUBSCRIBE_SECRET) {
  console.error('Missing UNSUBSCRIBE_SECRET — unsubscribe links cannot be signed (CAN-SPAM). Aborting.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── A/B variants: testimonial-driven, distinct angles. Real, curated quotes from siteConfig.testimonials
//    (already approved/public) so nothing unreviewed goes out. ─────────────────────────────────────────
type Variant = {
  key: 'A' | 'B' | 'C'
  utm_campaign: string
  subject: string
  preheader: string
  quote: string
  attribution: string
  lede: string
}

const VARIANTS: Variant[] = [
  {
    key: 'A',
    utm_campaign: 'winback-a-outcome',
    subject: 'She passed the EPPP on her first try',
    preheader: 'The tool she used is still waiting in your account.',
    quote:
      'thePsychology.ai was a massive support while I studied for the EPPP. I got through all the material, quizzes, and exams within 4 months and passed the EPPP on my first try.',
    attribution: 'Yael Dror, PsyD, Clinical Psychologist',
    lede: 'You started studying with us, then life happened. Here is what happened for someone who kept going.',
  },
  {
    key: 'B',
    utm_campaign: 'winback-b-realism',
    subject: 'EPPP questions worded like the real exam',
    preheader: 'The closest practice to the actual test, still in your account.',
    quote:
      'Out of all the programs I looked at, this one comes the closest to how the EPPP actually words its questions. My test was all application based, and this program is set up the same way.',
    attribution: 'Verified member, shared in an EPPP Facebook group',
    lede: 'The reason people come back to finish: the practice actually matches the exam.',
  },
  {
    key: 'C',
    utm_campaign: 'winback-c-value',
    subject: 'Your EPPP prep is still here ($30, not $1,800)',
    preheader: 'Everything you completed is saved. Pick up where you left off.',
    quote:
      'Information like PrepJet, but much easier to digest and at a fraction of the cost. Overall a good program and I would recommend it to peers.',
    attribution: 'Verified member',
    lede: 'Your progress did not go anywhere. Neither did the price for early members.',
  },
]

// Even, deterministic split — identical to the DCT sender so behavior is familiar and a re-run
// never reshuffles a user into a different variant.
function pickVariant(email: string): Variant {
  const h = createHash('md5').update(email.toLowerCase()).digest()
  return VARIANTS[h.readUInt32BE(0) % VARIANTS.length]
}

// Same token /api/dct-unsubscribe verifies: HMAC-SHA256(lowercased email, UNSUBSCRIBE_SECRET), base64url.
function unsubUrl(email: string): string {
  const e = Buffer.from(email, 'utf8').toString('base64url')
  const t = createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase()).digest('base64url')
  return `${APP_URL}/api/dct-unsubscribe?e=${e}&t=${t}`
}

function ctaUrl(v: Variant): string {
  return `${APP_URL}/dashboard?upgrade=email&utm_source=winback&utm_medium=email&utm_campaign=${v.utm_campaign}`
}

function renderHtml(firstName: string, v: Variant, email: string): string {
  const unsub = unsubUrl(email)
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${v.preheader}</span>

    <h2 style="margin-bottom: 12px;">Hi ${firstName},</h2>

    <p style="color: #333; line-height: 1.6;">${v.lede}</p>

    <blockquote style="border-left: 3px solid #d97706; margin: 24px 0; padding: 8px 0 8px 18px; color: #333; font-style: italic; line-height: 1.6;">
      &ldquo;${v.quote}&rdquo;
      <div style="margin-top: 10px; font-style: normal; font-size: 14px; color: #666;">— ${v.attribution}</div>
    </blockquote>

    <p style="color: #333; line-height: 1.6;">
      <strong>Your study progress is safe.</strong> Everything you completed is still in your account. You can keep
      studying on the Free plan, and Pro reopens the full library: 80+ lessons, unlimited quizzes, exam simulations,
      and the Recover sessions.
    </p>

    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #92400e; margin: 0; font-weight: 600;">Pro is $30/mo for early members.</p>
      <p style="color: #92400e; margin: 4px 0 0 0; font-size: 14px;">That price steps up to $40/mo in July, so now is the moment to lock it in.</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl(v)}" style="display: inline-block; background: #d97706; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px;">Get Pro Back</a>
    </div>

    <p style="color: #555; font-size: 14px; line-height: 1.6; text-align: center; margin: 8px 0 24px;">
      Already passed the EPPP, or have feedback on the site?<br>
      <a href="${APP_URL}/passed?utm_source=winback&utm_medium=email&utm_campaign=${v.utm_campaign}" style="color: #d97706; font-weight: 600;">Share your story or tell us what you think</a> — it helps us, and the next candidate.
    </p>

    <p style="color: #666; font-size: 14px; line-height: 1.5;">— Dr. Chan<br>thePsychology.ai</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0 14px;">
    <p style="color: #999; font-size: 12px; line-height: 1.5;">
      You are receiving this because you created a thePsychology.ai account.<br>
      ${POSTAL_ADDRESS}<br>
      <a href="${unsub}" style="color: #999;">Unsubscribe</a> from these emails.
    </p>
  </div>`
}

type Skip = { email: string; reason: string }

async function main() {
  // Preview mode: render each variant to an HTML file and sanity-check it. No DB, no network.
  if (isPreview) {
    const sampleEmail = 'preview@example.com'
    console.log('Preview mode — rendering each variant (no DB, no sends).\n')
    for (const v of VARIANTS) {
      const html = renderHtml('Jordan', v, sampleEmail)
      const path = join(tmpdir(), `winback-${v.key}.html`)
      writeFileSync(path, html)
      const ok = !html.includes('undefined') && html.includes(v.quote) && html.includes('Unsubscribe')
      console.log(`variant ${v.key}: subj="${v.subject}"  bytes=${html.length}  ${ok ? 'OK' : 'PROBLEM (undefined/missing quote or unsubscribe)'}`)
      console.log(`  -> ${path}`)
    }
    console.log(`\nSample unsubscribe URL: ${unsubUrl(sampleEmail)}`)
    return
  }

  // Test mode: send all 3 variants to one address (the founder). No pool query, no DB writes.
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
          html: renderHtml('Anders', v, TEST_EMAIL),
          headers: {
            'List-Unsubscribe': `<${unsubUrl(TEST_EMAIL)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })
      if (res.ok) console.log(`  sent variant ${v.key} -> ${TEST_EMAIL}`)
      else console.error(`  FAILED variant ${v.key}: ${await res.text()}`)
      await new Promise((r) => setTimeout(r, 500))
    }
    console.log('\nTest done. Check your inbox for [TEST A], [TEST B], [TEST C].')
    return
  }

  console.log(`Win-back sender ${isDryRun ? '(DRY RUN — no sends, no DB writes)' : '(LIVE)'}${LIMIT !== Infinity ? `  limit=${LIMIT}` : ''}\n`)

  // 1) Candidate pool — the spec query.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, trial_ends_at, stripe_customer_id, deleted_at')
    .eq('subscription_tier', 'free')
    .is('deleted_at', null)
    .or('trial_ends_at.not.is.null,stripe_customer_id.not.is.null')

  if (error) {
    console.error('Failed to fetch users:', error)
    process.exit(1)
  }
  console.log(`Candidate pool (free + had-trial-or-stripe + not deleted): ${users?.length || 0}`)

  // 2) Suppressions (unsubscribes) — shared list, checked before every send.
  const { data: supp } = await supabase.from('dct_suppressions').select('email')
  const suppressed = new Set((supp || []).map((s: { email: string }) => (s.email || '').toLowerCase()))

  // 3) Idempotency — anyone already sent a win-back is never re-mailed.
  const { data: priorSent } = await supabase
    .from('funnel_events')
    .select('user_id')
    .eq('event_name', 'winback_sent')
  const alreadySent = new Set((priorSent || []).map((r: { user_id: string }) => r.user_id))
  console.log(`Already received win-back (will skip): ${alreadySent.size}`)
  console.log(`On suppression list: ${suppressed.size}\n`)

  // 4) Filter + classify.
  const recipients: { id: string; email: string; full_name: string | null; variant: Variant }[] = []
  const skips: Skip[] = []

  for (const u of users || []) {
    const email = (u.email || '').trim()
    if (!email) {
      skips.push({ email: '(null)', reason: 'no-email' })
      continue
    }
    const lc = email.toLowerCase()
    if (SKIP_EMAILS.has(lc)) {
      skips.push({ email, reason: 'excluded (hard-coded)' })
      continue
    }
    const name = (u.full_name || '').toLowerCase()
    if (name && SKIP_NAME_SUBSTRINGS.some((s) => name.includes(s))) {
      skips.push({ email, reason: 'excluded (name match)' })
      continue
    }
    // getEntitledSubscriptionTier(): a free-tier user WITH a stripe_customer_id still has Pro access,
    // so a win-back is wrong for them. (All 6 such users verified as real ex-payers, incl. a test acct.)
    if (u.stripe_customer_id) {
      skips.push({ email, reason: 'still-Pro (stripe_customer_id)' })
      continue
    }
    if (suppressed.has(lc)) {
      skips.push({ email, reason: 'suppressed (unsubscribed)' })
      continue
    }
    if (alreadySent.has(u.id)) {
      skips.push({ email, reason: 'already-sent (idempotent)' })
      continue
    }
    recipients.push({ id: u.id, email, full_name: u.full_name, variant: pickVariant(email) })
  }

  // 5) Report.
  const byVariant = { A: 0, B: 0, C: 0 } as Record<Variant['key'], number>
  recipients.forEach((r) => (byVariant[r.variant.key] += 1))
  const skipCounts = skips.reduce<Record<string, number>>((m, s) => ((m[s.reason] = (m[s.reason] || 0) + 1), m), {})

  console.log(`Eligible recipients: ${recipients.length}`)
  console.log(`  variant A (outcome): ${byVariant.A}   variant B (realism): ${byVariant.B}   variant C (value): ${byVariant.C}`)
  console.log(`Skipped: ${skips.length}`)
  for (const [reason, n] of Object.entries(skipCounts)) console.log(`  ${reason}: ${n}`)
  const excludedShown = skips.filter((s) => s.reason.startsWith('excluded'))
  if (excludedShown.length) {
    console.log('  excluded individuals:')
    excludedShown.forEach((s) => console.log(`    - ${s.email} [${s.reason}]`))
  }
  console.log('')

  const toSend = recipients.slice(0, LIMIT)
  if (LIMIT !== Infinity) console.log(`Capping this run to ${toSend.length} (--limit=${LIMIT}).\n`)

  let sent = 0
  let failed = 0

  for (const r of toSend) {
    const firstName = r.full_name?.split(' ')[0] || 'there'
    const v = r.variant

    if (isDryRun) {
      console.log(`[DRY RUN] -> ${r.email}  variant=${v.key}  subj="${v.subject}"`)
      sent++
      continue
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: r.email,
          subject: v.subject,
          html: renderHtml(firstName, v, r.email),
          headers: {
            // RFC 8058 one-click unsubscribe — same signed URL the DCT system uses.
            'List-Unsubscribe': `<${unsubUrl(r.email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      if (res.ok) {
        sent++
        console.log(`Sent -> ${r.email}  (variant ${v.key})`)
        // Record the send for A/B attribution + idempotency. Service role bypasses RLS.
        const { error: trackErr } = await supabase.from('funnel_events').insert({
          user_id: r.id,
          event_name: 'winback_sent',
          metadata: { variant: v.key, utm_campaign: v.utm_campaign, subject: v.subject },
          created_at: new Date().toISOString(),
        })
        if (trackErr) {
          // The email already went out but we couldn't mark it. If the next run can't see this
          // send, it re-mails the user. A failing DB write usually keeps failing, so barreling on
          // would leave the whole rest of the batch unrecorded and re-sendable. ABORT now: damage
          // is bounded to this one user. Fix the DB write, then re-run — recorded users are skipped.
          console.error(`  !! SENT but FAILED to record winback_sent for ${r.email}: ${trackErr.message}`)
          console.error('  Aborting to prevent mass double-sends on a later run. Resolve the DB write and re-run.')
          break
        }
      } else {
        failed++
        console.error(`Failed for ${r.email}: ${await res.text()}`)
      }

      await new Promise((res) => setTimeout(res, 500)) // ~2/sec
    } catch (err) {
      failed++
      console.error(`Error for ${r.email}:`, err)
    }
  }

  console.log(`\nDone. ${isDryRun ? 'Would send' : 'Sent'}: ${sent}, Failed: ${failed}`)
}

main()
