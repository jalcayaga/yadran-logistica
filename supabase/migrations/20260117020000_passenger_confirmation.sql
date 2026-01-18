-- Add confirmation fields to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64');

-- Ensure existing rows get a token
UPDATE bookings 
SET confirmation_token = encode(gen_random_bytes(24), 'base64') 
WHERE confirmation_token IS NULL;

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
