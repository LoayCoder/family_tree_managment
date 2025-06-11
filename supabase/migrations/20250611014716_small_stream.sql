-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table if it doesn't exist
-- This is a simplified version of the table that Supabase Auth normally creates
-- In a real Supabase instance, this table is managed by the Auth service
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false NOT NULL,
  deleted_at timestamptz
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON auth.users (phone);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON auth.users (created_at);
CREATE INDEX IF NOT EXISTS users_confirmed_at_idx ON auth.users (confirmed_at);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION auth.create_user(
  email text,
  password text,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    email,
    encrypted_password,
    raw_user_meta_data,
    email_confirmed_at
  ) VALUES (
    email,
    -- In a real system, this would be properly hashed
    -- This is just a placeholder for demonstration
    'PLACEHOLDER_HASH:' || password,
    metadata,
    now() -- Auto-confirm email for simplicity
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;

-- Create a function to authenticate users
CREATE OR REPLACE FUNCTION auth.authenticate_user(
  email text,
  password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE 
    users.email = authenticate_user.email
    -- In a real system, this would properly verify the hash
    -- This is just a placeholder for demonstration
    AND users.encrypted_password = 'PLACEHOLDER_HASH:' || authenticate_user.password
    AND users.deleted_at IS NULL
    AND (users.banned_until IS NULL OR users.banned_until < now());
    
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid login credentials';
  END IF;
  
  -- Update last sign in time
  UPDATE auth.users
  SET 
    last_sign_in_at = now(),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN user_id;
END;
$$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_id FROM auth.users WHERE email = '1st.arabcoder@gmail.com';
  
  -- If admin doesn't exist, create one
  IF admin_id IS NULL THEN
    SELECT auth.create_user(
      '1st.arabcoder@gmail.com',
      'Admin@123456',
      '{"full_name": "مدير النظام", "user_level": "admin"}'::jsonb
    ) INTO admin_id;
    
    -- Ensure admin profile exists
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      user_level,
      approval_status,
      approved_at,
      approved_by
    ) VALUES (
      admin_id,
      '1st.arabcoder@gmail.com',
      'مدير النظام',
      'admin',
      'approved',
      now(),
      admin_id
    )
    ON CONFLICT (id) DO UPDATE SET
      user_level = 'admin',
      approval_status = 'approved',
      approved_at = now();
  END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;