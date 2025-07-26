/*
  # Update User Roles and Branch Assignment System

  1. New User Roles
    - Updates user_level enum to include new standardized roles:
      - family_secretary (Super Admin with full access)
      - level_manager (Branch manager with limited scope)
      - content_writer (News and content management)
      - family_member (Read-only family member)
    - Keeps existing roles for backward compatibility

  2. Branch Assignment
    - Adds assigned_branch_id column to user_profiles
    - Creates foreign key relationship with الفروع table
    - Enables Level Managers to be assigned to specific family branches

  3. Enhanced Functions
    - Updates approve_user function to handle role assignment and branch assignment
    - Updates reject_user function for new role structure
    - Creates update_user_role_and_branch function for role management
    - Adds prevent_privilege_escalation function for security

  4. Security
    - Updates RLS policies for new role structure
    - Ensures only family_secretary can modify user roles
    - Maintains data security and access control
*/

-- Step 1: Add new user levels to the existing check constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_level_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_level_check 
CHECK (user_level = ANY (ARRAY[
  'admin'::text, 
  'editor'::text, 
  'viewer'::text,
  'family_secretary'::text,
  'level_manager'::text,
  'content_writer'::text,
  'family_member'::text
]));

-- Step 2: Add assigned_branch_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'assigned_branch_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN assigned_branch_id integer;
  END IF;
END $$;

-- Step 3: Add foreign key constraint for assigned_branch_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_assigned_branch_id_fkey'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_assigned_branch_id_fkey 
    FOREIGN KEY (assigned_branch_id) REFERENCES "الفروع"("معرف_الفرع") ON DELETE SET NULL;
  END IF;
END $$;

-- Step 4: Add index for assigned_branch_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_branch 
ON user_profiles(assigned_branch_id) 
WHERE assigned_branch_id IS NOT NULL;

-- Step 5: Create helper function to check if user is family secretary
CREATE OR REPLACE FUNCTION is_family_secretary(user_id uuid)
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

