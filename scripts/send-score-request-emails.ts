/**
 * Score-request resurrection campaign — "how did the EPPP go?" re-engagement.
 *
 * A second resurrection email type alongside the win-back sender (send-downgrade-emails.ts).
 * Ask-don't-infer: we don't try to detect who finished. We email the same churned pool and let
 * them self-sort with two CTAs:
 *   - "I passed the EPPP"       -> /passed  (opens the score/testimonial form; the brag + testimonial path)
 *   - "I'm still working on it" -> /dashboard?share=result  (opens the same form; not-passed branch
 *                                   captures weak domains + a supportive "we'll help" message)
 * Both land on the existing ExamResultForm, which forks internally on pass/fail — no new capture UI.
 *
 * Personalization: the greeting uses the profile full_name when present. When it is null (most of
 * this pool never gave a name), we guess a first name from the email address, HIGH CONFIDENCE ONLY:
 *   - "meagan.krieger@..."  -> first token is a known name  -> "Meagan"
 *   - "lorin9494@gmail.com" -> whole token (digits stripped) is a known name -> "Lorin"
 *   - "drwendybaker@..." / "dr.roldan@..." -> "dr" prefix -> "Dr. Wendy" / "Dr. Roldan" (clinician audience)
 *   - "coolgirl22 / jsmith / send2mollyc" -> not a whole/first-token name -> no guess -> "there"
 * No general prefix-matching (that produced junk like send2molly -> "Sen"); the ONLY prefix split is
 * behind a "dr" anchor, which reliably marks a person's name. A wrong name is worse than none, so
 * everything uncertain falls back to "there". Dictionary: scripts/data/first-names.txt (~33k names).
 *
 * Usage (run from repo root):
 *   npx tsx scripts/send-score-request-emails.ts --preview          # render the email to a file; no DB, no send
 *   npx tsx scripts/send-score-request-emails.ts --dry-run          # full pool query + report; no send, no DB writes
 *   npx tsx scripts/send-score-request-emails.ts --test[=you@x.com] # send one copy to yourself; no pool, no DB writes
 *   npx tsx scripts/send-score-request-emails.ts --limit=20         # canary: cap the live send count
 *   npx tsx scripts/send-score-request-emails.ts                    # live send to all eligible
 *
 * Requires: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSUBSCRIBE_SECRET
 *
 * Recipients: subscription_tier='free' AND (trial_ends_at IS NOT NULL OR stripe_customer_id IS NOT NULL)
 *   AND deleted_at IS NULL  (same churned pool as the win-back sender).
 * Skipped (each logged): hard-coded excludes, still-Pro (stripe_customer_id), suppressed (unsubscribed),
 *   already-reported (already has an eppp_exam_results row), already-sent (idempotent re-runs), no-email.
 *
 * Tracking: each send writes funnel_events { event_name:'score_request_sent', metadata:{ subject, utm_campaign } }.
 */

import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
const FROM_EMAIL = process.env.NOTIFY_EMAIL_FROM || 'Dr. Anders Chan <DrChan@thepsychology.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thepsychology.ai'

// CAN-SPAM: honest physical postal address (matches the win-back + DCT footers).
const POSTAL_ADDRESS = 'thePsychology.ai, 760 Harrison Ave, #HC 603, Boston, MA 02118'
const UTM_CAMPAIGN = 'score-request'
const SUBJECT = 'How did the EPPP go?'
const PREHEADER = 'Pass or not, we want to hear from you (and help).'

const isDryRun = process.argv.includes('--dry-run')
const isPreview = process.argv.includes('--preview')
const testArg = process.argv.find((a) => a.startsWith('--test'))
const isTest = !!testArg
const TEST_EMAIL = testArg && testArg.includes('=') ? testArg.split('=')[1] : 'dranders@drinzinna.com'
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity

// Same verified excludes as the win-back sender (people who should not get resurrection mail).
const SKIP_EMAILS = new Set(
  [
    'drnehamenon@gmail.com',
    'sergioescobedo1992@gmail.co',
    'rblackwell32@outlook.com',
    'drdesireecurcio@gmail.com',
    'yaeldror.id@gmail.com',
    'support@prepjet.net',
    'israhibrahim23@gmai.com',
  ].map((e) => e.toLowerCase())
)
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

