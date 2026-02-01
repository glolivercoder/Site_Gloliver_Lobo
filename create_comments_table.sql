-- Create fan_club_comments table
CREATE TABLE IF NOT EXISTS public.fan_club_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.fan_club_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fan_club_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments" ON public.fan_club_comments
  FOR SELECT USING (true);

-- Authenticated users can add comments
CREATE POLICY "Authenticated users can comment" ON public.fan_club_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (or admins via their own logic)
CREATE POLICY "Users can delete own comments" ON public.fan_club_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_fan_club_comments_post_id ON public.fan_club_comments(post_id);
