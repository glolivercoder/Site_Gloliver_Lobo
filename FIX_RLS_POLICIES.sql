
-- =================================================================
-- FIX RLS POLICIES (GRANT ADMIN WRITE ACCESS) - V2 (PUBLIC SCHEMA)
-- =================================================================

-- 1. Enable RLS on all tables
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if user is admin (Backend verification)
-- stored in PUBLIC schema to avoid permission errors
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- TABLE: featured_slots (Management Area)
-- =================================================================
DROP POLICY IF EXISTS "Public Read Featured" ON featured_slots;
DROP POLICY IF EXISTS "Admin Full Access Featured" ON featured_slots;

-- Allow everyone to see the featured items
CREATE POLICY "Public Read Featured"
ON featured_slots FOR SELECT
USING (true);

-- Allow Admins to INSERT/UPDATE/DELETE
CREATE POLICY "Admin Full Access Featured"
ON featured_slots FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =================================================================
-- TABLE: media_files (Uploads)
-- =================================================================
DROP POLICY IF EXISTS "Public Read Media" ON media_files;
DROP POLICY IF EXISTS "Admin Full Access Media" ON media_files;

CREATE POLICY "Public Read Media"
ON media_files FOR SELECT
USING (true);

CREATE POLICY "Admin Full Access Media"
ON media_files FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =================================================================
-- TABLE: site_config (Settings)
-- =================================================================
DROP POLICY IF EXISTS "Public Read Config" ON site_config;
DROP POLICY IF EXISTS "Admin Updated Config" ON site_config;

CREATE POLICY "Public Read Config"
ON site_config FOR SELECT
USING (true);

CREATE POLICY "Admin Updated Config"
ON site_config FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =================================================================
-- TABLE: profiles
-- =================================================================
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON profiles;

CREATE POLICY "Public Read Profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admin Full Access Profiles"
ON profiles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
