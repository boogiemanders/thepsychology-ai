-- WAIS-5 Stimulus images: private bucket, restricted to chanders0@yahoo.com.
-- Pearson copyright. Personal-use only. Do NOT make this bucket public.

insert into storage.buckets (id, name, public)
values ('wais5-stim', 'wais5-stim', false)
on conflict (id) do nothing;

-- Policy: only authenticated user with allowlisted email can read objects in this bucket.
drop policy if exists "wais5_stim_read_allowed" on storage.objects;
create policy "wais5_stim_read_allowed"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wais5-stim'
  and (auth.jwt() ->> 'email') = 'chanders0@yahoo.com'
);

-- No insert/update/delete policy — only service role can mutate.
