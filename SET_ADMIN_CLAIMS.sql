
-- =================================================================
-- SET ADMIN CLAIMS (SECURE ROLE SYSTEM)
-- =================================================================

-- Function to set the admin role in app_metadata
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users 
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
  ) 
  WHERE email = user_email;

  -- Also update the public profiles table for UI consistency
  UPDATE public.profiles
  SET role = 'admin', is_blocked = false
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TAG SPECIFIED ACCOUNTS AS ADMINS
SELECT set_user_as_admin('glolivercoder@gmail.com');
SELECT set_user_as_admin('gloliverlobo@gmail.com');
SELECT set_user_as_admin('gloliverx@gmail.com');

-- Ensure new users default to 'fan' in the profiles table (handled by DB default if exists, or trigger)
-- For this project, we'll ensure RLS allows admins to do everything.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access') THEN
        CREATE POLICY "Admins have full access" ON public.profiles
        FOR ALL TO authenticated
        USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR LOWER(auth.jwt() ->> 'email') IN ('glolivercoder@gmail.com', 'gloliverlobo@gmail.com', 'gloliverx@gmail.com') );
    END IF;
END $$;
