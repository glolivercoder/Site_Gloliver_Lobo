import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAuthConfig() {
    console.log('='.repeat(60));
    console.log('VERIFICANDO CONFIGURAÇÃO DE AUTENTICAÇÃO SUPABASE');
    console.log('='.repeat(60));

    // 1. Check project URL
    console.log('\n📍 Supabase URL:', supabaseUrl);

    // 2. Check recent auth.users activity
    console.log('\n--- ÚLTIMOS USUÁRIOS AUTENTICADOS ---');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Erro:', authError.message);
    } else {
        const recentUsers = authData.users
            .sort((a, b) => new Date(b.last_sign_in_at || 0).getTime() - new Date(a.last_sign_in_at || 0).getTime())
            .slice(0, 5);

        recentUsers.forEach(u => {
            console.log(`  - ${u.email}`);
            console.log(`    Último login: ${u.last_sign_in_at || 'Nunca'}`);
            console.log(`    Provider: ${u.app_metadata?.provider || 'N/A'}`);
            console.log(`    Confirmado: ${u.email_confirmed_at ? 'Sim' : 'Não'}`);
        });
    }

    // 3. Check if there are any audit logs (requires admin)
    console.log('\n--- INFORMAÇÕES IMPORTANTES ---');
    console.log('Para verificar a configuração OAuth do Google:');
    console.log('1. Supabase Dashboard → Authentication → Providers → Google');
    console.log('2. Verifique se "Google" está ENABLED');
    console.log('3. Verifique se Client ID e Secret estão corretos');
    console.log('');
    console.log('Para verificar URLs de Redirect:');
    console.log('1. Supabase Dashboard → Authentication → URL Configuration');
    console.log('2. Site URL deve ser: https://sitegloliverlobo.pages.dev');
    console.log('3. Redirect URLs deve incluir: https://sitegloliverlobo.pages.dev/*');
    console.log('');
    console.log('No Google Cloud Console:');
    console.log('1. APIs & Services → Credentials → OAuth 2.0 Client');
    console.log('2. Authorized redirect URIs deve incluir:');
    console.log(`   ${supabaseUrl}/auth/v1/callback`);

    // 4. Test if the auth endpoint is reachable
    console.log('\n--- TESTANDO ENDPOINT DE AUTH ---');
    try {
        const response = await fetch(`${supabaseUrl}/auth/v1/settings`);
        const settings = await response.json();
        console.log('Resposta do endpoint /auth/v1/settings:');
        console.log(JSON.stringify(settings, null, 2));
    } catch (err: any) {
        console.error('Erro ao acessar endpoint:', err.message);
    }
}

checkAuthConfig().catch(console.error);
