-- Fix user authentication system
-- Instead of trying to create auth.users (which is managed by Supabase),
-- we'll update the existing user_profiles table and functions

-- First, let's make sure our user_profiles table has all necessary columns
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'approval_status') THEN
    ALTER TABLE user_profiles ADD COLUMN approval_status text DEFAULT 'pending' 
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'approved_by') THEN
    ALTER TABLE user_profiles ADD COLUMN approved_by uuid REFERENCES user_profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'approved_at') THEN
    ALTER TABLE user_profiles ADD COLUMN approved_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE user_profiles ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create or replace the is_admin function with proper search_path
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = user_id 
    AND user_level = 'admin' 
    AND approval_status = 'approved'
  );
$$;

-- Create or replace the prevent_privilege_escalation function with proper search_path
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is updating their own profile and not an admin
  IF auth.uid() = NEW.id AND NOT is_admin(auth.uid()) THEN
    -- Prevent changes to approval_status and user_level
    NEW.approval_status = OLD.approval_status;
    NEW.user_level = OLD.user_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON user_profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Create or replace the approve_user function with proper search_path
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, approver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now()
  WHERE id = user_id;
END;
$$;

-- Create or replace the reject_user function with proper search_path
CREATE OR REPLACE FUNCTION reject_user(user_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = user_id;
END;
$$;

-- Create or replace the handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = '1st.arabcoder@gmail.com' THEN
    -- Insert or update the user profile with admin privileges
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      user_level,
      approval_status,
      approved_at,
      approved_by
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'مدير النظام'),
      'admin',
      'approved',
      now(),
      NEW.id
    )
    ON CONFLICT (id) DO UPDATE SET
      user_level = 'admin',
      approval_status = 'approved',
      approved_at = now();
  ELSE
    -- For regular users, just create a normal profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      user_level
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'user_level', 'viewer')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure all policies are correctly set up
-- First drop all existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all existing policies on user_profiles
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON user_profiles;', ' ')
    FROM pg_policies
    WHERE tablename = 'user_profiles'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if no policies exist
    NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id) OR is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a safe view for user profiles
DROP VIEW IF EXISTS user_profile_safe;
CREATE VIEW user_profile_safe AS
SELECT 
  id,
  email,
  full_name,
  user_level,
  approval_status,
  created_at,
  updated_at
FROM user_profiles;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profile_safe TO authenticated;