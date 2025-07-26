```sql
-- Step 1: Drop the existing check constraint on user_profiles.user_level
-- This constraint prevents us from changing the column or its values easily.
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_user_level_check;

-- Step 2: Create a new 'roles' table
-- This table will store the definitions of all user roles.
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Step 3: Populate the 'roles' table with existing and new user levels
-- Ensure all possible user levels are present in this table.
INSERT INTO public.roles (name, description) VALUES
('admin', 'Administrator with full system access (legacy)'),
('editor', 'Content editor (legacy)'),
('viewer', 'Content viewer (legacy)'),
('family_secretary', 'Family Secretary (Super Admin)'),
('level_manager', 'Branch/Level Manager'),
('content_writer', 'Content Writer'),
('family_member', 'General Family Member')
ON CONFLICT (name) DO NOTHING; -- Avoids errors if roles already exist from previous attempts

-- Step 4: Add a new 'role_id' column to the 'user_profiles' table
-- This column will store the foreign key reference to the 'roles' table.
ALTER TABLE public.user_profiles
ADD COLUMN role_id INTEGER;

-- Step 5: Migrate existing user_level data to the new role_id column
-- This updates the new 'role_id' based on the old 'user_level' values.
UPDATE public.user_profiles AS up
SET role_id = r.id
FROM public.roles AS r
WHERE up.user_level = r.name;

-- Optional: Set a default role for any existing users who might not have a user_level
-- (e.g., if user_level was nullable or had unexpected values).
-- This assumes 'viewer' is the default role.
UPDATE public.user_profiles
SET role_id = (SELECT id FROM public.roles WHERE name = 'viewer')
WHERE role_id IS NULL;

-- Important: The 'user_level' column is still present.
-- We will drop it in a subsequent step after ensuring data integrity and updating foreign keys.
```