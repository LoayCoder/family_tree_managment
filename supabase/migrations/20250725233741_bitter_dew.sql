```sql
-- Step 1: Disable Dependent RLS Policies
-- news_posts policies
ALTER POLICY "Allow all users to read published news posts" ON public.news_posts DISABLE;
ALTER POLICY "Allow admins and editors to create news posts" ON public.news_posts DISABLE;
ALTER POLICY "Allow admins and editors to update news posts" ON public.news_posts DISABLE;
ALTER POLICY "Allow admins to delete news posts" ON public.news_posts DISABLE;

-- events policies
ALTER POLICY "Allow all users to read public events" ON public.events DISABLE;
ALTER POLICY "Allow admins and editors to create events" ON public.events DISABLE;
ALTER POLICY "Allow admins and editors to update events" ON public.events DISABLE;
ALTER POLICY "Allow admins to delete events" ON public.events DISABLE;

-- comments policies
ALTER POLICY "Allow public to read approved comments, admins to read all" ON public.comments DISABLE;
ALTER POLICY "Allow admins to update any comment, users to update their own" ON public.comments DISABLE;
ALTER POLICY "Allow admins to delete any comment, users to delete their own" ON public.comments DISABLE;

-- media_files policies
ALTER POLICY "Allow public to read approved public media, authenticated to re" ON public.media_files DISABLE;
ALTER POLICY "Allow admins to update any media file, users to update their ow" ON public.media_files DISABLE;
ALTER POLICY "Allow admins to delete any media file, users to delete their ow" ON public.media_files DISABLE;

-- notables policies
ALTER POLICY "Allow admins and editors to create notable profiles" ON public.notables DISABLE;
ALTER POLICY "Allow admins and editors to update notable profiles" ON public.notables DISABLE;
ALTER POLICY "Allow admins to delete notable profiles" ON public.notables DISABLE;

-- pending_person_changes policies
ALTER POLICY "Users can view their own submissions" ON public.pending_person_changes DISABLE;
ALTER POLICY "Level managers can submit changes" ON public.pending_person_changes DISABLE;
ALTER POLICY "Family secretary can manage all changes" ON public.pending_person_changes DISABLE;

-- pending_woman_changes policies
ALTER POLICY "Users can view their own submissions" ON public.pending_woman_changes DISABLE;
ALTER POLICY "Level managers can submit changes" ON public.pending_woman_changes DISABLE;
ALTER POLICY "Family secretary can manage all changes" ON public.pending_woman_changes DISABLE;

-- roles policies
ALTER POLICY "Allow admins to manage roles" ON public.roles DISABLE;

-- Step 2: Drop the Old Function
DROP FUNCTION IF EXISTS public.get_user_level(uuid);

-- Step 3: Create the New Function
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
    WHERE up.id = user_uuid;

    RETURN user_role_name;
END;
$$;

-- Step 4: Re-enable Dependent RLS Policies
-- news_posts policies
ALTER POLICY "Allow all users to read published news posts" ON public.news_posts ENABLE;
ALTER POLICY "Allow admins and editors to create news posts" ON public.news_posts ENABLE;
ALTER POLICY "Allow admins and editors to update news posts" ON public.news_posts ENABLE;
ALTER POLICY "Allow admins to delete news posts" ON public.news_posts ENABLE;

-- events policies
ALTER POLICY "Allow all users to read public events" ON public.events ENABLE;
ALTER POLICY "Allow admins and editors to create events" ON public.events ENABLE;
ALTER POLICY "Allow admins and editors to update events" ON public.events ENABLE;
ALTER POLICY "Allow admins to delete events" ON public.events ENABLE;

-- comments policies
ALTER POLICY "Allow public to read approved comments, admins to read all" ON public.comments ENABLE;
ALTER POLICY "Allow admins to update any comment, users to update their own" ON public.comments ENABLE;
ALTER POLICY "Allow admins to delete any comment, users to delete their own" ON public.comments ENABLE;

-- media_files policies
ALTER POLICY "Allow public to read approved public media, authenticated to re" ON public.media_files ENABLE;
ALTER POLICY "Allow admins to update any media file, users to update their ow" ON public.media_files ENABLE;
ALTER POLICY "Allow admins to delete any media file, users to delete their ow" ON public.media_files ENABLE;

-- notables policies
ALTER POLICY "Allow admins and editors to create notable profiles" ON public.notables ENABLE;
ALTER POLICY "Allow admins and editors to update notable profiles" ON public.notables ENABLE;
ALTER POLICY "Allow admins to delete notable profiles" ON public.notables ENABLE;

-- pending_person_changes policies
ALTER POLICY "Users can view their own submissions" ON public.pending_person_changes ENABLE;
ALTER POLICY "Level managers can submit changes" ON public.pending_person_changes ENABLE;
ALTER POLICY "Family secretary can manage all changes" ON public.pending_person_changes ENABLE;

-- pending_woman_changes policies
ALTER POLICY "Users can view their own submissions" ON public.pending_woman_changes ENABLE;
ALTER POLICY "Level managers can submit changes" ON public.pending_woman_changes ENABLE;
ALTER POLICY "Family secretary can manage all changes" ON public.pending_woman_changes ENABLE;

-- roles policies
ALTER POLICY "Allow admins to manage roles" ON public.roles ENABLE;
```