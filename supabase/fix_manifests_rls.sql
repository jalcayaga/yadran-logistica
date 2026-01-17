-- 1. Create bucket if it doesn't exist
-- If this fails, you can create the 'manifests' bucket manually in the Storage Dashboard (and make it Public).
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifests', 'manifests', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
-- We skip 'ALTER TABLE' because storage.objects usually has RLS enabled by default, 
-- and modifying system tables can cause permission errors.
DROP POLICY IF EXISTS "Public Access Manifests" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Manifests" ON storage.objects;

-- 3. Create Policy: Allow Public Read (GET)
CREATE POLICY "Public Access Manifests"
ON storage.objects FOR SELECT
USING ( bucket_id = 'manifests' );

-- 4. Create Policy: Allow Authenticated Upload (INSERT)
CREATE POLICY "Authenticated Upload Manifests"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'manifests' );
