import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
    console.log('='.repeat(60));
    console.log('DIAGNÓSTICO: Google Login e Admin Access');
    console.log('='.repeat(60));

    // 1. Check all profiles
    console.log('\n--- TODOS OS PERFIS ---');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, username, role, created_at');

    if (profileError) {
        console.error('Erro ao buscar perfis:', profileError.message);
    } else {
        console.log(`Total: ${profiles?.length} perfis`);
        profiles?.forEach(p => {
            console.log(`  - ${p.email} | role: ${p.role} | id: ${p.id}`);
        });
    }

    // 2. Check auth.users table
    console.log('\n--- USUÁRIOS AUTENTICADOS (auth.users) ---');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Erro ao listar usuários auth:', authError.message);
    } else {
        console.log(`Total: ${authUsers.users?.length} usuários`);
        authUsers.users?.forEach(u => {
            console.log(`  - ${u.email} | provider: ${u.app_metadata?.provider} | id: ${u.id}`);
        });
    }

    // 3. Check for mismatched profiles
    console.log('\n--- ANÁLISE ---');
    const adminEmails = ['glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'];

    for (const email of adminEmails) {
        const profile = profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());
        const authUser = authUsers.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        console.log(`\n${email}:`);
        console.log(`  Auth User: ${authUser ? '✅ Existe (id: ' + authUser.id.substring(0, 8) + '...)' : '❌ NÃO EXISTE'}`);
        console.log(`  Profile: ${profile ? '✅ Existe (role: ' + profile.role + ')' : '❌ NÃO EXISTE'}`);

        if (authUser && !profile) {
            console.log('  ⚠️  PROBLEMA: Usuário existe em auth mas NÃO tem perfil!');
        }

        if (authUser && profile && authUser.id !== profile.id) {
            console.log('  ⚠️  PROBLEMA: IDs não correspondem!');
            console.log(`     Auth ID: ${authUser.id}`);
            console.log(`     Profile ID: ${profile.id}`);
        }
    }

    // 4. Check is_admin function
    console.log('\n--- TESTANDO is_admin() ---');
    // Note: This requires being authenticated as the user, so we can't test directly
    console.log('(Esta função só pode ser testada com sessão ativa do usuário)');
}

diagnose().catch(console.error);
