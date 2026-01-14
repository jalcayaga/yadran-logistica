-- Add is_crew flag to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS is_crew BOOLEAN DEFAULT false;

-- Index for performance on filtering
CREATE INDEX IF NOT EXISTS idx_people_is_crew ON people(is_crew);
