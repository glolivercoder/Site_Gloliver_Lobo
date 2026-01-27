
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- SUPABASE DIAGNOSTIC TOOL ---");
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? "Found (Hidden)" : "MISSING"}`);

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Missing Environment Variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
    console.log(`\nChecking Table: '${tableName}'...`);
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (error) {
        console.error(`❌ ERROR accessing '${tableName}':`, error.message);
        if (error.code === '42P01') console.error("   -> PROBABLE CAUSE: Table does not exist (Did you run the SQL script?)");
        if (error.code === '42501') console.error("   -> PROBABLE CAUSE: RLS Policy blocking access (Did you run the SQL script?)");
    } else {
        console.log(`✅ SUCCESS: Access OK. Rows found: ${count}`);
    }
}

async function checkStorage(bucketName: string) {
    console.log(`\nChecking Storage Bucket: '${bucketName}'...`);
    const { data, error } = await supabase.storage.from(bucketName).list();
    if (error) {
        console.error(`❌ ERROR accessing bucket '${bucketName}':`, error.message);
    } else {
        console.log(`✅ SUCCESS: Access OK. Files found at root: ${data?.length || 0}`);
    }
}

async function run() {
    await checkTable('media_files');
    await checkTable('featured_slots');
    await checkTable('fan_club_posts');
    await checkTable('site_config');
    await checkTable('profiles');

    await checkStorage('media');
    await checkStorage('fan_club');

    console.log("\n--- DIAGNOSTIC COMPLETE ---");
    console.log("If you see 'Table does not exist' or 'Rows found: 0', please run the FINAL_RELEASE.sql script in Supabase.");
}

run();
