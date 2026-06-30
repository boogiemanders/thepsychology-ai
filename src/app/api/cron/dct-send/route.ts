import { NextRequest, NextResponse } from 'next/server'
import { createHmac, createHash } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'

// Server-side DCT cold-outreach sender. Replaces the old local send_dct.py +
// launchd job (which depended on the laptop being awake and sent zero). A daily
// Vercel cron hits this route; it selects the next batch of unsent, non-suppressed
// contacts, sends each 1:1 via Resend, and stamps sent_at. Idempotent: a sent row
// is never re-selected. Suppression-aware: anyone in dct_suppressions is skipped.
//
// Two modes (?mode=):
//   cold     (default) — first touch to contacts with no sent_at.
//   followup           — a 2nd touch to already-sent NON-responders (no reply, not
//                        suppressed). Gated behind DCT_FOLLOWUP_ENABLED so it never
//                        fires until armed. Keys off followup_sent_at, leaving the
//                        cold sender's sent_at idempotency untouched.
//
// A/B test: when dct_campaigns has active=true variants, each contact is assigned a
// variant by a stable hash of their email (even split, deterministic). The variant
// supplies subject + body paragraphs + its own utm_campaign (so GA attributes clicks
// per variant); replies attribute per variant via dct_contacts.(followup_)campaign_id.
// With no active variants, cold mode falls back to the original v1 copy below.
//
// Vercel cron fires a GET, so this is a GET (not POST). Manual/canary calls:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://<deployment>/api/cron/dct-send?dryRun=true&limit=1&mode=followup"

export const runtime = 'nodejs'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY
const CANADA_SENDS_ENABLED = process.env.CANADA_SENDS_ENABLED === 'true'
const FOLLOWUP_ENABLED = process.env.DCT_FOLLOWUP_ENABLED === 'true'

// --- send config (cold v1 copy ported verbatim from send_dct.py) ---
const FROM = 'Dr. Anders Chan <DrChan@thepsychology.ai>'
// Reply-To routes through the Resend inbound address (DCT_REPLY_TO) so replies
// auto-log to dct_replies via /api/dct-reply and forward to the founder's inbox.
const REPLY_TO = process.env.DCT_REPLY_TO || 'DrChan@thepsychology.ai'
const CC = 'DrChan@thepsychology.ai'
const SUBJECT = 'An Affordable EPPP Option for Your Students'
const BASE_URL = 'https://thepsychology.ai'
const DIVIDER = '-'.repeat(60)

// Default (v1 / control) body paragraphs, used when no active variant applies.
const PARAS = [
  "I'm Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). I built an EPPP prep tool, thepsychology.ai, which helped me pass with a month of preparation, and four postdocs have since passed with it too, most after about two months.",
  "Two reasons it might help your students. It's affordable ($40/month vs. the usual $849 to $1,799), and the questions are written the way the EPPP actually words them, so practice scores mean something. And the exam itself costs about $692 every attempt, so every retake a student avoids is real money saved.",
  "I'd love to give you free access to look around, plus a free trial for any student who wants to try it. If it's useful, please forward it to your graduating cohort. And if it could help program-wide, I'm glad to talk.",
]
const FOOTER_LINE = 'thePsychology.ai, 760 Harrison Ave, #HC 603, Boston, MA 02118'

type Variant = {
  id: number
  subject: string
  body_paras: string[]
  utm_campaign: string
  variant: string | null
}

function salutationFor(greeting: string): string {
  const g = greeting.trim()
  if (g.toLowerCase().startsWith('dear')) return g + ','
  return 'Hi ' + g + ','
}

// Signs the SAME token /api/dct-unsubscribe verifies: HMAC-SHA256 of the
// lowercased email with UNSUBSCRIBE_SECRET, base64url. e = base64url(email).
function unsubUrl(email: string): string {
  const e = Buffer.from(email, 'utf8').toString('base64url')
  const t = createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase()).digest('base64url')
  return `${BASE_URL}/api/dct-unsubscribe?e=${e}&t=${t}`
}

