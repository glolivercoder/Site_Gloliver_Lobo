-- =========================================================
-- SCRIPT CORRIGIDO PARA PROBLEMA DE MÚSICAS NÃO CARREGADAS NAS ABAS DESTAQUES E GÊNEROS
-- =========================================================

-- 1. CRIAR A TABELA featured_slots (necessária para o FeaturedSection.tsx)
CREATE TABLE IF NOT EXISTS featured_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_index INTEGER NOT NULL DEFAULT 0,
  slot_index INTEGER NOT NULL DEFAULT 0,
  custom_title TEXT,
  external_url TEXT,
  type TEXT DEFAULT 'video',
  thumbnail_url TEXT,
  media_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_index, slot_index)
);

-- 2. AJUSTAR POLÍTICAS DE featured_slots (remover e criar novamente)
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public read featured_slots" ON featured_slots;
DROP POLICY IF EXISTS "Admin manage featured_slots" ON featured_slots;

-- Criar políticas corretas para featured_slots
CREATE POLICY "Public read featured_slots" ON featured_slots 
FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage featured_slots" ON featured_slots 
FOR ALL TO authenticated USING (public.is_admin());

-- 3. AJUSTAR POLÍTICAS DE media_files (remover e criar novamente)
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Anyone can read media" ON media_files;
DROP POLICY IF EXISTS "Authenticated can upload media" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin can delete media" ON media_files;
DROP POLICY IF EXISTS "Public read media_files" ON media_files;
DROP POLICY IF EXISTS "Authenticated insert media_files" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin delete media_files" ON media_files;

-- Criar políticas corretas para media_files
CREATE POLICY "Public read media_files" ON media_files 
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert media_files" ON media_files 
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner or Admin delete media_files" ON media_files 
FOR DELETE USING (auth.uid() = uploaded_by OR public.is_admin());

-- 4. AJUSTAR POLÍTICAS DE site_config (remover e criar novamente)
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin only write" ON site_config;
DROP POLICY IF EXISTS "Public read config" ON site_config;
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
DROP POLICY IF EXISTS "Anyone can read site_config" ON site_config;

-- Criar políticas corretas para site_config
CREATE POLICY "Anyone can read site_config" ON site_config 
FOR SELECT TO public USING (true);

CREATE POLICY "Admin can insert site_config" ON site_config 
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update site_config" ON site_config 
FOR UPDATE TO authenticated USING (public.is_admin());

-- 5. AJUSTAR POLÍTICAS DE fan_club_posts (remover e criar novamente)
ALTER TABLE fan_club_posts ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Public read fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Authenticated insert fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Owner or Admin delete fan_club_posts" ON fan_club_posts;

-- Criar políticas corretas para fan_club_posts
CREATE POLICY "Public read fan_club_posts" ON fan_club_posts 
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert fan_club_posts" ON fan_club_posts 
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner or Admin delete fan_club_posts" ON fan_club_posts 
FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- 6. GARANTIR QUE OS BUCKETS ESTEJAM PÚBLICOS
UPDATE storage.buckets SET public = true WHERE id = 'media';
UPDATE storage.buckets SET public = true WHERE id = 'fan_club';

-- 7. REDEFINIR POLÍTICAS DE STORAGE (remover e criar novamente)
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;

CREATE POLICY "Public viewing" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media');

-- 8. GARANTIR QUE A FUNÇÃO is_admin() ESTEJA CORRETA
-- Se ainda houver problemas, substitua a função is_admin() por:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o email é o do administrador ou se tem claim admin
  RETURN (
    auth.jwt() ->> 'email' = 'gloliverlobo@gmail.com' 
    OR (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ATUALIZAR A COLUNA updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para featured_slots
DROP TRIGGER IF EXISTS tr_updated_at_featured_slots ON featured_slots;
CREATE TRIGGER tr_updated_at_featured_slots
  BEFORE UPDATE ON featured_slots
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger para media_files
DROP TRIGGER IF EXISTS tr_updated_at_media_files ON media_files;
CREATE TRIGGER tr_updated_at_media_files
  BEFORE UPDATE ON media_files
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 10. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_featured_slots_page_slot ON featured_slots(page_index, slot_index);
CREATE INDEX IF NOT EXISTS idx_media_files_genre ON media_files(genre);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);

-- 11. SINCRONIZAR PERFIS (garantir que todos os usuários tenham perfil)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 12. VERIFICAR SE AS TABELAS ESTÃO CORRETAMENTE CONFIGURADAS
-- Teste rápido para garantir que as consultas do frontend funcionem
-- SELECT * FROM featured_slots LIMIT 1;
-- SELECT * FROM media_files LIMIT 1;
-- SELECT * FROM profiles LIMIT 1;

-- =========================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- =========================================================