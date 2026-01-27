-- =========================================================
-- COMPLETE FIX SCRIPT (UPDATED - SAFE TO RUN MULTIPLE TIMES)
-- =========================================================

-- 1. Ensure columns exist in media_files
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS type TEXT;

-- 2. RESET POLICIES FOR media_files (Fix Gêneros display)
-- First, drop ANY existing policy name we might use or have used
DROP POLICY IF EXISTS "Public read media" ON media_files;
DROP POLICY IF EXISTS "Anyone can read media" ON media_files;
DROP POLICY IF EXISTS "Users can insert media" ON media_files;
DROP POLICY IF EXISTS "Authenticated can upload media" ON media_files;
DROP POLICY IF EXISTS "Owners or Admin can delete media" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin can delete media" ON media_files;

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read media" ON media_files 
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can upload media" ON media_files 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Owner or Admin can delete media" ON media_files 
FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR public.is_admin());

-- 3. RESET POLICIES FOR site_config (Fix Destaques display)
DROP POLICY IF EXISTS "Admin only write" ON site_config;
DROP POLICY IF EXISTS "Public read config" ON site_config;
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
DROP POLICY IF EXISTS "Anyone can read site_config" ON site_config;
DROP POLICY IF EXISTS "Admin can insert site_config" ON site_config;
DROP POLICY IF EXISTS "Admin can update site_config" ON site_config;
DROP POLICY IF EXISTS "Admin can delete site_config" ON site_config;

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_config" ON site_config 
FOR SELECT TO public USING (true);

CREATE POLICY "Admin can insert site_config" ON site_config 
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update site_config" ON site_config 
FOR UPDATE TO authenticated USING (public.is_admin());

-- 4. FIX STORAGE PERMISSIONS (Fix Image/Audio loading)
-- Make buckets public
UPDATE storage.buckets SET public = true WHERE id = 'media';
UPDATE storage.buckets SET public = true WHERE id = 'fan_club';

-- Reset storage policies
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin delete storage" ON storage.objects;

-- Allow public viewing for media bucket
CREATE POLICY "Public viewing" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

-- Allow uploads (simple check)
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media');

-- 5. SYNC PROFILES (Ensure users exist for foreign keys)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
