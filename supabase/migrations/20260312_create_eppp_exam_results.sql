CREATE TABLE IF NOT EXISTS public.eppp_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  scaled_score INTEGER,              -- 200-800 range, optional
  exam_date DATE,                    -- approximate is fine
  attempt_number INTEGER DEFAULT 1,  -- 1st, 2nd, 3rd attempt
  weak_domains TEXT[] DEFAULT '{}',  -- domain IDs from EPPP_DOMAINS
  testimonial_interest BOOLEAN DEFAULT FALSE,
  testimonial_text TEXT,
  testimonial_display_name TEXT,
  testimonial_contacted BOOLEAN DEFAULT FALSE,
  testimonial_approved BOOLEAN DEFAULT FALSE,
  score_report_path TEXT,           -- Supabase Storage path to photo of score report bars
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eppp_exam_results_user_id ON public.eppp_exam_results(user_id);
CREATE INDEX idx_eppp_exam_results_passed ON public.eppp_exam_results(passed);

ALTER TABLE public.eppp_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own results"
  ON public.eppp_exam_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own results"
  ON public.eppp_exam_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
  ON public.eppp_exam_results FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for score report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('score-reports', 'score-reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own score reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'score-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own score reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'score-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
