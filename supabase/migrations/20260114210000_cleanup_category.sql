-- Drop the category column from vessels as we are using capacity for logic
ALTER TABLE vessels DROP COLUMN IF EXISTS category;
