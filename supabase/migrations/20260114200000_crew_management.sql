-- Add category to vessels if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vessels' AND column_name = 'category') THEN
        ALTER TABLE vessels ADD COLUMN category TEXT DEFAULT 'small' CHECK (category IN ('small', 'large'));
    END IF;
END $$;

-- Create Itinerary Crew Table
CREATE TABLE IF NOT EXISTS itinerary_crew (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('captain', 'substitute', 'crew_member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(itinerary_id, person_id)
);

-- RLS Policies for itinerary_crew
ALTER TABLE itinerary_crew ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (staff) to manage crew
-- Using the same logic as other tables, relying on the 'is_admin_or_logistica' function if available, 
-- or generic authenticated access if strictly controlled via app logic. 
-- Based on existing schema, we have 'is_admin_or_logistica'.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_or_logistica') THEN
        CREATE POLICY "Staff full access itinerary_crew" ON itinerary_crew
            FOR ALL TO authenticated
            USING (is_admin_or_logistica());
    ELSE
        -- Fallback if function not found (safety net)
        CREATE POLICY "Authenticated full access itinerary_crew" ON itinerary_crew
            FOR ALL TO authenticated
            USING (true);
    END IF;
END $$;
