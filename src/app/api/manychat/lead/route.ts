import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'

// ManyChat TikTok DM funnel lead capture. ManyChat runs a DM keyword auto-reply
// on our TikTok Business account, asks the viewer for their email, then fires an
// "External Request" action here with the email + subscriber metadata. We store
// the lead (one row per subscriber, upserted) and return the clickable /go link
// so ManyChat can email it (TikTok DM links are not clickable, so the email is
// the real delivery). Auth is a shared secret in the x-manychat-secret header,
// which ManyChat's External Request lets you set.

export const runtime = 'nodejs'
export const maxDuration = 30

const SECRET = process.env.MANYCHAT_WEBHOOK_SECRET || ''
// The link we hand back for ManyChat to email. /go/practice-questions?s=tiktok
// 307-redirects to the EPPP practice-questions page with GA UTMs
// (utm_campaign=practice-questions, utm_source=tiktok).
const LEAD_LINK =
  process.env.MANYCHAT_LEAD_LINK || 'https://www.thepsychology.ai/go/practice-questions?s=tiktok'

function secretOk(req: NextRequest): boolean {
  if (!SECRET) return false
  const got = req.headers.get('x-manychat-secret') || ''
  const a = Buffer.from(got)
  const b = Buffer.from(SECRET)
  // timingSafeEqual throws on length mismatch; HMAC both sides to a fixed length
  // first so a wrong-length guess does not leak via an early return.
  const ha = createHmac('sha256', 'k').update(a).digest()
  const hb = createHmac('sha256', 'k').update(b).digest()
  return timingSafeEqual(ha, hb)
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function POST(request: NextRequest) {
  if (!secretOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ManyChat field names vary by flow setup, so accept the common aliases.
  const subscriberId =
    str(body.manychat_subscriber_id) || str(body.subscriber_id) || str(body.id)
  const emailRaw = str(body.email)
  const email = emailRaw ? emailRaw.toLowerCase() : null
  const tiktokUsername =
    str(body.tiktok_username) || str(body.username) || str(body.handle)
  const keyword = str(body.keyword) || str(body.trigger)
  const ref = str(body.ref) || str(body.flow)

  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (!subscriberId && !email) {
    return NextResponse.json(
      { error: 'Need at least subscriber id or email' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const row = {
    manychat_subscriber_id: subscriberId,
    email,
    tiktok_username: tiktokUsername,
    keyword,
    ref,
    raw: body,
    updated_at: new Date().toISOString(),
  }

  // One row per subscriber when we have an id (so DM-first then email-later
  // updates the same row); otherwise just insert what we have.
  const { error } = subscriberId
    ? await supabase
        .from('tiktok_leads')
        .upsert(row, { onConflict: 'manychat_subscriber_id' })
    : await supabase.from('tiktok_leads').insert(row)

  if (error) {
    console.error('[manychat-lead] insert failed:', error.message)
    return NextResponse.json({ error: 'Store failed' }, { status: 500 })
  }

  // PII-free Slack ping (founder policy: Slack carries no name/email).
  try {
    const hook = process.env.SLACK_WEBHOOK_SIGNUPS
    if (hook) {
      const tag = email ? 'email captured' : 'DM started'
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `New TikTok DM lead via ManyChat (${tag}${keyword ? `, keyword: ${keyword}` : ''}).`,
        }),
      })
    }
  } catch {
    // non-critical
  }

  // ManyChat reads JSON response fields back into the flow (map `link` into the
  // email/DM step).
  return NextResponse.json({ ok: true, link: LEAD_LINK })
}
