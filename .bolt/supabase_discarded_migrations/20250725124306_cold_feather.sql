/*
  # Update Loay's user level to family_secretary

  1. Changes
    - Update user_level for loay.smartphoto@gmail.com to 'family_secretary'
    - Set approval_status to 'approved' if not already
    - Update timestamps

  2. Security
    - Direct update as this is an administrative change
    - Ensures the family secretary role is properly assigned
*/

-- Update Loay's user level to family_secretary (أمين العائلة - مدير خارق)
UPDATE user_profiles 
SET 
  user_level = 'family_secretary',
  approval_status = 'approved',
  approved_at = CASE 
    WHEN approval_status != 'approved' THEN now() 
    ELSE approved_at 
  END,
  updated_at = now()
WHERE email = 'loay.smartphoto@gmail.com';

-- Verify the update
SELECT 
  email,
  full_name,
  user_level,
  approval_status,
  approved_at,
  updated_at
FROM user_profiles 
WHERE email = 'loay.smartphoto@gmail.com';