/*
  # Create Admin User Account

  1. Purpose
    - Create an admin user account with email: 1st.arabcoder@gmail.com
    - Set user_level to 'admin'
    - Set approval_status to 'approved'
    - Bypass normal approval process

  2. Security
    - This is a one-time setup for the initial admin user
    - The admin can then approve other users through the admin panel

  3. Important Notes
    - This user will have full admin privileges
    - They can access the admin panel to manage other users
    - Make sure to use a strong password when signing up with this email
*/

-- Insert admin user profile
-- Note: The user must first sign up through the normal auth process with this email
-- This migration will ensure their profile gets admin privileges when created

-- First, let's create a function to handle admin user creation
CREATE OR REPLACE FUNCTION create_admin_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = '1st.arabcoder@gmail.com' THEN
    -- Insert admin profile
    INSERT INTO user_profiles (
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
      NEW.id -- Self-approved
    )
    ON CONFLICT (id) DO UPDATE SET
      user_level = 'admin',
      approval_status = 'approved',
      approved_at = now(),
      approved_by = NEW.id;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create admin profile
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_admin_user_profile();

-- If the user already exists in auth.users, update their profile
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID if they already exist
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = '1st.arabcoder@gmail.com';
  
  -- If user exists, create/update their profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      user_level,
      approval_status,
      approved_at,
      approved_by
    ) VALUES (
      admin_user_id,
      '1st.arabcoder@gmail.com',
      'مدير النظام',
      'admin',
      'approved',
      now(),
      admin_user_id
    )
    ON CONFLICT (id) DO UPDATE SET
      user_level = 'admin',
      approval_status = 'approved',
      approved_at = now(),
      approved_by = admin_user_id;
  END IF;
END $$;