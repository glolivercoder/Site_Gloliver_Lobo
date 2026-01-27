-- =========================================================
-- FINAL CONSOLIDATED FIX (RUN THIS IN SUPABASE SQL EDITOR)
-- =========================================================

-- 1. SYNC STORAGE (Make buckets public)
UPDATE storage.buckets SET public = true WHERE id = 'media';
UPDATE storage.buckets SET public = true WHERE id = 'fan_club';

-- 2. SYNC PROFILES (Crucial for joins like 'profiles(email)')
-- This ensures every user in auth.users has a profile in public.profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name' 
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. ENSURE COLS EXIST
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS type TEXT; -- 'audio', 'video', 'image'

-- 4. FIX CONSTRAINTS SAFELY (Idempotent)
DO $$ 
BEGIN
    -- Fix media_files -> profiles relationship
    ALTER TABLE public.media_files DROP CONSTRAINT IF EXISTS media_files_uploaded_by_fkey;
    ALTER TABLE public.media_files DROP CONSTRAINT IF EXISTS media_files_uploaded_by_profiles_fkey;
    
    -- Try to add the constraint. If it fails, it's likely due to orphaned IDs.
    -- We'll catch it, clean up, and try again.
    BEGIN
        ALTER TABLE public.media_files 
        ADD CONSTRAINT media_files_uploaded_by_profiles_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.media_files SET uploaded_by = NULL 
        WHERE uploaded_by NOT IN (SELECT id FROM public.profiles);
        
        ALTER TABLE public.media_files 
        ADD CONSTRAINT media_files_uploaded_by_profiles_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END;

    -- Fix fan_club_posts -> profiles relationship
    ALTER TABLE public.fan_club_posts DROP CONSTRAINT IF EXISTS fan_club_posts_author_id_fkey;
    ALTER TABLE public.fan_club_posts DROP CONSTRAINT IF EXISTS fan_club_posts_author_id_profiles_fkey;
    BEGIN
        ALTER TABLE public.fan_club_posts 
        ADD CONSTRAINT fan_club_posts_author_id_profiles_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.fan_club_posts SET author_id = NULL 
        WHERE author_id NOT IN (SELECT id FROM public.profiles);
        
        ALTER TABLE public.fan_club_posts 
        ADD CONSTRAINT fan_club_posts_author_id_profiles_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END;
END $$;

-- 5. POLICIES (Reset to clean state)
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
CREATE POLICY "Public viewing" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'media' AND 
  (public.is_admin() OR ((metadata->>'size')::int < 10500000))
);

-- 6. ADMIN CONFIG POLICY
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
CREATE POLICY "Admin manage site_config" ON site_config FOR ALL USING (public.is_admin());
