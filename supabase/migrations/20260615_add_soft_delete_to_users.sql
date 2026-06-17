-- Soft-delete support for account deletion. DELETE /api/account/delete sets
-- users.deleted_at (mark the row, then hard-delete the auth user). The column
-- never existed, so that UPDATE was 500ing and the whole delete flow failed.
-- Idempotent so it is safe to re-run. Column-only: no query filters users by
-- deleted_at yet, so an index would be dead weight (the PK already covers the
-- id lookups the delete route does). Add a targeted index later if a read ever
-- filters active users.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.users.deleted_at IS
  'Soft-delete timestamp set by /api/account/delete; null = active account.';
