-- Tripwire log: every Stripe webhook event we receive lands here.
-- Use to audit "did the event actually fire?" without digging through Stripe dashboard.
create table if not exists public.stripe_webhook_log (
  id bigserial primary key,
  event_id text not null,
  event_type text not null,
  customer_id text,
  received_at timestamptz not null default now()
);

create unique index if not exists stripe_webhook_log_event_id_uidx
  on public.stripe_webhook_log (event_id);

create index if not exists stripe_webhook_log_received_at_idx
  on public.stripe_webhook_log (received_at desc);

create index if not exists stripe_webhook_log_event_type_idx
  on public.stripe_webhook_log (event_type, received_at desc);
