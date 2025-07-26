```sql
-- Step 1: Set role_id to NOT NULL
-- This assumes all existing user_profiles rows have been successfully migrated to have a role_id.
ALTER TABLE public.user_profiles
ALTER COLUMN role_id SET NOT NULL;

-- Step 2: Add Foreign Key Constraint from user_profiles.role_id to roles.id
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profile_role
FOREIGN KEY (role_id) REFERENCES public.roles(id)
ON DELETE RESTRICT; -- Prevents deleting a role if users are still assigned to it

-- Step 3: Drop the old user_level column
ALTER TABLE public.user_profiles
DROP COLUMN user_level;

-- Step 4: Redefine the get_user_level function to use the new roles table
-- This function is used in RLS policies across your schema.
CREATE OR REPLACE FUNCTION public.get_user_level(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_name text;
BEGIN
    SELECT r.name INTO user_role_name
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = user_id;

    RETURN user_role_name;
END;
$$;

-- Optional: Verify the changes
-- SELECT id, email, full_name, role_id, approval_status FROM public.user_profiles;
-- SELECT up.email, r.name as user_role FROM public.user_profiles up JOIN public.roles r ON up.role_id = r.id;
```