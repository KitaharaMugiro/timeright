-- Add budget_level functionality to participations table

-- Add budget_level column (1-3 stars for restaurant price range)
ALTER TABLE participations
  ADD COLUMN budget_level SMALLINT NOT NULL DEFAULT 2
  CONSTRAINT budget_level_range CHECK (budget_level >= 1 AND budget_level <= 3);

-- Add comment for documentation
COMMENT ON COLUMN participations.budget_level IS 'Restaurant price preference: 1=budget-friendly, 2=moderate, 3=upscale';
