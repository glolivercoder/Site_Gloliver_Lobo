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
    ((metadata->>'size')::int < 10500000)
  ))
);

-- 4. Ensure admin can do anything with config
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
CREATE POLICY "Admin manage site_config" ON site_config FOR ALL USING (public.is_admin());

-- 5. Fix relationships and ADD GENRE COLUMN (CRITICAL)
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS genre TEXT;

ALTER TABLE public.media_files 
DROP CONSTRAINT IF EXISTS media_files_uploaded_by_fkey,
DROP CONSTRAINT IF EXISTS media_files_uploaded_by_profiles_fkey,
ADD CONSTRAINT media_files_uploaded_by_profiles_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.fan_club_posts
DROP CONSTRAINT IF EXISTS fan_club_posts_author_id_fkey,
ADD CONSTRAINT fan_club_posts_author_id_profiles_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.activity_logs
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey,
ADD CONSTRAINT activity_logs_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
