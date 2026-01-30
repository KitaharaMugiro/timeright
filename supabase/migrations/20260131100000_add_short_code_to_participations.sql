-- Add short_code column to participations for easier invite code sharing
ALTER TABLE participations
ADD COLUMN short_code VARCHAR(6) UNIQUE;

-- Create index for fast lookup
CREATE INDEX idx_participations_short_code ON participations(short_code);

-- Generate short codes for existing participations with invite_token
UPDATE participations
SET short_code = UPPER(SUBSTRING(MD5(invite_token || RANDOM()::TEXT) FROM 1 FOR 6))
WHERE invite_token IS NOT NULL AND short_code IS NULL;

-- Add comment
COMMENT ON COLUMN participations.short_code IS 'Short 6-character code for easy invite sharing (e.g., ABC123)';
