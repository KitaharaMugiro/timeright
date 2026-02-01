-- Create icebreaker_game_categories table
CREATE TABLE IF NOT EXISTS icebreaker_game_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create icebreaker_games table
CREATE TABLE IF NOT EXISTS icebreaker_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES icebreaker_game_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 10,
  has_rounds BOOLEAN DEFAULT false,
  instructions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_icebreaker_games_category ON icebreaker_games(category_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_games_active ON icebreaker_games(is_active);
CREATE INDEX IF NOT EXISTS idx_icebreaker_game_categories_active ON icebreaker_game_categories(is_active);

-- Enable RLS
ALTER TABLE icebreaker_game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreaker_games ENABLE ROW LEVEL SECURITY;

-- RLS policies for icebreaker_game_categories
-- Everyone can read active categories
CREATE POLICY "Anyone can read active categories"
  ON icebreaker_game_categories FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage categories"
  ON icebreaker_game_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS policies for icebreaker_games
-- Everyone can read active games
CREATE POLICY "Anyone can read active games"
  ON icebreaker_games FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage games"
  ON icebreaker_games FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert initial categories
INSERT INTO icebreaker_game_categories (slug, name, description, emoji, sort_order) VALUES
  ('intro', '自己紹介', 'お互いを知るためのゲーム', '👋', 1),
  ('lively', 'ワイワイ', '盛り上がる系のゲーム', '🎉', 2),
  ('relaxed', 'まったり', 'ゆっくり楽しむゲーム', '☕', 3),
  ('inspire', 'インスパイア', '深く知り合うゲーム', '✨', 4);

-- Insert initial games with category assignments
INSERT INTO icebreaker_games (game_type, category_id, name, description, emoji, min_players, max_players, has_rounds, instructions, sort_order) VALUES
  -- 自己紹介カテゴリ
  ('peer_intro', (SELECT id FROM icebreaker_game_categories WHERE slug = 'intro'), '他己紹介', 'ペアでインタビューして紹介', '🎤', 4, 10, false, ARRAY['ペアを作ります', '数分間インタビューします', '全体に向けて相手を紹介'], 1),
  ('two_truths', (SELECT id FROM icebreaker_game_categories WHERE slug = 'intro'), '2つの真実と1つの嘘', '3つの発言のうち嘘を当てる', '🎭', 3, 8, true, ARRAY['発表者が3つの発言をします', '2つは本当、1つは嘘', '他の人は嘘を当てましょう'], 2),
  ('questions', (SELECT id FROM icebreaker_game_categories WHERE slug = 'intro'), '質問タイム', '質問を投げて全員が短く答える', '💬', 2, 10, true, ARRAY['質問が表示されます', '全員が順番に答えます', '理由を一言添えると盛り上がります'], 3),

  -- ワイワイカテゴリ
  ('word_wolf', (SELECT id FROM icebreaker_game_categories WHERE slug = 'lively'), 'ワードウルフ', '少数派のお題を持つ人を探す', '🐺', 4, 8, false, ARRAY['全員にお題が配られます', '1人だけ違うお題（ウルフ）', '会話でウルフを探しましょう'], 1),
  ('ng_word', (SELECT id FROM icebreaker_game_categories WHERE slug = 'lively'), 'NGワードゲーム', '自分のNGワードを言わずに会話', '🚫', 3, 8, false, ARRAY['全員にNGワードが配られます', '自分のNGワードは見えません', '会話中に言ってしまったらアウト！'], 2),

  -- まったりカテゴリ
  ('would_you_rather', (SELECT id FROM icebreaker_game_categories WHERE slug = 'relaxed'), 'どっちがいい？', 'AとBどっちを選ぶ？理由を一言', '🤔', 2, 10, true, ARRAY['2つの選択肢が表示されます', '全員がどちらかを選びます', '選んだ理由を話し合いましょう'], 1),
  ('common_things', (SELECT id FROM icebreaker_game_categories WHERE slug = 'relaxed'), '10の共通点', 'ペアで共通点を10個探す', '🤝', 2, 10, false, ARRAY['ペアを作ります', '細かい共通点を10個探します', '意外な共通点ほど盛り上がります'], 2),

  -- インスパイアカテゴリ
  ('whodunit', (SELECT id FROM icebreaker_game_categories WHERE slug = 'inspire'), '犯人探し', '誰の面白い経験か当てる', '🔍', 4, 10, true, ARRAY['全員が面白い経験を書きます', 'シャッフルして読み上げます', '誰の話か当てましょう'], 1),
  ('guess_favorite', (SELECT id FROM icebreaker_game_categories WHERE slug = 'inspire'), '好きなもの当て', '誰の好みか当てる', '❤️', 3, 10, true, ARRAY['カテゴリーが発表されます', '全員が好きなものを書きます', '誰のか当てましょう'], 2);
