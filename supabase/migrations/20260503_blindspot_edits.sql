-- Blind Spot YC application collaborative editing.
-- Stores live-edited content for each EditableArea on /lab/blind-spot.

create table if not exists public.blindspot_editors (
  email text primary key
);

insert into public.blindspot_editors (email) values
  ('dranders@drinzinna.com')
on conflict do nothing;

create table if not exists public.blindspot_edits (
  field_id text primary key,
  content text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_by_email text
);

alter table public.blindspot_editors enable row level security;
alter table public.blindspot_edits enable row level security;

-- editors table: only authed allowlist members can read
drop policy if exists "blindspot_editors read self" on public.blindspot_editors;
create policy "blindspot_editors read self"
  on public.blindspot_editors for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- edits table: public read (the page itself is public)
drop policy if exists "blindspot_edits read public" on public.blindspot_edits;
create policy "blindspot_edits read public"
  on public.blindspot_edits for select
  to anon, authenticated
  using (true);

-- edits table: write requires being on the allowlist
drop policy if exists "blindspot_edits insert allowlist" on public.blindspot_edits;
create policy "blindspot_edits insert allowlist"
  on public.blindspot_edits for insert
  to authenticated
  with check (
    exists (
      select 1 from public.blindspot_editors e
      where lower(e.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "blindspot_edits update allowlist" on public.blindspot_edits;
create policy "blindspot_edits update allowlist"
  on public.blindspot_edits for update
  to authenticated
  using (
    exists (
      select 1 from public.blindspot_editors e
      where lower(e.email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.blindspot_editors e
      where lower(e.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "blindspot_edits delete allowlist" on public.blindspot_edits;
create policy "blindspot_edits delete allowlist"
  on public.blindspot_edits for delete
  to authenticated
  using (
    exists (
      select 1 from public.blindspot_editors e
      where lower(e.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- bump updated_at on update
create or replace function public.touch_blindspot_edits()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_blindspot_edits on public.blindspot_edits;
create trigger touch_blindspot_edits
  before update on public.blindspot_edits
  for each row execute function public.touch_blindspot_edits();

-- enable realtime (idempotent: ignore error if already added)
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.blindspot_edits';
  exception when duplicate_object then
    null;
  end;
end $$;
