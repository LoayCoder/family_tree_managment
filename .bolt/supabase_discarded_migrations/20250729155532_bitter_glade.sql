```sql
-- Create the roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default roles if they don't already exist
INSERT INTO public.roles (name, description) VALUES
('family_secretary', 'Manages all aspects of the family system, including users, content, and data.'),
('level_manager', 'Manages a specific branch or level of the family tree, can submit changes for approval.'),
('content_writer', 'Can create and submit news posts, audio files, and text documents for approval.'),
('family_member', 'Basic access to view family tree, news, and approved content.'),
('viewer', 'Legacy role: Can view content.'),
('editor', 'Legacy role: Can edit content.'),
('admin', 'Legacy role: Administrator with broad permissions.')
ON CONFLICT (name) DO NOTHING;

-- Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approval_status text DEFAULT 'pending'::text CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by uuid REFERENCES public.user_profiles(id),
    approved_at timestamp with time zone,
    rejection_reason text,
    assigned_branch_id integer REFERENCES public."الفروع"("معرف_الفرع") ON DELETE SET NULL,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON public.user_profiles USING btree (approval_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON public.user_profiles USING btree (assigned_branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles USING btree (role_id);

-- Create RLS policies for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert their own profile (used by trigger function)
DROP POLICY IF EXISTS "Allow authenticated insert for profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated insert for profiles" ON public.user_profiles
FOR INSERT WITH CHECK (true); -- Allow insert, the trigger will set the correct user_id

-- Policy for service_role to insert profiles (if needed for direct insertion)
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.user_profiles;
CREATE POLICY "Allow service role to insert profiles" ON public.user_profiles
FOR INSERT TO service_role WITH CHECK (true);

-- Policy for users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy for admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles" ON public.user_profiles
FOR SELECT USING (get_user_level(auth.uid()) IN ('admin', 'family_secretary'));

-- Policy for admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (get_user_level(auth.uid()) IN ('admin', 'family_secretary')) WITH CHECK (get_user_level(auth.uid()) IN ('admin', 'family_secretary'));

-- Policy for admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
FOR DELETE USING (get_user_level(auth.uid()) IN ('admin', 'family_secretary'));

-- Create a function to get user's role level (for RLS)
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

-- Create a trigger function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run as definer to bypass RLS for initial insert
AS $$
DECLARE
    _user_role_id uuid;
    _user_full_name text;
    _requested_role_name text;
BEGIN
    -- Set row_security to off for this transaction to allow insertion regardless of RLS policies
    SET LOCAL row_security = off;

    -- Get requested role from raw_user_meta_data, default to 'family_member' if not provided
    _requested_role_name := COALESCE(NEW.raw_user_meta_data->>'user_level', 'family_member');

    -- Get the role_id for the requested role name
    SELECT id INTO _user_role_id
    FROM public.roles
    WHERE name = _requested_role_name;

    -- If the requested role doesn't exist, default to 'family_member'
    IF _user_role_id IS NULL THEN
        SELECT id INTO _user_role_id
        FROM public.roles
        WHERE name = 'family_member';
        RAISE WARNING 'Requested role "%" not found, defaulting to "family_member" for user %', _requested_role_name, NEW.email;
    END IF;

    -- Get full_name from raw_user_meta_data
    _user_full_name := NEW.raw_user_meta_data->>'full_name';

    -- Insert a row into public.user_profiles
    INSERT INTO public.user_profiles (id, email, full_name, role_id, approval_status)
    VALUES (NEW.id, NEW.email, _user_full_name, _user_role_id, 'pending');

    RETURN NEW;
END;
$$;

-- Create the trigger to call handle_new_user on auth.users inserts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create a trigger function to update `updated_at` column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at_column trigger to relevant tables
-- user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- roles
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC functions for admin actions (approve, reject, change role)
CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid, approver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles
    SET approval_status = 'approved',
        approved_by = approver_id,
        approved_at = now()
    WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(user_id uuid, approver_id uuid, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles
    SET approval_status = 'rejected',
        approved_by = approver_id,
        approved_at = now(),
        rejection_reason = reason
    WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_user_role(user_id uuid, new_role_name text, changer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _new_role_id uuid;
BEGIN
    SELECT id INTO _new_role_id
    FROM public.roles
    WHERE name = new_role_name;

    IF _new_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "%" not found', new_role_name;
    END IF;

    UPDATE public.user_profiles
    SET role_id = _new_role_id,
        updated_at = now()
    WHERE id = user_id;
END;
$$;

-- Create a safe view for user profiles to expose only necessary information
CREATE OR REPLACE VIEW public.user_profile_safe AS
SELECT
    up.id,
    up.email,
    up.full_name,
    r.name AS role_name,
    r.id AS role_id,
    up.approval_status,
    up.created_at,
    up.updated_at,
    up.approved_at,
    up.approved_by,
    up.rejection_reason
FROM
    public.user_profiles up
JOIN
    public.roles r ON up.role_id = r.id;

-- Create functions for pending changes approval
CREATE OR REPLACE FUNCTION public.approve_person_change(p_pending_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_change_data jsonb;
    v_entity_id bigint;
    v_change_type text;
BEGIN
    -- Get the pending change details
    SELECT change_data, entity_id, change_type
    INTO v_change_data, v_entity_id, v_change_type
    FROM public.pending_person_changes
    WHERE id = p_pending_id AND approval_status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending person change with ID % not found or not pending.', p_pending_id;
    END IF;

    -- Apply the change based on type
    IF v_change_type = 'insert' THEN
        INSERT INTO public."الأشخاص" (
            "الاسم_الأول", is_root, "تاريخ_الميلاد", "تاريخ_الوفاة", "مكان_الميلاد", "مكان_الوفاة",
            "رقم_هوية_وطنية", "الجنس", "الحالة_الاجتماعية", "المنصب", "مستوى_التعليم",
            father_id, mother_id, "معرف_الفرع", "صورة_شخصية", ملاحظات
        ) VALUES (
            v_change_data->>'الاسم_الأول',
            (v_change_data->>'is_root')::boolean,
            (v_change_data->>'تاريخ_الميلاد')::date,
            (v_change_data->>'تاريخ_الوفاة')::date,
            (v_change_data->>'مكان_الميلاد')::integer,
            (v_change_data->>'مكان_الوفاة')::integer,
            v_change_data->>'رقم_هوية_وطنية',
            v_change_data->>'الجنس',
            v_change_data->>'الحالة_الاجتماعية',
            v_change_data->>'المنصب',
            v_change_data->>'مستوى_التعليم',
            (v_change_data->>'father_id')::bigint,
            (v_change_data->>'mother_id')::bigint,
            (v_change_data->>'معرف_الفرع')::integer,
            v_change_data->>'صورة_شخصية',
            v_change_data->>'ملاحظات'
        );
    ELSIF v_change_type = 'update' THEN
        UPDATE public."الأشخاص"
        SET
            "الاسم_الأول" = COALESCE(v_change_data->>'الاسم_الأول', "الاسم_الأول"),
            is_root = COALESCE((v_change_data->>'is_root')::boolean, is_root),
            "تاريخ_الميلاد" = COALESCE((v_change_data->>'تاريخ_الميلاد')::date, "تاريخ_الميلاد"),
            "تاريخ_الوفاة" = COALESCE((v_change_data->>'تاريخ_الوفاة')::date, "تاريخ_الوفاة"),
            "مكان_الميلاد" = COALESCE((v_change_data->>'مكان_الميلاد')::integer, "مكان_الميلاد"),
            "مكان_الوفاة" = COALESCE((v_change_data->>'مكان_الوفاة')::integer, "مكان_الوفاة"),
            "رقم_هوية_وطنية" = COALESCE(v_change_data->>'رقم_هوية_وطنية', "رقم_هوية_وطنية"),
            "الجنس" = COALESCE(v_change_data->>'الجنس', "الجنس"),
            "الحالة_الاجتماعية" = COALESCE(v_change_data->>'الحالة_الاجتماعية', "الحالة_الاجتماعية"),
            "المنصب" = COALESCE(v_change_data->>'المنصب', "المنصب"),
            "مستوى_التعليم" = COALESCE(v_change_data->>'مستوى_التعليم', "مستوى_التعليم"),
            father_id = COALESCE((v_change_data->>'father_id')::bigint, father_id),
            mother_id = COALESCE((v_change_data->>'mother_id')::bigint, mother_id),
            "معرف_الفرع" = COALESCE((v_change_data->>'معرف_الفرع')::integer, "معرف_الفرع"),
            "صورة_شخصية" = COALESCE(v_change_data->>'صورة_شخصية', "صورة_شخصية"),
            ملاحظات = COALESCE(v_change_data->>'ملاحظات', ملاحظات)
        WHERE id = v_entity_id;
    ELSIF v_change_type = 'delete' THEN
        DELETE FROM public."الأشخاص"
        WHERE id = v_entity_id;
    END IF;

    -- Update the approval status
    UPDATE public.pending_person_changes
    SET approval_status = 'approved', approved_at = now()
    WHERE id = p_pending_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_person_change(p_pending_id integer, p_rejection_reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.pending_person_changes
    SET approval_status = 'rejected',
        rejection_reason = p_rejection_reason,
        approved_at = now()
    WHERE id = p_pending_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_woman_change(p_pending_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_change_data jsonb;
    v_entity_id integer;
    v_change_type text;
BEGIN
    -- Get the pending change details
    SELECT change_data, entity_id, change_type
    INTO v_change_data, v_entity_id, v_change_type
    FROM public.pending_woman_changes
    WHERE id = p_pending_id AND approval_status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending woman change with ID % not found or not pending.', p_pending_id;
    END IF;

    -- Apply the change based on type
    IF v_change_type = 'insert' THEN
        INSERT INTO public."النساء" (
            "الاسم_الأول", "اسم_الأب", "اسم_العائلة", "تاريخ_الميلاد", "تاريخ_الوفاة",
            "مكان_الميلاد", "مكان_الوفاة", "رقم_هوية_وطنية", "الحالة_الاجتماعية",
            "المنصب", "مستوى_التعليم", "معرف_الفرع", "صورة_شخصية", ملاحظات
        ) VALUES (
            v_change_data->>'الاسم_الأول',
            v_change_data->>'اسم_الأب',
            v_change_data->>'اسم_العائلة',
            (v_change_data->>'تاريخ_الميلاد')::date,
            (v_change_data->>'تاريخ_الوفاة')::date,
            (v_change_data->>'مكان_الميلاد')::integer,
            (v_change_data->>'مكان_الوفاة')::integer,
            v_change_data->>'رقم_هوية_وطنية',
            v_change_data->>'الحالة_الاجتماعية',
            v_change_data->>'المنصب',
            v_change_data->>'مستوى_التعليم',
            (v_change_data->>'معرف_الفرع')::integer,
            v_change_data->>'صورة_شخصية',
            v_change_data->>'ملاحظات'
        );
    ELSIF v_change_type = 'update' THEN
        UPDATE public."النساء"
        SET
            "الاسم_الأول" = COALESCE(v_change_data->>'الاسم_الأول', "الاسم_الأول"),
            "اسم_الأب" = COALESCE(v_change_data->>'اسم_الأب', "اسم_الأب"),
            "اسم_العائلة" = COALESCE(v_change_data->>'اسم_العائلة', "اسم_العائلة"),
            "تاريخ_الميلاد" = COALESCE((v_change_data->>'تاريخ_الميلاد')::date, "تاريخ_الميلاد"),
            "تاريخ_الوفاة" = COALESCE((v_change_data->>'تاريخ_الوفاة')::date, "تاريخ_الوفاة"),
            "مكان_الميلاد" = COALESCE((v_change_data->>'مكان_الميلاد')::integer, "مكان_الميلاد"),
            "مكان_الوفاة" = COALESCE((v_change_data->>'مكان_الوفاة')::integer, "مكان_الوفاة"),
            "رقم_هوية_وطنية" = COALESCE(v_change_data->>'رقم_هوية_وطنية', "رقم_هوية_وطنية"),
            "الحالة_الاجتماعية" = COALESCE(v_change_data->>'الحالة_الاجتماعية', "الحالة_الاجتماعية"),
            "المنصب" = COALESCE(v_change_data->>'المنصب', "المنصب"),
            "مستوى_التعليم" = COALESCE(v_change_data->>'مستوى_التعليم', "مستوى_التعليم"),
            "معرف_الفرع" = COALESCE((v_change_data->>'معرف_الفرع')::integer, "معرف_الفرع"),
            "صورة_شخصية" = COALESCE(v_change_data->>'صورة_شخصية', "صورة_شخصية"),
            ملاحظات = COALESCE(v_change_data->>'ملاحظات', ملاحظات)
        WHERE id = v_entity_id;
    ELSIF v_change_type = 'delete' THEN
        DELETE FROM public."النساء"
        WHERE id = v_entity_id;
    END IF;

    -- Update the approval status
    UPDATE public.pending_woman_changes
    SET approval_status = 'approved', approved_at = now()
    WHERE id = p_pending_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_woman_change(p_pending_id integer, p_rejection_reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.pending_woman_changes
    SET approval_status = 'rejected',
        rejection_reason = p_rejection_reason,
        approved_at = now()
    WHERE id = p_pending_id;
END;
$function$;

-- News Post Approval Functions
CREATE OR REPLACE FUNCTION public.approve_news_post(p_post_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.news_posts
    SET status = 'published',
        published_at = now(),
        updated_at = now()
    WHERE id = p_post_id AND status = 'pending_approval';
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_news_post(p_post_id integer, p_rejection_reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.news_posts
    SET status = 'rejected', -- Assuming 'rejected' is a valid status in news_posts
        rejection_reason = p_rejection_reason, -- Assuming news_posts has a rejection_reason column
        updated_at = now()
    WHERE id = p_post_id AND status = 'pending_approval';
END;
$function$;
```