// ── First-name dictionary (high-confidence name guessing) ────────────────────────────────────────
const NAMES: Set<string> = (() => {
  const path = join(process.cwd(), 'scripts', 'data', 'first-names.txt')
  try {
    return new Set(readFileSync(path, 'utf8').split('\n').map((s) => s.trim().toLowerCase()).filter(Boolean))
  } catch (e) {
    console.error(`Could not read first-names dictionary at ${path}. Run from the repo root.`)
    process.exit(1)
  }
})()

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const stripEdgeDigits = (s: string) => s.replace(/^\d+|\d+$/g, '')

type Guess = { name: string; doctor: boolean }

// High-confidence only. Returns null unless we're confident. Doctor detection is deliberate:
// clinical users often email as dr<name> / dr.<name>, so "dr" is a strong "this is a person" anchor.
function guessNameFromEmail(email: string): Guess | null {
  const local = (email.split('@')[0] || '').toLowerCase().replace(/\+.*$/, '')
  const tokens = local.split(/[._-]/).filter(Boolean)
  const first = stripEdgeDigits(tokens[0] || '')

  // A) explicit title token: "dr.sarah" / "dr_chan" / "dr-harutyunian". The separator confirms
  //    the next token is the person's name (first OR last) -> "Dr. X".
  if (tokens.length >= 2 && first === 'dr') {
    const t = stripEdgeDigits(tokens[1])
    return /^[a-z]{2,}$/.test(t) ? { name: titleCase(t), doctor: true } : null
  }

  // B) token is itself a known name -> plain name. Checked BEFORE the glued-dr rule so "drew",
  //    "drake" resolve to the name, not "Dr. ew". Covers single-token and first-of-many.
  if (first.length >= 3 && NAMES.has(first)) return { name: titleCase(first), doctor: false }

  // C) glued "dr" + firstname + lastname, no separator: "drsarahhill24" -> "Dr. Sarah". Require a
  //    trailing lastname (>=2 chars after the name) so English words don't match: "drama"/"dream"/
  //    "drive"/"driver" leave no valid name+lastname split and fall through to no-guess.
  if (first.startsWith('dr') && first.length >= 6) {
    const rem = first.slice(2)
    for (let i = Math.min(rem.length - 2, 12); i >= 3; i--) {
      if (NAMES.has(rem.slice(0, i))) return { name: titleCase(rem.slice(0, i)), doctor: true }
    }
  }
  return null
}

type NameSource = 'profile' | 'guess' | 'fallback'
function resolveGreeting(fullName: string | null, email: string): { name: string; source: NameSource } {
  const fn = (fullName || '').trim()
  if (fn) {
    const parts = fn.split(/\s+/).map((p) => p.replace(/[^a-zA-Z]/g, '')).filter(Boolean)
    if (parts.length) {
      // Profile name may itself carry a title, e.g. "Dr. Sarah Hill" -> greet "Dr. Sarah".
      const doctor = /^drs?$/i.test(parts[0])
      const nameTok = (doctor ? parts[1] : parts[0]) || parts[0]
      if (nameTok && nameTok.length >= 2) return { name: (doctor ? 'Dr. ' : '') + titleCase(nameTok), source: 'profile' }
    }
  }
  const guess = guessNameFromEmail(email)
  if (guess) return { name: (guess.doctor ? 'Dr. ' : '') + guess.name, source: 'guess' }
  return { name: 'there', source: 'fallback' }
}

// Same token /api/dct-unsubscribe verifies: HMAC-SHA256(lowercased email, UNSUBSCRIBE_SECRET), base64url.
function unsubUrl(email: string): string {
  const e = Buffer.from(email, 'utf8').toString('base64url')
  const t = createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase()).digest('base64url')
  return `${APP_URL}/api/dct-unsubscribe?e=${e}&t=${t}`
}

