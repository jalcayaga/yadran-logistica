-- Add column to store weather state when a trip departs
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS departure_weather JSONB;
