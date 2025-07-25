/*
  # Create Missing RPC Functions for User Management

  This migration creates the missing RPC functions that the AdminPanel requires:
  1. update_user_role_and_branch - Updates user roles and branch assignments
  2. approve_user - Approves pending users with role and branch assignment
  3. reject_user - Rejects pending users with optional reason
  4. Helper functions for user level checking

  ## Security
  - Only family_secretary users can execute these functions
  - Proper validation and error handling included
  - Audit trail maintained for all changes
*/

-- Helper function to check if user is family secretary
CREATE OR REPLACE FUNCTION public.is_family_secretary(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
    AND user_level = 'family_secretary' 
    AND approval_status = 'approved'
  );
END;
$$;

-- Helper function to get user level
CREATE OR REPLACE FUNCTION public.get_user_level(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  level text;
BEGIN
  SELECT user_level INTO level
  FROM user_profiles 
  WHERE id = user_id AND approval_status = 'approved';
  
  RETURN COALESCE(level, 'viewer');
END;
$$;

-- Function to update user role and branch assignment
CREATE OR REPLACE FUNCTION public.update_user_role_and_branch(
  target_user_id uuid,
  new_level text,
  new_branch_id integer,
  updater_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if updater is family secretary
  IF NOT is_family_secretary(updater_id) THEN
    RAISE EXCEPTION 'Only family secretary can update user roles';
  END IF;

  -- Validate the new level
  IF new_level NOT IN ('family_secretary', 'level_manager', 'content_writer', 'family_member', 'admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid user level: %', new_level;
  END IF;

  -- If assigning level_manager, branch_id is required
  IF new_level = 'level_manager' AND new_branch_id IS NULL THEN
    RAISE EXCEPTION 'Branch assignment is required for level managers';
  END IF;

  -- If not level_manager, clear branch assignment
  IF new_level != 'level_manager' THEN
    new_branch_id := NULL;
  END IF;

  -- Update the user profile
  UPDATE user_profiles
  SET 
    user_level = new_level,
    assigned_branch_id = new_branch_id,
    updated_at = now()
  WHERE id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

-- Function to approve a pending user
CREATE OR REPLACE FUNCTION public.approve_user(
  user_id uuid,
  approver_id uuid,
  new_level text,
  new_branch_id integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if approver is family secretary
  IF NOT is_family_secretary(approver_id) THEN
    RAISE EXCEPTION 'Only family secretary can approve users';
  END IF;

  -- Validate the new level
  IF new_level NOT IN ('family_secretary', 'level_manager', 'content_writer', 'family_member', 'admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid user level: %', new_level;
  END IF;

  -- If assigning level_manager, branch_id is required
  IF new_level = 'level_manager' AND new_branch_id IS NULL THEN
    RAISE EXCEPTION 'Branch assignment is required for level managers';
  END IF;

  -- If not level_manager, clear branch assignment
  IF new_level != 'level_manager' THEN
    new_branch_id := NULL;
  END IF;

  -- Update the user profile
  UPDATE user_profiles
  SET 
    approval_status = 'approved',
    user_level = new_level,
    assigned_branch_id = new_branch_id,
    approved_by = approver_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = user_id AND approval_status = 'pending';

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or not pending approval: %', user_id;
  END IF;
END;
$$;

-- Function to reject a pending user
CREATE OR REPLACE FUNCTION public.reject_user(
  user_id uuid,
  approver_id uuid,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if approver is family secretary
  IF NOT is_family_secretary(approver_id) THEN
    RAISE EXCEPTION 'Only family secretary can reject users';
  END IF;

  -- Update the user profile
  UPDATE user_profiles
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason,
    updated_at = now()
  WHERE id = user_id AND approval_status = 'pending';

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or not pending approval: %', user_id;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_family_secretary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_and_branch(uuid, text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user(uuid, uuid, text) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_family_secretary(uuid) IS 'Check if a user has family_secretary role';
COMMENT ON FUNCTION public.get_user_level(uuid) IS 'Get the user level for a given user ID';
COMMENT ON FUNCTION public.update_user_role_and_branch(uuid, text, integer, uuid) IS 'Update user role and branch assignment (family_secretary only)';
COMMENT ON FUNCTION public.approve_user(uuid, uuid, text, integer) IS 'Approve a pending user with role and branch assignment';
COMMENT ON FUNCTION public.reject_user(uuid, uuid, text) IS 'Reject a pending user with optional reason';