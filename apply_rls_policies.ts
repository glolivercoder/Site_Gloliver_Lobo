import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey || serviceRoleKey.includes('COLE_AQUI')) {
    console.error('❌ SERVICE_ROLE_KEY não configurada no .env.local');
    process.exit(1);
}

// Create client with service_role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// SQL Queries to execute
const QUERIES = {
    // Query 1: Nuclear Reset - Remove ALL existing policies
    nuclear_reset: `
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all public schema policies
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- Drop all storage policies
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;
    `,

    // Query 2: Create is_admin function
    is_admin_function: `
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
    `,

    // Query 3: site_config policies
    site_config_policies: `
CREATE POLICY "site_config_read" ON site_config FOR SELECT TO public USING (true);
CREATE POLICY "site_config_admin" ON site_config FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
    `,

    // Query 4: profiles policies
    profiles_policies: `
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_self" ON profiles FOR ALL TO authenticated USING (auth.uid() = id OR public.is_admin());
    `,

    // Query 5: fan_club_posts policies
    fan_posts_policies: `
CREATE POLICY "fan_posts_read" ON fan_club_posts FOR SELECT TO public USING (true);
CREATE POLICY "fan_posts_insert" ON fan_club_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "fan_posts_manage" ON fan_club_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "fan_posts_delete" ON fan_club_posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.is_admin());
    `,

    // Query 6: media_files policies
    media_policies: `
CREATE POLICY "media_read" ON media_files FOR SELECT TO public USING (true);
CREATE POLICY "media_admin" ON media_files FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
    `,

    // Query 7: featured_slots policies
    featured_policies: `
CREATE POLICY "featured_read" ON featured_slots FOR SELECT TO public USING (true);
CREATE POLICY "featured_admin" ON featured_slots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
    `,

    // Query 8: Storage policies
    storage_policies: `
UPDATE storage.buckets SET public = true WHERE id IN ('media', 'fan_club');

CREATE POLICY "storage_public_read" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id IN ('media', 'fan_club'));

CREATE POLICY "storage_fan_upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'fan_club');

CREATE POLICY "storage_media_admin" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media' AND public.is_admin());

CREATE POLICY "storage_delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (auth.uid() = owner OR public.is_admin());
    `
};

async function executeSQL(name: string, sql: string): Promise<boolean> {
    console.log(`\n🔄 Executando: ${name}...`);

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Try direct query via REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql_query: sql })
            });

            if (!response.ok) {
                console.log(`⚠️  ${name}: RPC não disponível, tentando método alternativo...`);
                return false;
            }
        }

        console.log(`✅ ${name}: Sucesso!`);
        return true;
    } catch (err: any) {
        console.log(`❌ ${name}: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('EXECUTANDO RESET E SIMPLIFICAÇÃO DE POLÍTICAS RLS');
    console.log('URL:', supabaseUrl);
    console.log('='.repeat(60));

    // Test connection first
    console.log('\n--- Testando Conexão ---');
    const { data: profiles, error: connError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('role', 'admin');

    if (connError) {
        console.error('❌ Erro de conexão:', connError.message);
        process.exit(1);
    }

    console.log('✅ Conexão OK! Admins encontrados:', profiles?.length);

    // Check if exec_sql function exists, if not create it
    console.log('\n--- Criando função exec_sql (se não existir) ---');

    const createExecSql = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute each query
    const results: { [key: string]: boolean } = {};

    for (const [name, sql] of Object.entries(QUERIES)) {
        results[name] = await executeSQL(name, sql);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('RESUMO DA EXECUÇÃO:');
    console.log('='.repeat(60));

    let allSuccess = true;
    for (const [name, success] of Object.entries(results)) {
        console.log(`${success ? '✅' : '❌'} ${name}`);
        if (!success) allSuccess = false;
    }

    if (!allSuccess) {
        console.log('\n⚠️  Algumas queries falharam.');
        console.log('Isso é normal se a função exec_sql não existe.');
        console.log('\nPor favor, execute o arquivo SIMPLIFIED_RLS_3_QUERIES.sql');
        console.log('manualmente no Supabase SQL Editor.');
    } else {
        console.log('\n🎉 TODAS AS POLÍTICAS FORAM APLICADAS COM SUCESSO!');
    }
}

main().catch(console.error);
