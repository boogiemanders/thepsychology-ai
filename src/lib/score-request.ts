/**
 * Score-request resurrection campaign — shared core.
 *
 * Used by BOTH the CLI sender (scripts/send-score-request-emails.ts, for preview/test/canary) and
 * the daily Vercel cron (src/app/api/cron/score-request-drip/route.ts, which drips 10/day). Keeping
 * the variants, name-guessing, render, and batch logic here means the two callers never drift.
 *
 * No Next.js imports and no top-level side effects, so the CLI can import it under tsx. The Supabase
 * client is passed in by the caller (service role).
 */

import { createHmac, createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thepsychology.ai'
const FROM_EMAIL = process.env.NOTIFY_EMAIL_FROM || 'Dr. Anders Chan <DrChan@thepsychology.ai>'
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
// CAN-SPAM: honest physical postal address (matches the win-back + DCT footers).
const POSTAL_ADDRESS = 'thePsychology.ai, 760 Harrison Ave, #HC 603, Boston, MA 02118'

// Same verified excludes as the win-back sender (people who should not get resurrection mail).
export const SKIP_EMAILS = new Set(
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
export const SKIP_NAME_SUBSTRINGS = ['neha', 'sergio escobedo', 'ronnie blackwell', 'desiree curcio', 'escobedo', 'curcio', 'yael dror', 'yael']

// ── A/B variants: same "how did it go?" email + two CTAs, three subject/framing angles.
//    Deterministic md5(email)%N split (mirrors the win-back + DCT senders) so a re-run never
//    reshuffles a user, and funnel_events records the variant for scoring. ─────────────────────────
export type ScoreVariant = {
  key: 'A' | 'B' | 'C'
  utm_campaign: string
  subject: string
  preheader: string
  lede: string[]
}

export const VARIANTS: ScoreVariant[] = [
  {
    key: 'A',
    utm_campaign: 'score-request-a-celebrate',
    subject: 'How did the EPPP go?',
    preheader: 'Pass or not, we want to hear from you (and help).',
    lede: [
      'A while back you were prepping for the EPPP with us. We keep thinking about the people who studied here, and we really want to know how it turned out for you.',
      'If you passed, we would love to celebrate with you and (if you are up for it) share your story, so the next candidate believes it is possible.',
      'If it did not go your way, or you are still in the thick of it, tell us where you got stuck. We will use it to point you to the right lessons and help you get over the line.',
    ],
  },
  {
    key: 'B',
    utm_campaign: 'score-request-b-quick',
    subject: 'Did you take the EPPP yet?',
    preheader: 'A quick question from Dr. Chan (takes about a minute).',
    lede: [
      'Quick question: have you taken the EPPP since you studied with us?',
      'If you passed, congratulations, we would genuinely love to hear about it. If you are still preparing, or it did not go your way, tell us where you are stuck and we will help.',
    ],
  },
  {
    key: 'C',
    utm_campaign: 'score-request-c-help',
    subject: 'Still studying for the EPPP? Let us help',
    preheader: 'Tell us where you are stuck and we will point you to the right lessons.',
    lede: [
      'You started prepping for the EPPP with us, and we want to make sure you actually get across the finish line.',
      'Already passed? Amazing, come share the win. Still grinding, or the last attempt did not go your way? Tell us where it got hard and we will point you to exactly the lessons and practice that close the gap.',
    ],
  },
]

export function pickVariant(email: string): ScoreVariant {
  const h = createHash('md5').update(email.toLowerCase()).digest()
  return VARIANTS[h.readUInt32BE(0) % VARIANTS.length]
}

// ── First-name dictionary (high-confidence name guessing) ────────────────────────────────────────
let _names: Set<string> | null = null
export function loadFirstNames(): Set<string> {
  if (_names) return _names
  try {
    const path = join(process.cwd(), 'scripts', 'data', 'first-names.txt')
    _names = new Set(readFileSync(path, 'utf8').split('\n').map((s) => s.trim().toLowerCase()).filter(Boolean))
  } catch {
    // Degrade gracefully: no dictionary -> every guess returns null -> greeting falls back to "there".
    // Never crash the drip over a missing data file.
    console.warn('[score-request] first-names dictionary unavailable; name guessing disabled')
    _names = new Set()
  }
  return _names
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const stripEdgeDigits = (s: string) => s.replace(/^\d+|\d+$/g, '')

type Guess = { name: string; doctor: boolean }

// High-confidence only. Returns null unless we're confident. Doctor detection is deliberate:
// clinical users often email as dr<name> / dr.<name>, so "dr" is a strong "this is a person" anchor.
export function guessNameFromEmail(email: string, names: Set<string>): Guess | null {
  const local = (email.split('@')[0] || '').toLowerCase().replace(/\+.*$/, '')
  const tokens = local.split(/[._-]/).filter(Boolean)
  const first = stripEdgeDigits(tokens[0] || '')

  // A) explicit title token: "dr.sarah" / "dr_chan" / "dr-harutyunian". The separator confirms the
  //    next token is the person's name (first OR last) -> "Dr. X".
  if (tokens.length >= 2 && first === 'dr') {
    const t = stripEdgeDigits(tokens[1])
    return /^[a-z]{2,}$/.test(t) ? { name: titleCase(t), doctor: true } : null
  }

  // B) token is itself a known name -> plain name. Checked BEFORE the glued-dr rule so "drew"/"drake"
  //    resolve to the name, not "Dr. ew". Covers single-token and first-of-many.
  if (first.length >= 3 && names.has(first)) return { name: titleCase(first), doctor: false }

  // C) glued "dr" + firstname + lastname, no separator: "drsarahhill24" -> "Dr. Sarah". Require a
  //    trailing lastname (>=2 chars after the name) so English words don't match: "drama"/"dream"/
  //    "drive"/"driver" leave no valid name+lastname split and fall through to no-guess.
  if (first.startsWith('dr') && first.length >= 6) {
    const rem = first.slice(2)
    for (let i = Math.min(rem.length - 2, 12); i >= 3; i--) {
      if (names.has(rem.slice(0, i))) return { name: titleCase(rem.slice(0, i)), doctor: true }
    }
  }
  return null
}

export type NameSource = 'profile' | 'guess' | 'fallback'
export function resolveGreeting(fullName: string | null, email: string, names: Set<string>): { name: string; source: NameSource } {
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
  const guess = guessNameFromEmail(email, names)
  if (guess) return { name: (guess.doctor ? 'Dr. ' : '') + guess.name, source: 'guess' }
  return { name: 'there', source: 'fallback' }
}

// Same token /api/dct-unsubscribe verifies: HMAC-SHA256(lowercased email, UNSUBSCRIBE_SECRET), base64url.
export function unsubUrl(email: string): string {
  const e = Buffer.from(email, 'utf8').toString('base64url')
  const t = createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase()).digest('base64url')
  return `${APP_URL}/api/dct-unsubscribe?e=${e}&t=${t}`
}

export function renderHtml(firstName: string, email: string, v: ScoreVariant): string {
  const utm = `utm_source=score_request&utm_medium=email&utm_campaign=${v.utm_campaign}`
  const passedUrl = `${APP_URL}/passed?${utm}` // -> /dashboard?share=passed (opens the score/testimonial form)
  const stillUrl = `${APP_URL}/dashboard?share=result&${utm}` // opens the same form, not-passed branch
  const unsub = unsubUrl(email)
  const ledeHtml = v.lede.map((p) => `<p style="color: #333; line-height: 1.6;">${p}</p>`).join('\n')
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${v.preheader}</span>

    <h2 style="margin-bottom: 12px;">Hi ${firstName},</h2>

    ${ledeHtml}

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

// "No more than 1 email from me ever" (founder rule): a person is off-limits for the score-request
// if they've received ANY prior resurrection campaign. Win-back already emailed ~222 of this pool,
// so this deliberately shrinks the score-request to people win-back never reached + future churners.
// Extend this list when new one-per-person campaigns are added.
export const PRIOR_CAMPAIGN_EVENTS = ['winback_sent', 'score_request_sent']

export type Skip = { email: string; reason: string }
export type BatchResult = {
  dryRun: boolean
  pool: number
  eligible: number
  sent: number
  failed: number
  byVariant: Record<'A' | 'B' | 'C', number>
  nameSrc: Record<NameSource, number>
  skipCounts: Record<string, number>
  recipients: { email: string; variant: string; greeting: string }[]
}

/**
 * Query the churned pool, filter, and send the score-request email to up to `limit` recipients.
 * Idempotent (skips anyone with a prior score_request_sent funnel_event), suppression-aware, and
 * skips anyone who already reported a result. Records score_request_sent per send for A/B scoring.
 */
export async function runScoreRequestBatch(opts: {
  supabase: SupabaseClient
  limit: number
  dryRun?: boolean
}): Promise<BatchResult> {
  const { supabase, limit } = opts
  const dryRun = !!opts.dryRun
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const names = loadFirstNames()

  // 1) Candidate pool — same churned pool as the win-back sender.
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, trial_ends_at, stripe_customer_id, deleted_at')
    .eq('subscription_tier', 'free')
    .is('deleted_at', null)
    .or('trial_ends_at.not.is.null,stripe_customer_id.not.is.null')
  if (error) throw new Error(`pool query failed: ${error.message}`)

  // 2) Suppressions, 3) already-reported, 4) 1-email-ever cap (any prior resurrection campaign).
  const [{ data: supp }, { data: reported }, { data: priorSent }] = await Promise.all([
    supabase.from('dct_suppressions').select('email'),
    supabase.from('eppp_exam_results').select('user_id'),
    supabase.from('funnel_events').select('user_id').in('event_name', PRIOR_CAMPAIGN_EVENTS),
  ])
  const suppressed = new Set((supp || []).map((s: { email: string }) => (s.email || '').toLowerCase()))
  const alreadyReported = new Set((reported || []).map((r: { user_id: string }) => r.user_id))
  const alreadyEmailed = new Set((priorSent || []).map((r: { user_id: string }) => r.user_id))

  // 5) Filter + classify.
  const recipients: { id: string; email: string; full_name: string | null; variant: ScoreVariant }[] = []
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
    if (alreadyEmailed.has(u.id)) { skips.push({ email, reason: 'already-emailed (1-per-person cap)' }); continue }
    recipients.push({ id: u.id, email, full_name: u.full_name, variant: pickVariant(email) })
  }

  const byVariant = { A: 0, B: 0, C: 0 } as Record<'A' | 'B' | 'C', number>
  const nameSrc = { profile: 0, guess: 0, fallback: 0 } as Record<NameSource, number>
  for (const r of recipients) {
    byVariant[r.variant.key] += 1
    nameSrc[resolveGreeting(r.full_name, r.email, names).source] += 1
  }
  const skipCounts = skips.reduce<Record<string, number>>((m, s) => ((m[s.reason] = (m[s.reason] || 0) + 1), m), {})

  const toSend = recipients.slice(0, limit)
  const out: BatchResult = {
    dryRun,
    pool: users?.length || 0,
    eligible: recipients.length,
    sent: 0,
    failed: 0,
    byVariant,
    nameSrc,
    skipCounts,
    recipients: [],
  }

  for (const r of toSend) {
    const { name: firstName } = resolveGreeting(r.full_name, r.email, names)
    const v = r.variant
    out.recipients.push({ email: r.email, variant: v.key, greeting: `Hi ${firstName}` })

    if (dryRun) { out.sent++; continue }
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing')

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: r.email,
          subject: v.subject,
          html: renderHtml(firstName, r.email, v),
          headers: {
            'List-Unsubscribe': `<${unsubUrl(r.email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })
      if (res.ok) {
        out.sent++
        const { error: trackErr } = await supabase.from('funnel_events').insert({
          user_id: r.id,
          event_name: 'score_request_sent',
          metadata: { variant: v.key, utm_campaign: v.utm_campaign, subject: v.subject },
          created_at: new Date().toISOString(),
        })
        if (trackErr) {
          // Sent but not recorded. A failing DB write usually keeps failing, so barreling on would
          // leave the rest of the batch re-sendable. Stop now: damage is bounded to this one user.
          throw new Error(`SENT but failed to record score_request_sent for ${r.email}: ${trackErr.message}. Aborting to prevent double-sends.`)
        }
      } else {
        out.failed++
        console.error(`[score-request] send failed for ${r.email}: ${await res.text()}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 500)) // ~2/sec
    } catch (err) {
      out.failed++
      console.error(`[score-request] error for ${r.email}:`, err)
      if (err instanceof Error && err.message.includes('Aborting')) throw err
    }
  }

  return out
}
