/*
  # Simplify User Signup Trigger

  This migration simplifies the user signup process by:
  1. Removing role selection from signup form
  2. Assigning default role during signup
  3. Allowing role assignment during approval process

  ## Changes Made
  1. Updated handle_new_user trigger to assign default role
  2. Ensured proper RLS policies for user profile creation
  3. Simplified user metadata handling
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create simplified handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
  user_full_name TEXT;
BEGIN
  -- Extract full name from user metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Get default role ID (family_member as default, fallback to first available role)
  SELECT id INTO default_role_id 
  FROM public.roles 
  WHERE name = 'family_member' 
  LIMIT 1;
  
  -- If family_member role doesn't exist, get the first available role
  IF default_role_id IS NULL THEN
    SELECT id INTO default_role_id 
    FROM public.roles 
    ORDER BY name 
    LIMIT 1;
  END IF;
  
  -- If no roles exist at all, log error but don't fail
  IF default_role_id IS NULL THEN
    RAISE WARNING 'No roles found in roles table. User profile creation may fail.';
  END IF;
  
  -- Temporarily disable RLS for this operation
  SET LOCAL row_security = off;
  
  -- Insert user profile with default role
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
    NULLIF(user_full_name, ''),
    default_role_id,
    'pending',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure service role has necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.roles TO service_role;

-- Update RLS policies for user_profiles to allow initial profile creation
DROP POLICY IF EXISTS "Allow authenticated insert for profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON public.user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert for profiles" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Ensure roles table has at least a default role
INSERT INTO public.roles (name, description, permissions) 
VALUES 
  ('family_member', 'Basic family member with read access', '["read", "view_approved"]'),
  ('viewer', 'Legacy viewer role with read access', '["read"]'),
  ('content_writer', 'Can create and submit content for approval', '["read", "write", "create_content"]'),
  ('level_manager', 'Can manage branch data and submit changes', '["read", "write", "manage_branch", "edit_branch_data"]'),
  ('editor', 'Legacy editor role with write access', '["read", "write", "edit"]'),
  ('admin', 'Legacy admin role with full access', '["*"]'),
  ('family_secretary', 'Family admin with super user privileges', '["*"]')
ON CONFLICT (name) DO NOTHING;