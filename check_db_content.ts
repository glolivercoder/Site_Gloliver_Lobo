
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('--- TESTANDO CONEXÃO COM SUPABASE ---');

    // 1. Test Simple Select
    const { data: healthCheck, error: healthError } = await supabase.from('site_config').select('count', { count: 'exact', head: true });

    if (healthError) {
        console.error('❌ ERRO DE CONEXÃO:', healthError.message);
        return;
    }
    console.log('✅ Conexão estabelecida com sucesso!');

    // 2. List Admins
    console.log('\n--- VERIFICANDO ADMINISTRADORES ---');
    const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, email, username, role, full_name')
        .eq('role', 'admin');

    if (adminError) {
        console.error('❌ Erro ao buscar admins:', adminError.message);
    } else if (admins && admins.length > 0) {
        console.log('✅ Administradores encontrados:', JSON.stringify(admins, null, 2));
    } else {
        console.log('⚠️ Nenhum administrador encontrado na tabela "profiles" com role="admin".');
    }

    // 3. List All Users (Limit 5) just to check data
    console.log('\n--- AMOSTRA DE USUÁRIOS (Limit 5) ---');
    const { data: users } = await supabase.from('profiles').select('email, role').limit(5);
    console.log(users);
}

checkStatus();
