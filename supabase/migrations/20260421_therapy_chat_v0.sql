-- Session Zero: psychotherapy chatbot MVP schema
-- Isolated from recover_chat_* tables for clinical-safety boundary (do not merge).

create extension if not exists "pgcrypto";

-- ============================================================================
-- therapy_sessions
-- ============================================================================
create table if not exists public.therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  session_number integer not null default 1,
  modality text not null default 'cbt',
  agenda text,
  summary text,
  themes text[] not null default '{}',
  homework text,
  harm_risk_flag boolean not null default false,
  crisis_events jsonb not null default '[]'::jsonb,
  escalated_to_plan_match boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists therapy_sessions_user_id_idx
  on public.therapy_sessions (user_id);

create index if not exists therapy_sessions_started_at_idx
  on public.therapy_sessions (started_at desc);

create index if not exists therapy_sessions_user_active_idx
  on public.therapy_sessions (user_id, ended_at)
  where deleted_at is null;

-- ============================================================================
-- therapy_messages
-- ============================================================================
create table if not exists public.therapy_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.therapy_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  message_index integer not null,
  safety_classification jsonb,
  model_used text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now(),
  unique (session_id, message_index)
);

create index if not exists therapy_messages_session_id_idx
  on public.therapy_messages (session_id);

create index if not exists therapy_messages_user_id_idx
  on public.therapy_messages (user_id);

create index if not exists therapy_messages_created_at_idx
  on public.therapy_messages (created_at desc);

-- ============================================================================
-- therapy_consent
-- ============================================================================
create table if not exists public.therapy_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consented_to_ai_disclosure boolean not null default false,
  consented_to_crisis_escalation_protocol boolean not null default false,
  age_verified_adult boolean not null default false,
  allow_session_data_for_improvement boolean not null default false,
  allow_research_contribution boolean not null default false,
  consented_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.therapy_sessions enable row level security;
alter table public.therapy_messages enable row level security;
alter table public.therapy_consent enable row level security;

-- therapy_sessions policies
drop policy if exists "Users can read their own therapy sessions" on public.therapy_sessions;
create policy "Users can read their own therapy sessions"
  on public.therapy_sessions for select
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Users can update their own therapy sessions" on public.therapy_sessions;
create policy "Users can update their own therapy sessions"
  on public.therapy_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manages therapy sessions" on public.therapy_sessions;
create policy "Service role manages therapy sessions"
  on public.therapy_sessions for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- therapy_messages policies
drop policy if exists "Users can read their own therapy messages" on public.therapy_messages;
create policy "Users can read their own therapy messages"
  on public.therapy_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages therapy messages" on public.therapy_messages;
create policy "Service role manages therapy messages"
  on public.therapy_messages for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- therapy_consent policies
drop policy if exists "Users can read their own therapy consent" on public.therapy_consent;
create policy "Users can read their own therapy consent"
  on public.therapy_consent for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own therapy consent" on public.therapy_consent;
create policy "Users can upsert their own therapy consent"
  on public.therapy_consent for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own therapy consent" on public.therapy_consent;
create policy "Users can update their own therapy consent"
  on public.therapy_consent for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manages therapy consent" on public.therapy_consent;
create policy "Service role manages therapy consent"
  on public.therapy_consent for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.therapy_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists therapy_sessions_set_updated_at on public.therapy_sessions;
create trigger therapy_sessions_set_updated_at
  before update on public.therapy_sessions
  for each row
  execute function public.therapy_set_updated_at();

drop trigger if exists therapy_consent_set_updated_at on public.therapy_consent;
create trigger therapy_consent_set_updated_at
  before update on public.therapy_consent
  for each row
  execute function public.therapy_set_updated_at();
