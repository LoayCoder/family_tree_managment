-- Fix user authentication policies and functions

-- First, drop any problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Drop the trigger first before dropping the function
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON user_profiles;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS prevent_privilege_escalation();
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Create a simple function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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

-- Create a trigger function to prevent users from changing their own approval status or user level
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to enforce the privilege escalation prevention
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Create new, non-recursive policies
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

-- Create a function to handle new user registration
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();