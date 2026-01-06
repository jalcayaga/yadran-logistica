-- Split full_name into first_name and last_name
-- Data migration: Simplistic split for existing data (if any)
ALTER TABLE people 
  ADD COLUMN first_name text,
  ADD COLUMN last_name text;

UPDATE people 
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = substring(full_name from position(' ' in full_name) + 1);

-- Handle cases where no space existed (last_name would be empty)
UPDATE people SET last_name = '-' WHERE last_name = '' OR last_name IS NULL;
UPDATE people SET first_name = full_name WHERE first_name IS NULL;

-- Enforce NOT NULL after population
ALTER TABLE people 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Drop old column
ALTER TABLE people DROP COLUMN full_name;
