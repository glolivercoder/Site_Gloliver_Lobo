-- ==============================================
-- FINAL DB FIX: SCHEMA & PERMISSIONS
-- Execute este script COMPLETO no Supabase Editor
-- ==============================================

-- 1. Resolver Ambiguidade de Colunas
-- Remove a coluna 'media_id' se existir (pois usamos 'media_file_id')
ALTER TABLE public.featured_slots DROP COLUMN IF EXISTS media_id;

-- Garante que 'media_file_id' existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'featured_slots' AND column_name = 'media_file_id') THEN
        ALTER TABLE public.featured_slots ADD COLUMN media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Corrigir Permissões (RLS) para 'featured_slots'
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para recriar
DROP POLICY IF EXISTS "Public read access" ON public.featured_slots;
DROP POLICY IF EXISTS "Admin full access" ON public.featured_slots;
DROP POLICY IF EXISTS "Anyone can read featured slots" ON public.featured_slots;
DROP POLICY IF EXISTS "Admins can update featured slots" ON public.featured_slots;

-- Cria policies corretas
CREATE POLICY "Anyone can read featured slots" ON public.featured_slots FOR SELECT USING (true);
CREATE POLICY "Admins can update featured slots" ON public.featured_slots FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. Corrigir Permissões para 'media_files' (Uploads)
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read media" ON public.media_files;
DROP POLICY IF EXISTS "Admin manage media" ON public.media_files;

CREATE POLICY "Public read media" ON public.media_files FOR SELECT USING (true);
CREATE POLICY "Admin manage media" ON public.media_files FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 4. Corrigir Tabela de Configuração (Site Config)
CREATE TABLE IF NOT EXISTS public.site_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admin update config" ON public.site_config FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
