-- Drop all existing policies for user_profiles to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Approved users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create a simple function to check if a user is an admin
-- This avoids recursive queries in policies
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

-- Create new, non-recursive policies

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile (basic info only)
-- Note: We're removing the WITH CHECK clause that referenced OLD
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy 4: Allow reading profiles for admin operations
-- This policy allows reading other profiles only if the requesting user is admin
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's their own profile OR they are an admin
    auth.uid() = id 
    OR 
    is_admin(auth.uid())
  );

-- Policy 5: Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy 6: Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create a trigger function to prevent users from changing their own approval status or user level
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is updating their own profile and not an admin
  IF auth.uid() = NEW.id AND NOT is_admin(auth.uid()) THEN
    -- Prevent changes to approval_status and user_level
    NEW.approval_status := OLD.approval_status;
    NEW.user_level := OLD.user_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to enforce the privilege escalation prevention
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON user_profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a safe view for user profiles
CREATE OR REPLACE VIEW user_profile_safe AS
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