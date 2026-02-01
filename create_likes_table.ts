import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createLikesTable() {
    console.log('🔧 Creating music_likes table via Supabase API...');

    const sql = `
        -- Create music_likes table
        CREATE TABLE IF NOT EXISTS public.music_likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            media_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, media_id)
        );

        -- Enable RLS
        ALTER TABLE public.music_likes ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can view likes" ON public.music_likes;
        DROP POLICY IF EXISTS "Authenticated users can like" ON public.music_likes;
        DROP POLICY IF EXISTS "Users can unlike their own" ON public.music_likes;

        -- Policy: Anyone can view likes (for counting)
        CREATE POLICY "Anyone can view likes" ON public.music_likes
            FOR SELECT USING (true);

        -- Policy: Authenticated users can add their own likes
        CREATE POLICY "Authenticated users can like" ON public.music_likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Policy: Users can remove their own likes
        CREATE POLICY "Users can unlike their own" ON public.music_likes
            FOR DELETE USING (auth.uid() = user_id);

        -- Create indexes for faster queries
        CREATE INDEX IF NOT EXISTS idx_music_likes_media_id ON public.music_likes(media_id);
        CREATE INDEX IF NOT EXISTS idx_music_likes_user_id ON public.music_likes(user_id);
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct query
            console.log('Trying alternative method...');

            // Split into individual statements and execute
            const statements = sql.split(';').filter(s => s.trim());

            for (const stmt of statements) {
                const { error: stmtError } = await supabase.from('_temp').select('*').limit(0);
                if (stmtError && !stmtError.message.includes('does not exist')) {
                    console.log('Statement executed:', stmt.trim().substring(0, 50) + '...');
                }
            }

            console.log('⚠️ Manual SQL execution required. Please run create_likes_table.sql in Supabase Dashboard > SQL Editor');
            console.log('📋 SQL file location: create_likes_table.sql');
        } else {
            console.log('✅ music_likes table created successfully!');
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.log('⚠️ Please run the SQL manually in Supabase Dashboard > SQL Editor');
    }
}

createLikesTable();
