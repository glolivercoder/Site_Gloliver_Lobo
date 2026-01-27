-- =========================================================
-- FIX SITE_CONFIG POLICIES - RUN THIS IN SUPABASE SQL EDITOR
-- =========================================================

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Admin only write" ON site_config;
DROP POLICY IF EXISTS "Public read config" ON site_config;
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;

-- 2. Create separate policies for each operation
-- Public can READ all config
CREATE POLICY "Anyone can read site_config" ON site_config 
FOR SELECT 
TO public 
USING (true);

-- Only Admin can INSERT
CREATE POLICY "Admin can insert site_config" ON site_config 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- Only Admin can UPDATE
CREATE POLICY "Admin can update site_config" ON site_config 
FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only Admin can DELETE
CREATE POLICY "Admin can delete site_config" ON site_config 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 3. Verify current data in site_config
SELECT key, value FROM site_config;

-- 4. If featured_pages is empty or missing, you can insert default:
-- INSERT INTO site_config (key, value) 
-- VALUES ('featured_pages', '[[{"id":1,"title":"Destaque 1","url":"","type":"video"},{"id":2,"title":"Destaque 2","url":"","type":"video"},{"id":3,"title":"Destaque 3","url":"","type":"video"},{"id":4,"title":"Destaque 4","url":"","type":"video"},{"id":5,"title":"Destaque 5","url":"","type":"video"},{"id":6,"title":"Destaque 6","url":"","type":"video"},{"id":7,"title":"Destaque 7","url":"","type":"video"},{"id":8,"title":"Destaque 8","url":"","type":"video"}]]'::jsonb)
-- ON CONFLICT (key) DO NOTHING;
