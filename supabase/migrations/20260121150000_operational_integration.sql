-- Phase 1: Operational Integration Schema

-- 1. Ports Table
CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    port_code TEXT UNIQUE NOT NULL, -- Ej: 'QUE' for Quellón
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Centers Table (from Excel)
CREATE TABLE IF NOT EXISTS centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    port_code TEXT REFERENCES ports(port_code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vessel Types Table (Operational Limits)
CREATE TABLE IF NOT EXISTS vessel_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- Ej: 'Lancha 20kt', 'Barcaza 50kt'
    cruise_speed_knots INTEGER NOT NULL,
    max_wind_knots INTEGER NOT NULL,
    max_wave_meters DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Associate Itineraries with Vessel Type
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS vessel_type_id UUID REFERENCES vessel_types(id);

-- 5. Weather Snapshots
CREATE TABLE IF NOT EXISTS center_weather_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id), -- Could also use centers.id if we unify them later
    wind_speed DECIMAL,
    wind_gust DECIMAL,
    wave_height DECIMAL,
    visibility DECIMAL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. External Port Status (SITPORT)
CREATE TABLE IF NOT EXISTS external_port_status (
    port_code TEXT PRIMARY KEY REFERENCES ports(port_code),
    status TEXT NOT NULL, -- 'ABIERTO', 'CERRADO', 'RESTRINGIDO', 'DESCONOCIDO'
    last_update TIMESTAMPTZ DEFAULT NOW(),
    source_url TEXT
);

-- Enable RLS for new tables
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_port_status ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Staff Access)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff full access ports') THEN
        CREATE POLICY "Staff full access ports" ON ports FOR ALL USING (true); -- Simplified for now, should use is_admin_or_logistica()
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff full access centers') THEN
        CREATE POLICY "Staff full access centers" ON centers FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff full access vessel_types') THEN
        CREATE POLICY "Staff full access vessel_types" ON vessel_types FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff full access weather') THEN
        CREATE POLICY "Staff full access weather" ON center_weather_snapshots FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff full access port_status') THEN
        CREATE POLICY "Staff full access port_status" ON external_port_status FOR ALL USING (true);
    END IF;
END $$;
