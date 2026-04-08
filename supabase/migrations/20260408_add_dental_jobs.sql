-- Dental Figure Extractor: per-user extraction job history
create table if not exists public.dental_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  status text not null default 'pending',  -- pending | done | error
  figure_count integer,
  result_key text,          -- R2 object key for the generated .pptx
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_dental_jobs_user
  on public.dental_jobs (user_id, created_at desc);

alter table public.dental_jobs enable row level security;

-- Users can read their own job history
create policy "users_read_own_dental_jobs" on public.dental_jobs
  for select using (auth.uid() = user_id);

-- Service role does everything (API route uses service key)
create policy "service_role_all_dental_jobs" on public.dental_jobs
  for all using (true) with check (true);
