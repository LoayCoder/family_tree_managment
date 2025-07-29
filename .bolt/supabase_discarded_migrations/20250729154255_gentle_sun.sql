/*
  # Complete User System Setup

  1. Tables and Data
    - Ensure roles table exists with all required roles
    - Verify user_profiles table structure
  
  2. Functions
    - Create handle_new_user trigger function
    - Create user management functions (approve_user, reject_user, etc.)
  
  3. Triggers
    - Set up trigger for new user creation
  
  4. Security
    - Enable RLS and create appropriate policies
*/

-- First, ensure the roles table exists and is populated
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert all required roles
INSERT INTO roles (name, description, permissions) VALUES
  ('family_secretary', 'Family Secretary - Full administrative access', '["*"]'),
  ('admin', 'Administrator - Legacy admin role', '["*"]'),
  ('family_member', 'Family Member - Basic access', '["read", "view_approved"]'),
  ('content_writer', 'Content Writer - Can create and submit content', '["read", "write", "create_content"]'),
  ('level_manager', 'Level Manager - Can manage branch data', '["read", "write", "manage_branch", "edit_branch_data"]'),
  ('editor', 'Editor - Legacy editor role', '["read", "write", "edit"]'),
  ('viewer', 'Viewer - Legacy viewer role', '["read"]')
ON CONFLICT (name) DO NOTHING;

-- Ensure user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  assigned_branch_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
  requested_role_name text;
  requested_role_id uuid;
BEGIN
  -- Get the default role (family_member)
  SELECT id INTO default_role_id 
  FROM roles 
  WHERE name = 'family_member';
  
  -- If no default role found, create it
  IF default_role_id IS NULL THEN
    INSERT INTO roles (name, description, permissions)
    VALUES ('family_member', 'Family Member - Basic access', '["read", "view_approved"]')
    RETURNING id INTO default_role_id;
  END IF;
  
  -- Get requested role from metadata
  requested_role_name := COALESCE(
    NEW.raw_user_meta_data->>'user_level',
    NEW.raw_user_meta_data->>'role',
    'family_member'
  );
  
  -- Validate and get the requested role ID
  SELECT id INTO requested_role_id 
  FROM roles 
  WHERE name = requested_role_name;
  
  -- Use default role if requested role doesn't exist
  IF requested_role_id IS NULL THEN
    requested_role_id := default_role_id;
  END IF;
  
  -- Insert user profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role_id,
    approval_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    requested_role_id,
    'pending'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    
    -- Try to insert with minimal data
    INSERT INTO user_profiles (id, email, role_id, approval_status)
    VALUES (NEW.id, NEW.email, default_role_id, 'pending')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create user management functions
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, approver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = NULL
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION reject_user(user_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = user_id AND up.approval_status = 'approved';
  
  RETURN user_role IN ('admin', 'family_secretary');
END;
$$;

-- Create helper function to get user level
CREATE OR REPLACE FUNCTION get_user_level(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = user_id AND up.approval_status = 'approved';
  
  RETURN COALESCE(user_role, 'viewer');
END;
$$;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create the user_profile_safe view
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
JOIN roles r ON up.role_id = r.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_profile_safe TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON roles TO authenticated;