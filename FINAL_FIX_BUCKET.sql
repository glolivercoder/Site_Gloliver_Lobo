-- =================================================================
-- FINAL FIX BUCKET: Force Buckets to PUBLIC & Set Correct Permissions
-- =================================================================

-- 1. Update existing buckets to be PUBLIC (Crucial for 400 error)
UPDATE storage.buckets
SET public = true
WHERE id = 'media';

UPDATE storage.buckets
SET public = true
WHERE id = 'fan_club';

-- 2. Ensure they exist if not present (Insert with public=true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('fan_club', 'fan_club', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Reset Storage Policies (Drop old ones to clean up)
DROP POLICY IF EXISTS "Public View Media" ON storage.objects;
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Own Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete All Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;

-- 4. Create new Clean Policies

-- A) Allow anyone (public) to READ from 'media' and 'fan_club'
CREATE POLICY "Public View Media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

-- B) Allow authenticated users to UPLOAD to 'media' (files must be owned by them)
CREATE POLICY "Authenticated Upload Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    (bucket_id = 'media' OR bucket_id = 'fan_club') 
    AND (auth.uid() = owner)
);

-- C) Allow users to DELETE their OWN files
CREATE POLICY "Authenticated Delete Own Media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    (bucket_id = 'media' OR bucket_id = 'fan_club')
    AND (auth.uid() = owner)
);

-- D) Allow Admin to DELETE ANYTHING (and Upload anywhere if needed)
-- Using email check for simplicity as role based access might require join
CREATE POLICY "Admin Delete All Media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    (select auth.jwt() ->> 'email') = 'gloliverlobo@gmail.com'
);

-- E) Allow Admin to UPDATE ANYTHING (e.g. metadata if needed)
CREATE POLICY "Admin Update All Media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    (select auth.jwt() ->> 'email') = 'gloliverlobo@gmail.com'
);
