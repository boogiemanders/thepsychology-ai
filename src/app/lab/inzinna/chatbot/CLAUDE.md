# Inzi Chatbot — Working Rules

## Analytics is mandatory

Inzi tracks GA4 conversions via `inzi-analytics.ts`. **Every new user-driven action that signals intent or conversion MUST fire a `trackEvent(...)` call.**

When you add a new flow (booking step, intake form, intent detection, anything a user clicks/submits), before considering it done:

1. Add the event name to the `InziEvent` union in `inzi-analytics.ts`
2. Document it in the event catalog comment at the top of that file
3. Call `trackEvent('inzi_xxx', { ... })` at the moment the action happens
4. If it represents a real conversion (form submitted, booking made, contact captured), mark it `★` in the catalog so it can be flagged as a Conversion in GA4 admin

If you can't decide whether something is trackable — it probably is. Track it.

## Host gtag pattern

Don't hardcode a GA Measurement ID. Inzi piggybacks on the host page's `gtag`/`dataLayer`. When embedded on Greg's WordPress site, events flow into Greg's GA4. Local dev = silent no-op (intentional).
