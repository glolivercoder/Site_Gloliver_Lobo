-- BACKUP: Supabase RLS Policies
-- Date: 2026-02-01T15:34:04.839Z
-- Project: https://trgvxjbazxripssubgit.supabase.co
============================================================

-- Table site_config: ERROR - 
-- Table profiles: ERROR - 
-- Table fan_club_posts: ERROR - 
-- Table media_files: ERROR - 
-- Table featured_slots: ERROR - 
-- Table activity_logs: ERROR - 

-- is_admin() function exists but returned: Invalid API key

-- No admin users found in profiles table

-- =========================================================================
-- NOTE: Full RLS policy backup requires service_role key or direct SQL access
-- To get complete policy definitions, run this in Supabase SQL Editor:
-- =========================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- To export is_admin() function:
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace;
