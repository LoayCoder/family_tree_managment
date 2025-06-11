-- Add approval status to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);

-- Update RLS policies to only allow approved users to access the system
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- New policies with approval system
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Approved users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND approval_status = 'approved');

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_level = 'admin' AND approval_status = 'approved'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_level = 'admin' AND approval_status = 'approved'
    )
  );

-- Function to approve user
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, approver_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject user
CREATE OR REPLACE FUNCTION reject_user(user_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;