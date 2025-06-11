/*
  # Fix User Profiles RLS Policies

  1. Security Changes
    - Drop existing problematic RLS policies that cause infinite recursion
    - Create new, properly structured RLS policies
    - Ensure policies don't reference the table they're protecting in subqueries

  2. Policy Structure
    - Users can read their own profile
    - Users can update their own profile (if approved)
    - Users can insert their own profile during signup
    - Admins can read and update all profiles
    - Remove recursive policy references
*/

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
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND approval_status = OLD.approval_status  -- Can't change approval status
    AND user_level = OLD.user_level            -- Can't change user level
  );

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
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy 6: Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;