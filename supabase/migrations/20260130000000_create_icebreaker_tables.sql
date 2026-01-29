-- Create icebreaker_sessions table
CREATE TABLE IF NOT EXISTS icebreaker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_round INTEGER NOT NULL DEFAULT 0,
  game_data JSONB NOT NULL DEFAULT '{}',
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create icebreaker_players table
CREATE TABLE IF NOT EXISTS icebreaker_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES icebreaker_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_data JSONB NOT NULL DEFAULT '{}',
  is_ready BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_icebreaker_sessions_match_id ON icebreaker_sessions(match_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_sessions_status ON icebreaker_sessions(status);
CREATE INDEX IF NOT EXISTS idx_icebreaker_players_session_id ON icebreaker_players(session_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_players_user_id ON icebreaker_players(user_id);

-- RLS Policies
ALTER TABLE icebreaker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreaker_players ENABLE ROW LEVEL SECURITY;

-- Sessions: Participants in the match can view and modify sessions
CREATE POLICY "Match participants can view sessions"
  ON icebreaker_sessions
  FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM matches WHERE table_members @> to_jsonb(auth.uid()::text)
    )
  );

CREATE POLICY "Match participants can create sessions"
  ON icebreaker_sessions
  FOR INSERT
  WITH CHECK (
    match_id IN (
      SELECT id FROM matches WHERE table_members @> to_jsonb(auth.uid()::text)
    )
  );

CREATE POLICY "Match participants can update sessions"
  ON icebreaker_sessions
  FOR UPDATE
  USING (
    match_id IN (
      SELECT id FROM matches WHERE table_members @> to_jsonb(auth.uid()::text)
    )
  );

-- Players: Session participants can view and modify player data
CREATE POLICY "Session participants can view players"
  ON icebreaker_players
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM icebreaker_sessions WHERE match_id IN (
        SELECT id FROM matches WHERE table_members @> to_jsonb(auth.uid()::text)
      )
    )
  );

CREATE POLICY "Users can join sessions"
  ON icebreaker_players
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM icebreaker_sessions WHERE match_id IN (
        SELECT id FROM matches WHERE table_members @> to_jsonb(auth.uid()::text)
      )
    )
  );

CREATE POLICY "Users can update own player data"
  ON icebreaker_players
  FOR UPDATE
  USING (user_id = auth.uid());

-- Enable realtime for both tables
ALTER publication supabase_realtime ADD TABLE icebreaker_sessions;
ALTER publication supabase_realtime ADD TABLE icebreaker_players;

-- Add comment for documentation
COMMENT ON TABLE icebreaker_sessions IS 'Icebreaker game sessions for matched dinner participants';
COMMENT ON TABLE icebreaker_players IS 'Players participating in icebreaker game sessions';
