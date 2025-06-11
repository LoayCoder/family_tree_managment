/*
  # Family Tree Database Schema

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `name` (varchar, required)
      - `parent_id` (uuid, foreign key to family_members)
      - `birth_date` (date, optional)
      - `gender` (varchar, check constraint for 'ذكر' or 'أنثى')
      - `phone` (varchar, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `family_members` table
    - Add policies for public access (since this is a family tree app)

  3. Functions
    - `get_family_tree()` - Returns family tree with hierarchical levels
    - `update_updated_at()` - Trigger function to update timestamps
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_family_tree();

-- Create the family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  parent_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  birth_date DATE,
  gender VARCHAR CHECK (gender IN ('ذكر', 'أنثى')),
  phone VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_parent_id ON family_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(name);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on family_members"
  ON family_members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on family_members"
  ON family_members
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on family_members"
  ON family_members
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on family_members"
  ON family_members
  FOR DELETE
  TO public
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create the get_family_tree function with proper return type
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
  level INTEGER
) AS $$
WITH RECURSIVE family_tree AS (
  -- Base case: root members (those without parents)
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
    0 as level
  FROM family_members fm
  WHERE fm.parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: children of existing members
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
    ft.level + 1
  FROM family_members fm
  JOIN family_tree ft ON fm.parent_id = ft.id
)
SELECT 
  family_tree.id,
  family_tree.name,
  family_tree.parent_id,
  family_tree.birth_date,
  family_tree.gender,
  family_tree.phone,
  family_tree.notes,
  family_tree.created_at,
  family_tree.updated_at,
  family_tree.level
FROM family_tree
ORDER BY family_tree.level, family_tree.name;
$$ LANGUAGE SQL STABLE;