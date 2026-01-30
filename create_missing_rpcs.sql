
-- CORREÇÃO FINAL: CRIAR FUNÇÕES E COLUNA FALTANTE

-- 1. Criar coluna updated_at se não existir (Isso corrige o erro da captura de tela)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_files' AND column_name = 'updated_at') THEN
        ALTER TABLE public.media_files ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Função para ATUALIZAR GÊNERO
CREATE OR REPLACE FUNCTION public.update_media_genre(media_id UUID, new_genre TEXT)
RETURNS VOID AS $$
BEGIN
  -- Verifica permissão (Admin ou Dono)
  IF NOT (
    public.is_admin() OR 
    EXISTS (SELECT 1 FROM media_files WHERE id = media_id AND uploaded_by = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Executa update
  UPDATE public.media_files 
  SET genre = new_genre, updated_at = now()
  WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Função para DELETAR MÍDIA
CREATE OR REPLACE FUNCTION public.delete_media_file(media_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verifica permissão (Admin ou Dono)
  IF NOT (
    public.is_admin() OR 
    EXISTS (SELECT 1 FROM media_files WHERE id = media_id AND uploaded_by = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Executa delete
  DELETE FROM public.media_files WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Conceder permissão de execução
GRANT EXECUTE ON FUNCTION public.update_media_genre(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_media_file(UUID) TO authenticated;
