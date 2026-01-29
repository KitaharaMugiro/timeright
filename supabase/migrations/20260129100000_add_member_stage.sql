-- 会員ステージ機能の追加

-- 会員ステージ enum
CREATE TYPE member_stage AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- users テーブルに会員ステージ関連カラムを追加
ALTER TABLE users ADD COLUMN stage_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN member_stage member_stage DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN stage_updated_at TIMESTAMPTZ DEFAULT NOW();

-- events テーブルに参加資格ステージを追加
ALTER TABLE events ADD COLUMN required_stage member_stage DEFAULT 'bronze';

-- ポイント履歴テーブル（内部管理用、ユーザーには非公開）
CREATE TABLE stage_point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステージ変動履歴テーブル
CREATE TABLE member_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_stage member_stage,
  new_stage member_stage,
  points_at_change INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_stage_point_logs_user_id ON stage_point_logs(user_id);
CREATE INDEX idx_stage_point_logs_created_at ON stage_point_logs(created_at);
CREATE INDEX idx_member_stage_history_user_id ON member_stage_history(user_id);

-- ポイントからステージを計算する関数
CREATE OR REPLACE FUNCTION get_stage_from_points(p_points INTEGER)
RETURNS member_stage AS $$
BEGIN
  IF p_points >= 600 THEN RETURN 'platinum';
  ELSIF p_points >= 300 THEN RETURN 'gold';
  ELSIF p_points >= 100 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ポイント追加関数
CREATE OR REPLACE FUNCTION add_stage_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_old_stage member_stage;
  v_new_stage member_stage;
  v_new_points INTEGER;
BEGIN
  -- 現在のステージ取得
  SELECT member_stage INTO v_old_stage FROM users WHERE id = p_user_id;

  -- ポイント更新（0未満にはならない）
  UPDATE users
  SET stage_points = GREATEST(0, stage_points + p_points),
      stage_updated_at = NOW()
  WHERE id = p_user_id
  RETURNING stage_points INTO v_new_points;

  -- 新ステージ計算
  v_new_stage := get_stage_from_points(v_new_points);

  -- ステージ変更があれば更新
  IF v_old_stage IS DISTINCT FROM v_new_stage THEN
    UPDATE users SET member_stage = v_new_stage WHERE id = p_user_id;
    INSERT INTO member_stage_history (user_id, old_stage, new_stage, points_at_change)
    VALUES (p_user_id, v_old_stage, v_new_stage, v_new_points);
  END IF;

  -- ログ記録
  INSERT INTO stage_point_logs (user_id, points, reason, reference_id)
  VALUES (p_user_id, p_points, p_reason, p_reference_id);
END;
$$ LANGUAGE plpgsql;

-- RLS ポリシー
ALTER TABLE stage_point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_stage_history ENABLE ROW LEVEL SECURITY;

-- stage_point_logs: 管理者のみ閲覧可能（ユーザーには非公開）
CREATE POLICY "Admins can view all stage point logs" ON stage_point_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role can insert stage point logs" ON stage_point_logs
  FOR INSERT WITH CHECK (TRUE);

-- member_stage_history: 自分の履歴は見れる、管理者は全部見れる
CREATE POLICY "Users can view own stage history" ON member_stage_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role can insert stage history" ON member_stage_history
  FOR INSERT WITH CHECK (TRUE);
