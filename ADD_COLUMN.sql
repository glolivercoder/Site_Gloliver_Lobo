-- Execute isto no SQL Editor do Supabase para corrigir o erro de salvamento nos Destaques

ALTER TABLE public.featured_slots 
ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL;
