ALTER TABLE crew_assignments ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64');
UPDATE crew_assignments SET confirmation_token = encode(gen_random_bytes(24), 'base64') WHERE confirmation_token IS NULL;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64');
UPDATE bookings SET confirmation_token = encode(gen_random_bytes(24), 'base64') WHERE confirmation_token IS NULL;
