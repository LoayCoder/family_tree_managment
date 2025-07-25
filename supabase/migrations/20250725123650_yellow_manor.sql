/*
  # Fix Database Schema Relationships and Missing Columns

  This migration fixes the following issues:
  1. Adds missing assigned_branch_id column to user_profiles table
  2. Creates foreign key relationship between user_profiles and الفروع
  3. Adds missing submitted_for_approval_at column to news_posts table
  4. Creates pending_changes_summary view with proper relationships
  5. Adds missing foreign key constraints for pending tables

  ## Changes Made
  1. Schema Updates
    - Add assigned_branch_id to user_profiles
    - Add submitted_for_approval_at to news_posts
    - Create foreign key constraints
  
  2. Views
    - Create pending_changes_summary view
    
  3. Security
    - Update RLS policies for new columns
*/

-- Add assigned_branch_id column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'assigned_branch_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN assigned_branch_id integer;
  END IF;
END $$;

-- Add foreign key constraint between user_profiles and الفروع
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

-- Add submitted_for_approval_at column to news_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_posts' AND column_name = 'submitted_for_approval_at'
  ) THEN
    ALTER TABLE news_posts ADD COLUMN submitted_for_approval_at timestamp with time zone;
  END IF;
END $$;

-- Update news_posts status check constraint to include pending_approval
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'news_posts_status_check'
  ) THEN
    ALTER TABLE news_posts DROP CONSTRAINT news_posts_status_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE news_posts 
  ADD CONSTRAINT news_posts_status_check 
  CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text, 'pending_approval'::text]));
END $$;

-- Create pending_person_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_person_changes (
  id serial PRIMARY KEY,
  change_type text NOT NULL CHECK (change_type = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])),
  entity_id bigint, -- ID of the person being changed (null for inserts)
  entity_name text NOT NULL, -- Name for display purposes
  change_data jsonb NOT NULL, -- The actual change data
  submitted_by_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  submitted_at timestamp with time zone DEFAULT now(),
  approval_status text DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  approved_by_user_id uuid REFERENCES user_profiles(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create pending_woman_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_woman_changes (
  id serial PRIMARY KEY,
  change_type text NOT NULL CHECK (change_type = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])),
  entity_id integer, -- ID of the woman being changed (null for inserts)
  entity_name text NOT NULL, -- Name for display purposes
  change_data jsonb NOT NULL, -- The actual change data
  submitted_by_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  submitted_at timestamp with time zone DEFAULT now(),
  approval_status text DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  approved_by_user_id uuid REFERENCES user_profiles(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on pending tables
ALTER TABLE pending_person_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_woman_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_person_changes
DROP POLICY IF EXISTS "Users can view their own submissions" ON pending_person_changes;
CREATE POLICY "Users can view their own submissions"
  ON pending_person_changes
  FOR SELECT
  TO authenticated
  USING (submitted_by_user_id = auth.uid() OR get_user_level(auth.uid()) = 'family_secretary');

DROP POLICY IF EXISTS "Level managers can submit changes" ON pending_person_changes;
CREATE POLICY "Level managers can submit changes"
  ON pending_person_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['level_manager'::text, 'family_secretary'::text]));

DROP POLICY IF EXISTS "Family secretary can manage all changes" ON pending_person_changes;
CREATE POLICY "Family secretary can manage all changes"
  ON pending_person_changes
  FOR ALL
  TO authenticated
  USING (get_user_level(auth.uid()) = 'family_secretary');

-- Create RLS policies for pending_woman_changes
DROP POLICY IF EXISTS "Users can view their own submissions" ON pending_woman_changes;
CREATE POLICY "Users can view their own submissions"
  ON pending_woman_changes
  FOR SELECT
  TO authenticated
  USING (submitted_by_user_id = auth.uid() OR get_user_level(auth.uid()) = 'family_secretary');

DROP POLICY IF EXISTS "Level managers can submit changes" ON pending_woman_changes;
CREATE POLICY "Level managers can submit changes"
  ON pending_woman_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['level_manager'::text, 'family_secretary'::text]));

DROP POLICY IF EXISTS "Family secretary can manage all changes" ON pending_woman_changes;
CREATE POLICY "Family secretary can manage all changes"
  ON pending_woman_changes
  FOR ALL
  TO authenticated
  USING (get_user_level(auth.uid()) = 'family_secretary');

-- Create pending_changes_summary view
DROP VIEW IF EXISTS pending_changes_summary;
CREATE VIEW pending_changes_summary AS
SELECT 
  'person' as change_entity,
  id,
  change_type,
  entity_name,
  entity_id,
  submitted_by_user_id,
  submitted_at,
  approval_status,
  rejection_reason
FROM pending_person_changes
WHERE approval_status = 'pending'

UNION ALL

SELECT 
  'woman' as change_entity,
  id,
  change_type,
  entity_name,
  entity_id,
  submitted_by_user_id,
  submitted_at,
  approval_status,
  rejection_reason
FROM pending_woman_changes
WHERE approval_status = 'pending';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_person_changes_status ON pending_person_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_person_changes_submitter ON pending_person_changes(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_woman_changes_status ON pending_woman_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_woman_changes_submitter ON pending_woman_changes(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(assigned_branch_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_approval ON news_posts(submitted_for_approval_at);

-- Add comment to explain the schema
COMMENT ON COLUMN user_profiles.assigned_branch_id IS 'Branch ID assigned to level_manager users for their management scope';
COMMENT ON COLUMN news_posts.submitted_for_approval_at IS 'Timestamp when the news post was submitted for approval by content writers';
COMMENT ON TABLE pending_person_changes IS 'Stores pending changes to person records for approval workflow';
COMMENT ON TABLE pending_woman_changes IS 'Stores pending changes to woman records for approval workflow';
COMMENT ON VIEW pending_changes_summary IS 'Unified view of all pending changes for admin panel display';