import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! You MUST add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Cloudflare/Vercel Environment Variables.");
}

// Fallback to avoid total crash, but features will fail
const safeUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeKey = supabaseAnonKey || "placeholder";

export const supabase = createClient(safeUrl, safeKey);

// Helper to get public URL for images/files from storage
export const getSupabaseUrl = (bucket: string, path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};
