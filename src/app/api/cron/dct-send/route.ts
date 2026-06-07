import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'

// Server-side DCT cold-outreach sender. Replaces the old local send_dct.py +
// launchd job (which depended on the laptop being awake and sent zero). A daily
// Vercel cron hits this route; it selects the next batch of unsent, non-suppressed
// contacts, sends each 1:1 via Resend, and stamps sent_at. Idempotent: a sent row
// is never re-selected. Suppression-aware: anyone in dct_suppressions is skipped.
//
// Email copy, Resend call shape, unsubscribe token, and the RFC 8058 one-click
// headers are ported VERBATIM from send_dct.py (copy is final, do not edit).
//
// Vercel cron fires a GET, so this is a GET (not POST). Manual/canary calls:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://<deployment>/api/cron/dct-send?dryRun=true&limit=1"

export const runtime = 'nodejs'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY
const CANADA_SENDS_ENABLED = process.env.CANADA_SENDS_ENABLED === 'true'

// --- send config (ported verbatim from send_dct.py, do not change) ---
const FROM = 'Dr. Anders Chan <DrChan@thepsychology.ai>'
// Reply-To routes through the Resend inbound address once DCT_REPLY_TO is set
// (replies then auto-log to dct_replies via /api/dct-reply and forward to the
// founder's inbox). Falls back to the direct inbox until inbound DNS is live.
const REPLY_TO = process.env.DCT_REPLY_TO || 'DrChan@thepsychology.ai'
const CC = 'DrChan@thepsychology.ai'
const SUBJECT = 'An Affordable EPPP Option for Your Students'
const BASE_URL = 'https://thepsychology.ai'
// GA attribution for clicks from this campaign. Used as the href in the HTML
// link only; the visible link text and the plain-text body stay clean.
const TRACKED_URL = `${BASE_URL}/?utm_source=dct-outreach&utm_medium=email&utm_campaign=eppp-dct`
const DIVIDER = '-'.repeat(60)

const PARAS = [
  "I'm Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). I built an EPPP prep tool, thepsychology.ai, which helped me pass with a month of preparation, and four postdocs have since passed with it too, most after about two months.",
  "Two reasons it might help your students. It's affordable ($30/month vs. the usual $849 to $1,799), and the questions are written the way the EPPP actually words them, so practice scores mean something. And the exam itself costs about $692 every attempt, so every retake a student avoids is real money saved.",
  "I'd love to give you free access to look around, plus a free trial for any student who wants to try it. If it's useful, please forward it to your graduating cohort. And if it could help program-wide, I'm glad to talk.",
]
const FOOTER_LINE = 'thePsychology.ai, 760 Harrison Ave, #HC 603, Boston, MA 02118'

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

