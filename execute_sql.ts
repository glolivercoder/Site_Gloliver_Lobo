import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env.local
const supabaseUrl = 'https://trgvxjbazxripssubgit.supabase.co';
const supabaseKey = 'sb_publishable_HpbJH1x9Lkcby3ME0w74Eg_uiMRV6Ay';

const supabase = createClient(supabaseUrl, supabaseKey);

// The simplified policies to execute
const SIMPLIFIED_QUERIES = `
-- PART 1: Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'glolivercoder@gmail.com',
      'gloliverlobo@gmail.com', 
      'gloliverx@gmail.com'
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function executeSql() {
    console.log('='.repeat(60));
    console.log('Attempting to execute SQL on Supabase...');
    console.log('='.repeat(60));

    // Try to use rpc to execute raw SQL (requires service_role key)
    // This is a security measure - anon key cannot run arbitrary SQL

    // Method 1: Try calling existing RPC functions to verify connection
    console.log('\n--- Testing Connection ---');
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

    if (adminError) {
        console.log('is_admin() error:', adminError.message);
    } else {
        console.log('is_admin() result:', adminCheck);
    }

    // Method 2: Try to read current policies via information schema (if accessible)
    console.log('\n--- Checking Current State ---');

    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('role', 'admin');

    if (profiles) {
        console.log('Admin users:', profiles);
    }

    console.log('\n' + '='.repeat(60));
    console.log('IMPORTANT: Direct SQL execution requires SERVICE_ROLE key');
    console.log('The anon key (sb_publishable_*) can only read/write data through RLS policies');
    console.log('It CANNOT create/modify functions or policies');
    console.log('='.repeat(60));
    console.log('\nTo execute SQL, you have these options:');
    console.log('1. Use Supabase Dashboard SQL Editor (manual)');
    console.log('2. Use Supabase CLI with service_role key');
    console.log('3. Provide the SERVICE_ROLE key (starts with "eyJ...")');
}

executeSql();
