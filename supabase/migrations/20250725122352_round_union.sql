/*
  # Phase 2: Approval Workflows for Data and Content Management

  This migration implements the approval workflow system for:
  1. Member data changes (persons and women)
  2. News post submissions
  3. Pending changes tracking and management
  4. Approval/rejection mechanisms

  ## New Tables
  - `pending_person_changes` - Tracks pending changes to الأشخاص table
  - `pending_woman_changes` - Tracks pending changes to النساء table
  - `pending_news_posts` - Enhanced news posts with approval workflow

  ## New Functions
  - `submit_person_change` - Submit person data for approval
  - `submit_woman_change` - Submit woman data for approval
  - `approve_person_change` - Approve pending person changes
  - `reject_person_change` - Reject pending person changes
  - `approve_woman_change` - Approve pending woman changes
  - `reject_woman_change` - Reject pending woman changes
  - `approve_news_post` - Approve news post for publication
  - `reject_news_post` - Reject news post submission

  ## Security
  - RLS policies for workflow enforcement
  - Role-based access control for approval actions
*/

-- Create enum for change types
CREATE TYPE change_type AS ENUM ('insert', 'update', 'delete');

-- Create enum for approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Table for pending person changes
CREATE TABLE IF NOT EXISTS pending_person_changes (
  id SERIAL PRIMARY KEY,
  change_type change_type NOT NULL,
  original_person_id BIGINT REFERENCES الأشخاص(id) ON DELETE CASCADE,
  submitted_by_user_id UUID REFERENCES user_profiles(id) NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approval_status approval_status DEFAULT 'pending',
  approved_by_user_id UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Person data fields (all nullable to support different change types)
  الاسم_الأول TEXT,
  is_root BOOLEAN,
  تاريخ_الميلاد DATE,
  تاريخ_الوفاة DATE,
  مكان_الميلاد INTEGER REFERENCES المواقع(معرف_الموقع),
  مكان_الوفاة INTEGER REFERENCES المواقع(معرف_الموقع),
  رقم_هوية_وطنية VARCHAR(20),
  الجنس TEXT CHECK (الجنس IN ('ذكر', 'أنثى')),
  الحالة_الاجتماعية TEXT CHECK (الحالة_الاجتماعية IN ('أعزب', 'متزوج', 'مطلق', 'أرمل')),
  المنصب TEXT,
  مستوى_التعليم TEXT,
  father_id BIGINT REFERENCES الأشخاص(id),
  mother_id BIGINT REFERENCES الأشخاص(id),
  معرف_الفرع INTEGER REFERENCES الفروع(معرف_الفرع),
  صورة_شخصية TEXT,
  ملاحظات TEXT,
  
  -- Notable fields
  is_notable BOOLEAN DEFAULT FALSE,
  notable_category TEXT,
  notable_biography TEXT,
  notable_education TEXT,
  notable_positions TEXT,
  notable_publications TEXT,
  notable_contact_info TEXT,
  notable_legacy TEXT,
  notable_profile_picture_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for pending woman changes
CREATE TABLE IF NOT EXISTS pending_woman_changes (
  id SERIAL PRIMARY KEY,
  change_type change_type NOT NULL,
  original_woman_id INTEGER REFERENCES النساء(id) ON DELETE CASCADE,
  submitted_by_user_id UUID REFERENCES user_profiles(id) NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approval_status approval_status DEFAULT 'pending',
  approved_by_user_id UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Woman data fields
  الاسم_الأول TEXT,
  اسم_الأب TEXT,
  اسم_العائلة TEXT,
  تاريخ_الميلاد DATE,
  تاريخ_الوفاة DATE,
  مكان_الميلاد INTEGER REFERENCES المواقع(معرف_الموقع),
  مكان_الوفاة INTEGER REFERENCES المواقع(معرف_الموقع),
  رقم_هوية_وطنية VARCHAR(20),
  الحالة_الاجتماعية TEXT CHECK (الحالة_الاجتماعية IN ('عزباء', 'متزوجة', 'مطلقة', 'أرملة')),
  المنصب TEXT,
  مستوى_التعليم TEXT,
  معرف_الفرع INTEGER REFERENCES الفروع(معرف_الفرع),
  صورة_شخصية TEXT,
  ملاحظات TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add approval workflow columns to news_posts table
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMPTZ;
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES user_profiles(id);
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update news_posts status enum to include pending_approval
ALTER TABLE news_posts DROP CONSTRAINT IF EXISTS news_posts_status_check;
ALTER TABLE news_posts ADD CONSTRAINT news_posts_status_check 
  CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'published'::text, 'archived'::text]));

