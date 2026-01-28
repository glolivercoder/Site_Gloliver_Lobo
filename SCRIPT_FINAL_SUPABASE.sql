-- =========================================================
-- SCRIPT FINAL SUPABASE - EXECUÇÃO PASSO A PASSO
-- Execute cada bloco separadamente no SQL Editor do Supabase
-- =========================================================

-- BLOCO 1: REMOVER POLÍTICA ESPECÍFICA QUE ESTÁ CAUSANDO CONFLITO
-- Execute este bloco primeiro e aguarde a confirmação
DROP POLICY IF EXISTS "Admin can insert site_config" ON site_config;

-- BLOCO 2: REMOVER OUTRAS POLÍTICAS DE site_config
-- Execute este bloco após o BLOCO 1
DROP POLICY IF EXISTS "Admin only write" ON site_config;
DROP POLICY IF EXISTS "Public read config" ON site_config;
DROP POLICY IF EXISTS "Admin manage site_config" ON site_config;
DROP POLICY IF EXISTS "Anyone can read site_config" ON site_config;

-- BLOCO 3: REMOVER POLÍTICAS DE media_files
-- Execute este bloco após o BLOCO 2
DROP POLICY IF EXISTS "Public read media" ON media_files;
DROP POLICY IF EXISTS "Users can insert media" ON media_files;
DROP POLICY IF EXISTS "Owners or Admin can delete media" ON media_files;
DROP POLICY IF EXISTS "Anyone can read media" ON media_files;
DROP POLICY IF EXISTS "Authenticated can upload media" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin can delete media" ON media_files;
DROP POLICY IF EXISTS "Public read media_files" ON media_files;
DROP POLICY IF EXISTS "Authenticated insert media_files" ON media_files;
DROP POLICY IF EXISTS "Owner or Admin delete media_files" ON media_files;

-- BLOCO 4: REMOVER POLÍTICAS DE featured_slots
-- Execute este bloco após o BLOCO 3
DROP POLICY IF EXISTS "Public read featured_slots" ON featured_slots;
DROP POLICY IF EXISTS "Admin manage featured_slots" ON featured_slots;

-- BLOCO 5: REMOVER POLÍTICAS DE fan_club_posts
-- Execute este bloco após o BLOCO 4
DROP POLICY IF EXISTS "Public read posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Users can insert posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Owners or Admin can delete posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Public read fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Authenticated insert fan_club_posts" ON fan_club_posts;
DROP POLICY IF EXISTS "Owner or Admin delete fan_club_posts" ON fan_club_posts;

-- BLOCO 6: REMOVER POLÍTICAS DE profiles
-- Execute este bloco após o BLOCO 5
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;

-- BLOCO 7: REMOVER POLÍTICAS DE storage
-- Execute este bloco após o BLOCO 6
DROP POLICY IF EXISTS "Public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin delete storage" ON storage.objects;

-- BLOCO 8: CRIAR FUNÇÃO is_admin() PADRONIZADA
-- Execute este bloco após o BLOCO 7
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

-- BLOCO 9: CRIAR TABELAS (se não existirem)
-- Execute este bloco após o BLOCO 8
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fan_club_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  media_path TEXT,
  external_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  genre TEXT,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- BLOCO 10: ATIVAR RLS
-- Execute este bloco após o BLOCO 9
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_slots ENABLE ROW LEVEL SECURITY;

-- BLOCO 11: CRIAR POLÍTICAS DE site_config
-- Execute este bloco após o BLOCO 10
CREATE POLICY "Anyone can read site_config" ON site_config 
FOR SELECT TO public USING (true);

CREATE POLICY "Admin can insert site_config" ON site_config 
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update site_config" ON site_config 
FOR UPDATE TO authenticated USING (public.is_admin());

-- BLOCO 12: CRIAR POLÍTICAS DE profiles
-- Execute este bloco após o BLOCO 11
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id OR public.is_admin());

-- BLOCO 13: CRIAR POLÍTICAS DE fan_club_posts
-- Execute este bloco após o BLOCO 12
CREATE POLICY "Public read fan_club_posts" ON fan_club_posts 
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert fan_club_posts" ON fan_club_posts 
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner or Admin delete fan_club_posts" ON fan_club_posts 
FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- BLOCO 14: CRIAR POLÍTICAS DE media_files
-- Execute este bloco após o BLOCO 13
CREATE POLICY "Public read media_files" ON media_files 
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert media_files" ON media_files 
FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner or Admin delete media_files" ON media_files 
FOR DELETE USING (auth.uid() = uploaded_by OR public.is_admin());

-- BLOCO 15: CRIAR POLÍTICAS DE featured_slots
-- Execute este bloco após o BLOCO 14
CREATE POLICY "Public read featured_slots" ON featured_slots 
FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage featured_slots" ON featured_slots 
FOR ALL TO authenticated USING (public.is_admin());

-- BLOCO 16: CONFIGURAR STORAGE
-- Execute este bloco após o BLOCO 15
UPDATE storage.buckets SET public = true WHERE id = 'media';
UPDATE storage.buckets SET public = true WHERE id = 'fan_club';

CREATE POLICY "Public viewing" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'media' OR bucket_id = 'fan_club');

CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Owner or Admin delete storage" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND 
  (auth.uid() = owner OR public.is_admin())
);

-- BLOCO 17: FUNÇÕES E TRIGGERS
-- Execute este bloco após o BLOCO 16
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action, details
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    TG_TABLE_NAME || ': ' || COALESCE(NEW.title, OLD.title, 'Sem título')
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_log_fan_posts ON fan_club_posts;
CREATE TRIGGER tr_log_fan_posts AFTER INSERT OR DELETE ON public.fan_club_posts
FOR EACH ROW EXECUTE PROCEDURE public.log_activity();

DROP TRIGGER IF EXISTS tr_log_media ON media_files;
CREATE TRIGGER tr_log_media AFTER INSERT OR DELETE ON public.media_files
FOR EACH ROW EXECUTE PROCEDURE public.log_activity();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || floor(random() * 10000)::text)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_updated_at_featured_slots ON featured_slots;
CREATE TRIGGER tr_updated_at_featured_slots
  BEFORE UPDATE ON featured_slots
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at_media_files ON media_files;
CREATE TRIGGER tr_updated_at_media_files
  BEFORE UPDATE ON media_files
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- BLOCO 18: ÍNDICES E SINCRONIZAÇÃO
-- Execute este bloco após o BLOCO 17
CREATE INDEX IF NOT EXISTS idx_featured_slots_page_slot ON featured_slots(page_index, slot_index);
CREATE INDEX IF NOT EXISTS idx_media_files_genre ON media_files(genre);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);

INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FIM DO SCRIPT FINAL
-- Execute cada bloco separadamente e aguarde a confirmação
-- =========================================================