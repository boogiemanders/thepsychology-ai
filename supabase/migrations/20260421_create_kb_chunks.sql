-- =============================================================================
-- kb_chunks — knowledge base for DIPS internal chatbot
-- One row per H2/H3 section of DIPS-Clinic-Manual.md and DIPS-Employee-Handbook
-- Embeddings: OpenAI text-embedding-3-small (1536 dims)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,                 -- 'clinic-manual' | 'employee-handbook'
  title TEXT NOT NULL,
  category TEXT NOT NULL,            -- faq | booking | billing | crisis | compliance | hr | benefits | how-to
  audience TEXT NOT NULL,            -- clinician | admin | supervisor | all-staff | new-staff
  content TEXT NOT NULL,
  links TEXT[] NOT NULL DEFAULT '{}',
  related TEXT[] NOT NULL DEFAULT '{}',
  embedding VECTOR(1536),
  tsv TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx
  ON public.kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS kb_chunks_tsv_idx
  ON public.kb_chunks USING GIN (tsv);

CREATE INDEX IF NOT EXISTS kb_chunks_category_idx ON public.kb_chunks (category);
CREATE INDEX IF NOT EXISTS kb_chunks_doc_idx ON public.kb_chunks (doc);

-- Hybrid search function: vector similarity + BM25-style text rank.
-- Returns top N chunks blended by (weight_vec * cosine_sim + weight_text * ts_rank).
CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  query_embedding VECTOR(1536),
  query_text TEXT,
  match_count INT DEFAULT 6,
  weight_vec FLOAT DEFAULT 0.7,
  weight_text FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id TEXT,
  doc TEXT,
  title TEXT,
  category TEXT,
  audience TEXT,
  content TEXT,
  links TEXT[],
  score FLOAT
)
LANGUAGE SQL STABLE AS $$
  WITH q AS (
    SELECT plainto_tsquery('english', query_text) AS tsq
  )
  SELECT
    c.id,
    c.doc,
    c.title,
    c.category,
    c.audience,
    c.content,
    c.links,
    (weight_vec * (1 - (c.embedding <=> query_embedding)))
      + (weight_text * COALESCE(ts_rank(c.tsv, q.tsq), 0)) AS score
  FROM public.kb_chunks c, q
  WHERE c.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT match_count;
$$;

-- Row-level security: enable but allow service-role full access only.
-- (Client never reads kb_chunks directly; the /api/chatbot route uses service role.)
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kb_chunks service role" ON public.kb_chunks;
CREATE POLICY "kb_chunks service role"
  ON public.kb_chunks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
