# TikTok DM funnel (ManyChat): setup + copy

DM-first lead capture for TikTok. A viewer DMs a keyword, ManyChat auto-replies,
asks for their email, then sends the free practice questions by email (TikTok DM
links are plain text and not clickable, so the email is the real delivery). The
lead is also stored in our own `tiktok_leads` table via `/api/manychat/lead`.

Verified (2026-06-16): US TikTok cannot do comment-to-DM (only Vietnam, Thailand,
Indonesia). DM-first is the only option in the US. ManyChat needs a TikTok
**Business** account (a free, reversible in-app switch, no EIN or tax ID). US is
supported (ManyChat launched US TikTok automation Nov 2025).

## One-time setup (founder)

1. **Switch TikTok to Business** (free, about a minute, reversible): Profile,
   Settings and privacy, Manage account, Switch to Business Account, pick a
   category. The only tradeoff is losing the trending Sound Library, which our
   talking-head videos do not use.
2. **Connect TikTok in ManyChat**: ManyChat, New Channel, TikTok, authorize.
3. **Apply the migration** `supabase/migrations/20260616_tiktok_leads.sql` (it
   creates the `tiktok_leads` table) the same way other migrations ship.
4. **Set the secret in Vercel** (Production): `MANYCHAT_WEBHOOK_SECRET` = a long
   random string. Optional: `MANYCHAT_LEAD_LINK` to override the default link
   `https://www.thepsychology.ai/go/eppp-dm?s=tiktok`.

## ManyChat flow

**Trigger**: keyword `PASS` (case-insensitive). Add aliases if you want: `EPPP`,
`QUESTIONS`. The video/caption tells viewers to DM the word.

**Message 1 (auto-reply):**
> Hey, glad you reached out. I'll send you free EPPP practice questions, written
> the way the real exam words them. What is the best email to send them to?

**Capture**: ManyChat's email question step (stores to the system Email field).

**External Request** (ManyChat action, fires after email is captured):
- Method: `POST`
- URL: `https://www.thepsychology.ai/api/manychat/lead`
- Header: `x-manychat-secret: <the MANYCHAT_WEBHOOK_SECRET value>`
- Body (JSON):
  ```json
  {
    "email": "{{email}}",
    "manychat_subscriber_id": "{{subscriber_id}}",
    "tiktok_username": "{{tiktok_username}}",
    "keyword": "PASS",
    "ref": "tiktok-dm-v1"
  }
  ```
- Response mapping: map the response field `link` into a ManyChat custom field
  (e.g. `go_link`). The route returns `{ "ok": true, "link": "..." }`.

**Email step (ManyChat email node)**. This is the delivery, because DM links are
not clickable. Send to the captured email:
> Subject: Your free EPPP practice questions
>
> Thanks for the DM. Here are your free EPPP practice questions: {{go_link}}
>
> These are written the way the EPPP actually words things, so your practice
> scores mean something. Have a look and tell me what you think.
>
> Dr. Anders Chan, thepsychology.ai

**Message 2 (DM, optional fallback):**
> Sent. Check your inbox for your free EPPP practice questions. If you do not see
> it, the link is in the email.

## After it is live

Once ManyChat is connected, the spoken TikTok CTA can move from "like, follow,
check the psychology dot ai" to a DM-first ask (e.g. "DM me the word PASS and I
will send you free practice questions"). That is a separate change to
`content/marketing/routines/tiktok-eppp.md`, not automatic. Until then the held
"Comment PASS" videos still have no auto-DM behind them.

## Notes

- The route stores one row per ManyChat subscriber (upsert), so a DM-first then
  email-later subscriber updates the same row. Leads land in `tiktok_leads`.
- Slack pings (`SLACK_WEBHOOK_SIGNUPS`) are PII-free by policy: no name or email,
  just that a lead came in and the keyword.
- The `/go/eppp-dm?s=tiktok` link tags GA with `utm_source=tiktok`,
  `utm_campaign=eppp-dm` so DM-funnel traffic is attributable.
