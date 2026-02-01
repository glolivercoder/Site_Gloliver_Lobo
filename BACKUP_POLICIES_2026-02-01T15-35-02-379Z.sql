-- BACKUP: Supabase RLS Policies
-- Date: 2026-02-01T15:34:57.555Z
-- Project: https://trgvxjbazxripssubgit.supabase.co
============================================================

-- Table site_config: 3 rows
-- Table profiles: 4 rows
-- Table fan_club_posts: 0 rows
-- Table media_files: 30 rows
-- Table featured_slots: 9 rows
-- Table activity_logs: 95 rows

-- is_admin() function result for current user: false

-- ADMIN USERS:
--   glolivercoder@gmail.com (role: admin)
--   gloliverlobo@gmail.com (role: admin)
--   gloliverx@gmail.com (role: admin)

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
