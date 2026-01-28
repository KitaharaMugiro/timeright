-- KPI Views for Admin Dashboard
-- These views pre-aggregate data for efficient KPI queries

-- User metrics view
CREATE OR REPLACE VIEW kpi_user_metrics AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as new_users_today,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  COUNT(*) FILTER (WHERE personality_type IS NOT NULL) as onboarded_users,
  ROUND(
    COUNT(*) FILTER (WHERE personality_type IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
  ) as onboarding_completion_rate
FROM users;

-- Subscription metrics view
CREATE OR REPLACE VIEW kpi_subscription_metrics AS
SELECT
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subscribers,
  COUNT(*) FILTER (WHERE subscription_status = 'canceled') as canceled_subscribers,
  COUNT(*) FILTER (WHERE subscription_status = 'past_due') as past_due_subscribers,
  COUNT(*) FILTER (WHERE subscription_status = 'none' OR subscription_status IS NULL) as no_subscription,
  ROUND(
    COUNT(*) FILTER (WHERE subscription_status = 'active')::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
  ) as subscription_rate
FROM users;

-- Event metrics view
CREATE OR REPLACE VIEW kpi_event_metrics AS
SELECT
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'open') as open_events,
  COUNT(*) FILTER (WHERE status = 'matched') as matched_events,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_events
FROM events;

-- Participation metrics view
CREATE OR REPLACE VIEW kpi_participation_metrics AS
SELECT
  COUNT(*) as total_participations,
  COUNT(*) FILTER (WHERE entry_type = 'solo') as solo_entries,
  COUNT(*) FILTER (WHERE entry_type = 'pair') as pair_entries,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_entries,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'canceled')::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
  ) as cancellation_rate,
  COUNT(*) FILTER (WHERE mood = 'lively') as mood_lively,
  COUNT(*) FILTER (WHERE mood = 'relaxed') as mood_relaxed,
  COUNT(*) FILTER (WHERE mood = 'inspire') as mood_inspire,
  COUNT(*) FILTER (WHERE mood = 'other') as mood_other
FROM participations;

-- Review metrics view
CREATE OR REPLACE VIEW kpi_review_metrics AS
SELECT
  COUNT(*) as total_reviews,
  COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0) as average_rating,
  COUNT(*) FILTER (WHERE rating = 1) as rating_1,
  COUNT(*) FILTER (WHERE rating = 2) as rating_2,
  COUNT(*) FILTER (WHERE rating = 3) as rating_3,
  COUNT(*) FILTER (WHERE rating = 4) as rating_4,
  COUNT(*) FILTER (WHERE rating = 5) as rating_5,
  COUNT(*) FILTER (WHERE block_flag = true) as block_count,
  ROUND(
    COUNT(*) FILTER (WHERE block_flag = true)::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
  ) as block_rate
FROM reviews;

-- Referral metrics view
CREATE OR REPLACE VIEW kpi_referral_metrics AS
SELECT
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_referrals,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
  ) as completion_rate
FROM referrals;

-- Daily user signups for trend chart (last 30 days)
CREATE OR REPLACE VIEW kpi_daily_signups AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as signups
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Daily participations for trend chart (last 30 days)
CREATE OR REPLACE VIEW kpi_daily_participations AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as participations,
  COUNT(*) FILTER (WHERE status = 'canceled') as cancellations
FROM participations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
