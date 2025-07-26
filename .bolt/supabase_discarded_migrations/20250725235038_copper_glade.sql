/*
  # Fix all database references to user_level column

  This migration identifies and fixes all remaining database objects that reference
  the old user_level column which was dropped during the role system refactor.

  1. Drop and recreate any views that reference user_level
  2. Update any functions that reference user_level
  3. Fix any triggers that reference user_level
  4. Ensure all RLS policies use the updated functions
*/

-- First, let's check if there are any views that might be referencing user_level
-- and drop them if they exist
DROP VIEW IF EXISTS user_profile_safe CASCADE;

-- Recreate the user_profile_safe view without user_level
CREATE OR REPLACE VIEW user_profile_safe AS
SELECT 
  id,
  email,
  full_name,
  approval_status,
  created_at,
  updated_at,
  r.name as user_level  -- Use role name for backward compatibility
FROM user_profiles up
LEFT JOIN roles r ON up.role_id = r.id;

-- Enable RLS on the view
ALTER VIEW user_profile_safe ENABLE ROW LEVEL SECURITY;

-- Drop and recreate any functions that might reference user_level
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(uuid, text) CASCADE;

-- Create a helper function to get user role name
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_name text;
BEGIN
  SELECT r.name INTO role_name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = user_id AND up.approval_status = 'approved';
  
  RETURN COALESCE(role_name, '');
END;
$$;

-- Update the get_user_level function to ensure it's working correctly
CREATE OR REPLACE FUNCTION get_user_level(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_name text;
BEGIN
  SELECT r.name INTO role_name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = user_id AND up.approval_status = 'approved';
  
  RETURN COALESCE(role_name, '');
END;
$$;

-- Update the is_admin function to use the new structure
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_level(user_id);
  RETURN user_role IN ('admin', 'family_secretary');
END;
$$;

-- Create a function to check if user is family secretary
CREATE OR REPLACE FUNCTION is_family_secretary(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_level(user_id) = 'family_secretary';
END;
$$;

-- Create a function to check if user is level manager
CREATE OR REPLACE FUNCTION is_level_manager(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_level(user_id) = 'level_manager';
END;
$$;

-- Drop and recreate any triggers that might reference user_level
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON user_profiles CASCADE;

-- Recreate the privilege escalation prevention trigger
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  target_role text;
BEGIN
  -- Get the current user's role
  current_user_role := get_user_level(auth.uid());
  
  -- Get the target role name
  SELECT name INTO target_role FROM roles WHERE id = NEW.role_id;
  
  -- Only family_secretary can change roles
  IF current_user_role != 'family_secretary' AND OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    RAISE EXCEPTION 'Only family secretary can change user roles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Ensure all RLS policies are properly set up
-- Drop existing policies that might have issues
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Recreate admin policies with correct function references
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id) OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON roles TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_secretary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_level_manager(uuid) TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';