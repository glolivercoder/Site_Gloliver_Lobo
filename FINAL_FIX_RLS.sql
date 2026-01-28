
-- =================================================================
-- FINAL FIX RLS (SIMPLIFIED & ROBUST)
-- =================================================================
-- This script Drops ALL existing policies and recreates them with 
-- DIRECT email checks. No functions, no complex roles.
-- This guarantees access if you are logged in with the correct email.

-- 1. Ensure RLS is enabled
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- TABLE: featured_slots
-- =================================================================
DROP POLICY IF EXISTS "Public Read Featured" ON featured_slots;
DROP POLICY IF EXISTS "Admin Full Access Featured" ON featured_slots;
DROP POLICY IF EXISTS "Admins Only" ON featured_slots;

CREATE POLICY "Public Read Featured" ON featured_slots FOR SELECT USING (true);

CREATE POLICY "Admin Write Featured" ON featured_slots FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
);

-- =================================================================
-- TABLE: media_files
-- =================================================================
DROP POLICY IF EXISTS "Public Read Media" ON media_files;
DROP POLICY IF EXISTS "Admin Full Access Media" ON media_files;

CREATE POLICY "Public Read Media" ON media_files FOR SELECT USING (true);

CREATE POLICY "Admin Write Media" ON media_files FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
);

-- =================================================================
-- TABLE: site_config
-- =================================================================
DROP POLICY IF EXISTS "Public Read Config" ON site_config;
DROP POLICY IF EXISTS "Admin Updated Config" ON site_config;

CREATE POLICY "Public Read Config" ON site_config FOR SELECT USING (true);

CREATE POLICY "Admin Write Config" ON site_config FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
);

-- =================================================================
-- TABLE: profiles
-- =================================================================
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own" ON profiles;
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON profiles;

CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Users update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Global Access (Direct Email Check)
CREATE POLICY "Admin Write Profiles" ON profiles FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com')
);
