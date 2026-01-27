-- =================================================================
-- FINAL RELEASE SCRIPT (RUN THIS TO FIX EVERYTHING)
-- =================================================================

-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LOWER(auth.jwt() ->> 'email') = 'glolivercoder@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABLE SETUP (Idempotent)

-- A) PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- B) MEDIA FILES
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    file_path TEXT,
    type TEXT,
    genre TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- C) FEATURED SLOTS (New Home Display)
CREATE TABLE IF NOT EXISTS public.featured_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_index INTEGER NOT NULL,
    slot_index INTEGER NOT NULL,
    custom_title TEXT,
    type TEXT,
    external_url TEXT,
    thumbnail_url TEXT,
    custom_thumbnail TEXT,
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(page_index, slot_index)
);
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;

-- D) SITE CONFIG (Legacy/Misc Settings)
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- E) FAN CLUB POSTS
CREATE TABLE IF NOT EXISTS public.fan_club_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    type TEXT CHECK (type IN ('image', 'video')),
    media_path TEXT,
    external_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.fan_club_posts ENABLE ROW LEVEL SECURITY;

-- 3. RESET & APPLY POLICIES

-- Helper to drop policies safely
DO $$ 
BEGIN 
    -- MEDIA FILES
    DROP POLICY IF EXISTS "Public Read Media" ON media_files;
    DROP POLICY IF EXISTS "Auth Insert Media" ON media_files;
    DROP POLICY IF EXISTS "Admin Delete Media" ON media_files;
    -- FEATURED SLOTS
    DROP POLICY IF EXISTS "Public Read Featured" ON featured_slots;
    DROP POLICY IF EXISTS "Admin Manage Featured" ON featured_slots;
    -- SITE CONFIG
    DROP POLICY IF EXISTS "Public Read Config" ON site_config;
    DROP POLICY IF EXISTS "Admin Manage Config" ON site_config;
    -- FAN CLUB
    DROP POLICY IF EXISTS "Public Read FanClub" ON fan_club_posts;
    DROP POLICY IF EXISTS "Admin Manage FanClub" ON fan_club_posts;
    -- PROFILES
    DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
    DROP POLICY IF EXISTS "User Update Own" ON profiles;
    DROP POLICY IF EXISTS "User Insert Own" ON profiles;
END $$;

-- MEDIA FILES POLICIES
CREATE POLICY "Public Read Media" ON public.media_files FOR SELECT TO public USING (true);
CREATE POLICY "Auth Insert Media" ON public.media_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Delete Media" ON public.media_files FOR DELETE TO authenticated USING ((auth.uid() = uploaded_by) OR public.is_admin());

-- FEATURED SLOTS POLICIES
CREATE POLICY "Public Read Featured" ON public.featured_slots FOR SELECT TO public USING (true);
CREATE POLICY "Admin Manage Featured" ON public.featured_slots FOR ALL TO authenticated USING (public.is_admin());

-- SITE CONFIG POLICIES
CREATE POLICY "Public Read Config" ON public.site_config FOR SELECT TO public USING (true);
CREATE POLICY "Admin Manage Config" ON public.site_config FOR ALL TO authenticated USING (public.is_admin());

-- FAN CLUB POLICIES
CREATE POLICY "Public Read FanClub" ON public.fan_club_posts FOR SELECT TO public USING (true);
CREATE POLICY "Admin Manage FanClub" ON public.fan_club_posts FOR ALL TO authenticated USING (public.is_admin());

-- PROFILES POLICIES
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "User Update Own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());
-- Insert handle by Trigger usually, but allow manual:
CREATE POLICY "User Insert Own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 4. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('fan_club', 'fan_club', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public 
USING (bucket_id IN ('media', 'fan_club'));

CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id IN ('media', 'fan_club'));

CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated 
USING (auth.uid() = owner OR public.is_admin());

-- 5. DATA SYNC (Sync existing Auth Users to Profiles)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'FINAL RELEASE SETUP COMPLETED SUCCESSFULLY.';
END $$;
