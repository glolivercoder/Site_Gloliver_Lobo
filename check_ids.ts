import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkIdMatching() {
    console.log('='.repeat(60));
    console.log('VERIFICAÇÃO DE IDs: auth.users vs profiles');
    console.log('='.repeat(60));

    const adminEmails = ['glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com'];

    // Get auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData.users;

    // Get profiles
    const { data: profiles } = await supabase.from('profiles').select('*');

    console.log('\n--- COMPARAÇÃO DETALHADA ---\n');

    for (const email of adminEmails) {
        const authUser = authUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        const profile = profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());

        console.log(`📧 ${email}`);
        console.log(`   Auth ID:    ${authUser?.id || 'NÃO ENCONTRADO'}`);
        console.log(`   Profile ID: ${profile?.id || 'NÃO ENCONTRADO'}`);

        if (authUser && profile) {
            if (authUser.id === profile.id) {
                console.log(`   Status: ✅ IDs CORRESPONDEM`);
            } else {
                console.log(`   Status: ❌ IDs NÃO CORRESPONDEM - ESTE É O PROBLEMA!`);
                console.log(`   O perfil precisa ser atualizado para usar o ID correto do auth.`);
            }
        } else if (authUser && !profile) {
            console.log(`   Status: ❌ PERFIL AUSENTE - precisa criar perfil com ID do auth`);
        }
        console.log('');
    }

    // Create fix SQL
    console.log('='.repeat(60));
    console.log('SQL PARA CORRIGIR IDs (se necessário):');
    console.log('='.repeat(60));

    for (const email of adminEmails) {
        const authUser = authUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        const profile = profiles?.find(p => p.email?.toLowerCase() === email.toLowerCase());

        if (authUser && profile && authUser.id !== profile.id) {
            console.log(`\n-- Corrigir ${email}`);
            console.log(`DELETE FROM profiles WHERE id = '${profile.id}';`);
            console.log(`INSERT INTO profiles (id, email, username, role) VALUES ('${authUser.id}', '${email}', '${profile.username || email.split('@')[0]}', 'admin');`);
        } else if (authUser && !profile) {
            console.log(`\n-- Criar perfil para ${email}`);
            console.log(`INSERT INTO profiles (id, email, username, role) VALUES ('${authUser.id}', '${email}', '${email.split('@')[0]}', 'admin');`);
        }
    }
}

checkIdMatching().catch(console.error);
