-- create-profile route writes signup_device + signup_user_agent on every signup,
-- but the columns never existed, so that upsert was failing silently.
alter table public.users
  add column if not exists signup_device text,
  add column if not exists signup_user_agent text;
