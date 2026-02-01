-- =========================================================================
-- SIMPLIFIED RLS POLICIES (3 QUERIES ONLY)
-- Logic:
--   1. Public can READ everything
--   2. Logged-in users can POST to fan area (their own posts)
--   3. Admins have FULL access to everything
-- =========================================================================

-- =========================================================================
-- QUERY 1: NUCLEAR RESET - Remove ALL existing policies
-- =========================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all public schema policies
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- Drop all storage policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- =========================================================================
-- QUERY 2: Core Function + Minimal Table Policies
-- =========================================================================

-- A. Create simplified is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'glolivercoder@gmail.com',
      'gloliverlobo@gmail.com', 
      'gloliverx@gmail.com'
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. site_config: Public read, Admin write
CREATE POLICY "site_config_read" ON site_config FOR SELECT TO public USING (true);
CREATE POLICY "site_config_admin" ON site_config FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- C. profiles: Public read, User manages own
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_self" ON profiles FOR ALL TO authenticated USING (auth.uid() = id OR public.is_admin());

-- D. fan_club_posts: Public read, Authenticated insert own, Owner/Admin manage
CREATE POLICY "fan_posts_read" ON fan_club_posts FOR SELECT TO public USING (true);
CREATE POLICY "fan_posts_insert" ON fan_club_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "fan_posts_manage" ON fan_club_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "fan_posts_delete" ON fan_club_posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.is_admin());

-- E. media_files: Public read, Admin manage
CREATE POLICY "media_read" ON media_files FOR SELECT TO public USING (true);
CREATE POLICY "media_admin" ON media_files FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- F. featured_slots: Public read, Admin manage
CREATE POLICY "featured_read" ON featured_slots FOR SELECT TO public USING (true);
CREATE POLICY "featured_admin" ON featured_slots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- G. activity_logs: Admin only (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    EXECUTE 'CREATE POLICY "logs_admin" ON activity_logs FOR ALL TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- =========================================================================
-- QUERY 3: Storage Policies (Simplified)
-- =========================================================================

-- Ensure buckets are public for reading
UPDATE storage.buckets SET public = true WHERE id IN ('media', 'fan_club');

-- Storage: Anyone can view public buckets
CREATE POLICY "storage_public_read" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id IN ('media', 'fan_club'));

-- Storage: Authenticated can upload to fan_club
CREATE POLICY "storage_fan_upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'fan_club');

-- Storage: Admin can upload to media bucket
CREATE POLICY "storage_media_admin" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media' AND public.is_admin());

-- Storage: Owner or Admin can delete
CREATE POLICY "storage_delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (auth.uid() = owner OR public.is_admin());

-- =========================================================================
-- DONE! Summary:
-- - Public: Can read ALL content (fan posts, media, profiles)
-- - Fans: Can post photos/videos to fan area, manage ONLY their own posts
-- - Admins: Full access to settings, media management, featured slots
-- =========================================================================
