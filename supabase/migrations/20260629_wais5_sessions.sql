-- WAIS-5 saved sessions: clinician-scoped, labeled by client identifier.
-- One row per (clinician, client_label); upserts overwrite.

create table if not exists wais5_sessions (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references auth.users(id) on delete cascade,
  client_label text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinician_id, client_label)
);

create index if not exists wais5_sessions_clinician_idx
  on wais5_sessions (clinician_id, updated_at desc);

alter table wais5_sessions enable row level security;

create policy wais5_sessions_select_own on wais5_sessions
  for select using (auth.uid() = clinician_id);

create policy wais5_sessions_insert_own on wais5_sessions
  for insert with check (auth.uid() = clinician_id);

create policy wais5_sessions_update_own on wais5_sessions
  for update using (auth.uid() = clinician_id)
  with check (auth.uid() = clinician_id);

create policy wais5_sessions_delete_own on wais5_sessions
  for delete using (auth.uid() = clinician_id);
