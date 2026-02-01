-- =========================================================================
-- BACKUP: Current RLS Policies (Execute this FIRST to see what exists)
-- =========================================================================

-- 1. List ALL current policies (Copy the output for backup)
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

-- 2. Export current is_admin() function definition
SELECT pg_get_functiondef(oid) as current_is_admin_function
FROM pg_proc 
WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace;
