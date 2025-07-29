/*
  # Update handle_new_user trigger to use role_id from metadata

  This migration updates the handle_new_user trigger function to:
  1. Extract role_id directly from user metadata instead of looking up by role name
  2. Include proper error handling and fallback mechanisms
  3. Ensure the trigger works with the new signup flow that sends role_id directly

  ## Changes Made
  - Modified handle_new_user function to use role_id from metadata
  - Added validation to ensure role_id exists in roles table
  - Added fallback to 'family_member' role if role_id is invalid
  - Improved error handling and logging
*/

-- Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_id uuid;
  fallback_role_id uuid;
BEGIN
  -- Temporarily disable RLS for this function
  SET LOCAL row_security = off;
  
  -- Extract role_id from user metadata
  user_role_id := (NEW.raw_user_meta_data->>'role_id')::uuid;
  
  -- Validate that the role_id exists in the roles table
  IF user_role_id IS NOT NULL THEN
    -- Check if the role exists
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = user_role_id) THEN
      -- Role doesn't exist, set to null to trigger fallback
      user_role_id := NULL;
    END IF;
  END IF;
  
  -- If no valid role_id provided, fallback to 'family_member'
  IF user_role_id IS NULL THEN
    SELECT id INTO fallback_role_id 
    FROM roles 
    WHERE name = 'family_member' 
    LIMIT 1;
    
    -- If 'family_member' doesn't exist, use the first available role
    IF fallback_role_id IS NULL THEN
      SELECT id INTO fallback_role_id 
      FROM roles 
      ORDER BY name 
      LIMIT 1;
    END IF;
    
    user_role_id := fallback_role_id;
  END IF;
  
  -- Insert user profile with the determined role_id
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
    user_role_id,
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

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT ON public.roles TO service_role;