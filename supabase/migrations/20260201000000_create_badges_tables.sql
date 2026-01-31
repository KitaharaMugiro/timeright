-- Badge master table
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_emoji text,
  icon_type text, -- 'emoji' or 'lucide'
  lucide_icon text, -- Lucide icon name (e.g., 'Shield')
  color text NOT NULL, -- color theme: 'yellow', 'emerald', etc.
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User badges junction table
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_reason text,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Badges are readable by everyone
CREATE POLICY "Badges are readable by everyone"
  ON badges FOR SELECT
  USING (true);

-- Users can read their own badges
CREATE POLICY "Users can read their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all user badges
CREATE POLICY "Admins can manage user badges"
  ON user_badges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Insert initial badges
INSERT INTO badges (slug, name, description, icon_emoji, icon_type, color, sort_order)
VALUES
  ('founding_member', 'Gold Badge', '初期メンバー', '🥇', 'emoji', 'yellow', 1),
  ('identity_verified', '本人確認済み', '身分証明書で本人確認完了', NULL, 'lucide', 'emerald', 2);

-- Create indexes
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
