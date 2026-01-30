
-- FIX MISSING UPDATE POLICIES / CORREÇÃO DE POLÍTICAS DE ATUALIZAÇÃO

-- 1. Ensure is_admin is correct (Garante que a função is_admin está correta)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role text;
BEGIN
  -- 1. Verifica lista hardcoded
  IF auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com') THEN
    RETURN true;
  END IF;

  -- 2. Verifica Metadados
  IF (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- 3. Verifica Tabela de Perfis
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Add UPDATE policy for media_files (Adiciona permissão para editar músicas/gêneros)
DROP POLICY IF EXISTS "Admin update media_files" ON media_files;
CREATE POLICY "Admin update media_files" ON media_files 
FOR UPDATE TO authenticated 
USING (public.is_admin() OR auth.uid() = uploaded_by)
WITH CHECK (public.is_admin() OR auth.uid() = uploaded_by);

-- 3. Add UPDATE policy for fan_club_posts (Adiciona permissão para editar posts)
DROP POLICY IF EXISTS "Admin update fan_club_posts" ON fan_club_posts;
CREATE POLICY "Admin update fan_club_posts" ON fan_club_posts 
FOR UPDATE TO authenticated 
USING (public.is_admin() OR auth.uid() = author_id)
WITH CHECK (public.is_admin() OR auth.uid() = author_id);

-- 4. Ensure Storage UPDATE permissions (Garante permissão de edição no Storage)
DROP POLICY IF EXISTS "Admin update storage" ON storage.objects;
CREATE POLICY "Admin update storage" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (auth.uid() = owner OR public.is_admin()))
WITH CHECK (bucket_id = 'media' AND (auth.uid() = owner OR public.is_admin()));
