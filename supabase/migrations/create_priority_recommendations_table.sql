-- Create priority_recommendations table for storing prioritizer analysis results
CREATE TABLE IF NOT EXISTS priority_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  exam_mode TEXT NOT NULL CHECK (exam_mode IN ('study', 'test')),
  -- Store the full recommendation as JSONB for flexibility
  -- Structure: {
  --   topPriorities: [{ domainNumber, domainName, domainWeight, percentageWrong, priorityScore, wrongKNs, recommendedTopicIds }, ...],
  --   allResults: [{ ... }, ...] (all 8 domains for reference)
  -- }
  recommendation_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_priority_recommendations_user_id ON priority_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_priority_recommendations_user_exam_type ON priority_recommendations(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_priority_recommendations_created_at ON priority_recommendations(created_at DESC);

-- Enable RLS for security
ALTER TABLE priority_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only read their own priority recommendations
CREATE POLICY "Users can read their own priority recommendations"
  ON priority_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recommendations
CREATE POLICY "Users can insert priority recommendations"
  ON priority_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a view to get the latest recommendation for each exam type
CREATE OR REPLACE VIEW latest_priority_recommendations AS
SELECT DISTINCT ON (user_id, exam_type)
  id,
  user_id,
  exam_type,
  exam_mode,
  recommendation_data,
  created_at
FROM priority_recommendations
ORDER BY user_id, exam_type, created_at DESC;
