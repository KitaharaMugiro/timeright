-- Fix Security Definer Views: Change to Security Invoker
-- This ensures views respect RLS policies of the querying user

-- Change all KPI views to use SECURITY INVOKER
ALTER VIEW kpi_user_metrics SET (security_invoker = true);
ALTER VIEW kpi_subscription_metrics SET (security_invoker = true);
ALTER VIEW kpi_event_metrics SET (security_invoker = true);
ALTER VIEW kpi_participation_metrics SET (security_invoker = true);
ALTER VIEW kpi_review_metrics SET (security_invoker = true);
ALTER VIEW kpi_referral_metrics SET (security_invoker = true);
ALTER VIEW kpi_daily_signups SET (security_invoker = true);
ALTER VIEW kpi_daily_participations SET (security_invoker = true);

-- Enable RLS on auth_sessions table (defense-in-depth)
-- Note: This table is accessed via service role which bypasses RLS,
-- but enabling RLS protects against accidental exposure via PostgREST
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON auth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions (for logout)
CREATE POLICY "Users can delete own sessions"
  ON auth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: INSERT is only done via service role, no user policy needed
