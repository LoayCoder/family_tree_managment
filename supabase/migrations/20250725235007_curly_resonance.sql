/*
  # Fix all remaining user_level column references

  This migration identifies and fixes all database objects that still reference
  the old user_level column which was replaced with the roles table structure.

  1. Drop and recreate functions that reference user_level
  2. Update any remaining RLS policies
  3. Check for triggers or views that might reference user_level
  4. Ensure all database objects use the new roles table structure
*/

-- First, let's check what's causing the issue by looking at the user_profiles table structure
-- and any objects that might be referencing user_level

-- Drop any functions that might still reference user_level
DROP FUNCTION IF EXISTS public.get_user_level(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Recreate the get_user_level function to work with the new roles table
CREATE OR REPLACE FUNCTION public.get_user_level(user_uuid uuid)
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
    WHERE up.id = user_uuid 
    AND up.approval_status = 'approved';
    
    RETURN COALESCE(user_role_name, 'viewer');
END;
$$;

-- Recreate the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_user_level(user_uuid) IN ('admin', 'family_secretary');
END;
$$;

-- Check if there are any views that reference user_level and drop them if needed
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            -- Try to get the view definition and check if it contains user_level
            IF EXISTS (
                SELECT 1 
                FROM pg_views 
                WHERE schemaname = view_record.schemaname 
                AND viewname = view_record.viewname 
                AND definition LIKE '%user_level%'
            ) THEN
                EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
                RAISE NOTICE 'Dropped view %.% because it referenced user_level', view_record.schemaname, view_record.viewname;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not check view %.%: %', view_record.schemaname, view_record.viewname, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Recreate the user_profile_safe view without user_level
CREATE OR REPLACE VIEW public.user_profile_safe AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    r.name as user_level,  -- This provides backward compatibility
    up.approval_status,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
LEFT JOIN public.roles r ON up.role_id = r.id;

-- Enable RLS on the view
ALTER VIEW public.user_profile_safe SET (security_invoker = true);

-- Grant necessary permissions
GRANT SELECT ON public.user_profile_safe TO authenticated;
GRANT SELECT ON public.user_profile_safe TO anon;

-- Ensure all RLS policies are properly recreated for tables that use get_user_level

-- Drop and recreate RLS policies for news_posts
DROP POLICY IF EXISTS "Allow all users to read published news posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow admins and editors to create news posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow admins and editors to update news posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow admins to delete news posts" ON public.news_posts;

CREATE POLICY "Allow all users to read published news posts"
ON public.news_posts
FOR SELECT
TO public
USING (((status = 'published'::text) AND (is_public = true)) OR (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text])));

CREATE POLICY "Allow admins and editors to create news posts"
ON public.news_posts
FOR INSERT
TO public
WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text, 'content_writer'::text]));

CREATE POLICY "Allow admins and editors to update news posts"
ON public.news_posts
FOR UPDATE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text, 'content_writer'::text]));

CREATE POLICY "Allow admins to delete news posts"
ON public.news_posts
FOR DELETE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text]));

-- Drop and recreate RLS policies for events
DROP POLICY IF EXISTS "Allow all users to read public events" ON public.events;
DROP POLICY IF EXISTS "Allow admins and editors to create events" ON public.events;
DROP POLICY IF EXISTS "Allow admins and editors to update events" ON public.events;
DROP POLICY IF EXISTS "Allow admins to delete events" ON public.events;

CREATE POLICY "Allow all users to read public events"
ON public.events
FOR SELECT
TO public
USING ((is_public = true) OR (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text])));

CREATE POLICY "Allow admins and editors to create events"
ON public.events
FOR INSERT
TO public
WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text]));

CREATE POLICY "Allow admins and editors to update events"
ON public.events
FOR UPDATE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text]));

CREATE POLICY "Allow admins to delete events"
ON public.events
FOR DELETE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text]));

-- Drop and recreate RLS policies for comments
DROP POLICY IF EXISTS "Allow public to read approved comments, admins to read all" ON public.comments;
DROP POLICY IF EXISTS "Allow admins to update any comment, users to update their own" ON public.comments;
DROP POLICY IF EXISTS "Allow admins to delete any comment, users to delete their own" ON public.comments;

CREATE POLICY "Allow public to read approved comments, admins to read all"
ON public.comments
FOR SELECT
TO public
USING ((approval_status = 'approved'::text) OR (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text])));

