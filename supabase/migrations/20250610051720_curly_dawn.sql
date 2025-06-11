/*
  # Add status and date of death fields to family members

  1. New Columns
    - `is_alive` (boolean, default: true, not null)
    - `date_of_death` (date, nullable)
  
  2. Constraints
    - Data integrity constraint to ensure consistency between status and death date
  
  3. Function Updates
    - Drop and recreate get_family_tree function to include new fields
*/

-- Add new columns to family_members table
DO $$
BEGIN
  -- Add is_alive column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'is_alive'
  ) THEN
    ALTER TABLE family_members ADD COLUMN is_alive BOOLEAN DEFAULT true NOT NULL;
  END IF;

  -- Add date_of_death column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'date_of_death'
  ) THEN
    ALTER TABLE family_members ADD COLUMN date_of_death DATE;
  END IF;
END $$;

-- Add constraint to ensure data integrity
-- If someone is alive, they shouldn't have a date of death
-- If someone is deceased, they should have a date of death
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'family_members' AND constraint_name = 'check_death_date_consistency'
  ) THEN
    ALTER TABLE family_members DROP CONSTRAINT check_death_date_consistency;
  END IF;

  -- Add the constraint
  ALTER TABLE family_members ADD CONSTRAINT check_death_date_consistency
    CHECK (
      (is_alive = true AND date_of_death IS NULL) OR
      (is_alive = false AND date_of_death IS NOT NULL)
    );
END $$;

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_family_tree();

-- Recreate the get_family_tree function to include new fields
CREATE OR REPLACE FUNCTION get_family_tree()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  parent_id UUID,
  birth_date DATE,
  gender VARCHAR,
  phone VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_alive BOOLEAN,
  date_of_death DATE,
  level INTEGER
) AS $$
WITH RECURSIVE family_tree AS (
  -- الجذور (بدون والدين)
  SELECT 
    fm.id,
    fm.name,
    fm.parent_id,
    fm.birth_date,
    fm.gender,
    fm.phone,
    fm.notes,
    fm.created_at,
    fm.updated_at,
    fm.is_alive,
    fm.date_of_death,
    0 as level
  FROM family_members fm
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- الأطفال
  SELECT 
    fm.id,
    fm.name,
    fm.parent_id,
    fm.birth_date,
    fm.gender,
    fm.phone,
    fm.notes,
    fm.created_at,
    fm.updated_at,
    fm.is_alive,
    fm.date_of_death,
    ft.level + 1
  FROM family_members fm
  JOIN family_tree ft ON fm.parent_id = ft.id
)
SELECT * FROM family_tree
ORDER BY level, name;
$$ LANGUAGE SQL;