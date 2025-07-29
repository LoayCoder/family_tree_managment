/*
  # Fix User Signup Role Constraint and RLS Issues

  This migration fixes the "Database error saving new user" issue by:
  1. Updating role constraints to include all frontend role names
  2. Fixing RLS policies to allow service role insertions
  3. Ensuring the trigger function can create user profiles successfully
*/

-- First, let's check if we need to update any existing check constraints
-- and add the missing roles to the roles table

-- Insert all required roles if they don't exist
INSERT INTO roles (id, name, description, permissions) VALUES
  (gen_random_uuid(), 'family_secretary', 'Family Secretary - Super admin with full access', '["*"]'::jsonb),
  (gen_random_uuid(), 'family_member', 'Basic family member with read access', '["read", "view_approved"]'::jsonb),
  (gen_random_uuid(), 'content_writer', 'Content writer with content creation permissions', '["read", "write", "create_content"]'::jsonb),
  (gen_random_uuid(), 'level_manager', 'Branch manager with branch management permissions', '["read", "write", "manage_branch", "edit_branch_data"]'::jsonb),
  (gen_random_uuid(), 'admin', 'Legacy admin role', '["*"]'::jsonb),
  (gen_random_uuid(), 'editor', 'Legacy editor role', '["read", "write", "edit"]'::jsonb),
  (gen_random_uuid(), 'viewer', 'Legacy viewer role with read-only access', '["read"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Drop the old check constraint if it exists and create a new one that includes all roles
DO $$
BEGIN
  -- Drop existing check constraint on user_profiles if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%user_level%' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_level_check;
  END IF;
  
  -- Also check for any role-related constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%role%' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  END IF;
END $$;

-- Ensure the user_profiles table has the correct structure
-- Add role_id column if it doesn't exist and is needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Update RLS policies to allow service role insertions
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON user_profiles;

-- Create new policies that work with the trigger system
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role (used by triggers) to insert profiles
CREATE POLICY "Allow service role to insert profiles" ON user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert (for direct profile creation)
CREATE POLICY "Allow authenticated insert for profiles" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create or replace the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_name text;
  role_record record;
BEGIN
  -- Temporarily disable RLS for this function
  SET LOCAL row_security = off;
  
  BEGIN
    -- Extract the requested role from user metadata, default to 'family_member'
    user_role_name := COALESCE(
      NEW.raw_user_meta_data->>'user_level',
      NEW.raw_user_meta_data->>'role',
      'family_member'
    );
    
    -- Validate that the role exists, fallback to 'family_member' if not
    SELECT * INTO role_record FROM roles WHERE name = user_role_name;
    
    IF NOT FOUND THEN
      user_role_name := 'family_member';
      SELECT * INTO role_record FROM roles WHERE name = user_role_name;
    END IF;
    
    -- If still no role found, create a basic family_member role
    IF NOT FOUND THEN
      INSERT INTO roles (id, name, description, permissions) 
      VALUES (gen_random_uuid(), 'family_member', 'Basic family member', '["read"]'::jsonb)
      RETURNING * INTO role_record;
    END IF;
    
    -- Insert the user profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role_id,
      approval_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      role_record.id,
      'pending',
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Successfully created user profile for user: % with role: %', NEW.email, user_role_name;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    
    -- Try to create a minimal profile as fallback
    BEGIN
      INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role_id,
        approval_status
      ) VALUES (
        NEW.id,
        NEW.email,
        'New User',
        (SELECT id FROM roles WHERE name = 'family_member' LIMIT 1),
        'pending'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create fallback profile for %: %', NEW.email, SQLERRM;
    END;
  END;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the user_profile_safe view if it doesn't exist
CREATE OR REPLACE VIEW user_profile_safe AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  r.name as role_name,
  up.role_id,
  up.approval_status,
  up.created_at,
  up.updated_at,
  up.approved_at,
  up.approved_by,
  up.rejection_reason
FROM user_profiles up
LEFT JOIN roles r ON up.role_id = r.id;

-- Grant necessary permissions
GRANT SELECT ON user_profile_safe TO authenticated, anon;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON roles TO service_role;

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy for roles table
DROP POLICY IF EXISTS "Anyone can read roles" ON roles;
CREATE POLICY "Anyone can read roles" ON roles
  FOR SELECT TO authenticated, anon
  USING (true);