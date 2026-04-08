-- License Watch: NYSED license notification signups
create table if not exists public.license_watch_signups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  license_type text not null default 'psychology',
  status text not null default 'watching',  -- watching | found | notified | unsubscribed
  license_number text,
  license_found_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint license_watch_signups_email_unique unique (email)
);

-- Index for cron lookups
create index if not exists idx_license_watch_status on public.license_watch_signups (status) where status = 'watching';

-- RLS
alter table public.license_watch_signups enable row level security;

-- Service role can do everything (for cron + API routes)
create policy "service_role_all" on public.license_watch_signups
  for all using (true) with check (true);

-- No public access (signups go through API route with service role)
