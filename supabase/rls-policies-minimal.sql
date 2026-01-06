-- RLS Policies for existing tables only
-- Execute this in Supabase SQL Editor

-- People table
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on people" 
ON people FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated write on people" 
ON people FOR ALL 
TO authenticated 
USING (true);

-- Locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on locations" 
ON locations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated write on locations" 
ON locations FOR ALL 
TO authenticated 
USING (true);

-- Operators table
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on operators" 
ON operators FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated write on operators" 
ON operators FOR ALL 
TO authenticated 
USING (true);

-- Vessels table
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on vessels" 
ON vessels FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated write on vessels" 
ON vessels FOR ALL 
TO authenticated 
USING (true);

-- Routes table
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on routes" 
ON routes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated write on routes" 
ON routes FOR ALL 
TO authenticated 
USING (true);
