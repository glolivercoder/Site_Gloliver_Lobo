-- Remove a coluna duplicada que eu pedi para criar antes.
-- A coluna correta já existia no banco como 'media_file_id'.
-- Isso resolve o erro "Ambiguous embedding".

ALTER TABLE public.featured_slots DROP COLUMN IF EXISTS media_id;
