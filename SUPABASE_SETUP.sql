-- 1. Create site_config table
CREATE TABLE site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create profiles table (User data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create fan_club_posts table
CREATE TABLE fan_club_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  media_path TEXT,
  external_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create media_files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'audio', 'video'
  genre TEXT,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.1 Create activity_logs table for notifications
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'post', 'delete', 'block'
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), -- Use system UUID or auth.uid
    TG_OP,
    TG_TABLE_NAME || ': ' || COALESCE(NEW.title, OLD.title, 'Sem título')
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for notifications
CREATE TRIGGER tr_log_fan_posts AFTER INSERT OR DELETE ON public.fan_club_posts
FOR EACH ROW EXECUTE PROCEDURE public.log_activity();

CREATE TRIGGER tr_log_media AFTER INSERT OR DELETE ON public.media_files
FOR EACH ROW EXECUTE PROCEDURE public.log_activity();

-- 5. Automate Profile Creation on Signup
-- Use a trigger to ensure a profile is created as soon as a user signs up.

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RLS Policies

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email' = 'gloliverlobo@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Site Config: Admin only write, Everyone read
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only write" ON site_config FOR ALL USING (public.is_admin());
CREATE POLICY "Public read config" ON site_config FOR SELECT TO public USING (true);

-- Profiles: Public read, Users manage own, Admin manage all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id OR public.is_admin());

-- Fan Club Posts: Public read, Users can post, Admin/Owner can delete
ALTER TABLE fan_club_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read posts" ON fan_club_posts FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert posts" ON fan_club_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners or Admin can delete posts" ON fan_club_posts FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- Media Files: Public read, Users can upload, Admin/Owner can delete
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media" ON media_files FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert media" ON media_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners or Admin can delete media" ON media_files FOR DELETE USING (auth.uid() = uploaded_by OR public.is_admin());

-- 7. Storage Policies (Run these to secure the buckets)
-- Secure the 'media' bucket
-- Note: 'media' bucket must be created first in the dashboard.

-- Allow public viewing
CREATE POLICY "Public viewing" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media' OR bucket_id = 'fan_club');

-- Allow authenticated users to upload to 'media' bucket
-- Enforce 10MB limit for non-admins if it's a video
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'media' AND 
  (public.is_admin() OR (
    -- Non-admin check: Max 10.5M bytes (~10MB) for safety
    ((metadata->>'size')::int < 10500000)
  ))
);

-- Allow Admin or Owner to delete their files
CREATE POLICY "Owner or Admin delete storage" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND 
  (auth.uid() = owner OR public.is_admin())
);
