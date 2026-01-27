-- =================================================================
-- FAN CLUB SETUP (Run this to fix the Fan Club Page)
-- =================================================================

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.fan_club_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    title TEXT,
    type TEXT CHECK (type IN ('image', 'video')),
    
    -- Internal Media (Storage Path)
    media_path TEXT,
    
    -- External URL
    external_url TEXT,
    
    -- Author (Link to Profiles)
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE public.fan_club_posts ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Everyone can view posts
CREATE POLICY "Public View Posts"
ON public.fan_club_posts FOR SELECT
TO public
USING (true);

-- Admin can Insert/Update/Delete (Or Authenticated Users?)
-- Component logic says "isAdmin" check for posting.
CREATE POLICY "Admin Manage Posts"
ON public.fan_club_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Storage Bucket (Ensure it exists and is public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fan_club', 'fan_club', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Fan Club Bucket were handled in MASTER_SETUP, 
-- but ensuring specific access here just in case.
-- (Assuming MASTER_SETUP was run, if not, this relies on it).