const utm = `utm_source=score_request&utm_medium=email&utm_campaign=${UTM_CAMPAIGN}`
const passedUrl = `${APP_URL}/passed?${utm}` // -> /dashboard?share=passed (opens the score/testimonial form)
const stillUrl = `${APP_URL}/dashboard?share=result&${utm}` // opens the same form, not-passed branch

function renderHtml(firstName: string, email: string): string {
  const unsub = unsubUrl(email)
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${PREHEADER}</span>

    <h2 style="margin-bottom: 12px;">Hi ${firstName},</h2>

    <p style="color: #333; line-height: 1.6;">
      A while back you were prepping for the EPPP with us. We keep thinking about the people who
      studied here, and we really want to know how it turned out for you.
    </p>

    <p style="color: #333; line-height: 1.6;">
      If you passed, we would love to celebrate with you and (if you are up for it) share your story,
      so the next candidate believes it is possible.
    </p>

    <p style="color: #333; line-height: 1.6;">
      If it did not go your way, or you are still in the thick of it, tell us where you got stuck.
      We will use it to point you to the right lessons and help you get over the line.
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${passedUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 6px;">I passed the EPPP</a>
      <br>
      <a href="${stillUrl}" style="display: inline-block; background: #fff; color: #d97706; border: 2px solid #d97706; padding: 10px 26px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 10px 6px 6px;">I'm still working on it</a>
    </div>

    <p style="color: #555; font-size: 14px; line-height: 1.6; text-align: center;">
      It takes about a minute, and it genuinely helps us make the prep better for you and everyone after you.
    </p>

    <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 28px;">— Dr. Chan<br>thePsychology.ai</p>

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
  // Preview: render the email to a file and sanity-check it. No DB, no network.
  if (isPreview) {
    console.log('Preview mode — rendering the email (no DB, no sends).\n')
    for (const [label, name] of [['profile', 'Jordan'], ['guess', 'Lorin'], ['doctor', 'Dr. Wendy'], ['fallback', 'there']] as const) {
      const html = renderHtml(name, 'preview@example.com')
      const path = join(tmpdir(), `score-request-${label}.html`)
      writeFileSync(path, html)
      const ok =
        !html.includes('undefined') &&
        html.includes(passedUrl) &&
        html.includes(stillUrl) &&
        html.includes('Unsubscribe')
      console.log(`${label} greeting ("Hi ${name},"): bytes=${html.length}  ${ok ? 'OK' : 'PROBLEM'}\n  -> ${path}`)
    }
    console.log(`\nSubject: ${SUBJECT}`)
    console.log(`Sample unsubscribe URL: ${unsubUrl('preview@example.com')}`)
    return
  }

  // Test: send one copy to the founder. No pool query, no DB writes.
  if (isTest) {
    console.log(`TEST mode — sending one copy to ${TEST_EMAIL}. Pool NOT queried, no DB writes.\n`)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TEST_EMAIL,
        subject: `[TEST] ${SUBJECT}`,
        html: renderHtml('Anders', TEST_EMAIL),
        headers: {
          'List-Unsubscribe': `<${unsubUrl(TEST_EMAIL)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
    if (res.ok) console.log(`  sent -> ${TEST_EMAIL}`)
    else console.error(`  FAILED: ${await res.text()}`)
    return
  }

  console.log(`Score-request sender ${isDryRun ? '(DRY RUN — no sends, no DB writes)' : '(LIVE)'}${LIMIT !== Infinity ? `  limit=${LIMIT}` : ''}\n`)

  // 1) Candidate pool — same churned pool as the win-back sender.
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

  // 2) Suppressions (unsubscribes) — shared list.
  const { data: supp } = await supabase.from('dct_suppressions').select('email')
  const suppressed = new Set((supp || []).map((s: { email: string }) => (s.email || '').toLowerCase()))

  // 3) Already reported their result — do not nag them for a score they already gave us.
  const { data: reported } = await supabase.from('eppp_exam_results').select('user_id')
  const alreadyReported = new Set((reported || []).map((r: { user_id: string }) => r.user_id))

  // 4) Idempotency — anyone already sent a score-request is never re-mailed.
  const { data: priorSent } = await supabase
    .from('funnel_events')
    .select('user_id')
    .eq('event_name', 'score_request_sent')
  const alreadySent = new Set((priorSent || []).map((r: { user_id: string }) => r.user_id))
  console.log(`Already reported a result (will skip): ${alreadyReported.size}`)
  console.log(`Already received score-request (will skip): ${alreadySent.size}`)
  console.log(`On suppression list: ${suppressed.size}\n`)

  // 5) Filter + classify.
  const recipients: { id: string; email: string; full_name: string | null }[] = []
  const skips: Skip[] = []

  for (const u of users || []) {
    const email = (u.email || '').trim()
    if (!email) { skips.push({ email: '(null)', reason: 'no-email' }); continue }
    const lc = email.toLowerCase()
    if (SKIP_EMAILS.has(lc)) { skips.push({ email, reason: 'excluded (hard-coded)' }); continue }
    const name = (u.full_name || '').toLowerCase()
    if (name && SKIP_NAME_SUBSTRINGS.some((s) => name.includes(s))) { skips.push({ email, reason: 'excluded (name match)' }); continue }
    if (suppressed.has(lc)) { skips.push({ email, reason: 'suppressed (unsubscribed)' }); continue }
    if (alreadyReported.has(u.id)) { skips.push({ email, reason: 'already-reported' }); continue }
    if (alreadySent.has(u.id)) { skips.push({ email, reason: 'already-sent (idempotent)' }); continue }
    recipients.push({ id: u.id, email, full_name: u.full_name })
  }

  // 6) Report — including how the greeting name resolves (personalization coverage).
  const nameSrc = { profile: 0, guess: 0, fallback: 0 } as Record<NameSource, number>
  const guessSamples: string[] = []
  for (const r of recipients) {
    const g = resolveGreeting(r.full_name, r.email)
    nameSrc[g.source] += 1
    if (g.source === 'guess' && guessSamples.length < 20) guessSamples.push(`${r.email}  ->  Hi ${g.name}`)
  }
  const skipCounts = skips.reduce<Record<string, number>>((m, s) => ((m[s.reason] = (m[s.reason] || 0) + 1), m), {})

  console.log(`Eligible recipients: ${recipients.length}`)
  console.log(`  greeting from profile name: ${nameSrc.profile}   guessed from email: ${nameSrc.guess}   generic "there": ${nameSrc.fallback}`)
  console.log(`Skipped: ${skips.length}`)
  for (const [reason, n] of Object.entries(skipCounts)) console.log(`  ${reason}: ${n}`)
  if (guessSamples.length) {
    console.log('\n  sample email-guessed names:')
    guessSamples.forEach((s) => console.log(`    ${s}`))
  }
  console.log('')

  const toSend = recipients.slice(0, LIMIT)
  if (LIMIT !== Infinity) console.log(`Capping this run to ${toSend.length} (--limit=${LIMIT}).\n`)

  let sent = 0
  let failed = 0

  for (const r of toSend) {
    const { name: firstName } = resolveGreeting(r.full_name, r.email)

    if (isDryRun) {
      console.log(`[DRY RUN] -> ${r.email}  greeting="Hi ${firstName}"`)
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
          subject: SUBJECT,
          html: renderHtml(firstName, r.email),
          headers: {
            'List-Unsubscribe': `<${unsubUrl(r.email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      if (res.ok) {
        sent++
        console.log(`Sent -> ${r.email}  (Hi ${firstName})`)
        const { error: trackErr } = await supabase.from('funnel_events').insert({
          user_id: r.id,
          event_name: 'score_request_sent',
          metadata: { subject: SUBJECT, utm_campaign: UTM_CAMPAIGN },
          created_at: new Date().toISOString(),
        })
        if (trackErr) {
          // Email already went out but we could not mark it. A failing DB write usually keeps
          // failing, so barreling on would leave the rest of the batch re-sendable. Abort now:
          // damage is bounded to this one user. Fix the write, then re-run (recorded users skip).
          console.error(`  !! SENT but FAILED to record score_request_sent for ${r.email}: ${trackErr.message}`)
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
