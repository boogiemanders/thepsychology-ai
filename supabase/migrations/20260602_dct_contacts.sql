-- DCT cold-outreach contacts + send audit trail.
-- Server-side replacement for the local send_dct.py + launchd job (which depended
-- on the laptop being awake and sent zero). The daily Vercel cron
-- (/api/cron/dct-send) selects unsent, non-suppressed rows and stamps sent_at.
-- Idempotency lives here: "send where sent_at is null and email not in dct_suppressions".

create table if not exists public.dct_contacts (
  email text primary key,
  last_name text,
  greeting text,
  raw_name text,
  institution text,
  country text not null default 'USA',
  segment int,
  sent_at timestamptz,
  resend_id text,
  created_at timestamptz not null default now()
);

-- Hot path: "next unsent contacts for a country, stable order".
create index if not exists dct_contacts_unsent_idx
  on public.dct_contacts (country, segment, email)
  where sent_at is null;

-- One row per cron run, so we can prove the send ran and see counts over time.
create table if not exists public.dct_send_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  country text not null,
  attempted int not null default 0,
  sent int not null default 0,
  failed int not null default 0,
  skipped_suppressed int not null default 0,
  dry_run boolean not null default false
);

-- Only the server (service-role key, which bypasses RLS) touches these.
-- RLS on with no policies = no anon/public access.
alter table public.dct_contacts enable row level security;
alter table public.dct_send_runs enable row level security;
