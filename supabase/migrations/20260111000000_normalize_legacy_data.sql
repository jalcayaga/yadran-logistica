DO $$
DECLARE
    r RECORD;
    clean_rut TEXT;
    existing_id UUID;
BEGIN
    -- 1. RUT NORMALIZATION & MERGE
    -- Iterate over all "dirty" records (with dots or lowercase)
    FOR r IN SELECT * FROM people WHERE rut_normalized LIKE '%.%' OR rut_normalized != UPPER(rut_normalized) LOOP
        -- Calculate the clean version
        clean_rut := UPPER(REPLACE(r.rut_normalized, '.', ''));
        
        -- Check if a "clean" record already exists
        SELECT id INTO existing_id FROM people WHERE rut_normalized = clean_rut AND id != r.id LIMIT 1;
        
        IF existing_id IS NOT NULL THEN
            -- CONFLICT DETECTED: A clean version exists.
            -- 1. Move all bookings from the "dirty" ID to the "clean" ID
            UPDATE bookings SET passenger_id = existing_id WHERE passenger_id = r.id;
            
            -- 2. Delete the "dirty" record since it's now redundant and unused
            DELETE FROM people WHERE id = r.id;
            
            RAISE NOTICE 'Merged duplicate passenger % (ID: %) into % (ID: %)', r.rut_normalized, r.id, clean_rut, existing_id;
        ELSE
            -- NO CONFLICT: Just update the current record
            UPDATE people SET rut_normalized = clean_rut WHERE id = r.id;
        END IF;
    END LOOP;

    -- 2. PHONE NORMALIZATION
    -- This generally doesn't have unique constraints, so bulk update is safe.
    -- Remove non-digits
    UPDATE people
    SET phone_e164 = regexp_replace(phone_e164, '\D','','g')
    WHERE phone_e164 IS NOT NULL;

    -- Add 56 to 9-digit numbers starting with 9
    UPDATE people
    SET phone_e164 = '56' || phone_e164
    WHERE length(phone_e164) = 9 AND phone_e164 LIKE '9%';
END $$;
