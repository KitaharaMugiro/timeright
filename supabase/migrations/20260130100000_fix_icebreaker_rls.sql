-- Fix icebreaker RLS policies
-- Since this app uses LINE login with cookie sessions (not Supabase Auth),
-- auth.uid() is always NULL for browser clients.
--
-- Strategy:
-- - Allow SELECT for all (needed for Realtime subscriptions)
-- - Block INSERT/UPDATE/DELETE via RLS (force API route usage with Service Role)

-- Drop existing policies for icebreaker_sessions
DROP POLICY IF EXISTS "Match participants can view sessions" ON icebreaker_sessions;
DROP POLICY IF EXISTS "Match participants can create sessions" ON icebreaker_sessions;
DROP POLICY IF EXISTS "Match participants can update sessions" ON icebreaker_sessions;

-- Drop existing policies for icebreaker_players
DROP POLICY IF EXISTS "Session participants can view players" ON icebreaker_players;
DROP POLICY IF EXISTS "Users can join sessions" ON icebreaker_players;
DROP POLICY IF EXISTS "Users can update own player data" ON icebreaker_players;

-- Create new policies: SELECT only (for Realtime subscriptions)
-- Access control is handled at the application level (API routes check cookie auth)

CREATE POLICY "Allow read access for realtime"
  ON icebreaker_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow read access for realtime"
  ON icebreaker_players
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies = blocked for anon clients
-- Service Role (used by API routes) bypasses RLS entirely
