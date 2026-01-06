-- FIX: Drop old tables that might conflict
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS itinerary_stops CASCADE;
DROP TABLE IF EXISTS itineraries CASCADE;

-- Re-Apply Logistics Schema

-- Create Enums (IF NOT EXISTS to avoid error, or DROP TYPE?)
-- Postgres doesn't support generic IF NOT EXISTS for types easily without a Block.
-- We'll assume they might exist and that's fine, or we can catch exception.
DO $$ BEGIN
    CREATE TYPE itinerary_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'standby');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Itineraries Table
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    status itinerary_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Itinerary Stops Table
CREATE TABLE itinerary_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    UNIQUE(itinerary_id, stop_order)
);

-- Create Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES people(id) ON DELETE SET NULL,
    origin_stop_id UUID REFERENCES itinerary_stops(id),
    destination_stop_id UUID REFERENCES itinerary_stops(id),
    status booking_status DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access itineraries" ON itineraries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access stops" ON itinerary_stops FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access bookings" ON bookings FOR ALL TO authenticated USING (true);

-- Ensure Function exists (replace)
CREATE OR REPLACE FUNCTION check_capacity(
    p_itinerary_id UUID,
    p_active_booking_id UUID,
    p_start_order INTEGER,
    p_end_order INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_capacity INTEGER;
    v_segment_load INTEGER;
    v_has_capacity BOOLEAN := TRUE;
    v_i INTEGER;
BEGIN
    SELECT v.capacity INTO v_max_capacity
    FROM itineraries i
    JOIN vessels v ON i.vessel_id = v.id
    WHERE i.id = p_itinerary_id;

    IF v_max_capacity IS NULL OR v_max_capacity = 0 THEN
        RETURN FALSE; 
    END IF;

    FOR v_i IN p_start_order .. (p_end_order - 1) LOOP
        SELECT COUNT(*)
        INTO v_segment_load
        FROM bookings b
        JOIN itinerary_stops s_origin ON b.origin_stop_id = s_origin.id
        JOIN itinerary_stops s_dest ON b.destination_stop_id = s_dest.id
        WHERE b.itinerary_id = p_itinerary_id
          AND b.status = 'confirmed'
          AND (p_active_booking_id IS NULL OR b.id != p_active_booking_id)
          AND s_origin.stop_order <= v_i
          AND s_dest.stop_order > v_i;

        IF (v_segment_load + 1) > v_max_capacity THEN
            v_has_capacity := FALSE;
            EXIT; 
        END IF;
    END LOOP;

    RETURN v_has_capacity;
END;
$$ LANGUAGE plpgsql;
