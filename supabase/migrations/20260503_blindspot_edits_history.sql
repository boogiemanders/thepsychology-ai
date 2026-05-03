-- History log for /lab/blind-spot collaborative editing.
-- Captures the OLD value on every update/delete so we can audit/undo.

create table if not exists public.blindspot_edits_history (
  id bigserial primary key,
  field_id text not null,
  content text not null,
  changed_at timestamptz not null default now(),
  change_kind text not null check (change_kind in ('update', 'delete')),
  previous_updated_by uuid,
  previous_updated_by_email text,
  previous_updated_at timestamptz
);

create index if not exists blindspot_edits_history_field_idx
  on public.blindspot_edits_history (field_id, changed_at desc);

alter table public.blindspot_edits_history enable row level security;

-- only allowlisted editors can read history
drop policy if exists "blindspot_edits_history read allowlist" on public.blindspot_edits_history;
create policy "blindspot_edits_history read allowlist"
  on public.blindspot_edits_history for select
  to authenticated
  using (
    exists (
      select 1 from public.blindspot_editors e
      where lower(e.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- no direct client writes; trigger inserts only
-- (no insert/update/delete policies = denied for everyone except service role / triggers)

-- log function: writes the OLD row to history before it's overwritten
create or replace function public.log_blindspot_edits_change()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'UPDATE' then
    -- only log if content actually changed
    if old.content is distinct from new.content then
      insert into public.blindspot_edits_history (
        field_id, content, change_kind,
        previous_updated_by, previous_updated_by_email, previous_updated_at
      )
      values (
        old.field_id, old.content, 'update',
        old.updated_by, old.updated_by_email, old.updated_at
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.blindspot_edits_history (
      field_id, content, change_kind,
      previous_updated_by, previous_updated_by_email, previous_updated_at
    )
    values (
      old.field_id, old.content, 'delete',
      old.updated_by, old.updated_by_email, old.updated_at
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists log_blindspot_edits_change on public.blindspot_edits;
create trigger log_blindspot_edits_change
  before update or delete on public.blindspot_edits
  for each row execute function public.log_blindspot_edits_change();
