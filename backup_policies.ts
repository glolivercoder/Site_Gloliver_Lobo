import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase credentials from .env.local
const supabaseUrl = 'https://trgvxjbazxripssubgit.supabase.co';
const supabaseKey = 'sb_publishable_HpbJH1x9Lkcby3ME0w74Eg_uiMRV6Ay';

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupPolicies() {
    console.log('='.repeat(60));
    console.log('BACKUP: Current RLS Policies from Supabase');
    console.log('Date:', new Date().toISOString());
    console.log('='.repeat(60));

    let backupContent = `-- BACKUP: Supabase RLS Policies\n-- Date: ${new Date().toISOString()}\n-- Project: ${supabaseUrl}\n${'='.repeat(60)}\n\n`;

    try {
        // Query pg_policies view using RPC or direct query
        // Note: This requires service_role key for full access, but we'll try with anon

        // 1. Get all tables
        const tables = ['site_config', 'profiles', 'fan_club_posts', 'media_files', 'featured_slots', 'activity_logs'];

        console.log('\n--- TABLES STATUS ---');
        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                backupContent += `-- Table ${table}: ERROR - ${error.message}\n`;
            } else {
                console.log(`✅ ${table}: ${count ?? 0} rows`);
                backupContent += `-- Table ${table}: ${count ?? 0} rows\n`;
            }
        }

        // 2. Get current is_admin function (if accessible)
        console.log('\n--- CHECKING is_admin FUNCTION ---');
        const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
        if (adminError) {
            console.log('is_admin() check:', adminError.message);
            backupContent += `\n-- is_admin() function exists but returned: ${adminError.message}\n`;
        } else {
            console.log('is_admin() result:', adminCheck);
            backupContent += `\n-- is_admin() function result for current user: ${adminCheck}\n`;
        }

        // 3. Get all profiles with roles
        console.log('\n--- ADMIN USERS ---');
        const { data: admins, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, username, role')
            .eq('role', 'admin');

        if (admins && admins.length > 0) {
            console.log('Admin users found:');
            backupContent += `\n-- ADMIN USERS:\n`;
            for (const admin of admins) {
                console.log(`  - ${admin.email} (${admin.role})`);
                backupContent += `--   ${admin.email} (role: ${admin.role})\n`;
            }
        } else {
            console.log('No admin users found in profiles table');
            backupContent += `\n-- No admin users found in profiles table\n`;
        }

        // 4. For full policy backup, we need to query pg_policies
        // This requires service_role key or direct SQL access
        backupContent += `
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
`;

        // Save backup file
        const backupPath = path.join(process.cwd(), 'BACKUP_POLICIES_' + new Date().toISOString().replace(/[:.]/g, '-') + '.sql');
        fs.writeFileSync(backupPath, backupContent);
        console.log(`\n✅ Backup saved to: ${backupPath}`);

    } catch (err) {
        console.error('Backup error:', err);
    }
}

backupPolicies();
