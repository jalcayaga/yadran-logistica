-- Add capacity to vessels
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

-- Create Enums
CREATE TYPE itinerary_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'standby');

-- Create Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    status itinerary_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Itinerary Stops Table
CREATE TABLE IF NOT EXISTS itinerary_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    UNIQUE(itinerary_id, stop_order)
);

-- Create Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES people(id) ON DELETE SET NULL,
    origin_stop_id UUID REFERENCES itinerary_stops(id),
    destination_stop_id UUID REFERENCES itinerary_stops(id),
    status booking_status DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything (for now, admin focused)
CREATE POLICY "Allow authenticated full access itineraries" ON itineraries
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access stops" ON itinerary_stops
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access bookings" ON bookings
    FOR ALL TO authenticated USING (true);


-- FUNCTION: Check Capacity Logic
-- Returns TRUE if the booking can be accommodated, FALSE otherwise.
CREATE OR REPLACE FUNCTION check_capacity(
    p_itinerary_id UUID,
    p_active_booking_id UUID, -- Optional: exclude this booking (for updates)
    p_start_order INTEGER,
    p_end_order INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_capacity INTEGER;
    v_segment_load INTEGER;
    v_has_capacity BOOLEAN := TRUE;
    v_i INTEGER;
BEGIN
    -- 1. Get Vessel Capacity
    SELECT v.capacity INTO v_max_capacity
    FROM itineraries i
    JOIN vessels v ON i.vessel_id = v.id
    WHERE i.id = p_itinerary_id;

    -- If no capacity defined or 0, assume unlimited? Or 0? 
    -- Let's assume 0 means 0 capacity for safety, but maybe handle NULL as 0.
    IF v_max_capacity IS NULL OR v_max_capacity = 0 THEN
        RETURN FALSE; 
    END IF;

    -- 2. Iterate through each segment [start_order, end_order)
    -- A passenger occupies the vessel from their start stop up to (but not including) their end stop's departure?
    -- Actually, simpler: A passenger is ON BOARD during the transit between Stop K and Stop K+1.
    -- If I go from Order 0 to Order 2. I occupy Segment 0->1 and Segment 1->2.
    -- So I loop k from p_start_order to p_end_order - 1.

    FOR v_i IN p_start_order .. (p_end_order - 1) LOOP
        
        -- Count how many active bookings cover this segment index v_i
        -- A booking covers segment v_i if:
        -- booking.start_order <= v_i AND booking.end_order > v_i
        
        -- We need to join bookings with itinerary_stops to get the orders
        SELECT COUNT(*)
        INTO v_segment_load
        FROM bookings b
        JOIN itinerary_stops s_origin ON b.origin_stop_id = s_origin.id
        JOIN itinerary_stops s_dest ON b.destination_stop_id = s_dest.id
        WHERE b.itinerary_id = p_itinerary_id
          AND b.status = 'confirmed'
          AND (p_active_booking_id IS NULL OR b.id != p_active_booking_id) -- Exclude current if updating
          AND s_origin.stop_order <= v_i
          AND s_dest.stop_order > v_i;

        -- Check
        IF (v_segment_load + 1) > v_max_capacity THEN
            v_has_capacity := FALSE;
            EXIT; -- Break loop early
        END IF;
        
    END LOOP;

    RETURN v_has_capacity;
END;
$$ LANGUAGE plpgsql;
