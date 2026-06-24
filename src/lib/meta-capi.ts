/**
 * Meta Conversions API (CAPI)
 *
 * Server-side event sender for conversions that complete off the browser.
 * Mirrors the ga4-measurement-protocol.ts pattern.
 *
 * Requires two env vars:
 *   NEXT_PUBLIC_META_PIXEL_ID  — the pixel ID (1301811485070326)
 *   META_CAPI_ACCESS_TOKEN     — from Meta Events Manager > Settings > Conversions API
 *
 * Meta requires PII fields (email) to be SHA-256 hashed. All hashing
 * happens here so callers pass raw values.
 */

import crypto from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const CAPI_ENDPOINT = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events`

export function isMetaCapiConfigured(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN)
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

type MetaCapiEvent = {
  event_name: string
  event_time: number
  event_id?: string
  event_source_url?: string
  user_data?: {
    em?: string   // hashed email
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string  // fb click id cookie
    fbp?: string  // fb browser id cookie
  }
  custom_data?: Record<string, unknown>
}

type SendArgs = {
  events: Array<{
    name: string
    eventId?: string
    email?: string | null
    sourceUrl?: string
    customData?: Record<string, unknown>
  }>
}

/**
 * Fire one or more CAPI events. Fail-safe: returns false (never throws)
 * so a tracking miss can't break a webhook or critical path.
 */
export async function sendMetaCapiEvent({ events }: SendArgs): Promise<boolean> {
  if (!isMetaCapiConfigured()) {
    console.warn('[meta-capi] Skipped: NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set')
    return false
  }

  const now = Math.floor(Date.now() / 1000)

  const payload: MetaCapiEvent[] = events.map((e) => ({
    event_name: e.name,
    event_time: now,
    ...(e.eventId ? { event_id: e.eventId } : {}),
    ...(e.sourceUrl ? { event_source_url: e.sourceUrl } : {}),
    user_data: {
      ...(e.email ? { em: sha256(e.email) } : {}),
    },
    ...(e.customData ? { custom_data: e.customData } : {}),
  }))

  try {
    const response = await fetch(`${CAPI_ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: payload,
        // test_event_code: 'TEST12345',  // uncomment to verify in Meta Events Manager test tool
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[meta-capi] Non-ok response: ${response.status}`, body)
      return false
    }
    return true
  } catch (error) {
    console.error('[meta-capi] Error sending event:', error)
    return false
  }
}
