-- MASTER FIX SCRIPT TO RUN IN SUPABASE SQL EDITOR

-- 1. Add confirmation fields to crew_assignments
ALTER TABLE crew_assignments 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Allow public access for confirmation via token (using a function to avoid RLS issues)
CREATE OR REPLACE FUNCTION confirm_crew_assignment(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id 
    FROM crew_assignments 
    WHERE confirmation_token = p_token 
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        UPDATE crew_assignments 
        SET confirmed_at = NOW() 
        WHERE id = v_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add confirmation fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Allow public access for confirmation via token
CREATE OR REPLACE FUNCTION confirm_booking(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id 
    FROM bookings 
    WHERE confirmation_token = p_token 
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        UPDATE bookings 
        SET confirmed_at = NOW(),
            status = 'confirmed'
        WHERE id = v_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
