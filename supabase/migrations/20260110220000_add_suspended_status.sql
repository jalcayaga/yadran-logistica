-- Add 'suspended' to the itinerary_status enum
-- Use 'IF NOT EXISTS' logic by catching the duplicate value error if needed, 
-- but PG doesn't strictly support IF NOT EXISTS in ADD VALUE directly in all versions efficiently without a block.
-- However, standard Supabase migration practice:

ALTER TYPE itinerary_status ADD VALUE IF NOT EXISTS 'suspended';