-- Step 6: Create helper function to get user level
CREATE OR REPLACE FUNCTION get_user_level(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  level text;
BEGIN
  SELECT user_level INTO level
  FROM user_profiles 
  WHERE id = user_id 
  AND approval_status = 'approved';
  
  RETURN COALESCE(level, 'none');
END;
$$;

-- Step 7: Update approve_user function to handle new roles and branch assignment
CREATE OR REPLACE FUNCTION approve_user(
  user_id uuid,
  approver_id uuid,
  new_level text DEFAULT 'family_member',
  new_branch_id integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if approver is family secretary or admin
  IF NOT (is_family_secretary(approver_id) OR get_user_level(approver_id) = 'admin') THEN
    RAISE EXCEPTION 'غير مصرح لك بالموافقة على المستخدمين';
  END IF;

  -- Validate new_level
  IF new_level NOT IN ('family_secretary', 'level_manager', 'content_writer', 'family_member', 'admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'مستوى المستخدم غير صالح';
  END IF;

  -- If assigning level_manager, ensure branch is provided
  IF new_level = 'level_manager' AND new_branch_id IS NULL THEN
    RAISE EXCEPTION 'يجب تحديد فرع عند تعيين مدير فرع';
  END IF;

  -- If not level_manager, clear branch assignment
  IF new_level != 'level_manager' THEN
    new_branch_id := NULL;
  END IF;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    approval_status = 'approved',
    user_level = new_level,
    assigned_branch_id = new_branch_id,
    approved_by = approver_id,
    approved_at = now()
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
END;
$$;

-- Step 8: Update reject_user function
CREATE OR REPLACE FUNCTION reject_user(
  user_id uuid,
  approver_id uuid,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if approver is family secretary or admin
  IF NOT (is_family_secretary(approver_id) OR get_user_level(approver_id) = 'admin') THEN
    RAISE EXCEPTION 'غير مصرح لك برفض المستخدمين';
  END IF;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
END;
$$;

-- Step 9: Create update_user_role_and_branch function
CREATE OR REPLACE FUNCTION update_user_role_and_branch(
  target_user_id uuid,
  new_level text,
  new_branch_id integer DEFAULT NULL,
  updater_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if updater is family secretary or admin
  IF NOT (is_family_secretary(updater_id) OR get_user_level(updater_id) = 'admin') THEN
    RAISE EXCEPTION 'غير مصرح لك بتحديث صلاحيات المستخدمين';
  END IF;

  -- Validate new_level
  IF new_level NOT IN ('family_secretary', 'level_manager', 'content_writer', 'family_member', 'admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'مستوى المستخدم غير صالح';
  END IF;

  -- If assigning level_manager, ensure branch is provided
  IF new_level = 'level_manager' AND new_branch_id IS NULL THEN
    RAISE EXCEPTION 'يجب تحديد فرع عند تعيين مدير فرع';
  END IF;

  -- If not level_manager, clear branch assignment
  IF new_level != 'level_manager' THEN
    new_branch_id := NULL;
  END IF;

  -- Prevent users from escalating their own privileges
  IF target_user_id = updater_id THEN
    RAISE EXCEPTION 'لا يمكنك تعديل صلاحياتك الخاصة';
  END IF;

  -- Update user profile
  UPDATE user_profiles 
  SET 
    user_level = new_level,
    assigned_branch_id = new_branch_id,
    updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
END;
$$;

-- Step 10: Update RLS policies for user_profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Create new comprehensive RLS policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Family secretaries and admins can read all profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = id) OR 
    is_family_secretary(auth.uid()) OR 
    get_user_level(auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update own basic profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Users cannot change their own user_level, approval_status, or assigned_branch_id
    user_level = (SELECT user_level FROM user_profiles WHERE id = auth.uid()) AND
    approval_status = (SELECT approval_status FROM user_profiles WHERE id = auth.uid()) AND
    assigned_branch_id = (SELECT assigned_branch_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Family secretaries and admins can update all profiles" ON user_profiles
  FOR UPDATE TO authenticated
  USING (is_family_secretary(auth.uid()) OR get_user_level(auth.uid()) = 'admin')
  WITH CHECK (is_family_secretary(auth.uid()) OR get_user_level(auth.uid()) = 'admin');

CREATE POLICY "Family secretaries and admins can delete profiles" ON user_profiles
  FOR DELETE TO authenticated
  USING (is_family_secretary(auth.uid()) OR get_user_level(auth.uid()) = 'admin');

-- Step 11: Update existing trigger function to prevent privilege escalation
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow family secretaries and admins to make any changes
  IF is_family_secretary(auth.uid()) OR get_user_level(auth.uid()) = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Prevent users from changing their own critical fields
  IF OLD.id = auth.uid() THEN
    -- Restore critical fields to their original values
    NEW.user_level := OLD.user_level;
    NEW.approval_status := OLD.approval_status;
    NEW.assigned_branch_id := OLD.assigned_branch_id;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON user_profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Step 12: Create view for safe user profile access
CREATE OR REPLACE VIEW user_profile_safe AS
SELECT 
  id,
  email,
  full_name,
  user_level,
  approval_status,
  assigned_branch_id,
  created_at,
  updated_at,
  approved_at,
  approved_by,
  rejection_reason
FROM user_profiles;

-- Grant appropriate permissions
GRANT SELECT ON user_profile_safe TO authenticated;

-- Step 13: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_level 
ON user_profiles(user_level) 
WHERE approval_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status 
ON user_profiles(approval_status);

-- Step 14: Add comments for documentation
COMMENT ON COLUMN user_profiles.assigned_branch_id IS 'Branch ID assigned to level_manager users for their management scope';
COMMENT ON FUNCTION approve_user IS 'Approves a user and assigns their role and branch (if level_manager)';
COMMENT ON FUNCTION reject_user IS 'Rejects a user with optional reason';
COMMENT ON FUNCTION update_user_role_and_branch IS 'Updates user role and branch assignment (family_secretary only)';
COMMENT ON FUNCTION is_family_secretary IS 'Checks if user has family_secretary role';
COMMENT ON FUNCTION get_user_level IS 'Gets the user level for authenticated user';