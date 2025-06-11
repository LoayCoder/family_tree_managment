/*
  # Add get_family_tree function

  1. New Functions
    - `get_family_tree()` - Returns family members with their hierarchical levels
      - Uses recursive CTE to calculate family tree levels
      - Returns all family member data plus a level column
      - Orders results by level and name

  2. Function Details
    - Returns TABLE with all family_members columns plus level INTEGER
    - Level 0 = root members (no parents)
    - Level increases for each generation down the tree
    - Ordered by level first, then by name alphabetically
*/

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
    ft.level + 1
  FROM family_members fm
  JOIN family_tree ft ON fm.parent_id = ft.id
)
SELECT * FROM family_tree
ORDER BY level, name;
$$ LANGUAGE SQL;