-- Day 3 stakes-driven nudge — sent ~24h after Day 2 to users who still haven't started an exam.
alter table public.users
  add column if not exists onboarding_day3_sent_at timestamptz;
