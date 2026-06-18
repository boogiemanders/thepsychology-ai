# TikTok DM funnel (ManyChat): setup + copy

DM-first link delivery for TikTok. A viewer DMs `PASS`, ManyChat DMs back the
practice-questions link, then a follow-up DM offers a clickable version by email.
The two-message flow is pure ManyChat config (no backend). Storing the lead is an
optional add-on (PR #111 route + table).

Verified (2026-06-16): US TikTok cannot do comment-to-DM (only Vietnam, Thailand,
Indonesia). DM-first is the only US option. ManyChat needs a TikTok **Business**
account (free, reversible in-app switch, no EIN). Business verified 2026-06-17.

**TikTok DM links are not clickable** (plain text, copy-paste). That is why
message 2 offers email: a link in an email IS clickable. The `/go` link is kept
short to make copy-paste easy.

## One-time setup (founder)

1. **Switch TikTok to Business** (done 2026-06-17).
2. **Connect TikTok in ManyChat**: ManyChat, New Channel, TikTok, authorize.

That is all the two-message flow needs. The optional lead-capture step also needs
the migration applied + `MANYCHAT_WEBHOOK_SECRET` set in Vercel (see bottom).

## ManyChat flow

**Trigger**: keyword `PASS` (case-insensitive; aliases `EPPP`, `QUESTIONS` if you
want). The caption/video tells viewers to **DM** the word (not comment, US comment
triggers do not exist).

**Message 1 (DM, the link):**
> Here are your free EPPP practice questions, written the way the real exam words
> them: https://www.thepsychology.ai/go/practice-questions?s=tiktok

**Message 2 (DM, the heads-up + email offer):**
> Heads up: TikTok will not make that link tappable, so copy-paste it into your
> browser. Want a tappable version instead? Reply with your email and I will send
> it over.

**If they reply with an email** (ManyChat email question step), send a ManyChat
**email node** (the link is clickable in email):
> Subject: Your free EPPP practice questions
>
> Here is your tappable link: https://www.thepsychology.ai/go/practice-questions?s=tiktok
>
> These are written the way the EPPP actually words things, so your practice
> scores mean something. Tell me what you think. Dr. Anders Chan, thepsychology.ai

The link 307-redirects to the practice-questions page and tags GA
(`utm_source=tiktok`, `utm_campaign=practice-questions`), so DM traffic is
attributable. (The `/go` route already lives on main; it maps `practice-questions`
to `/resources/practice-questions` today.)

## Optional: store the lead

To save who DM'd plus their email (and get a PII-free Slack ping), add an
**External Request** to the flow after the email step. Needs PR #111's route +
table deployed, the migration `supabase/migrations/20260616_tiktok_leads.sql`
applied, and `MANYCHAT_WEBHOOK_SECRET` set in Vercel (Production):
- `POST https://www.thepsychology.ai/api/manychat/lead`
- Header `x-manychat-secret: <MANYCHAT_WEBHOOK_SECRET>`
- Body: `{ "email": "{{email}}", "manychat_subscriber_id": "{{subscriber_id}}", "tiktok_username": "{{tiktok_username}}", "keyword": "PASS", "ref": "tiktok-dm-v1" }`
- Returns `{ "ok": true, "link": "..." }` and stores one row per subscriber in
  `tiktok_leads` (upsert). Optional env `MANYCHAT_LEAD_LINK` overrides the link.

## After it is live

Update the spoken/caption CTA from "Comment PASS" to "DM me the word PASS and I
will send you free practice questions" in
`content/marketing/routines/tiktok-eppp.md` (separate change). Until the CTA says
DM, the held "Comment PASS" videos trigger nothing.
