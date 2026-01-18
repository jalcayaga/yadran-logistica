-- Migration to fix RUT display format for all existing records
-- This ensures all RUTs are displayed with proper formatting (XX.XXX.XXX-X)

-- Function to format RUT with dots and dash
CREATE OR REPLACE FUNCTION format_rut(rut_normalized TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_rut TEXT;
    rut_body TEXT;
    rut_dv TEXT;
    formatted TEXT;
BEGIN
    -- Remove all non-alphanumeric characters
    clean_rut := regexp_replace(rut_normalized, '[^0-9kK]', '', 'g');
    
    -- If empty or too short, return as is
    IF clean_rut IS NULL OR length(clean_rut) < 2 THEN
        RETURN rut_normalized;
    END IF;
    
    -- Split into body and verification digit
    rut_body := substring(clean_rut from 1 for length(clean_rut) - 1);
    rut_dv := substring(clean_rut from length(clean_rut) for 1);
    
    -- Format with dots (reverse, add dots every 3 digits, reverse back)
    formatted := reverse(rut_body);
    formatted := regexp_replace(formatted, '(\d{3})(?=\d)', '\1.', 'g');
    formatted := reverse(formatted);
    
    -- Add dash and verification digit
    RETURN formatted || '-' || rut_dv;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all people records where rut_display doesn't have proper formatting
-- (i.e., missing dots or not matching the expected format)
UPDATE people
SET rut_display = format_rut(rut_normalized)
WHERE rut_display IS NOT NULL 
  AND rut_normalized IS NOT NULL
  AND (
    -- RUT doesn't have dots (only has dash or nothing)
    rut_display !~ '\d+\.\d+\.\d+-[0-9kK]'
    OR
    -- RUT is different from what it should be
    rut_display != format_rut(rut_normalized)
  );

COMMENT ON FUNCTION format_rut IS 'Formats a normalized RUT with dots and dash (e.g., 12.345.678-K)';