function textBody(greeting: string, url: string): string {
  const paras = PARAS.join('\n\n')
  return (
    salutationFor(greeting) +
    '\n\n' +
    paras +
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

function htmlBody(greeting: string, url: string): string {
  const bodyParas = PARAS.map((p) => `<p>${p}</p>`).join('')
  return (
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;' +
    'font-size:15px;line-height:1.55;color:#1a1a2e;max-width:560px">' +
    `<p>${salutationFor(greeting)}</p>` +
    bodyParas +
    `<p>You can take a look here: <a href="${TRACKED_URL}">https://thepsychology.ai</a></p>` +
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

async function sendOne(c: Contact): Promise<{ ok: boolean; id?: string; error?: string }> {
  const url = unsubUrl(c.email)
  const payload = {
    from: FROM,
    to: [c.email],
    cc: [CC],
    reply_to: REPLY_TO,
    subject: SUBJECT,
    text: textBody(c.greeting || '', url),
    html: htmlBody(c.greeting || '', url),
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
  const country = (params.get('country') || 'USA').trim()
  const parsedLimit = Number.parseInt(params.get('limit') || '90', 10)
  const limit = Math.max(1, Math.min(100, Number.isFinite(parsedLimit) ? parsedLimit : 90))
  const dryRun = params.get('dryRun') === 'true'

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

  // Canada is QUEUED BEHIND the US list: both share one Resend daily cap, so
  // hold all Canadian sends until every US contact is done. The Canada cron can
  // fire daily harmlessly in the meantime; it just no-ops until US is drained.
  if (country.toLowerCase() === 'canada') {
    const { count: usUnsent } = await supabase
      .from('dct_contacts')
      .select('email', { count: 'exact', head: true })
      .eq('country', 'USA')
      .is('sent_at', null)
    if ((usUnsent ?? 0) > 0) {
      return NextResponse.json(
        { deferred: true, reason: 'US list not finished', us_unsent: usUnsent },
        { status: 200 }
      )
    }
  }

  // 1. Suppression set (lowercased), so an unsubscribe sticks across campaigns.
  const { data: suppRows, error: suppErr } = await supabase.from('dct_suppressions').select('email')
  if (suppErr) {
    return NextResponse.json({ error: `Suppression fetch failed: ${suppErr.message}` }, { status: 500 })
  }
  const suppressed = new Set((suppRows || []).map((r) => (r.email || '').trim().toLowerCase()))

  // 2. Next unsent contacts for this country (stable order). Pull extra so the
  //    suppressed filter still leaves a full batch.
  const { data: candidates, error: candErr } = await supabase
    .from('dct_contacts')
    .select('email, greeting')
    .eq('country', country)
    .is('sent_at', null)
    .order('segment', { ascending: true, nullsFirst: false })
    .order('email', { ascending: true })
    .limit(limit + suppressed.size)
  if (candErr) {
    return NextResponse.json({ error: `Contact fetch failed: ${candErr.message}` }, { status: 500 })
  }

  const nonSuppressed = (candidates || []).filter(
    (c) => !suppressed.has((c.email || '').trim().toLowerCase())
  )
  const skippedSuppressed = (candidates || []).length - nonSuppressed.length
  const toSend = nonSuppressed.slice(0, limit) as Contact[]

  // Dry run: render one full email (copy + greeting + working unsubscribe URL),
  // send nothing, change nothing.
  if (dryRun) {
    const sample = toSend[0]
    const sampleUrl = sample ? unsubUrl(sample.email) : null
    return NextResponse.json({
      dryRun: true,
      country,
      limit,
      would_attempt: toSend.length,
      skipped_suppressed: skippedSuppressed,
      sample:
        sample && sampleUrl
          ? {
              to: sample.email,
              from: FROM,
              cc: CC,
              subject: SUBJECT,
              unsubscribe_url: sampleUrl,
              text: textBody(sample.greeting || '', sampleUrl),
            }
          : null,
    })
  }

  // 3. Send 1:1. One bad send never aborts the batch.
  let sent = 0
  let failed = 0
  for (const c of toSend) {
    try {
      const result = await sendOne(c)
      if (result.ok) {
        const { error: stampErr } = await supabase
          .from('dct_contacts')
          .update({ sent_at: new Date().toISOString(), resend_id: result.id || null })
          .eq('email', c.email)
        if (stampErr) {
          // Sent but couldn't stamp: log loud. Worst case it retries next run.
          console.error('[dct-send] sent but failed to stamp sent_at:', c.email, stampErr.message)
        }
        sent++
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

  // 4. Audit row + Slack summary (both best-effort).
  const { error: runErr } = await supabase.from('dct_send_runs').insert({
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
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `DCT send (${country}): ${sent} sent, ${failed} failed, ${skippedSuppressed} suppressed-skipped, ${toSend.length} attempted.`,
        }),
      })
    }
  } catch {
    // non-critical
  }

  return NextResponse.json({
    country,
    limit,
    attempted: toSend.length,
    sent,
    failed,
    skipped_suppressed: skippedSuppressed,
  })
}
