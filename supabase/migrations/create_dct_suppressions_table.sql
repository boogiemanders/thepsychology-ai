-- Suppression list for cold-outreach campaigns (DCT and future blasts).
-- One row per email that asked not to be contacted. The sender checks this
-- table before every send, so an unsubscribe sticks across future campaigns.
create table if not exists public.dct_suppressions (
  email text primary key,
  reason text,
  source text default 'dct_outreach',
  created_at timestamptz not null default now()
);

-- Only the server (service-role key, which bypasses RLS) reads or writes this.
-- RLS on with no policies = no anon/public access.
alter table public.dct_suppressions enable row level security;
