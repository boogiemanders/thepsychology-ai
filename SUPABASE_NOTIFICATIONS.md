# Supabase email notifications

This repo now exposes a webhook endpoint that turns Supabase insert events into admin emails:

- Endpoint: `POST /api/webhooks/supabase`
- Events handled: `INSERT` on `public.users` (new profile signup) and `feedback`
- Delivery: Resend HTTP API (no extra npm package needed)

## Environment variables to add (Vercel → Settings → Environment Variables)

| Name | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `NOTIFY_EMAIL_FROM` | Verified sender in Resend, e.g. `Dr. Chan <notify@thepsychology.ai>` |
| `NOTIFY_EMAIL_TO` | Your inbox for notifications, e.g. `anders@thepsychology.ai` |
| `SUPABASE_WEBHOOK_SECRET` | Shared secret checked on every webhook call |

## Wire up Supabase database webhooks (one per table)

1. Supabase Dashboard → Database → Webhooks → Create webhook.
2. Name: e.g. `notify-new-users`.
3. Events: `INSERT`.
4. Table: `public.users` (or `auth.users` if you prefer to hook auth directly).
5. URL: `https://<your-vercel-domain>/api/webhooks/supabase`.
6. Header: `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`.
7. Save.
8. Repeat for the `feedback` table (name it `notify-feedback`).

## What the emails contain

- `public.users` (signups): email, full name, tier, referral source, promo code, Stripe customer id, exam date, timestamps, and user id.
- `feedback`: message, page path, anonymous flag, user id/email (when present), status, screenshot path, and timestamp.

## Testing

- In the Supabase Webhooks UI, use “Send test webhook” with an `INSERT` payload, or POST from your terminal:

```
curl -X POST https://<your-vercel-domain>/api/webhooks/supabase \
  -H "Authorization: Bearer $SUPABASE_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"feedback","schema":"public","record":{"message":"Test","page_path":"/trial-expired","is_anonymous":true}}'
```

- You should receive an email at `NOTIFY_EMAIL_TO`. Check Vercel logs if nothing arrives (missing env vars or Resend errors are logged).

## Notes

- Using `public.users` (profile creation) avoids double-emitting events if `auth.users` is noisy; you can swap to `auth.users` if you want earlier notifications—the handler supports either.
- Keep the secret long and random; rotate it in both Vercel and the Supabase webhook headers if it’s ever exposed.
