/**
 * Inzi chatbot — GA4 conversion tracking helper.
 *
 * Single source of truth for all chatbot analytics. Every user action that
 * signals intent or conversion MUST go through `trackEvent` here.
 *
 * When Inzi is embedded on a host page that already has GA4 loaded
 * (e.g. Greg's WordPress site), events flow into the host's GA property
 * automatically. When no GA is present (local dev), events no-op silently.
 *
 * --- EVENT CATALOG ----------------------------------------------------------
 * Add new events to the InziEvent union below before calling trackEvent.
 * Keep names lowercase_snake_case, prefixed `inzi_`.
 *
 * inzi_chat_opened              — Launcher toggled open
 * inzi_first_message_sent       — First user message in a live session
 * inzi_intent_reached           — State changed to a meaningful intent
 *                                  params: { intent: 'crisis' | 'assessment' | 'booking' | 'handoff' }
 * inzi_scheduling_started       — Booking/scheduling form shown
 * inzi_scheduling_submitted     — Booking form POSTed successfully  ★ conversion
 * inzi_clinician_message_started — Contact-clinician form shown
 * inzi_clinician_message_submitted — Clinician message sent          ★ conversion
 * inzi_voice_call_started       — Voice call modal opened
 *
 * ★ = mark as Conversion in GA4 admin once live.
 * ---------------------------------------------------------------------------
 */

export type InziEvent =
  | 'inzi_chat_opened'
  | 'inzi_first_message_sent'
  | 'inzi_intent_reached'
  | 'inzi_scheduling_started'
  | 'inzi_scheduling_submitted'
  | 'inzi_clinician_message_started'
  | 'inzi_clinician_message_submitted'
  | 'inzi_voice_call_started'

type Params = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackEvent(name: InziEvent, params: Params = {}): void {
  if (typeof window === 'undefined') return
  const payload = {
    chatbot: 'inzi',
    page_path: window.location?.pathname,
    ...params,
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload)
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...payload })
    }
  } catch {
    // never let analytics break the UX
  }
}
