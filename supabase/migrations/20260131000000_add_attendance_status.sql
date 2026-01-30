-- Add attendance status columns to participations table
-- attendance_status: 'attending' | 'canceled' | 'late'

CREATE TYPE attendance_status AS ENUM ('attending', 'canceled', 'late');

ALTER TABLE participations
  ADD COLUMN attendance_status attendance_status DEFAULT 'attending' NOT NULL,
  ADD COLUMN attendance_updated_at TIMESTAMPTZ,
  ADD COLUMN late_minutes INTEGER,
  ADD COLUMN cancel_reason TEXT;

-- Add no-show flag to reviews table
ALTER TABLE reviews
  ADD COLUMN is_no_show BOOLEAN DEFAULT FALSE NOT NULL;

-- Allow rating 0 for no-show reports (update existing constraint)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 0 AND rating <= 5);

-- Add index for efficient queries
CREATE INDEX idx_participations_attendance_status ON participations(attendance_status);
CREATE INDEX idx_participations_event_attendance ON participations(event_id, attendance_status);
