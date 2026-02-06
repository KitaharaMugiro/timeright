-- Icebreaker scores table: track points per user per match (persists across game sessions)
CREATE TABLE IF NOT EXISTS icebreaker_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_icebreaker_scores_match_id ON icebreaker_scores(match_id);

-- RLS: SELECT only (same pattern as other icebreaker tables)
ALTER TABLE icebreaker_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for realtime"
  ON icebreaker_scores
  FOR SELECT
  USING (true);

-- Enable realtime
ALTER publication supabase_realtime ADD TABLE icebreaker_scores;
