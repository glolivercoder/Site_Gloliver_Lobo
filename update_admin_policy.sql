
-- Update is_admin function to check profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role text;
BEGIN
  -- 1. Check if email is in hardcoded list (Safety net)
  IF auth.jwt() ->> 'email' IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com') THEN
    RETURN true;
  END IF;

  -- 2. Check App Metadata (Supabase standard)
  IF (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- 3. Check Profiles Table (The Fix)
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
