-- ==========================================
-- SCRIPT DE CORREÇÃO DE PERMISSÕES (POLICIES)
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. CORRIGIR TABELA DE CURTIDAS (LIKES)
-- Remove policies antigas para evitar erro de "policy already exists"
DROP POLICY IF EXISTS "Anyone can view likes" ON public.music_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.music_likes;
DROP POLICY IF EXISTS "Users can unlike their own" ON public.music_likes;

-- Garante que a tabela existe
CREATE TABLE IF NOT EXISTS public.music_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id) -- Impede like duplicado
);

-- Ativa segurança
ALTER TABLE public.music_likes ENABLE ROW LEVEL SECURITY;

-- Cria as novas policies
CREATE POLICY "Anyone can view likes" ON public.music_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.music_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own" ON public.music_likes FOR DELETE USING (auth.uid() = user_id);


-- 2. CORRIGIR TABELA DE COMENTÁRIOS DO FÃ CLUBE
-- Remove policies antigas
DROP POLICY IF EXISTS "Anyone can view comments" ON public.fan_club_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.fan_club_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.fan_club_comments;

-- Garante que a tabela existe
CREATE TABLE IF NOT EXISTS public.fan_club_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.fan_club_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativa segurança
ALTER TABLE public.fan_club_comments ENABLE ROW LEVEL SECURITY;

-- Cria as novas policies
CREATE POLICY "Anyone can view comments" ON public.fan_club_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.fan_club_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.fan_club_comments FOR DELETE USING (auth.uid() = user_id);

-- Cria índice para performance
CREATE INDEX IF NOT EXISTS idx_fan_club_comments_post_id ON public.fan_club_comments(post_id);

-- 3. CORRIGIR TABELA DE DESTAQUES (Para suportar Likes)
-- Adiciona coluna media_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'featured_slots' AND column_name = 'media_id') THEN
        ALTER TABLE public.featured_slots ADD COLUMN media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL;
    END IF;
END $$;
