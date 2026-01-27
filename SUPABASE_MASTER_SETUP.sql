-- =================================================================
-- SUPABASE MASTER SETUP SCRIPT (Final & Connected Fix)
-- =================================================================

-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'gloliverlobo@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABLE CONFIGURATIONS

-- A) MEDIA FILES
ALTER TABLE IF EXISTS public.media_files ENABLE ROW LEVEL SECURITY;

-- Clean old policies (Case Sensitive Matches)
DROP POLICY IF EXISTS "Public Read Media" ON media_files;
DROP POLICY IF EXISTS "Public read media" ON media_files;
DROP POLICY IF EXISTS "Anyone can read media" ON media_files;
DROP POLICY IF EXISTS "Authenticated Insert Media" ON media_files;
DROP POLICY IF EXISTS "Authenticated can upload media" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin Delete Media" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin can delete media" ON media_files;
DROP POLICY IF EXISTS "Users can insert media" ON media_files;

-- CREATE
CREATE POLICY "Public Read Media" 
ON public.media_files FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Authenticated Insert Media" 
ON public.media_files FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Owner or Admin Delete Media" 
ON public.media_files FOR DELETE 
TO authenticated 
USING (
    (auth.uid() = uploaded_by) OR public.is_admin()
);

-- B) SITE CONFIGURATION -> REPLACED BY featured_slots, but keeping for legacy
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Config" ON site_config;
DROP POLICY IF EXISTS "Admin Manage Config" ON site_config;
DROP POLICY IF EXISTS "Anyone can read site_config" ON site_config;
DROP POLICY IF EXISTS "Admin only write" ON site_config;
DROP POLICY IF EXISTS "Public read config" ON site_config;
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;

CREATE POLICY "Public Read Config" 
ON public.site_config FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admin Manage Config" 
ON public.site_config FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- C) PROFILES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "User Update Own Profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "User Insert Own Profile" ON profiles;

CREATE POLICY "Public Read Profiles" 
ON public.profiles FOR SELECT 
TO public 
USING (true);

CREATE POLICY "User Update Own Profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "User Insert Own Profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 3. STORAGE CONFIGURATION
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('fan_club', 'fan_club', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean Storage Policies
DROP POLICY IF EXISTS "Public Read Storage" ON storage.objects;
DROP POLICY IF EXISTS "Public View Media" ON storage.objects;
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin Delete Storage" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin delete storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete All Media" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Public Read Storage"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

CREATE POLICY "Authenticated Insert Storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    (bucket_id = 'media' OR bucket_id = 'fan_club')
    AND (auth.role() = 'authenticated')
);

CREATE POLICY "Owner or Admin Delete Storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
    ((bucket_id = 'media' OR bucket_id = 'fan_club') AND auth.uid() = owner)
    OR public.is_admin()
);

CREATE POLICY "Admin Update Storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 4. NEW RELATIONAL TABLE (Ensure Permissions here too just in case)
-- (Ideally run RESTRUCTURE_BACKEND.sql, but let's allow it here if helpful)
-- GRANT ALL ON public.featured_slots TO authenticated; -- Commented out to keep separation of concerns

DO $$
BEGIN
  RAISE NOTICE 'Supabase Master Setup (Fixed) Completed.';
END $$;
