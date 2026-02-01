import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables! Check .env.local");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // CRITICAL: Detects OAuth tokens in URL after redirect
        flowType: 'pkce', // Use PKCE flow for better security
        storageKey: 'gloliverlobo-auth', // Explicit storage key
    }
});

// Helper to get full storage URL
export const getSupabaseUrl = (bucket: string, path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};
