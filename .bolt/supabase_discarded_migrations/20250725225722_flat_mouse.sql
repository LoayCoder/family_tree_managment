-- Verify and fix user role for loay.smartphoto@gmail.com
-- This ensures the user has the correct family_secretary role

-- First, let's check the current user profile
SELECT 
  id,
  email,
  user_level,
  approval_status,
  created_at,
  updated_at
FROM user_profiles 
WHERE email = 'loay.smartphoto@gmail.com';

-- Update the user to have family_secretary role if not already set
UPDATE user_profiles 
SET 
  user_level = 'family_secretary',
  approval_status = 'approved',
  updated_at = now()
WHERE email = 'loay.smartphoto@gmail.com';

-- Verify the update was successful
SELECT 
  id,
  email,
  user_level,
  approval_status,
  'User successfully updated to family_secretary' as status
FROM user_profiles 
WHERE email = 'loay.smartphoto@gmail.com';

-- Also check if there are any other users with family_secretary role
SELECT 
  email,
  user_level,
  approval_status
FROM user_profiles 
WHERE user_level = 'family_secretary'
ORDER BY created_at;