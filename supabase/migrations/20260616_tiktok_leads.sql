-- TikTok DM-first lead capture. ManyChat runs the DM keyword auto-reply on our
-- TikTok Business account (US comment-to-DM is still blocked, DM-first is not),
-- collects the viewer's email, then POSTs the lead to /api/manychat/lead, which
-- lands here. We email the clickable /go link separately (TikTok DM links are
-- plain text, not clickable). One row per ManyChat subscriber (upserted), so a
-- subscriber who DMs first and gives their email later updates the same row.

create table if not exists public.tiktok_leads (
  id bigint generated always as identity primary key,
  manychat_subscriber_id text unique,
  email text,
  tiktok_username text,
  keyword text,
  ref text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tiktok_leads enable row level security;
-- No policies: RLS on with zero policies denies anon/authenticated; the
-- service-role key used by /api/manychat/lead bypasses RLS. Capture table is
-- write-only from the server, never exposed to the browser.
create index if not exists tiktok_leads_email_idx on public.tiktok_leads (lower(email));
create index if not exists tiktok_leads_created_at_idx on public.tiktok_leads (created_at desc);
