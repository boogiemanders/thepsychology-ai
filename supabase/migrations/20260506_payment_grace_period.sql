-- Track 7-day grace period after a Stripe invoice.payment_failed.
-- Set when payment fails (only if currently null, so retries don't reset it).
-- Cleared on payment success or after the cron downgrades the user.
alter table public.users
  add column if not exists grace_period_ends_at timestamptz;

create index if not exists users_grace_period_ends_at_idx
  on public.users (grace_period_ends_at)
  where grace_period_ends_at is not null;