-- Enable RLS on new tables
ALTER TABLE pending_person_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_woman_changes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_person_changes_status ON pending_person_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_person_changes_submitted_by ON pending_person_changes(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_person_changes_submitted_at ON pending_person_changes(submitted_at);

CREATE INDEX IF NOT EXISTS idx_pending_woman_changes_status ON pending_woman_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_pending_woman_changes_submitted_by ON pending_woman_changes(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_woman_changes_submitted_at ON pending_woman_changes(submitted_at);

CREATE INDEX IF NOT EXISTS idx_news_posts_approval_status ON news_posts(status) WHERE status = 'pending_approval';

-- Function to submit person changes for approval
CREATE OR REPLACE FUNCTION submit_person_change(
  p_change_type change_type,
  p_original_person_id BIGINT DEFAULT NULL,
  p_person_data JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_level TEXT;
  v_assigned_branch_id INTEGER;
  v_pending_id INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user level and assigned branch
  SELECT user_level, assigned_branch_id INTO v_user_level, v_assigned_branch_id
  FROM user_profiles 
  WHERE id = v_user_id AND approval_status = 'approved';
  
  IF v_user_level IS NULL THEN
    RAISE EXCEPTION 'User not found or not approved';
  END IF;
  
  -- Check permissions
  IF v_user_level NOT IN ('family_secretary', 'level_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to submit person changes';
  END IF;
  
  -- For level_manager, check if they can manage this person (branch validation)
  IF v_user_level = 'level_manager' AND v_assigned_branch_id IS NOT NULL THEN
    -- Check if the person belongs to the manager's assigned branch
    IF p_change_type IN ('update', 'delete') AND p_original_person_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM الأشخاص 
        WHERE id = p_original_person_id AND معرف_الفرع = v_assigned_branch_id
      ) THEN
        RAISE EXCEPTION 'Cannot modify person outside assigned branch';
      END IF;
    END IF;
    
    -- For new persons, ensure they are assigned to the manager's branch
    IF p_change_type = 'insert' THEN
      p_person_data := p_person_data || jsonb_build_object('معرف_الفرع', v_assigned_branch_id);
    END IF;
  END IF;
  
  -- Family secretary can approve immediately
  IF v_user_level = 'family_secretary' THEN
    -- Apply changes directly
    IF p_change_type = 'insert' THEN
      INSERT INTO الأشخاص (
        الاسم_الأول, is_root, تاريخ_الميلاد, تاريخ_الوفاة, مكان_الميلاد, مكان_الوفاة,
        رقم_هوية_وطنية, الجنس, الحالة_الاجتماعية, المنصب, مستوى_التعليم,
        father_id, mother_id, معرف_الفرع, صورة_شخصية, ملاحظات, path
      )
      SELECT 
        (p_person_data->>'الاسم_الأول')::TEXT,
        (p_person_data->>'is_root')::BOOLEAN,
        (p_person_data->>'تاريخ_الميلاد')::DATE,
        (p_person_data->>'تاريخ_الوفاة')::DATE,
        (p_person_data->>'مكان_الميلاد')::INTEGER,
        (p_person_data->>'مكان_الوفاة')::INTEGER,
        (p_person_data->>'رقم_هوية_وطنية')::VARCHAR(20),
        (p_person_data->>'الجنس')::TEXT,
        (p_person_data->>'الحالة_الاجتماعية')::TEXT,
        (p_person_data->>'المنصب')::TEXT,
        (p_person_data->>'مستوى_التعليم')::TEXT,
        (p_person_data->>'father_id')::BIGINT,
        (p_person_data->>'mother_id')::BIGINT,
        (p_person_data->>'معرف_الفرع')::INTEGER,
        (p_person_data->>'صورة_شخصية')::TEXT,
        (p_person_data->>'ملاحظات')::TEXT,
        '0'::ltree; -- Temporary path, will be updated by trigger
      
      RETURN -1; -- Indicates immediate approval
      
    ELSIF p_change_type = 'update' AND p_original_person_id IS NOT NULL THEN
      UPDATE الأشخاص SET
        الاسم_الأول = COALESCE((p_person_data->>'الاسم_الأول')::TEXT, الاسم_الأول),
        is_root = COALESCE((p_person_data->>'is_root')::BOOLEAN, is_root),
        تاريخ_الميلاد = COALESCE((p_person_data->>'تاريخ_الميلاد')::DATE, تاريخ_الميلاد),
        تاريخ_الوفاة = COALESCE((p_person_data->>'تاريخ_الوفاة')::DATE, تاريخ_الوفاة),
        مكان_الميلاد = COALESCE((p_person_data->>'مكان_الميلاد')::INTEGER, مكان_الميلاد),
        مكان_الوفاة = COALESCE((p_person_data->>'مكان_الوفاة')::INTEGER, مكان_الوفاة),
        رقم_هوية_وطنية = COALESCE((p_person_data->>'رقم_هوية_وطنية')::VARCHAR(20), رقم_هوية_وطنية),
        الجنس = COALESCE((p_person_data->>'الجنس')::TEXT, الجنس),
        الحالة_الاجتماعية = COALESCE((p_person_data->>'الحالة_الاجتماعية')::TEXT, الحالة_الاجتماعية),
        المنصب = COALESCE((p_person_data->>'المنصب')::TEXT, المنصب),
        مستوى_التعليم = COALESCE((p_person_data->>'مستوى_التعليم')::TEXT, مستوى_التعليم),
        father_id = COALESCE((p_person_data->>'father_id')::BIGINT, father_id),
        mother_id = COALESCE((p_person_data->>'mother_id')::BIGINT, mother_id),
        معرف_الفرع = COALESCE((p_person_data->>'معرف_الفرع')::INTEGER, معرف_الفرع),
        صورة_شخصية = COALESCE((p_person_data->>'صورة_شخصية')::TEXT, صورة_شخصية),
        ملاحظات = COALESCE((p_person_data->>'ملاحظات')::TEXT, ملاحظات),
        تاريخ_التحديث = NOW()
      WHERE id = p_original_person_id;
      
      RETURN -1; -- Indicates immediate approval
      
    ELSIF p_change_type = 'delete' AND p_original_person_id IS NOT NULL THEN
      DELETE FROM الأشخاص WHERE id = p_original_person_id;
      RETURN -1; -- Indicates immediate approval
    END IF;
  ELSE
    -- Level manager - submit for approval
    INSERT INTO pending_person_changes (
      change_type, original_person_id, submitted_by_user_id,
      الاسم_الأول, is_root, تاريخ_الميلاد, تاريخ_الوفاة, مكان_الميلاد, مكان_الوفاة,
      رقم_هوية_وطنية, الجنس, الحالة_الاجتماعية, المنصب, مستوى_التعليم,
      father_id, mother_id, معرف_الفرع, صورة_شخصية, ملاحظات,
      is_notable, notable_category, notable_biography, notable_education,
      notable_positions, notable_publications, notable_contact_info, notable_legacy,
      notable_profile_picture_url
    )
    VALUES (
      p_change_type, p_original_person_id, v_user_id,
      (p_person_data->>'الاسم_الأول')::TEXT,
      (p_person_data->>'is_root')::BOOLEAN,
      (p_person_data->>'تاريخ_الميلاد')::DATE,
      (p_person_data->>'تاريخ_الوفاة')::DATE,
      (p_person_data->>'مكان_الميلاد')::INTEGER,
      (p_person_data->>'مكان_الوفاة')::INTEGER,
      (p_person_data->>'رقم_هوية_وطنية')::VARCHAR(20),
      (p_person_data->>'الجنس')::TEXT,
      (p_person_data->>'الحالة_الاجتماعية')::TEXT,
      (p_person_data->>'المنصب')::TEXT,
      (p_person_data->>'مستوى_التعليم')::TEXT,
      (p_person_data->>'father_id')::BIGINT,
      (p_person_data->>'mother_id')::BIGINT,
      (p_person_data->>'معرف_الفرع')::INTEGER,
      (p_person_data->>'صورة_شخصية')::TEXT,
      (p_person_data->>'ملاحظات')::TEXT,
      (p_person_data->>'is_notable')::BOOLEAN,
      (p_person_data->>'notable_category')::TEXT,
      (p_person_data->>'notable_biography')::TEXT,
      (p_person_data->>'notable_education')::TEXT,
      (p_person_data->>'notable_positions')::TEXT,
      (p_person_data->>'notable_publications')::TEXT,
      (p_person_data->>'notable_contact_info')::TEXT,
      (p_person_data->>'notable_legacy')::TEXT,
      (p_person_data->>'notable_profile_picture_url')::TEXT
    )
    RETURNING id INTO v_pending_id;
    
    RETURN v_pending_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to submit woman changes for approval
CREATE OR REPLACE FUNCTION submit_woman_change(
  p_change_type change_type,
  p_original_woman_id INTEGER DEFAULT NULL,
  p_woman_data JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_level TEXT;
  v_assigned_branch_id INTEGER;
  v_pending_id INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user level and assigned branch
  SELECT user_level, assigned_branch_id INTO v_user_level, v_assigned_branch_id
  FROM user_profiles 
  WHERE id = v_user_id AND approval_status = 'approved';
  
  IF v_user_level IS NULL THEN
    RAISE EXCEPTION 'User not found or not approved';
  END IF;
  
  -- Check permissions
  IF v_user_level NOT IN ('family_secretary', 'level_manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to submit woman changes';
  END IF;
  
  -- For level_manager, check if they can manage this woman (branch validation)
  IF v_user_level = 'level_manager' AND v_assigned_branch_id IS NOT NULL THEN
    -- Check if the woman belongs to the manager's assigned branch
    IF p_change_type IN ('update', 'delete') AND p_original_woman_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM النساء 
        WHERE id = p_original_woman_id AND معرف_الفرع = v_assigned_branch_id
      ) THEN
        RAISE EXCEPTION 'Cannot modify woman outside assigned branch';
      END IF;
    END IF;
    
    -- For new women, ensure they are assigned to the manager's branch
    IF p_change_type = 'insert' THEN
      p_woman_data := p_woman_data || jsonb_build_object('معرف_الفرع', v_assigned_branch_id);
    END IF;
  END IF;
  
  -- Family secretary can approve immediately
  IF v_user_level = 'family_secretary' THEN
    -- Apply changes directly
    IF p_change_type = 'insert' THEN
      INSERT INTO النساء (
        الاسم_الأول, اسم_الأب, اسم_العائلة, تاريخ_الميلاد, تاريخ_الوفاة,
        مكان_الميلاد, مكان_الوفاة, رقم_هوية_وطنية, الحالة_الاجتماعية,
        المنصب, مستوى_التعليم, معرف_الفرع, صورة_شخصية, ملاحظات
      )
      SELECT 
        (p_woman_data->>'الاسم_الأول')::TEXT,
        (p_woman_data->>'اسم_الأب')::TEXT,
        (p_woman_data->>'اسم_العائلة')::TEXT,
        (p_woman_data->>'تاريخ_الميلاد')::DATE,
        (p_woman_data->>'تاريخ_الوفاة')::DATE,
        (p_woman_data->>'مكان_الميلاد')::INTEGER,
        (p_woman_data->>'مكان_الوفاة')::INTEGER,
        (p_woman_data->>'رقم_هوية_وطنية')::VARCHAR(20),
        (p_woman_data->>'الحالة_الاجتماعية')::TEXT,
        (p_woman_data->>'المنصب')::TEXT,
        (p_woman_data->>'مستوى_التعليم')::TEXT,
        (p_woman_data->>'معرف_الفرع')::INTEGER,
        (p_woman_data->>'صورة_شخصية')::TEXT,
        (p_woman_data->>'ملاحظات')::TEXT;
      
      RETURN -1; -- Indicates immediate approval
      
    ELSIF p_change_type = 'update' AND p_original_woman_id IS NOT NULL THEN
      UPDATE النساء SET
        الاسم_الأول = COALESCE((p_woman_data->>'الاسم_الأول')::TEXT, الاسم_الأول),
        اسم_الأب = COALESCE((p_woman_data->>'اسم_الأب')::TEXT, اسم_الأب),
        اسم_العائلة = COALESCE((p_woman_data->>'اسم_العائلة')::TEXT, اسم_العائلة),
        تاريخ_الميلاد = COALESCE((p_woman_data->>'تاريخ_الميلاد')::DATE, تاريخ_الميلاد),
        تاريخ_الوفاة = COALESCE((p_woman_data->>'تاريخ_الوفاة')::DATE, تاريخ_الوفاة),
        مكان_الميلاد = COALESCE((p_woman_data->>'مكان_الميلاد')::INTEGER, مكان_الميلاد),
        مكان_الوفاة = COALESCE((p_woman_data->>'مكان_الوفاة')::INTEGER, مكان_الوفاة),
        رقم_هوية_وطنية = COALESCE((p_woman_data->>'رقم_هوية_وطنية')::VARCHAR(20), رقم_هوية_وطنية),
        الحالة_الاجتماعية = COALESCE((p_woman_data->>'الحالة_الاجتماعية')::TEXT, الحالة_الاجتماعية),
        المنصب = COALESCE((p_woman_data->>'المنصب')::TEXT, المنصب),
        مستوى_التعليم = COALESCE((p_woman_data->>'مستوى_التعليم')::TEXT, مستوى_التعليم),
        معرف_الفرع = COALESCE((p_woman_data->>'معرف_الفرع')::INTEGER, معرف_الفرع),
        صورة_شخصية = COALESCE((p_woman_data->>'صورة_شخصية')::TEXT, صورة_شخصية),
        ملاحظات = COALESCE((p_woman_data->>'ملاحظات')::TEXT, ملاحظات),
        تاريخ_التحديث = NOW()
      WHERE id = p_original_woman_id;
      
      RETURN -1; -- Indicates immediate approval
      
    ELSIF p_change_type = 'delete' AND p_original_woman_id IS NOT NULL THEN
      DELETE FROM النساء WHERE id = p_original_woman_id;
      RETURN -1; -- Indicates immediate approval
    END IF;
  ELSE
    -- Level manager - submit for approval
    INSERT INTO pending_woman_changes (
      change_type, original_woman_id, submitted_by_user_id,
      الاسم_الأول, اسم_الأب, اسم_العائلة, تاريخ_الميلاد, تاريخ_الوفاة,
      مكان_الميلاد, مكان_الوفاة, رقم_هوية_وطنية, الحالة_الاجتماعية,
      المنصب, مستوى_التعليم, معرف_الفرع, صورة_شخصية, ملاحظات
    )
    VALUES (
      p_change_type, p_original_woman_id, v_user_id,
      (p_woman_data->>'الاسم_الأول')::TEXT,
      (p_woman_data->>'اسم_الأب')::TEXT,
      (p_woman_data->>'اسم_العائلة')::TEXT,
      (p_woman_data->>'تاريخ_الميلاد')::DATE,
      (p_woman_data->>'تاريخ_الوفاة')::DATE,
      (p_woman_data->>'مكان_الميلاد')::INTEGER,
      (p_woman_data->>'مكان_الوفاة')::INTEGER,
      (p_woman_data->>'رقم_هوية_وطنية')::VARCHAR(20),
      (p_woman_data->>'الحالة_الاجتماعية')::TEXT,
      (p_woman_data->>'المنصب')::TEXT,
      (p_woman_data->>'مستوى_التعليم')::TEXT,
      (p_woman_data->>'معرف_الفرع')::INTEGER,
      (p_woman_data->>'صورة_شخصية')::TEXT,
      (p_woman_data->>'ملاحظات')::TEXT
    )
    RETURNING id INTO v_pending_id;
    
    RETURN v_pending_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to approve person changes
CREATE OR REPLACE FUNCTION approve_person_change(
  p_pending_id INTEGER,
  p_approver_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_pending_record RECORD;
  v_new_person_id BIGINT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can approve changes';
  END IF;
  
  -- Get pending record
  SELECT * INTO v_pending_record
  FROM pending_person_changes
  WHERE id = p_pending_id AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found or already processed';
  END IF;
  
  -- Apply the change based on type
  IF v_pending_record.change_type = 'insert' THEN
    INSERT INTO الأشخاص (
      الاسم_الأول, is_root, تاريخ_الميلاد, تاريخ_الوفاة, مكان_الميلاد, مكان_الوفاة,
      رقم_هوية_وطنية, الجنس, الحالة_الاجتماعية, المنصب, مستوى_التعليم,
      father_id, mother_id, معرف_الفرع, صورة_شخصية, ملاحظات, path
    )
    VALUES (
      v_pending_record.الاسم_الأول,
      v_pending_record.is_root,
      v_pending_record.تاريخ_الميلاد,
      v_pending_record.تاريخ_الوفاة,
      v_pending_record.مكان_الميلاد,
      v_pending_record.مكان_الوفاة,
      v_pending_record.رقم_هوية_وطنية,
      v_pending_record.الجنس,
      v_pending_record.الحالة_الاجتماعية,
      v_pending_record.المنصب,
      v_pending_record.مستوى_التعليم,
      v_pending_record.father_id,
      v_pending_record.mother_id,
      v_pending_record.معرف_الفرع,
      v_pending_record.صورة_شخصية,
      v_pending_record.ملاحظات,
      '0'::ltree -- Temporary path, will be updated by trigger
    )
    RETURNING id INTO v_new_person_id;
    
    -- Handle notable information if applicable
    IF v_pending_record.is_notable AND v_pending_record.notable_category IS NOT NULL THEN
      INSERT INTO notables (
        person_id, category, biography, education, positions,
        publications, contact_info, legacy, profile_picture_url
      )
      VALUES (
        v_new_person_id,
        v_pending_record.notable_category,
        v_pending_record.notable_biography,
        v_pending_record.notable_education,
        v_pending_record.notable_positions,
        v_pending_record.notable_publications,
        v_pending_record.notable_contact_info,
        v_pending_record.notable_legacy,
        v_pending_record.notable_profile_picture_url
      );
    END IF;
    
  ELSIF v_pending_record.change_type = 'update' THEN
    UPDATE الأشخاص SET
      الاسم_الأول = COALESCE(v_pending_record.الاسم_الأول, الاسم_الأول),
      is_root = COALESCE(v_pending_record.is_root, is_root),
      تاريخ_الميلاد = COALESCE(v_pending_record.تاريخ_الميلاد, تاريخ_الميلاد),
      تاريخ_الوفاة = COALESCE(v_pending_record.تاريخ_الوفاة, تاريخ_الوفاة),
      مكان_الميلاد = COALESCE(v_pending_record.مكان_الميلاد, مكان_الميلاد),
      مكان_الوفاة = COALESCE(v_pending_record.مكان_الوفاة, مكان_الوفاة),
      رقم_هوية_وطنية = COALESCE(v_pending_record.رقم_هوية_وطنية, رقم_هوية_وطنية),
      الجنس = COALESCE(v_pending_record.الجنس, الجنس),
      الحالة_الاجتماعية = COALESCE(v_pending_record.الحالة_الاجتماعية, الحالة_الاجتماعية),
      المنصب = COALESCE(v_pending_record.المنصب, المنصب),
      مستوى_التعليم = COALESCE(v_pending_record.مستوى_التعليم, مستوى_التعليم),
      father_id = COALESCE(v_pending_record.father_id, father_id),
      mother_id = COALESCE(v_pending_record.mother_id, mother_id),
      معرف_الفرع = COALESCE(v_pending_record.معرف_الفرع, معرف_الفرع),
      صورة_شخصية = COALESCE(v_pending_record.صورة_شخصية, صورة_شخصية),
      ملاحظات = COALESCE(v_pending_record.ملاحظات, ملاحظات),
      تاريخ_التحديث = NOW()
    WHERE id = v_pending_record.original_person_id;
    
  ELSIF v_pending_record.change_type = 'delete' THEN
    DELETE FROM الأشخاص WHERE id = v_pending_record.original_person_id;
  END IF;
  
  -- Update pending record
  UPDATE pending_person_changes SET
    approval_status = 'approved',
    approved_by_user_id = v_user_id,
    approved_at = NOW(),
    rejection_reason = p_approver_notes
  WHERE id = p_pending_id;
  
  RETURN TRUE;
END;
$$;

-- Function to reject person changes
CREATE OR REPLACE FUNCTION reject_person_change(
  p_pending_id INTEGER,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can reject changes';
  END IF;
  
  -- Update pending record
  UPDATE pending_person_changes SET
    approval_status = 'rejected',
    approved_by_user_id = v_user_id,
    approved_at = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_pending_id AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found or already processed';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to approve woman changes
CREATE OR REPLACE FUNCTION approve_woman_change(
  p_pending_id INTEGER,
  p_approver_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_pending_record RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can approve changes';
  END IF;
  
  -- Get pending record
  SELECT * INTO v_pending_record
  FROM pending_woman_changes
  WHERE id = p_pending_id AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found or already processed';
  END IF;
  
  -- Apply the change based on type
  IF v_pending_record.change_type = 'insert' THEN
    INSERT INTO النساء (
      الاسم_الأول, اسم_الأب, اسم_العائلة, تاريخ_الميلاد, تاريخ_الوفاة,
      مكان_الميلاد, مكان_الوفاة, رقم_هوية_وطنية, الحالة_الاجتماعية,
      المنصب, مستوى_التعليم, معرف_الفرع, صورة_شخصية, ملاحظات
    )
    VALUES (
      v_pending_record.الاسم_الأول,
      v_pending_record.اسم_الأب,
      v_pending_record.اسم_العائلة,
      v_pending_record.تاريخ_الميلاد,
      v_pending_record.تاريخ_الوفاة,
      v_pending_record.مكان_الميلاد,
      v_pending_record.مكان_الوفاة,
      v_pending_record.رقم_هوية_وطنية,
      v_pending_record.الحالة_الاجتماعية,
      v_pending_record.المنصب,
      v_pending_record.مستوى_التعليم,
      v_pending_record.معرف_الفرع,
      v_pending_record.صورة_شخصية,
      v_pending_record.ملاحظات
    );
    
  ELSIF v_pending_record.change_type = 'update' THEN
    UPDATE النساء SET
      الاسم_الأول = COALESCE(v_pending_record.الاسم_الأول, الاسم_الأول),
      اسم_الأب = COALESCE(v_pending_record.اسم_الأب, اسم_الأب),
      اسم_العائلة = COALESCE(v_pending_record.اسم_العائلة, اسم_العائلة),
      تاريخ_الميلاد = COALESCE(v_pending_record.تاريخ_الميلاد, تاريخ_الميلاد),
      تاريخ_الوفاة = COALESCE(v_pending_record.تاريخ_الوفاة, تاريخ_الوفاة),
      مكان_الميلاد = COALESCE(v_pending_record.مكان_الميلاد, مكان_الميلاد),
      مكان_الوفاة = COALESCE(v_pending_record.مكان_الوفاة, مكان_الوفاة),
      رقم_هوية_وطنية = COALESCE(v_pending_record.رقم_هوية_وطنية, رقم_هوية_وطنية),
      الحالة_الاجتماعية = COALESCE(v_pending_record.الحالة_الاجتماعية, الحالة_الاجتماعية),
      المنصب = COALESCE(v_pending_record.المنصب, المنصب),
      مستوى_التعليم = COALESCE(v_pending_record.مستوى_التعليم, مستوى_التعليم),
      معرف_الفرع = COALESCE(v_pending_record.معرف_الفرع, معرف_الفرع),
      صورة_شخصية = COALESCE(v_pending_record.صورة_شخصية, صورة_شخصية),
      ملاحظات = COALESCE(v_pending_record.ملاحظات, ملاحظات),
      تاريخ_التحديث = NOW()
    WHERE id = v_pending_record.original_woman_id;
    
  ELSIF v_pending_record.change_type = 'delete' THEN
    DELETE FROM النساء WHERE id = v_pending_record.original_woman_id;
  END IF;
  
  -- Update pending record
  UPDATE pending_woman_changes SET
    approval_status = 'approved',
    approved_by_user_id = v_user_id,
    approved_at = NOW(),
    rejection_reason = p_approver_notes
  WHERE id = p_pending_id;
  
  RETURN TRUE;
END;
$$;

-- Function to reject woman changes
CREATE OR REPLACE FUNCTION reject_woman_change(
  p_pending_id INTEGER,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can reject changes';
  END IF;
  
  -- Update pending record
  UPDATE pending_woman_changes SET
    approval_status = 'rejected',
    approved_by_user_id = v_user_id,
    approved_at = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_pending_id AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found or already processed';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to approve news posts
CREATE OR REPLACE FUNCTION approve_news_post(
  p_post_id INTEGER,
  p_approver_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can approve news posts';
  END IF;
  
  -- Update news post
  UPDATE news_posts SET
    status = 'published',
    approved_by_user_id = v_user_id,
    published_at = NOW(),
    rejection_reason = p_approver_notes
  WHERE id = p_post_id AND status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'News post not found or not pending approval';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to reject news posts
CREATE OR REPLACE FUNCTION reject_news_post(
  p_post_id INTEGER,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is family secretary
  IF NOT is_family_secretary(v_user_id) THEN
    RAISE EXCEPTION 'Only family secretary can reject news posts';
  END IF;
  
  -- Update news post
  UPDATE news_posts SET
    status = 'draft',
    approved_by_user_id = v_user_id,
    rejection_reason = p_rejection_reason
  WHERE id = p_post_id AND status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'News post not found or not pending approval';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- RLS Policies for pending_person_changes
CREATE POLICY "Family secretary can view all pending person changes"
  ON pending_person_changes
  FOR SELECT
  TO authenticated
  USING (is_family_secretary(auth.uid()));

CREATE POLICY "Level managers can view their own pending person changes"
  ON pending_person_changes
  FOR SELECT
  TO authenticated
  USING (submitted_by_user_id = auth.uid());

CREATE POLICY "Level managers can insert pending person changes"
  ON pending_person_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_level(auth.uid()) IN ('level_manager', 'family_secretary') AND
    submitted_by_user_id = auth.uid()
  );

CREATE POLICY "Family secretary can update pending person changes"
  ON pending_person_changes
  FOR UPDATE
  TO authenticated
  USING (is_family_secretary(auth.uid()));

-- RLS Policies for pending_woman_changes
CREATE POLICY "Family secretary can view all pending woman changes"
  ON pending_woman_changes
  FOR SELECT
  TO authenticated
  USING (is_family_secretary(auth.uid()));

CREATE POLICY "Level managers can view their own pending woman changes"
  ON pending_woman_changes
  FOR SELECT
  TO authenticated
  USING (submitted_by_user_id = auth.uid());

CREATE POLICY "Level managers can insert pending woman changes"
  ON pending_woman_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_level(auth.uid()) IN ('level_manager', 'family_secretary') AND
    submitted_by_user_id = auth.uid()
  );

CREATE POLICY "Family secretary can update pending woman changes"
  ON pending_woman_changes
  FOR UPDATE
  TO authenticated
  USING (is_family_secretary(auth.uid()));

-- Update RLS policies for الأشخاص table to restrict direct access
DROP POLICY IF EXISTS "Enable insert for all users" ON الأشخاص;
DROP POLICY IF EXISTS "Enable update for all users" ON الأشخاص;
DROP POLICY IF EXISTS "Enable delete for all users" ON الأشخاص;

CREATE POLICY "Family secretary can manage persons directly"
  ON الأشخاص
  FOR ALL
  TO authenticated
  USING (is_family_secretary(auth.uid()))
  WITH CHECK (is_family_secretary(auth.uid()));

CREATE POLICY "All users can read persons"
  ON الأشخاص
  FOR SELECT
  TO authenticated
  USING (true);

-- Update RLS policies for النساء table to restrict direct access
DROP POLICY IF EXISTS "Enable insert for all users" ON النساء;
DROP POLICY IF EXISTS "Enable update for all users" ON النساء;
DROP POLICY IF EXISTS "Enable delete for all users" ON النساء;

CREATE POLICY "Family secretary can manage women directly"
  ON النساء
  FOR ALL
  TO authenticated
  USING (is_family_secretary(auth.uid()))
  WITH CHECK (is_family_secretary(auth.uid()));

CREATE POLICY "All users can read women"
  ON النساء
  FOR SELECT
  TO authenticated
  USING (true);

-- Update RLS policies for news_posts to include approval workflow
DROP POLICY IF EXISTS "Allow all users to read published news posts" ON news_posts;
DROP POLICY IF EXISTS "Allow admins and editors to create news posts" ON news_posts;
DROP POLICY IF EXISTS "Allow admins and editors to update news posts" ON news_posts;
DROP POLICY IF EXISTS "Allow admins to delete news posts" ON news_posts;

CREATE POLICY "All users can read published public news posts"
  ON news_posts
  FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND is_public = true) OR
    is_family_secretary(auth.uid()) OR
    get_user_level(auth.uid()) = 'content_writer'
  );

CREATE POLICY "Content writers and family secretary can create news posts"
  ON news_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_level(auth.uid()) IN ('content_writer', 'family_secretary') AND
    author_id = auth.uid()
  );

CREATE POLICY "Content writers can update their own draft news posts"
  ON news_posts
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() AND
    get_user_level(auth.uid()) = 'content_writer' AND
    status IN ('draft', 'pending_approval')
  )
  WITH CHECK (
    author_id = auth.uid() AND
    get_user_level(auth.uid()) = 'content_writer' AND
    status IN ('draft', 'pending_approval')
  );

CREATE POLICY "Family secretary can update any news post"
  ON news_posts
  FOR UPDATE
  TO authenticated
  USING (is_family_secretary(auth.uid()))
  WITH CHECK (is_family_secretary(auth.uid()));

CREATE POLICY "Family secretary can delete news posts"
  ON news_posts
  FOR DELETE
  TO authenticated
  USING (is_family_secretary(auth.uid()));

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_pending_changes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_person_changes_updated_at
  BEFORE UPDATE ON pending_person_changes
  FOR EACH ROW EXECUTE FUNCTION update_pending_changes_updated_at();

CREATE TRIGGER update_pending_woman_changes_updated_at
  BEFORE UPDATE ON pending_woman_changes
  FOR EACH ROW EXECUTE FUNCTION update_pending_changes_updated_at();

-- Create view for pending changes summary
CREATE OR REPLACE VIEW pending_changes_summary AS
SELECT 
  'person' as change_entity,
  id,
  change_type,
  submitted_by_user_id,
  submitted_at,
  approval_status,
  approved_by_user_id,
  approved_at,
  rejection_reason,
  CASE 
    WHEN change_type = 'insert' THEN الاسم_الأول
    WHEN change_type = 'update' THEN (
      SELECT الاسم_الأول FROM الأشخاص WHERE id = original_person_id
    )
    WHEN change_type = 'delete' THEN (
      SELECT الاسم_الأول FROM الأشخاص WHERE id = original_person_id
    )
  END as entity_name,
  original_person_id as entity_id
FROM pending_person_changes

UNION ALL

SELECT 
  'woman' as change_entity,
  id,
  change_type,
  submitted_by_user_id,
  submitted_at,
  approval_status,
  approved_by_user_id,
  approved_at,
  rejection_reason,
  CASE 
    WHEN change_type = 'insert' THEN الاسم_الأول
    WHEN change_type = 'update' THEN (
      SELECT الاسم_الأول FROM النساء WHERE id = original_woman_id
    )
    WHEN change_type = 'delete' THEN (
      SELECT الاسم_الأول FROM النساء WHERE id = original_woman_id
    )
  END as entity_name,
  original_woman_id as entity_id
FROM pending_woman_changes

ORDER BY submitted_at DESC;

-- Grant necessary permissions
GRANT SELECT ON pending_changes_summary TO authenticated;
GRANT EXECUTE ON FUNCTION submit_person_change TO authenticated;
GRANT EXECUTE ON FUNCTION submit_woman_change TO authenticated;
GRANT EXECUTE ON FUNCTION approve_person_change TO authenticated;
GRANT EXECUTE ON FUNCTION reject_person_change TO authenticated;
GRANT EXECUTE ON FUNCTION approve_woman_change TO authenticated;
GRANT EXECUTE ON FUNCTION reject_woman_change TO authenticated;
GRANT EXECUTE ON FUNCTION approve_news_post TO authenticated;
GRANT EXECUTE ON FUNCTION reject_news_post TO authenticated;