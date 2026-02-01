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

-- Policy: Anyone can view likes (for counting)
CREATE POLICY "Anyone can view likes" ON public.music_likes
  FOR SELECT USING (true);

-- Policy: Authenticated users can add their own likes
CREATE POLICY "Authenticated users can like" ON public.music_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own likes
CREATE POLICY "Users can unlike their own" ON public.music_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_music_likes_media_id ON public.music_likes(media_id);
CREATE INDEX idx_music_likes_user_id ON public.music_likes(user_id);
