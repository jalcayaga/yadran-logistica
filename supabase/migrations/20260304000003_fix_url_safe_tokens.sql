-- Make all confirmation and tracking tokens URL safe by replacing url-unsafe base64 characters

-- 1. Fix existing crew_assignments tokens
UPDATE crew_assignments 
SET confirmation_token = replace(replace(replace(confirmation_token, '/', '_'), '+', '-'), '=', '')
WHERE confirmation_token LIKE '%/%' OR confirmation_token LIKE '%+%' OR confirmation_token LIKE '%=%';

ALTER TABLE crew_assignments 
ALTER COLUMN confirmation_token SET DEFAULT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-'), '=', '');

-- 2. Fix existing bookings tokens
UPDATE bookings 
SET confirmation_token = replace(replace(replace(confirmation_token, '/', '_'), '+', '-'), '=', '')
WHERE confirmation_token LIKE '%/%' OR confirmation_token LIKE '%+%' OR confirmation_token LIKE '%=%';

ALTER TABLE bookings 
ALTER COLUMN confirmation_token SET DEFAULT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-'), '=', '');

-- 3. Fix the generate_share_token function
DROP FUNCTION IF EXISTS generate_share_token(UUID, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION generate_share_token(p_itinerary_id UUID, p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '24 hours'))
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
BEGIN
    -- Generate URL-safe token
    v_token := replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-'), '=', '');
    
    INSERT INTO itinerary_shares (itinerary_id, token, expires_at)
    VALUES (p_itinerary_id, v_token, p_expires_at)
    ON CONFLICT (itinerary_id) 
    DO UPDATE SET 
        token = v_token,
        expires_at = p_expires_at,
        revoked = false,
        created_at = NOW()
    WHERE itinerary_shares.revoked = true OR itinerary_shares.expires_at < NOW()
    RETURNING token INTO v_token;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix existing itinerary_shares tokens
UPDATE itinerary_shares 
SET token = replace(replace(replace(token, '/', '_'), '+', '-'), '=', '')
WHERE token LIKE '%/%' OR token LIKE '%+%' OR token LIKE '%=%';

ALTER TABLE itinerary_shares 
ALTER COLUMN token SET DEFAULT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-'), '=', '');
