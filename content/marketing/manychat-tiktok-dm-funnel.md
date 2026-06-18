# TikTok DM funnel (ManyChat): setup + copy

DM-first link delivery for TikTok. A viewer DMs the keyword `PASS`, ManyChat
auto-replies in the DM with the practice-questions link. No email step. This
version is pure ManyChat config, no backend or migration required.

Verified (2026-06-16): US TikTok cannot do comment-to-DM (only Vietnam, Thailand,
Indonesia). DM-first is the only option in the US. ManyChat needs a TikTok
**Business** account (a free, reversible in-app switch, no EIN or tax ID). US is
supported (ManyChat launched US TikTok automation Nov 2025).

**The link is not clickable in a TikTok DM.** TikTok shows DM links as plain
text, so the viewer copy-pastes it. There is no clickable-link or button option
in TikTok DMs. The link is kept short (`/go/practice-questions?s=tiktok`) to make
that easy. This is also why the optional email path below exists.

## One-time setup (founder)

1. **Switch TikTok to Business** (free, ~1 min, reversible): Profile, Settings and
   privacy, Manage account, Switch to Business Account, pick a category. (Done
   2026-06-17.)
2. **Connect TikTok in ManyChat**: ManyChat, New Channel, TikTok, authorize.

That is all this version needs. The migration and `MANYCHAT_WEBHOOK_SECRET` are
only for the optional lead-capture path below.

## ManyChat flow (DM the link)

**Trigger**: keyword `PASS` (case-insensitive). Add aliases if you want: `EPPP`,
`QUESTIONS`. The video/caption tells viewers to **DM** the word (not comment, US
comment triggers do not exist).

**Auto-reply (single DM):**
> Here are your free EPPP practice questions, written the way the real exam words
> them: https://www.thepsychology.ai/go/practice-questions?s=tiktok
>
> (Tap and hold to copy if it is not tappable.) Have a look and tell me what you
> think. Dr. Anders Chan, thepsychology.ai

That is the whole funnel. The link 307-redirects to the EPPP practice-questions
page and tags GA with `utm_source=tiktok`, `utm_campaign=practice-questions`, so
DM traffic is attributable.

## Optional: capture the lead too

If you later want to save who DM'd (and collect emails for follow-up), add these
to the same flow. This needs the backend from PR #111 (route + table) deployed,
the migration `supabase/migrations/20260616_tiktok_leads.sql` applied, and
`MANYCHAT_WEBHOOK_SECRET` set in Vercel (Production).

- **Email question step** (ManyChat), then an **External Request**:
  - Method `POST`, URL `https://www.thepsychology.ai/api/manychat/lead`
  - Header `x-manychat-secret: <MANYCHAT_WEBHOOK_SECRET>`
  - Body: `{ "email": "{{email}}", "manychat_subscriber_id": "{{subscriber_id}}", "tiktok_username": "{{tiktok_username}}", "keyword": "PASS", "ref": "tiktok-dm-v1" }`
  - The route stores one row per subscriber in `tiktok_leads` (upsert), fires a
    PII-free Slack ping (`SLACK_WEBHOOK_SIGNUPS`), and returns
    `{ "ok": true, "link": "..." }` so you can email the link as well.
  - Optional env `MANYCHAT_LEAD_LINK` overrides the returned link.

## After it is live

Update the spoken/caption CTA from "Comment PASS" to a DM-first ask, e.g. "DM me
the word PASS and I will send you free practice questions." That is a separate
change to `content/marketing/routines/tiktok-eppp.md`, not automatic. Until the
CTA says DM, the held "Comment PASS" videos trigger nothing.
