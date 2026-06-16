import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'
import { classifyReply } from '@/lib/dct/reply-classifier'

// Resend inbound webhook for DCT outreach replies. The cold sender sets
// Reply-To to an inbound address (DCT_REPLY_TO) whose domain MX-routes to
// Resend; Resend fires email.received here. We verify the svix signature,
// fetch the full body, log the reply against contact + campaign, ping Slack,
// and forward a copy to the founder's inbox so nothing is lost.
//
// The webhook payload is metadata-only; full content requires
// GET /emails/receiving/{id}. If that fetch fails (e.g. a send-only API key),
// we still log the metadata so no reply disappears.

export const runtime = 'nodejs'
export const maxDuration = 60

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FORWARD_TO = 'DrChan@thepsychology.ai'
const FORWARD_FROM = 'Dr. Anders Chan <DrChan@thepsychology.ai>'

// Standard svix signature check (Resend webhooks are svix-delivered).
// signed content = "{svix-id}.{svix-timestamp}.{raw body}", HMAC-SHA256 with
// the base64-decoded secret (after the whsec_ prefix), base64 output.
function verifySignature(rawBody: string, headers: Headers): boolean {
  if (!WEBHOOK_SECRET) return false
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatures = headers.get('svix-signature')
  if (!id || !timestamp || !signatures) return false
  // Reject stale deliveries (replay protection, 5 min tolerance).
  const ts = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false
  const secret = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', secret).update(`${id}.${timestamp}.${rawBody}`).digest()
  // Header holds space-separated "v1,<base64sig>" entries.
  for (const part of signatures.split(' ')) {
    const sig = part.split(',')[1]
    if (!sig) continue
    const candidate = Buffer.from(sig, 'base64')
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true
  }
  return false
}

async function fetchFullEmail(inboundId: string): Promise<{ text: string | null; html: string | null } | null> {
  if (!RESEND_API_KEY) return null
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${inboundId}`, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'User-Agent': 'thepsychology-dct-sender/1.0',
      },
    })
    if (!res.ok) {
      console.error('[dct-reply] body fetch failed:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return { text: data?.text || null, html: data?.html || null }
  } catch (e) {
    console.error('[dct-reply] body fetch threw:', e)
    return null
  }
}

// Low-noise capture monitor: if Resend (svix headers present) delivers but the
// signature fails, the secret is wrong / rotated and reply capture is silently
// dead. Alert on THAT, not on random unsigned bot traffic hitting the endpoint.
async function alertSignatureFailure(): Promise<void> {
  try {
    const hook = process.env.SLACK_WEBHOOK_SIGNUPS
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'DCT reply webhook: signed delivery failed verification. Reply capture is likely down. Check RESEND_WEBHOOK_SECRET vs the Resend webhook signing secret.',
        }),
      })
    }
  } catch {
    // non-critical
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers)) {
    // svix-id present => a real (mis-signed) Resend delivery, worth surfacing.
    if (request.headers.get('svix-id')) await alertSignatureFailure()
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (event.type !== 'email.received') {
    return NextResponse.json({ ignored: event.type || 'unknown' })
  }

  const data = (event.data || {}) as Record<string, unknown>
  const inboundId = String(data.email_id || data.id || '')
  const fromRaw = String(data.from || '')
  const fromEmail = (fromRaw.match(/<([^>]+)>/)?.[1] || fromRaw).trim().toLowerCase()
  const toEmail = Array.isArray(data.to) ? String(data.to[0] || '') : String(data.to || '')
  const subject = String(data.subject || '')

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Link the reply to the contact (and through it, the campaign).
  const { data: contact } = await supabase
    .from('dct_contacts')
    .select('email, institution, campaign_id')
    .ilike('email', fromEmail)
    .maybeSingle()

  const full = inboundId ? await fetchFullEmail(inboundId) : null
  const bodyText = full?.text || null

  // Auto-classify: regex catches auto-replies/opt-outs, a mini model judges
  // positive/neutral/negative. Result is also persisted under raw._classification
  // so the later scorecard can use confidence/source without a schema change.
  const classification = await classifyReply(subject, bodyText)

  const { error: insertErr } = await supabase.from('dct_replies').insert({
    resend_inbound_id: inboundId || null,
    contact_email: contact?.email || null,
    campaign_id: contact?.campaign_id || null,
    from_email: fromEmail,
    to_email: toEmail || null,
    subject: subject || null,
    body_text: bodyText,
    reply_type: classification.reply_type,
    raw: { ...data, _classification: classification },
  })
  // Duplicate webhook deliveries hit the unique resend_inbound_id; treat as ok.
  if (insertErr && !insertErr.message.includes('duplicate')) {
    console.error('[dct-reply] insert failed:', insertErr.message)
  }

  // Slack ping (best-effort): replies are time-sensitive, surface them fast.
  try {
    const hook = process.env.SLACK_WEBHOOK_SIGNUPS
    if (hook) {
      const snippet = (bodyText || '').replace(/\s+/g, ' ').slice(0, 200)
      const tag = `[${classification.reply_type}${classification.confidence ? ` ${Math.round(classification.confidence * 100)}%` : ''}]`
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${tag} DCT reply from ${fromEmail}${contact?.institution ? ` (${contact.institution})` : ''}: ${subject}${snippet ? `\n> ${snippet}` : ''}`,
        }),
      })
    }
  } catch {
    // non-critical
  }

  // Forward a copy to the founder's inbox (best-effort). Reply-To is the
  // original sender so replying from the inbox goes straight back to them.
  try {
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'thepsychology-dct-sender/1.0',
        },
        body: JSON.stringify({
          from: FORWARD_FROM,
          to: [FORWARD_TO],
          reply_to: fromRaw || fromEmail,
          subject: `[DCT reply] ${subject}`,
          text: `From: ${fromRaw}\nTo: ${toEmail}\n\n${bodyText || '(body unavailable, see Resend dashboard)'}`,
        }),
      })
    }
  } catch (e) {
    console.error('[dct-reply] forward failed:', e)
  }

  return NextResponse.json({ ok: true })
}
