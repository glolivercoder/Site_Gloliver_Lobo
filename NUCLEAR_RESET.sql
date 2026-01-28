
-- =================================================================
-- NUCLEAR RESET V2: RESTORE PUBLIC ACCESS
-- =================================================================
-- The previous script accidentally LOCKED the site for visitors (Admin Only).
-- This script restores PUBLIC READ access so everyone can see the site content.
-- It keeps the "God Mode" Write access for Admins.

-- 1. MEDIA BUCKET (STORAGE)
-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, false, 52428800, '{image/*,audio/*,video/*}')
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 52428800, allowed_mime_types = '{image/*,audio/*,video/*}';

-- WIPE ALL STORAGE POLICIES
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin CRUD Media" ON storage.objects;

-- GRANT PUBLIC READ (Visitors can see images/songs)
CREATE POLICY "Public Read Media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- GRANT ADMIN WRITE (You can upload)
CREATE POLICY "Admin CRUD Media" ON storage.objects FOR ALL 
USING (
  bucket_id = 'media'
  AND (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
)
WITH CHECK (
  bucket_id = 'media'
  AND (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
);


-- 2. DATABASE TABLES
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- WIPE OLD POLICIES
DROP POLICY IF EXISTS "Public Read Featured" ON featured_slots;
DROP POLICY IF EXISTS "Admin God Mode Featured" ON featured_slots;

DROP POLICY IF EXISTS "Public Read Media" ON media_files;
DROP POLICY IF EXISTS "Admin God Mode Media" ON media_files;

DROP POLICY IF EXISTS "Public Read Config" ON site_config;
DROP POLICY IF EXISTS "Admin God Mode Config" ON site_config;

DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Admin God Mode Profiles" ON profiles;

-- === FEATURED SLOTS ===
-- Everyone can READ
CREATE POLICY "Public Read Featured" ON featured_slots FOR SELECT USING (true);
-- Only Admins can WRITE
CREATE POLICY "Admin God Mode Featured" ON featured_slots FOR ALL
USING (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'));

-- === MEDIA FILES ===
CREATE POLICY "Public Read Media" ON media_files FOR SELECT USING (true);
CREATE POLICY "Admin God Mode Media" ON media_files FOR ALL
USING (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'));

-- === SITE CONFIG ===
CREATE POLICY "Public Read Config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Admin God Mode Config" ON site_config FOR ALL
USING (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'));

-- === PROFILES ===
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Admin God Mode Profiles" ON profiles FOR ALL
USING (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'));
