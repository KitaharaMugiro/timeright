-- Create user_activity_logs table for tracking all user and admin actions
CREATE TABLE user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_activity_logs_user_created ON user_activity_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access (all reads/writes happen server-side)
CREATE POLICY "Service role full access on activity logs"
  ON user_activity_logs FOR ALL
  USING (auth.role() = 'service_role');
