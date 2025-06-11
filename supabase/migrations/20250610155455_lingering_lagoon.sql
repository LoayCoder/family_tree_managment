/*
  # Remove family_members table and update get_family_tree function

  1. Changes
    - Drop family_members table and all its dependencies
    - Update get_family_tree function to work with Arabic tables
    - Maintain compatibility with existing frontend code

  2. Security
    - Remove all policies from family_members table
    - Function works with existing Arabic table policies
*/

-- Drop policies on family_members table if they exist
DROP POLICY IF EXISTS "Allow public read access on family_members" ON family_members;
DROP POLICY IF EXISTS "Allow public insert access on family_members" ON family_members;
DROP POLICY IF EXISTS "Allow public update access on family_members" ON family_members;
DROP POLICY IF EXISTS "Allow public delete access on family_members" ON family_members;

-- Drop triggers on family_members table if they exist
DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;

-- Drop the family_members table if it exists
DROP TABLE IF EXISTS family_members CASCADE;

-- Drop the existing get_family_tree function completely
DROP FUNCTION IF EXISTS get_family_tree();

-- Create the updated get_family_tree function to work with Arabic tables
CREATE OR REPLACE FUNCTION get_family_tree()
RETURNS TABLE(
    id TEXT,
    name TEXT,
    parent_id TEXT,
    birth_date DATE,
    gender TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_alive BOOLEAN,
    date_of_death DATE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE family_tree AS (
        -- Base case: root members (no parent)
        SELECT 
            p."id"::TEXT as id,
            p."الاسم_الأول" as name,
            p."father_id"::TEXT as parent_id,
            p."تاريخ_الميلاد" as birth_date,
            p."الجنس" as gender,
            NULL::TEXT as phone,
            p."ملاحظات" as notes,
            p."تاريخ_الإنشاء" as created_at,
            p."تاريخ_التحديث" as updated_at,
            CASE 
                WHEN p."تاريخ_الوفاة" IS NULL THEN true 
                ELSE false 
            END as is_alive,
            p."تاريخ_الوفاة" as date_of_death,
            0 as level
        FROM "الأشخاص" p
        WHERE p."father_id" IS NULL
        
        UNION ALL
        
        -- Recursive case: children
        SELECT 
            p."id"::TEXT as id,
            p."الاسم_الأول" as name,
            p."father_id"::TEXT as parent_id,
            p."تاريخ_الميلاد" as birth_date,
            p."الجنس" as gender,
            NULL::TEXT as phone,
            p."ملاحظات" as notes,
            p."تاريخ_الإنشاء" as created_at,
            p."تاريخ_التحديث" as updated_at,
            CASE 
                WHEN p."تاريخ_الوفاة" IS NULL THEN true 
                ELSE false 
            END as is_alive,
            p."تاريخ_الوفاة" as date_of_death,
            ft.level + 1
        FROM "الأشخاص" p
        INNER JOIN family_tree ft ON p."father_id"::TEXT = ft.id
    )
    SELECT * FROM family_tree
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;