CREATE POLICY "Allow admins to update any comment, users to update their own"
ON public.comments
FOR UPDATE
TO public
USING ((get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text])) OR (user_id = auth.uid()));

CREATE POLICY "Allow admins to delete any comment, users to delete their own"
ON public.comments
FOR DELETE
TO public
USING ((get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text])) OR (user_id = auth.uid()));

-- Drop and recreate RLS policies for media_files
DROP POLICY IF EXISTS "Allow public to read approved public media, authenticated to re" ON public.media_files;
DROP POLICY IF EXISTS "Allow admins to update any media file, users to update their ow" ON public.media_files;
DROP POLICY IF EXISTS "Allow admins to delete any media file, users to delete their ow" ON public.media_files;

CREATE POLICY "Allow public to read approved public media, authenticated to read all"
ON public.media_files
FOR SELECT
TO public
USING (((is_public = true) AND (approval_status = 'approved'::text)) OR (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text])));

CREATE POLICY "Allow admins to update any media file, users to update their own"
ON public.media_files
FOR UPDATE
TO public
USING ((get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text])) OR (uploaded_by_user_id = auth.uid()));

CREATE POLICY "Allow admins to delete any media file, users to delete their own"
ON public.media_files
FOR DELETE
TO public
USING ((get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text])) OR (uploaded_by_user_id = auth.uid()));

-- Drop and recreate RLS policies for notables
DROP POLICY IF EXISTS "Allow admins and editors to create notable profiles" ON public.notables;
DROP POLICY IF EXISTS "Allow admins and editors to update notable profiles" ON public.notables;
DROP POLICY IF EXISTS "Allow admins to delete notable profiles" ON public.notables;

CREATE POLICY "Allow admins and editors to create notable profiles"
ON public.notables
FOR INSERT
TO public
WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text]));

CREATE POLICY "Allow admins and editors to update notable profiles"
ON public.notables
FOR UPDATE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'editor'::text, 'family_secretary'::text]));

CREATE POLICY "Allow admins to delete notable profiles"
ON public.notables
FOR DELETE
TO public
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text]));

-- Drop and recreate RLS policies for pending changes tables
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.pending_person_changes;
DROP POLICY IF EXISTS "Level managers can submit changes" ON public.pending_person_changes;
DROP POLICY IF EXISTS "Family secretary can manage all changes" ON public.pending_person_changes;

CREATE POLICY "Users can view their own submissions"
ON public.pending_person_changes
FOR SELECT
TO authenticated
USING ((submitted_by_user_id = auth.uid()) OR (get_user_level(auth.uid()) = 'family_secretary'::text));

CREATE POLICY "Level managers can submit changes"
ON public.pending_person_changes
FOR INSERT
TO authenticated
WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['level_manager'::text, 'family_secretary'::text]));

CREATE POLICY "Family secretary can manage all changes"
ON public.pending_person_changes
FOR ALL
TO authenticated
USING (get_user_level(auth.uid()) = 'family_secretary'::text);

-- Same for pending_woman_changes
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.pending_woman_changes;
DROP POLICY IF EXISTS "Level managers can submit changes" ON public.pending_woman_changes;
DROP POLICY IF EXISTS "Family secretary can manage all changes" ON public.pending_woman_changes;

CREATE POLICY "Users can view their own submissions"
ON public.pending_woman_changes
FOR SELECT
TO authenticated
USING ((submitted_by_user_id = auth.uid()) OR (get_user_level(auth.uid()) = 'family_secretary'::text));

CREATE POLICY "Level managers can submit changes"
ON public.pending_woman_changes
FOR INSERT
TO authenticated
WITH CHECK (get_user_level(auth.uid()) = ANY (ARRAY['level_manager'::text, 'family_secretary'::text]));

CREATE POLICY "Family secretary can manage all changes"
ON public.pending_woman_changes
FOR ALL
TO authenticated
USING (get_user_level(auth.uid()) = 'family_secretary'::text);

-- Check if there's a roles table RLS policy that needs updating
DROP POLICY IF EXISTS "Allow admins to manage roles" ON public.roles;

CREATE POLICY "Allow admins to manage roles"
ON public.roles
FOR ALL
TO authenticated
USING (get_user_level(auth.uid()) = ANY (ARRAY['admin'::text, 'family_secretary'::text]));

-- Grant necessary permissions on the roles table
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO anon;

-- Ensure the get_user_level function has proper permissions
GRANT EXECUTE ON FUNCTION public.get_user_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_level(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;