function trackedUrl(utmCampaign: string): string {
  return `${BASE_URL}/?utm_source=dct-outreach&utm_medium=email&utm_campaign=${utmCampaign}`
}

// Even, deterministic variant split: same email always lands in the same bucket,
// so cold + follow-up attribute to one variant and a re-run never reshuffles.
function pickVariant(email: string, variants: Variant[]): Variant | null {
  if (!variants.length) return null
  const h = createHash('md5').update(email.toLowerCase()).digest()
  return variants[h.readUInt32BE(0) % variants.length]
}

type RenderedCopy = { subject: string; paras: string[]; utmCampaign: string }
function copyFor(variant: Variant | null): RenderedCopy {
  return {
    subject: variant?.subject || SUBJECT,
    paras: variant?.body_paras?.length ? variant.body_paras : PARAS,
    utmCampaign: variant?.utm_campaign || 'eppp-dct',
  }
}

function textBody(greeting: string, url: string, copy: RenderedCopy): string {
  return (
    salutationFor(greeting) +
    '\n\n' +
    copy.paras.join('\n\n') +
    '\n\n' +
    'You can take a look here: https://thepsychology.ai\n\n' +
    'Thanks for everything you do for our field.\n\n' +
    'Regards,\nAnders\n\n' +
    'Anders Chan, PsyD\nFounder, Licensed Psychologist - thePsychology.ai\n\n' +
    DIVIDER +
    '\n' +
    "You're receiving this as a Director of Clinical Training. Prefer not to hear from me? Unsubscribe here: " +
    url +
    '\n' +
    FOOTER_LINE
  )
}

function htmlBody(greeting: string, url: string, copy: RenderedCopy): string {
  const bodyParas = copy.paras.map((p) => `<p>${p}</p>`).join('')
  return (
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;' +
    'font-size:15px;line-height:1.55;color:#1a1a2e;max-width:560px">' +
    `<p>${salutationFor(greeting)}</p>` +
    bodyParas +
    `<p>You can take a look here: <a href="${trackedUrl(copy.utmCampaign)}">https://thepsychology.ai</a></p>` +
    '<p>Thanks for everything you do for our field.</p>' +
    '<p>Regards,<br>Anders</p>' +
    '<p>Anders Chan, PsyD<br>Founder, Licensed Psychologist - thePsychology.ai</p>' +
    '<hr style="border:none;border-top:1px solid #ddd;margin:22px 0">' +
    '<p style="font-size:12px;color:#888;line-height:1.5">' +
    "You're receiving this as a Director of Clinical Training. Prefer not to hear from me? " +
    `<a href="${url}" style="color:#888">Unsubscribe</a>.<br>` +
    FOOTER_LINE +
    '</p></div>'
  )
}

type Contact = { email: string; greeting: string | null }

async function sendOne(c: Contact, variant: Variant | null): Promise<{ ok: boolean; id?: string; error?: string }> {
  const url = unsubUrl(c.email)
  const copy = copyFor(variant)
  const payload = {
    from: FROM,
    to: [c.email],
    cc: [CC],
    reply_to: REPLY_TO,
    subject: copy.subject,
    text: textBody(c.greeting || '', url, copy),
    html: htmlBody(c.greeting || '', url, copy),
    headers: {
      'List-Unsubscribe': `<${url}>, <mailto:DrChan@thepsychology.ai?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Cloudflare in front of Resend blocks some default UAs (err 1010).
      'User-Agent': 'thepsychology-dct-sender/1.0',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status} ${await res.text()}` }
  }
  const data = await res.json()
  return { ok: true, id: data?.id }
}

