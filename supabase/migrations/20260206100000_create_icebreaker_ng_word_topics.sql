CREATE TABLE icebreaker_ng_word_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE icebreaker_ng_word_topics ENABLE ROW LEVEL SECURITY;

-- Seed with existing hardcoded topics
INSERT INTO icebreaker_ng_word_topics (topic) VALUES
  ('最近ハマっていること'),
  ('週末の過ごし方'),
  ('好きな食べ物・料理'),
  ('行ってみたい場所'),
  ('子供の頃の思い出'),
  ('最近見た映画やドラマ'),
  ('趣味について'),
  ('仕事で大変だったこと'),
  ('理想のデートプラン'),
  ('最近買ってよかったもの');
