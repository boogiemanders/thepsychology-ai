/**
 * GA4 Measurement Protocol
 *
 * Server-side event sender for conversions that complete off the browser
 * (e.g. Stripe `checkout.session.completed`), where the client `gtag` can't
 * reach. Posts directly to the GA4 collect endpoint.
 *
 * Requires two env vars:
 *   - NEXT_PUBLIC_GA_MEASUREMENT_ID (already set — the G-XXXX id)
 *   - GA4_API_SECRET (new — create in GA4 Admin > Data Streams > your stream >
 *     Measurement Protocol API secrets)
 *
 * The browser `gtag` writes a `_ga` cookie that holds the real GA client_id, but
 * a Stripe webhook never sees that cookie. When we can't recover it we fall back
 * to a deterministic client_id derived from the userId so the same user always
 * maps to the same GA client (keeps purchase de-duped and joined to the session).
 */

import crypto from 'crypto'

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const API_SECRET = process.env.GA4_API_SECRET
const COLLECT_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

export function isGa4MeasurementProtocolConfigured(): boolean {
  return Boolean(MEASUREMENT_ID && API_SECRET)
}

/**
 * Build a stable GA-style client_id ("<int>.<int>") from a userId. Used when the
 * real `_ga` cookie value isn't available server-side.
 */
export function deterministicClientId(seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex')
  const a = parseInt(hash.slice(0, 8), 16)
  const b = parseInt(hash.slice(8, 16), 16)
  return `${a}.${b}`
}

type Ga4Event = {
  name: string
  params?: Record<string, unknown>
}

type SendArgs = {
  clientId: string
  userId?: string
  events: Ga4Event[]
}

/**
 * Fire one or more GA4 events via the Measurement Protocol. Fail-safe: returns
 * false (never throws) so a tracking miss can't break the Stripe webhook.
 */
export async function sendGa4Event({ clientId, userId, events }: SendArgs): Promise<boolean> {
  if (!isGa4MeasurementProtocolConfigured()) {
    console.warn('[ga4-mp] Skipped: NEXT_PUBLIC_GA_MEASUREMENT_ID or GA4_API_SECRET not set')
    return false
  }

  const url = `${COLLECT_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        ...(userId ? { user_id: userId } : {}),
        events,
      }),
    })

    // GA4 collect returns 204 No Content on success.
    if (!response.ok) {
      console.error(`[ga4-mp] Non-ok response: ${response.status}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[ga4-mp] Error sending event:', error)
    return false
  }
}
