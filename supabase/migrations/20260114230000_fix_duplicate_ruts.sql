-- Fix bad RUT formatting (remove commas from display)
UPDATE people
SET rut_display = REPLACE(rut_display, ',', '')
WHERE rut_display LIKE '%,%';

-- Ensure normalized RUT is correct for everyone (re-calculate from display)
-- This assumes rut_display is now clean (e.g. 19.206.990-4 or 19206990-4)
-- We strip everything non-alphanumeric and uppercase
UPDATE people
SET rut_normalized = UPPER(REGEXP_REPLACE(rut_display, '[^kK0-9]', '', 'g'));

-- Optional: If normalized calculation fails or differs, the trigger (if exists) might handle it,
-- but a manual update ensures consistency for the search index.
