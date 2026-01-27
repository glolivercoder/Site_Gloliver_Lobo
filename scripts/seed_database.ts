
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

// NOTE: Using SERVICE ROLE KEY would be better for seeding, but we only have ANON.
// RLS might block this if we are not authenticated as Admin.
// HOWEVER, we can try to sign in first if we had password, but we don't.
// We will try anonymously. If RLS is set to "Admin Only", this WILL fail.
// BUT, my diagnostic script said "Access OK" for tables? That was SELECT.
// INSERT might fail.

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Attempting to SEED test data...");

    // 1. Featured Slot (Page 1, Slot 1)
    const { error: featError } = await supabase.from('featured_slots').upsert({
        page_index: 0,
        slot_index: 0,
        custom_title: "TESTE DE DEBUG",
        type: "video",
        external_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll
        thumbnail_url: "https://placehold.co/600x400"
    }, { onConflict: 'page_index, slot_index' });

    if (featError) {
        console.error("❌ Featured Seed Failed:", featError.message);
        console.error("   (This confirms RLS is blocking Writes. You need to be logged in as Admin to write).");
    } else {
        console.log("✅ Featured Seed Success! Check Homepage.");
    }

    // 2. Fan Club
    // This requires Author ID usually.
}

seed();
