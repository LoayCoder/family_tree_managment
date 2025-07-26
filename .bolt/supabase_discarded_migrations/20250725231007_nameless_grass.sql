/*
  # Fix user_level check constraint to allow new roles

  1. Changes
    - Drop existing user_level check constraint that only allows admin/editor/viewer
    - Add new check constraint that includes all modern user levels:
      - family_secretary (أمين العائلة - مدير خارق)
      - level_manager (مدير فرع)
      - content_writer (كاتب محتوى)
      - family_member (عضو عائلة)
      - admin, editor, viewer (legacy roles)

  2. Security
    - Maintains data integrity with proper validation
    - Allows modern role-based access control
*/

-- Drop the existing check constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_level_check;

-- Add new check constraint with all valid user levels
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_level_check 
CHECK (user_level = ANY (ARRAY[
  'family_secretary'::text,
  'level_manager'::text, 
  'content_writer'::text,
  'family_member'::text,
  'admin'::text,
  'editor'::text,
  'viewer'::text
]));

-- Verify the constraint was updated
SELECT 
  conname as constraint_name,
  consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'user_profiles_user_level_check';

-- Now update the user to family_secretary
UPDATE public.user_profiles
SET
    user_level = 'family_secretary',
    approval_status = 'approved',
    approved_at = now(),
    approved_by = (SELECT id FROM public.user_profiles WHERE email = '1st.arabcoder@gmail.com' LIMIT 1)
WHERE email = 'loay.smartphoto@gmail.com';

-- Verify the update was successful
SELECT 
  email, 
  user_level, 
  approval_status, 
  approved_at
FROM public.user_profiles 
WHERE email = 'loay.smartphoto@gmail.com';