-- Add manifest_pdf to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS manifest_pdf TEXT;
