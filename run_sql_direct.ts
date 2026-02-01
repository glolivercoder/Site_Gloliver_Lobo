import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Supabase PostgreSQL connection string
// Transaction pooler endpoint (us-west-2)
// Password URL-encoded: BHcuT1!jT*J& -> BHcuT1%21jT%2AJ%26
const connectionString = 'postgresql://postgres.trgvxjbazxripssubgit:BHcuT1%21jT%2AJ%26@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function executeSQL() {
    console.log('='.repeat(60));
    console.log('EXECUTANDO SQL NO SUPABASE VIA POSTGRESQL');
    console.log('='.repeat(60));

    const client = new Client({ connectionString });

    try {
        console.log('\n🔄 Conectando ao PostgreSQL...');
        await client.connect();
        console.log('✅ Conectado!');

        // Read the SQL file
        const sqlFilePath = path.join(process.cwd(), 'SIMPLIFIED_RLS_3_QUERIES.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split by query markers and execute each
        console.log('\n🔄 Executando queries...\n');

        // Execute the entire script
        await client.query(sqlContent);

        console.log('✅ TODAS AS QUERIES EXECUTADAS COM SUCESSO!');

    } catch (err: any) {
        console.error('❌ Erro:', err.message);

        // If connection fails, try with session pooler
        if (err.message.includes('password') || err.message.includes('authentication')) {
            console.log('\n⚠️  A senha do banco de dados é necessária.');
            console.log('Por favor, vá em Supabase Dashboard → Settings → Database');
            console.log('E copie a "Connection string" completa (URI format)');
        }
    } finally {
        await client.end();
    }
}

executeSQL();
