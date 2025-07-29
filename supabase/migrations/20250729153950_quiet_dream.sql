/*
  # Fix User Signup System

  1. Database Setup
    - Ensure roles table exists with required roles
    - Create handle_new_user trigger function
    - Set up proper triggers for user registration

  2. Security
    - Enable RLS on user_profiles table
    - Create proper policies for user access
*/

-- Ensure roles table exists and is populated
INSERT INTO public.roles (name, description) VALUES
('family_member', 'Basic family member with read-only access to approved content'),
('content_writer', 'Can create and submit content for approval'),
('level_manager', 'Manages a specific branch, submits changes for approval'),
('viewer', 'Legacy viewer role'),
('editor', 'Legacy editor role'),
('admin', 'Legacy admin role'),
('family_secretary', 'Super admin role with full control')
ON CONFLICT (name) DO NOTHING;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
  user_level text;
BEGIN
  -- Get the user_level from auth metadata, default to 'family_member'
  user_level := COALESCE(NEW.raw_user_meta_data->>'user_level', 'family_member');
  
  -- Get the role ID for the requested role
  SELECT id INTO default_role_id 
  FROM public.roles 
  WHERE name = user_level;
  
  -- If role not found, default to family_member
  IF default_role_id IS NULL THEN
    SELECT id INTO default_role_id 
    FROM public.roles 
    WHERE name = 'family_member';
  END IF;
  
  -- Insert user profile
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
    default_role_id,
    'pending',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id) OR is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));