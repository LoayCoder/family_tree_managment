-- Fix user authentication system
-- Instead of trying to create auth.users (which is managed by Supabase),
-- we'll focus on fixing the functions and policies with proper search_path settings

-- Fix the is_admin function with proper search_path
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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

-- Fix the prevent_privilege_escalation function with proper search_path
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is updating their own profile and not an admin
  IF auth.uid() = NEW.id AND NOT is_admin(auth.uid()) THEN
    -- Prevent changes to approval_status and user_level
    NEW.approval_status = OLD.approval_status;
    NEW.user_level = OLD.user_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the approve_user function with proper search_path
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, approver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now()
  WHERE id = user_id;
END;
$$;

-- Fix the reject_user function with proper search_path
CREATE OR REPLACE FUNCTION reject_user(user_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = user_id;
END;
$$;

-- Fix the handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = '1st.arabcoder@gmail.com' THEN
    -- Insert or update the user profile with admin privileges
    INSERT INTO public.user_profiles (
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
      NEW.id
    )
    ON CONFLICT (id) DO UPDATE SET
      user_level = 'admin',
      approval_status = 'approved',
      approved_at = now();
  ELSE
    -- For regular users, just create a normal profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      user_level
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'user_level', 'viewer')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profile_safe TO authenticated;

-- Create a function to check if the admin user exists and create it if needed
-- This is for manual execution, not automatic
CREATE OR REPLACE FUNCTION check_admin_user()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_exists boolean;
BEGIN
  -- Check if admin user profile exists
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE email = '1st.arabcoder@gmail.com' 
    AND user_level = 'admin' 
    AND approval_status = 'approved'
  ) INTO admin_exists;

  IF admin_exists THEN
    RETURN 'Admin user already exists';
  ELSE
    RETURN 'Admin user does not exist. Please create it through the UI using email: 1st.arabcoder@gmail.com';
  END IF;
END;
$$;

-- Add a comment with instructions
COMMENT ON FUNCTION check_admin_user() IS 
'Checks if the admin user exists. To create the admin user:
1. Sign up through the normal authentication flow with email: 1st.arabcoder@gmail.com
2. Use a strong password (e.g., Admin@123456)
3. The system will automatically grant admin privileges';