export async function GET(request: NextRequest) {
  // Auth: require the bearer secret. Vercel sends Authorization: Bearer
  // $CRON_SECRET automatically on cron runs when CRON_SECRET is set, so this
  // covers the real cron and manual canary calls. We do NOT trust the
  // x-vercel-cron header: it is not stripped from inbound external requests,
  // so honoring it would let anyone trigger a real send.
  const authHeader = request.headers.get('authorization')
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  if (!hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const mode = (params.get('mode') || 'cold').trim().toLowerCase() === 'followup' ? 'followup' : 'cold'
  const country = (params.get('country') || 'USA').trim()
  const parsedLimit = Number.parseInt(params.get('limit') || '90', 10)
  const limit = Math.max(1, Math.min(100, Number.isFinite(parsedLimit) ? parsedLimit : 90))
  const dryRun = params.get('dryRun') === 'true'

  // Follow-up is a 2nd touch; keep it disarmed until explicitly enabled so a
  // merged cron can sit harmless until the founder flips DCT_FOLLOWUP_ENABLED.
  // A dry run sends nothing, so allow it through for previewing the variants.
  if (mode === 'followup' && !FOLLOWUP_ENABLED && !dryRun) {
    return NextResponse.json({ deferred: true, mode, reason: 'DCT_FOLLOWUP_ENABLED not set' }, { status: 200 })
  }

  // CASL gate: Canada stays OFF until explicitly enabled. US (CAN-SPAM) is fine
  // with the existing unsubscribe + sender identification.
  if (country.toLowerCase() === 'canada' && !CANADA_SENDS_ENABLED) {
    return NextResponse.json(
      { error: 'Canada sends are disabled (CASL gate). Set CANADA_SENDS_ENABLED=true after sign-off.' },
      { status: 403 }
    )
  }

  if (!UNSUBSCRIBE_SECRET || !RESEND_API_KEY) {
    return NextResponse.json({ error: 'Missing UNSUBSCRIBE_SECRET or RESEND_API_KEY' }, { status: 500 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Active A/B variants (stable order so the hash split is reproducible).
  const { data: variantRows } = await supabase
    .from('dct_campaigns')
    .select('id, subject, body_paras, utm_campaign, variant')
    .eq('active', true)
    .order('id', { ascending: true })
  const variants: Variant[] = (variantRows || []).map((v) => ({
    id: v.id as number,
    subject: String(v.subject || ''),
    body_paras: Array.isArray(v.body_paras) ? (v.body_paras as string[]) : [],
    utm_campaign: String(v.utm_campaign || 'eppp-dct'),
    variant: (v.variant as string) || null,
  }))

  // Follow-up needs variants to send (there is no v1 fallback for a 2nd touch).
  if (mode === 'followup' && !variants.length) {
    return NextResponse.json({ error: 'No active variants to send', mode }, { status: 200 })
  }

  // Suppression set (lowercased), so an unsubscribe sticks across campaigns.
  const { data: suppRows, error: suppErr } = await supabase.from('dct_suppressions').select('email')
  if (suppErr) {
    return NextResponse.json({ error: `Suppression fetch failed: ${suppErr.message}` }, { status: 500 })
  }
  const suppressed = new Set((suppRows || []).map((r) => (r.email || '').trim().toLowerCase()))

  // Anyone who already replied (any type) is excluded from a follow-up: don't nag
  // a responder. Cold mode ignores this (they haven't been emailed yet).
  const responded = new Set<string>()
  if (mode === 'followup') {
    const { data: replyRows } = await supabase.from('dct_replies').select('from_email, contact_email')
    for (const r of replyRows || []) {
      if (r.from_email) responded.add(String(r.from_email).trim().toLowerCase())
      if (r.contact_email) responded.add(String(r.contact_email).trim().toLowerCase())
    }
  }

  // Canada is QUEUED BEHIND the US list in COLD mode: both share one Resend daily
  // cap. Hold Canadian cold sends until every US contact is done.
  if (mode === 'cold' && country.toLowerCase() === 'canada') {
    const { count: usUnsent } = await supabase
      .from('dct_contacts')
      .select('email', { count: 'exact', head: true })
      .eq('country', 'USA')
      .is('sent_at', null)
    if ((usUnsent ?? 0) > 0) {
      return NextResponse.json({ deferred: true, reason: 'US list not finished', us_unsent: usUnsent }, { status: 200 })
    }
  }

  // Select the next batch. Pull extra so the suppressed/responded filter still
  // leaves a full batch.
  const overfetch = limit + suppressed.size + responded.size
  let query = supabase
    .from('dct_contacts')
    .select('email, greeting')
    .eq('country', country)
    .order('segment', { ascending: true, nullsFirst: false })
    .order('email', { ascending: true })
    .limit(overfetch)
  query = mode === 'followup' ? query.not('sent_at', 'is', null).is('followup_sent_at', null) : query.is('sent_at', null)

  const { data: candidates, error: candErr } = await query
  if (candErr) {
    return NextResponse.json({ error: `Contact fetch failed: ${candErr.message}` }, { status: 500 })
  }

  const eligible = (candidates || []).filter((c) => {
    const e = (c.email || '').trim().toLowerCase()
    return !suppressed.has(e) && !responded.has(e)
  })
  const skippedSuppressed = (candidates || []).length - eligible.length
  const toSend = eligible.slice(0, limit) as Contact[]

  // Dry run: render one full email for the assigned variant, send nothing.
  if (dryRun) {
    const sample = toSend[0]
    const sampleVariant = sample ? pickVariant(sample.email, variants) : null
    const sampleUrl = sample ? unsubUrl(sample.email) : null
    return NextResponse.json({
      dryRun: true,
      mode,
      country,
      limit,
      active_variants: variants.map((v) => v.variant || v.utm_campaign),
      would_attempt: toSend.length,
      skipped_suppressed: skippedSuppressed,
      sample:
        sample && sampleUrl
          ? {
              to: sample.email,
              variant: sampleVariant?.variant || 'v1-default',
              subject: copyFor(sampleVariant).subject,
              unsubscribe_url: sampleUrl,
              text: textBody(sample.greeting || '', sampleUrl, copyFor(sampleVariant)),
            }
          : null,
    })
  }

  // Send 1:1. One bad send never aborts the batch.
  let sent = 0
  let failed = 0
  const byVariant: Record<string, number> = {}
  for (const c of toSend) {
    const variant = pickVariant(c.email, variants)
    try {
      const result = await sendOne(c, variant)
      if (result.ok) {
        const stamp =
          mode === 'followup'
            ? { followup_sent_at: new Date().toISOString(), followup_resend_id: result.id || null, followup_campaign_id: variant?.id ?? null }
            : { sent_at: new Date().toISOString(), resend_id: result.id || null, campaign_id: variant?.id ?? null }
        const { error: stampErr } = await supabase.from('dct_contacts').update(stamp).eq('email', c.email)
        if (stampErr) {
          // Sent but couldn't stamp: log loud. Worst case it retries next run.
          console.error('[dct-send] sent but failed to stamp:', mode, c.email, stampErr.message)
        }
        sent++
        const key = variant?.variant || 'v1-default'
        byVariant[key] = (byVariant[key] || 0) + 1
      } else {
        failed++
        console.error('[dct-send] send failed:', c.email, result.error)
      }
    } catch (e) {
      failed++
      console.error('[dct-send] send threw:', c.email, e)
    }
    // Pace to respect Resend's rate limit (~2 req/s), matching send_dct.py.
    await new Promise((r) => setTimeout(r, 600))
  }

  // Audit row + Slack summary (both best-effort).
  const { error: runErr } = await supabase.from('dct_send_runs').insert({
    mode,
    country,
    attempted: toSend.length,
    sent,
    failed,
    skipped_suppressed: skippedSuppressed,
    dry_run: false,
  })
  if (runErr) console.error('[dct-send] failed to write audit row:', runErr.message)

  try {
    const hook = process.env.SLACK_WEBHOOK_SIGNUPS
    if (hook) {
      const split = Object.entries(byVariant).map(([k, n]) => `${k}:${n}`).join(' ')
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `DCT ${mode} (${country}): ${sent} sent, ${failed} failed, ${skippedSuppressed} skipped, ${toSend.length} attempted.${split ? ` [${split}]` : ''}`,
        }),
      })
    }
  } catch {
    // non-critical
  }

  return NextResponse.json({
    mode,
    country,
    limit,
    attempted: toSend.length,
    sent,
    failed,
    skipped_suppressed: skippedSuppressed,
    by_variant: byVariant,
  })
}
