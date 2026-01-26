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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create fan_club_posts table
CREATE TABLE fan_club_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  media_path TEXT,
  external_url TEXT,
  author_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create media_files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'audio', 'video'
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- ADMIN ROLE CHECK: Replace 'gloliverlobo@gmail.com' with your actual admin email
-- Create a policy where only the admin can insert/update/delete

CREATE POLICY "Admin only write" ON site_config FOR ALL 
USING (auth.jwt() ->> 'email' = 'gloliverlobo@gmail.com');

CREATE POLICY "Public read config" ON site_config FOR SELECT 
TO public USING (true);

CREATE POLICY "Admin only write posts" ON fan_club_posts FOR ALL 
USING (auth.jwt() ->> 'email' = 'gloliverlobo@gmail.com');

CREATE POLICY "Public read posts" ON fan_club_posts FOR SELECT 
TO public USING (true);

CREATE POLICY "Admin only media" ON media_files FOR ALL 
USING (auth.jwt() ->> 'email' = 'gloliverlobo@gmail.com');

CREATE POLICY "Public read profiles" ON profiles FOR SELECT 
TO public USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 6. Storage Buckets (Run in Supabase Dashboard or via API)
-- Need to create buckets: 'fan_club' and 'media'
-- Set them to PUBLIC if you want everyone to see the content without signed URLs.
