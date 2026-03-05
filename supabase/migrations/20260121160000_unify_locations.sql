-- Fix: Harmonize Centers into Locations table

-- 1. Add coordinates and port reference to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS longitude DECIMAL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS port_code TEXT REFERENCES ports(port_code);

-- 2. Migrate data from 'centers' to 'locations'
-- Note: We use a loop or insert into to move the data
INSERT INTO locations (name, code, type, latitude, longitude, port_code, active)
SELECT 
    name, 
    UPPER(REPLACE(name, ' ', '_')) as code, -- Generate a code if missing
    'center', 
    latitude, 
    longitude, 
    port_code,
    true
FROM centers
ON CONFLICT (code) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    port_code = EXCLUDED.port_code,
    type = 'center';

-- 3. Update snapshots to point to the NEW location ids
-- This is tricky if we want to keep history, but since it's demo data we can just link them
-- For production, we'd need a mapping table.
UPDATE center_weather_snapshots cws
SET location_id = l.id
FROM locations l
JOIN centers c ON c.name = l.name
WHERE cws.location_id = c.id;

-- 4. Clean up (Optional but recommended to avoid confusion)
-- DROP TABLE centers; 
-- We'll keep it for a moment just in case, but the app should now point to locations.
