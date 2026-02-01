-- =========================================================================
-- COMPREHENSIVE FIX: Admin and Fan Access Permissions
-- Execute this entire script in Supabase SQL Editor
-- =========================================================================

-- =========================================================================
-- PART 1: Update is_admin() Function
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  db_role TEXT;
BEGIN
  -- Check hardcoded admin emails (all 3 admins)
  IF auth.jwt() ->> 'email' IN (
    'glolivercoder@gmail.com',
    'gloliverlobo@gmail.com',
    'gloliverx@gmail.com'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check app_metadata
  IF (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check profiles table for role = 'admin'
  SELECT role INTO db_role FROM public.profiles WHERE id = auth.uid();
  IF db_role = 'admin' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- PART 2: Fix fan_club_posts RLS Policies
-- =========================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Authenticated insert fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Owner or Admin delete fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Owner or Admin update fan_club_posts" ON fan_club_posts;

-- Create new policies
-- Anyone can read
CREATE POLICY "Public read fan_club_posts" ON fan_club_posts 
  FOR SELECT TO public USING (true);

-- Authenticated users can insert their own posts
CREATE POLICY "Authenticated insert fan_club_posts" ON fan_club_posts 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = author_id);

-- Owner or Admin can update
CREATE POLICY "Owner or Admin update fan_club_posts" ON fan_club_posts 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

-- Owner or Admin can delete
CREATE POLICY "Owner or Admin delete fan_club_posts" ON fan_club_posts 
  FOR DELETE TO authenticated 
  USING (auth.uid() = author_id OR public.is_admin());

-- =========================================================================
-- PART 3: Fix media_files RLS Policies
-- =========================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read media_files" ON media_files;
DROP POLICY IF EXISTS "Authenticated insert media_files" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin delete media_files" ON media_files;
DROP POLICY IF EXISTS "Admin update media_files" ON media_files;

-- Create new policies
CREATE POLICY "Public read media_files" ON media_files 
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert media_files" ON media_files 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = uploaded_by OR public.is_admin());

CREATE POLICY "Owner or Admin update media_files" ON media_files 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = uploaded_by OR public.is_admin())
  WITH CHECK (auth.uid() = uploaded_by OR public.is_admin());

CREATE POLICY "Owner or Admin delete media_files" ON media_files 
  FOR DELETE TO authenticated 
  USING (auth.uid() = uploaded_by OR public.is_admin());

-- =========================================================================
-- PART 4: Fix Storage Policies for fan_club bucket
-- =========================================================================

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('fan_club', 'fan_club', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies for fan_club
DROP POLICY IF EXISTS "Fan club public view" ON storage.objects;
DROP POLICY IF EXISTS "Fan club authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Fan club owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Fan club owner or admin delete" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Fan club public view" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'fan_club');

CREATE POLICY "Fan club authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fan_club');

CREATE POLICY "Fan club owner or admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'fan_club' AND (auth.uid() = owner OR public.is_admin()));

-- =========================================================================
-- PART 5: Add updated_at column to media_files if missing
-- =========================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'media_files' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.media_files ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- =========================================================================
-- PART 6: Create RPC Functions for Media Management
-- =========================================================================

-- Update Genre Function
CREATE OR REPLACE FUNCTION public.update_media_genre(media_id UUID, new_genre TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM media_files WHERE id = media_id AND uploaded_by = auth.uid()
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  UPDATE public.media_files 
  SET genre = new_genre, updated_at = now()
  WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete Media Function
CREATE OR REPLACE FUNCTION public.delete_media_file(media_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM media_files WHERE id = media_id AND uploaded_by = auth.uid()
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  DELETE FROM public.media_files WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_media_genre(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_media_file(UUID) TO authenticated;

-- =========================================================================
-- VERIFICATION: Check that policies exist
-- =========================================================================
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =========================================================================
-- END OF SCRIPT
-- =========================================================================
