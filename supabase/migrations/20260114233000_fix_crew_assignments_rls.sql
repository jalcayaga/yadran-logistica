-- Enable RLS
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON crew_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON crew_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON crew_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON crew_assignments;

-- Create permissive policies for now (as this is an admin tool)
-- Ideally stricter policies would be used in production

CREATE POLICY "Enable read access for all users" ON crew_assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON crew_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON crew_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON crew_assignments
    FOR DELETE USING (auth.role() = 'authenticated');
