-- Add performance indexes for common query patterns

-- Index for events: commonly filtered by event_date and status
CREATE INDEX IF NOT EXISTS idx_events_event_date_status ON events(event_date, status);

-- Index for participations: commonly filtered by event_id and status
CREATE INDEX IF NOT EXISTS idx_participations_event_id_status ON participations(event_id, status);

-- Index for reviews: commonly filtered by target_user_id and is_no_show
CREATE INDEX IF NOT EXISTS idx_reviews_target_user_id_is_no_show ON reviews(target_user_id, is_no_show);
