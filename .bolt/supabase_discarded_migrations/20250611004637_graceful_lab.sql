/*
  # Create Admin User Account

  1. Creates an admin user in auth.users table
  2. Creates corresponding user_profiles entry
  3. Sets user as admin with approved status
  
  Login credentials:
  - Email: 1st.arabcoder@gmail.com
  - Password: Admin@123456
*/

-- Create or update the admin user in auth.users table
-- Note: The password hash is for the password "Admin@123456"
DO $$
DECLARE
  admin_user_id uuid := '361af0c1-2a09-45b1-ba90-dd08a29b77d2';
BEGIN
  -- Insert or update the user in auth.users
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    email_confirmed_at,
    encrypted_password,
    aud,
    role,
    instance_id
  )
  VALUES (
    admin_user_id,
    '1st.arabcoder@gmail.com',
    '{"full_name": "مدير النظام"}',
    now(),
    now(),
    now(), -- Email already confirmed
    '$2a$10$Xt9Hn8QpNP8nT5zGERhxpOvYwJH2P1XVfOmY5d.P8IkbKpnm/6X4e', -- Password: Admin@123456
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now(),
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    encrypted_password = EXCLUDED.encrypted_password;

  -- Insert or update the profile in user_profiles
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    user_level,
    approval_status,
    approved_at,
    approved_by
  )
  VALUES (
    admin_user_id,
    '1st.arabcoder@gmail.com',
    'مدير النظام',
    'admin',
    'approved',
    now(),
    admin_user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_level = 'admin',
    approval_status = 'approved',
    approved_at = now(),
    approved_by = admin_user_id;

END $$;