-- Inzi inbox: messages from chatbot routed to clinicians/admin.

create table if not exists inzi_messages (
  id uuid primary key default gen_random_uuid(),
  intent text not null check (intent in ('scheduling', 'billing', 'clinical', 'general')),
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'urgent')),
  assigned_clinician text,
  status text not null default 'new' check (status in ('new', 'read', 'responded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inzi_messages_status_idx on inzi_messages(status, created_at desc);
create index if not exists inzi_messages_intent_idx on inzi_messages(intent, created_at desc);
create index if not exists inzi_messages_clinician_idx on inzi_messages(assigned_clinician, created_at desc);

create or replace function inzi_messages_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists inzi_messages_updated_at on inzi_messages;
create trigger inzi_messages_updated_at
  before update on inzi_messages
  for each row execute function inzi_messages_touch_updated_at();
