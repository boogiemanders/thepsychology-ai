-- Viral Content Analyzer tables for tracking social media content performance
-- Platforms: TikTok, Twitter/X, Instagram

-- Main table for storing analyzed content
CREATE TABLE IF NOT EXISTS viral_content_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'twitter', 'instagram')),
  content_url TEXT,
  content_id TEXT,

  -- Content metadata
  title TEXT,
  description TEXT,
  transcript TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  posted_at TIMESTAMPTZ,

  -- Engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4),

  -- AI Analysis scores (1-10 scale)
  hook_score INTEGER CHECK (hook_score >= 1 AND hook_score <= 10),
  visual_score INTEGER CHECK (visual_score >= 1 AND visual_score <= 10),
  pacing_score INTEGER CHECK (pacing_score >= 1 AND pacing_score <= 10),
  tone_score INTEGER CHECK (tone_score >= 1 AND tone_score <= 10),
  cadence_score INTEGER CHECK (cadence_score >= 1 AND cadence_score <= 10),
  overall_viral_score INTEGER CHECK (overall_viral_score >= 1 AND overall_viral_score <= 100),

  -- AI Analysis details (JSON)
  hook_analysis JSONB,
  visual_analysis JSONB,
  pacing_analysis JSONB,
  tone_analysis JSONB,
  cadence_analysis JSONB,

  -- Recommendations
  improvement_suggestions JSONB,
  viral_elements JSONB,
  missing_elements JSONB,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for tracking niche search trends
CREATE TABLE IF NOT EXISTS niche_search_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,

  -- Search data
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  trend_direction TEXT CHECK (trend_direction IN ('rising', 'stable', 'declining')),
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),

  -- Platform-specific popularity
  tiktok_popularity INTEGER,
  twitter_popularity INTEGER,
  instagram_popularity INTEGER,
  youtube_popularity INTEGER,
  google_popularity INTEGER,

  -- Related keywords
  related_keywords JSONB,

  -- Content suggestions based on this keyword
  content_ideas JSONB,

  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for site improvement recommendations
CREATE TABLE IF NOT EXISTS site_viral_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Analysis results
  current_site_score INTEGER CHECK (current_site_score >= 1 AND current_site_score <= 100),

  -- Specific recommendations
  hook_recommendations JSONB,
  visual_recommendations JSONB,
  copy_recommendations JSONB,
  cta_recommendations JSONB,

  -- Based on top performing content
  top_patterns JSONB,
  suggested_changes JSONB,

  -- Implementation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'implemented', 'dismissed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_viral_content_user ON viral_content_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_content_platform ON viral_content_analyses(platform);
CREATE INDEX IF NOT EXISTS idx_viral_content_score ON viral_content_analyses(overall_viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_content_created ON viral_content_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_content_status ON viral_content_analyses(status);

CREATE INDEX IF NOT EXISTS idx_niche_trends_user ON niche_search_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_niche_trends_keyword ON niche_search_trends(keyword);
CREATE INDEX IF NOT EXISTS idx_niche_trends_niche ON niche_search_trends(niche);

CREATE INDEX IF NOT EXISTS idx_site_recommendations_user ON site_viral_recommendations(user_id);

-- Enable RLS
ALTER TABLE viral_content_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_search_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_viral_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for viral_content_analyses
CREATE POLICY "Users can view own analyses" ON viral_content_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON viral_content_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON viral_content_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access viral" ON viral_content_analyses
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for niche_search_trends
CREATE POLICY "Users can view own trends" ON niche_search_trends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trends" ON niche_search_trends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access trends" ON niche_search_trends
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for site_viral_recommendations
CREATE POLICY "Users can view own site recommendations" ON site_viral_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own site recommendations" ON site_viral_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own site recommendations" ON site_viral_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access site recs" ON site_viral_recommendations
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_viral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER viral_content_updated_at
  BEFORE UPDATE ON viral_content_analyses
  FOR EACH ROW EXECUTE FUNCTION update_viral_updated_at();

CREATE TRIGGER site_recommendations_updated_at
  BEFORE UPDATE ON site_viral_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_viral_updated_at();
