-- ==============================================
-- FIX STORAGE PERMISSIONS (BUCKETS & OBJECTS)
-- Execute este script no Supabase Editor sql
-- ==============================================

-- 1. Forçar buckets públicos
UPDATE storage.buckets
SET public = true
WHERE id IN ('media', 'fan_club');

-- Se os buckets não existirem, cria-os pública
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('fan_club', 'fan_club', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remover policies antigas (para evitar conflitos)
DROP POLICY IF EXISTS "Public Access Media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access FanClub" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Criar Policies Unificadas

-- PERMITIR LEITURA PÚBLICA (Todos podem ver/ouvir)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('media', 'fan_club') );

-- PERMITIR UPLOAD PARA AUTENTICADOS (Login necessário)
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('media', 'fan_club') 
  AND auth.role() = 'authenticated'
);

-- PERMITIR UPDATE/DELETE APENAS PARA DONOS OU ADMINS
CREATE POLICY "Owner/Admin Manage"
ON storage.objects FOR ALL
USING (
  bucket_id IN ('media', 'fan_club')
  AND (
    auth.uid() = owner -- Dono do arquivo
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') -- Admin
  )
);
