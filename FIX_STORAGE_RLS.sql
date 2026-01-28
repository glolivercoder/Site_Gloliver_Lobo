
-- =================================================================
-- FIX STORAGE POLICIES (ALLOW FILE UPLOADS)
-- =================================================================
-- The previous script fixed the DATABASE tables. 
-- This script fixes the FILE STORAGE (Bucket) permissions.

-- 1. Ensure the 'media' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage objects (Standard Supabase Security)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop old restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Any Upload Media" ON storage.objects;

-- 4. Create New Policies (Direct Email Check - Like the Tables)

-- Allow Everyon to Download/View files
CREATE POLICY "Public Read Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' );

-- Allow Admins to UPLOAD (Insert)
CREATE POLICY "Admin Upload Media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
);

-- Allow Admins to UPDATE (Replace files)
CREATE POLICY "Admin Update Media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
);

-- Allow Admins to DELETE files
CREATE POLICY "Admin Delete Media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
);
