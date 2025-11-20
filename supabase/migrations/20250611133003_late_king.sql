/*
  # Clear Demo Data

  1. Data Cleanup
    - Removes all demo data from application tables
    - Preserves user authentication and access information
    - Resets sequences for all tables

  2. Security
    - Maintains all RLS policies
    - Preserves user profiles and authentication
*/

-- Clear data from all application tables while preserving user access information

-- Clear family members table
DELETE FROM public.family_members;

-- Clear Arabic family tree tables
DELETE FROM public."المراجع";
DELETE FROM public."النصوص_والوثائق";
DELETE FROM public."الملفات_الصوتية";
DELETE FROM public."الأحداث";
DELETE FROM public."ارتباط_النساء";
DELETE FROM public."النساء";
DELETE FROM public."الأشخاص";
DELETE FROM public."الفروع";
DELETE FROM public."المواقع";

-- Reset sequences for all tables
ALTER SEQUENCE IF EXISTS public.family_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."المواقع_معرف_الموقع_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."الفروع_معرف_الفرع_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."الأشخاص_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."النساء_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."ارتباط_النساء_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."الأحداث_معرف_الحدث_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."الملفات_الصوتية_معرف_الملف_الصو_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."النصوص_والوثائق_معرف_النص_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public."المراجع_معرف_المرجع_seq" RESTART WITH 1;

-- Note: We're intentionally NOT deleting from the following tables:
-- - auth.users
-- - public.user_profiles
-- This preserves all user authentication and access information