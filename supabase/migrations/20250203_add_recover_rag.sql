create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table if not exists recover_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  apa_citation text,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recover_documents
  add column if not exists apa_citation text;

create unique index if not exists recover_documents_storage_path_key
  on recover_documents (storage_path);

create table if not exists recover_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references recover_documents (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists recover_chunks_document_id_idx
  on recover_chunks (document_id);

create index if not exists recover_chunks_embedding_idx
  on recover_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table recover_documents enable row level security;
alter table recover_chunks enable row level security;

drop policy if exists "Service role can manage recover documents" on recover_documents;
create policy "Service role can manage recover documents"
  on recover_documents for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role can manage recover chunks" on recover_chunks;
create policy "Service role can manage recover chunks"
  on recover_chunks for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

drop function if exists match_recover_chunks(vector(1536), integer, float);

create function match_recover_chunks(
  query_embedding vector(1536),
  match_count integer default 6,
  min_similarity float default 0.2
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  document_apa_citation text,
  storage_path text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    recover_chunks.id,
    recover_chunks.document_id,
    recover_documents.title as document_title,
    recover_documents.apa_citation as document_apa_citation,
    recover_documents.storage_path,
    recover_chunks.content,
    1 - (recover_chunks.embedding <=> query_embedding) as similarity
  from recover_chunks
  join recover_documents on recover_documents.id = recover_chunks.document_id
  where 1 - (recover_chunks.embedding <=> query_embedding) >= min_similarity
  order by recover_chunks.embedding <=> query_embedding
  limit match_count;
$$;

insert into storage.buckets (id, name, public)
values ('recover-pdfs', 'recover-pdfs', false)
on conflict (id) do nothing;
