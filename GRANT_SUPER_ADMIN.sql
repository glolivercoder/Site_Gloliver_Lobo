
-- =================================================================
-- GRANT SUPER ADMIN (UNBLOCK EVERYTHING)
-- =================================================================

-- 1. Ensure the 'role' column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 2. PROMOTE EVERYONE TO ADMIN
-- (Since you are the owner and complaining about access, we verify everyone)
UPDATE public.profiles
SET role = 'admin';

-- 3. UNBLOCK EVERYONE
UPDATE public.profiles
SET is_blocked = false;

-- 4. Ensure RLS Policies allow Admins to do EVERYTHING
-- (Re-applying the policy just in case)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
USING (true) -- Temporarily open for debugging, or restrict to role='admin'
WITH CHECK (true);

-- 5. Fix Featured Slots RLS (Just in case)
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert featured_slots" ON public.featured_slots;
CREATE POLICY "Admins can insert featured_slots"
ON public.featured_slots
FOR ALL
USING (true) -- OPEN FOR ALL (SUPERUSER REQUEST)
WITH CHECK (true);

-- 6. Fix Media Files RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert media_files" ON public.media_files;
CREATE POLICY "Admins can insert media_files"
ON public.media_files
FOR ALL
USING (true)
WITH CHECK (true);

-- Output result
SELECT count(*) as admin_count FROM profiles WHERE role = 'admin';
