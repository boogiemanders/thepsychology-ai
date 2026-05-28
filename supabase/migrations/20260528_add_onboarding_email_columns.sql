-- Track which onboarding nudge emails have been sent so the daily cron doesn't double-send.
alter table public.users
  add column if not exists onboarding_day1_sent_at timestamptz,
  add column if not exists onboarding_day2_sent_at timestamptz;
