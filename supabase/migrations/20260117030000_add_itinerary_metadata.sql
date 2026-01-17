-- Add created_by_email to itineraries to track the user who created it
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS created_by_email TEXT;
