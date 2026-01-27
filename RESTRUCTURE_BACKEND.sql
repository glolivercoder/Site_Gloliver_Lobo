-- =================================================================
-- RESTRUCTURE BACKEND: MIGRATION TO RELATIONAL SCHEMA
-- =================================================================

-- 1. Create the new table for Featured Slots
-- Replaces the huge JSON in 'site_config' with proper rows.
CREATE TABLE IF NOT EXISTS public.featured_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_index INTEGER NOT NULL, -- 0 for Page 1, 1 for Page 2...
    slot_index INTEGER NOT NULL, -- 0-7 for the 8 slots
    
    title TEXT,
    type TEXT CHECK (type IN ('audio', 'video', 'image')),
    
    -- Option A: Linked to uploaded media (The "Right" Way)
    media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
    
    -- Option B: Manual Override (For external YouTube links etc)
    external_url TEXT,
    
    -- Custom Thumbnail (If undefined, use media thumbnail or default)
    thumbnail_url TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure we don't have duplicate entries for the same slot
    UNIQUE(page_index, slot_index)
);

-- 2. Security (RLS) for the new table
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;

-- Public can Read EVERYTHING
CREATE POLICY "Public Read Slots"
ON public.featured_slots FOR SELECT
TO public
USING (true);

-- Admin can Do EVERYTHING (Insert, Update, Delete)
CREATE POLICY "Admin Manage Slots"
ON public.featured_slots FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Cleanup Legacy Data (Optional but recommended)
-- We don't delete 'site_config' yet to allow rollback, 
-- but we can add a comment.
COMMENT ON TABLE public.featured_slots IS 'Stores Featured Content relations, replacing site_config[featured_pages].';

-- 4. Grant Permissions
GRANT SELECT ON public.featured_slots TO public;
GRANT ALL ON public.featured_slots TO authenticated;
GRANT USAGE ON SEQUENCE featured_slots_id_seq TO authenticated; -- If generic Identity used (UUID doesn't allow sequences but good practice for serials)
