/*
  # Create Admin User

  1. Changes
     - Creates a function to automatically set admin privileges for a specific email
     - Sets up a trigger to apply admin privileges when the user signs up
     - Provides instructions for manual signup

  This migration creates a mechanism to automatically grant admin privileges
  to a specific email address when they sign up through the normal authentication flow.
*/

-- Create a function to automatically set admin privileges for a specific email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user has the admin email
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
      NEW.raw_user_meta_data->>'full_name',
      COALESCE(NEW.raw_user_meta_data->>'user_level', 'viewer')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment with instructions
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates user profiles when users sign up.
For the email 1st.arabcoder@gmail.com, it will automatically grant admin privileges.
To create the admin user:
1. Sign up through the normal authentication flow with email: 1st.arabcoder@gmail.com
2. Use a strong password (e.g., Admin@123456)
3. The system will automatically grant admin privileges';