/*
  # Admin User Setup and Authentication Fix

  1. Database Setup
    - Ensure all required tables exist
    - Create admin user setup functions
    - Add proper triggers and policies

  2. Admin User Creation
    - Create initial admin user if not exists
    - Set up proper user profile
    - Ensure authentication works

  3. Security
    - Proper RLS policies
    - Admin user management
*/

-- First, ensure the user_profiles table exists with all required columns
DO $$
BEGIN
  -- Check if user_profiles table exists, if not create it
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text,
      user_level text NOT NULL DEFAULT 'viewer' CHECK (user_level IN ('admin', 'editor', 'viewer')),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
      approved_by uuid REFERENCES user_profiles(id),
      approved_at timestamptz,
      rejection_reason text
    );

    -- Create indexes
    CREATE INDEX idx_user_profiles_email ON user_profiles(email);
    CREATE INDEX idx_user_profiles_user_level ON user_profiles(user_level);
    CREATE INDEX idx_user_profiles_approval_status ON user_profiles(approval_status);
  END IF;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Approved users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create RLS policies
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

CREATE POLICY "Approved users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND approval_status = 'approved');

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_level = 'admin' 
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_level = 'admin' 
      AND approval_status = 'approved'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user boolean;
  user_level_to_assign text;
  approval_status_to_assign text;
BEGIN
  -- Check if this is the first user (admin email)
  SELECT COUNT(*) = 0 INTO is_first_user FROM auth.users;
  
  -- Determine user level and approval status
  IF NEW.email = '1st.arabcoder@gmail.com' OR is_first_user THEN
    user_level_to_assign := 'admin';
    approval_status_to_assign := 'approved';
  ELSE
    user_level_to_assign := COALESCE(NEW.raw_user_meta_data->>'user_level', 'editor');
    approval_status_to_assign := 'pending';
  END IF;

  -- Insert user profile
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    user_level,
    approval_status,
    approved_by,
    approved_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_level_to_assign,
    approval_status_to_assign,
    CASE WHEN approval_status_to_assign = 'approved' THEN NEW.id ELSE NULL END,
    CASE WHEN approval_status_to_assign = 'approved' THEN now() ELSE NULL END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profiles updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to create admin user if not exists
CREATE OR REPLACE FUNCTION create_admin_user_if_not_exists()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  admin_exists boolean;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE email = '1st.arabcoder@gmail.com' 
    AND user_level = 'admin' 
    AND approval_status = 'approved'
  ) INTO admin_exists;

  -- If admin doesn't exist, we need to create one
  -- Note: This function can be called manually after creating the user in Supabase Auth UI
  IF NOT admin_exists THEN
    -- Check if the user exists in auth.users but not in user_profiles
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = '1st.arabcoder@gmail.com';

    IF admin_user_id IS NOT NULL THEN
      -- User exists in auth but not in profiles, create profile
      INSERT INTO user_profiles (
        id,
        email,
        full_name,
        user_level,
        approval_status,
        approved_by,
        approved_at
      ) VALUES (
        admin_user_id,
        '1st.arabcoder@gmail.com',
        'مدير النظام',
        'admin',
        'approved',
        admin_user_id,
        now()
      ) ON CONFLICT (id) DO UPDATE SET
        user_level = 'admin',
        approval_status = 'approved',
        approved_by = admin_user_id,
        approved_at = now();
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Create a view for safe user profile access
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

-- Grant access to the view
GRANT SELECT ON user_profile_safe TO authenticated;