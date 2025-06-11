/*
  # Fix User Profiles RLS Policy for Registration

  1. Security Changes
    - Add INSERT policy for user_profiles table to allow users to create their own profiles
    - Ensure users can only insert profiles with their own auth.uid()

  This migration fixes the RLS violation error that prevents new user registration.
*/

-- Add INSERT policy for user_profiles table
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);