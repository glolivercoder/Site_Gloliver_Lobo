-- Run this in your Supabase SQL Editor to fix upload issues:

-- 1. Ensure the bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'media';

-- 2. Drop the old policy
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;

-- 3. Create a more robust policy using content_length
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'media' AND 
  (public.is_admin() OR (
    -- Non-admin check: Max 10.5M bytes (~10MB) for safety
    (content_length < 10500000)
  ))
);

-- 4. Ensure admin can do anything with config
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
CREATE POLICY "Admin manage site_config" ON site_config FOR ALL USING (public.is_admin());
