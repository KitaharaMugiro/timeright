-- Add mood functionality to participations table

-- Create enum type for participation mood
CREATE TYPE participation_mood AS ENUM ('lively', 'relaxed', 'inspire', 'other');

-- Add mood columns to participations table
ALTER TABLE participations
  ADD COLUMN mood participation_mood NOT NULL DEFAULT 'lively',
  ADD COLUMN mood_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN participations.mood IS 'The mood/atmosphere preference for the event';
COMMENT ON COLUMN participations.mood_text IS 'Custom mood text when mood is "other"';
