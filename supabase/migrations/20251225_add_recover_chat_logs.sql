create extension if not exists "pgcrypto";

-- Ensure newer user profile columns exist before creating admin views.
-- (Some projects may not have applied older migrations like add_exam_date_column.sql yet.)
alter table public.users add column if not exists exam_date date;

create table if not exists public.recover_chat_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  message_count integer not null default 0,
  has_harm_alert boolean not null default false,
  has_stress_alert boolean not null default false,
  last_alert_reason text,
  last_alert_at timestamptz
);

create index if not exists recover_chat_sessions_user_id_idx
  on public.recover_chat_sessions (user_id);

create index if not exists recover_chat_sessions_last_message_at_idx
  on public.recover_chat_sessions (last_message_at desc nulls last);

create table if not exists public.recover_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.recover_chat_sessions (id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_index integer not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  alert_reason text,
  created_at timestamptz not null default now(),
  unique (session_id, message_index)
);

create index if not exists recover_chat_messages_session_id_idx
  on public.recover_chat_messages (session_id);

create index if not exists recover_chat_messages_user_id_idx
  on public.recover_chat_messages (user_id);

create index if not exists recover_chat_messages_created_at_idx
  on public.recover_chat_messages (created_at desc);

alter table public.recover_chat_sessions enable row level security;
alter table public.recover_chat_messages enable row level security;

drop policy if exists "Users can read their own recover chat sessions" on public.recover_chat_sessions;
create policy "Users can read their own recover chat sessions"
  on public.recover_chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own recover chat messages" on public.recover_chat_messages;
create policy "Users can read their own recover chat messages"
  on public.recover_chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage recover chat sessions" on public.recover_chat_sessions;
create policy "Service role can manage recover chat sessions"
  on public.recover_chat_sessions for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role can manage recover chat messages" on public.recover_chat_messages;
create policy "Service role can manage recover chat messages"
  on public.recover_chat_messages for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create or replace function public.recover_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recover_chat_sessions_set_updated_at on public.recover_chat_sessions;
create trigger recover_chat_sessions_set_updated_at
  before update on public.recover_chat_sessions
  for each row
  execute function public.recover_set_updated_at();

create or replace view public.admin_recover_chat_sessions as
select
  s.*,
  u.email,
  u.full_name,
  u.subscription_tier,
  u.exam_date,
  u.created_at as user_created_at
from public.recover_chat_sessions s
left join public.users u
  on u.id = s.user_id;

revoke all on public.admin_recover_chat_sessions from public;
grant select on public.admin_recover_chat_sessions to service_role;

create or replace view public.admin_recover_chat_messages as
select
  m.*,
  u.email,
  u.full_name
from public.recover_chat_messages m
left join public.users u
  on u.id = m.user_id;

revoke all on public.admin_recover_chat_messages from public;
grant select on public.admin_recover_chat_messages to service_role;
