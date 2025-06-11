/*
  # Arabic Family Tree Database System

  1. Core Tables
    - المواقع (Locations) - Geographic foundation
    - الفروع (Branches) - Family branches with ltree
    - الأشخاص (Persons) - Main family line for men
    - النساء (Women) - Side branch for women

  2. Features
    - Hierarchical structure using ltree
    - National ID search capabilities
    - Geographic branch management
    - Comprehensive statistics and views
    - Row Level Security (RLS)

  3. Performance
    - Optimized indexes for fast queries
    - Automatic path generation
    - Efficient hierarchical operations
*/

-- Enable ltree extension first
CREATE EXTENSION IF NOT EXISTS ltree;

-- 1. LOCATIONS TABLE (Foundation)
CREATE TABLE IF NOT EXISTS public.المواقع (
    معرف_الموقع     SERIAL PRIMARY KEY,
    الدولة          VARCHAR(100) NOT NULL,
    المنطقة         VARCHAR(100),
    المدينة         VARCHAR(100),
    تفاصيل_إضافية   TEXT,
    تاريخ_الإنشاء    TIMESTAMP DEFAULT NOW(),
    تاريخ_التحديث   TIMESTAMP DEFAULT NOW(),
    UNIQUE(الدولة, المنطقة, المدينة)
);

-- 2. BRANCHES TABLE (Hierarchical)
CREATE TABLE IF NOT EXISTS public.الفروع (
    معرف_الفرع      SERIAL PRIMARY KEY,
    اسم_الفرع       VARCHAR(200) NOT NULL UNIQUE,
    وصف_الفرع       TEXT,
    الفرع_الأصل     INTEGER REFERENCES public.الفروع(معرف_الفرع),
    معرف_الموقع     INTEGER REFERENCES public.المواقع(معرف_الموقع),
    تاريخ_التأسيس   DATE,
    مسار_الفرع      LTREE,
    ملاحظات         TEXT,
    تاريخ_الإنشاء    TIMESTAMP DEFAULT NOW(),
    تاريخ_التحديث   TIMESTAMP DEFAULT NOW()
);

-- 3. PERSONS TABLE (Main Line - Men)
CREATE TABLE IF NOT EXISTS public.الأشخاص (
    id                  BIGSERIAL PRIMARY KEY,
    الاسم_الأول         TEXT NOT NULL,
    is_root             BOOLEAN DEFAULT FALSE,
    تاريخ_الميلاد       DATE,
    تاريخ_الوفاة        DATE,
    مكان_الميلاد        INTEGER REFERENCES public.المواقع(معرف_الموقع),
    مكان_الوفاة         INTEGER REFERENCES public.المواقع(معرف_الموقع),
    رقم_هوية_وطنية     VARCHAR(20) UNIQUE,
    الجنس               TEXT CHECK (الجنس IN ('ذكر','أنثى')) DEFAULT 'ذكر',
    الحالة_الاجتماعية   TEXT CHECK (الحالة_الاجتماعية IN ('أعزب','متزوج','مطلق','أرمل')),
    المنصب              TEXT,
    مستوى_التعليم       TEXT,
    father_id           BIGINT REFERENCES public.الأشخاص(id),
    mother_id           BIGINT REFERENCES public.الأشخاص(id),
    معرف_الفرع          INTEGER REFERENCES public.الفروع(معرف_الفرع),
    path                LTREE NOT NULL,
    صورة_شخصية         TEXT,
    ملاحظات             TEXT,
    تاريخ_الإنشاء       TIMESTAMP DEFAULT NOW(),
    تاريخ_التحديث      TIMESTAMP DEFAULT NOW()
);

-- 4. WOMEN TABLE (Side Branch)
CREATE TABLE IF NOT EXISTS public.النساء (
    id                  SERIAL PRIMARY KEY,
    الاسم_الأول         TEXT NOT NULL,
    اسم_الأب            TEXT,
    اسم_العائلة         TEXT,
    تاريخ_الميلاد       DATE,
    تاريخ_الوفاة        DATE,
    مكان_الميلاد        INTEGER REFERENCES public.المواقع(معرف_الموقع),
    مكان_الوفاة         INTEGER REFERENCES public.المواقع(معرف_الموقع),
    رقم_هوية_وطنية     VARCHAR(20) UNIQUE,
    الحالة_الاجتماعية   TEXT CHECK (الحالة_الاجتماعية IN ('عزباء','متزوجة','مطلقة','أرملة')),
    المنصب              TEXT,
    مستوى_التعليم       TEXT,
    معرف_الفرع          INTEGER REFERENCES public.الفروع(معرف_الفرع),
    صورة_شخصية         TEXT,
    ملاحظات             TEXT,
    تاريخ_الإنشاء       TIMESTAMP DEFAULT NOW(),
    تاريخ_التحديث      TIMESTAMP DEFAULT NOW()
);

-- 5. OPTIMIZED INDEXES
-- Person Indexes
CREATE INDEX IF NOT EXISTS idx_الأشخاص_path ON public.الأشخاص USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_الأشخاص_اسم ON public.الأشخاص (الاسم_الأول);
CREATE INDEX IF NOT EXISTS idx_الأشخاص_فرع ON public.الأشخاص (معرف_الفرع);
CREATE INDEX IF NOT EXISTS idx_الأشخاص_جذر ON public.الأشخاص (is_root) WHERE is_root = TRUE;
CREATE INDEX IF NOT EXISTS idx_الأشخاص_هوية ON public.الأشخاص (رقم_هوية_وطنية) WHERE رقم_هوية_وطنية IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_الأشخاص_ميلاد ON public.الأشخاص (تاريخ_الميلاد);
CREATE INDEX IF NOT EXISTS idx_الأشخاص_father ON public.الأشخاص (father_id);

-- Women Indexes
CREATE INDEX IF NOT EXISTS idx_النساء_اسم ON public.النساء (الاسم_الأول);
CREATE INDEX IF NOT EXISTS idx_النساء_عائلة ON public.النساء (اسم_العائلة);
CREATE INDEX IF NOT EXISTS idx_النساء_فرع ON public.النساء (معرف_الفرع);
CREATE INDEX IF NOT EXISTS idx_النساء_هوية ON public.النساء (رقم_هوية_وطنية) WHERE رقم_هوية_وطنية IS NOT NULL;

-- Branch Indexes
CREATE INDEX IF NOT EXISTS idx_الفروع_مسار ON public.الفروع USING GIST (مسار_الفرع);
CREATE INDEX IF NOT EXISTS idx_الفروع_اسم ON public.الفروع (اسم_الفرع);

-- Location Indexes
CREATE INDEX IF NOT EXISTS idx_المواقع_الدولة ON public.المواقع (الدولة);
CREATE INDEX IF NOT EXISTS idx_المواقع_المنطقة ON public.المواقع (المنطقة);
CREATE INDEX IF NOT EXISTS idx_المواقع_المدينة ON public.المواقع (المدينة);

-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- Function to update person path automatically
CREATE OR REPLACE FUNCTION public.update_person_path()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.father_id IS NULL THEN
        NEW.path := NEW.id::text::ltree;
    ELSE
        SELECT path || NEW.id::text INTO NEW.path
        FROM public.الأشخاص WHERE id = NEW.father_id;
        
        -- If parent path is null, set this as root
        IF NEW.path IS NULL THEN
            NEW.path := NEW.id::text::ltree;
        END IF;
    END IF;
    NEW.تاريخ_التحديث := NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for automatic path updates
DROP TRIGGER IF EXISTS trg_set_person_path ON public.الأشخاص;
CREATE TRIGGER trg_set_person_path
    BEFORE INSERT OR UPDATE OF father_id
    ON public.الأشخاص
    FOR EACH ROW EXECUTE FUNCTION public.update_person_path();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.تاريخ_التحديث = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS update_المواقع_updated_at ON public.المواقع;
CREATE TRIGGER update_المواقع_updated_at BEFORE UPDATE ON public.المواقع FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_الفروع_updated_at ON public.الفروع;
CREATE TRIGGER update_الفروع_updated_at BEFORE UPDATE ON public.الفروع FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_النساء_updated_at ON public.النساء;
CREATE TRIGGER update_النساء_updated_at BEFORE UPDATE ON public.النساء FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. MAIN VIEW FOR DISPLAY
CREATE OR REPLACE VIEW public.عرض_الأشخاص_كامل AS
SELECT 
    p.id,
    p.الاسم_الأول,
    p.is_root,
    f.الاسم_الأول AS اسم_الأب,
    gf.الاسم_الأول AS اسم_الجد,
    root.الاسم_الأول AS اسم_العائلة,
    CASE 
        WHEN p.is_root THEN p.الاسم_الأول
        WHEN nlevel(p.path) = 2 THEN CONCAT(p.الاسم_الأول, ' ', root.الاسم_الأول)
        WHEN nlevel(p.path) = 3 THEN CONCAT(p.الاسم_الأول, ' ', f.الاسم_الأول, ' ', root.الاسم_الأول)
        WHEN nlevel(p.path) >= 4 THEN CONCAT(p.الاسم_الأول, ' ', f.الاسم_الأول, ' ', gf.الاسم_الأول, ' ', root.الاسم_الأول)
        ELSE p.الاسم_الأول
    END AS الاسم_الكامل,
    nlevel(p.path) AS مستوى_الجيل,
    p.تاريخ_الميلاد,
    p.تاريخ_الوفاة,
    p.رقم_هوية_وطنية,
    p.الجنس,
    p.الحالة_الاجتماعية,
    p.المنصب,
    p.مستوى_التعليم,
    fr.اسم_الفرع,
    -- Format birth location
    CASE 
        WHEN birth_loc.المدينة IS NOT NULL THEN 
            CONCAT(birth_loc.الدولة, ', ', COALESCE(birth_loc.المنطقة, ''), ', ', birth_loc.المدينة)
        WHEN birth_loc.المنطقة IS NOT NULL THEN 
            CONCAT(birth_loc.الدولة, ', ', birth_loc.المنطقة)
        ELSE birth_loc.الدولة 
    END AS مكان_الميلاد,
    -- Format death location
    CASE 
        WHEN death_loc.المدينة IS NOT NULL THEN 
            CONCAT(death_loc.الدولة, ', ', COALESCE(death_loc.المنطقة, ''), ', ', death_loc.المدينة)
        WHEN death_loc.المنطقة IS NOT NULL THEN 
            CONCAT(death_loc.الدولة, ', ', death_loc.المنطقة)
        ELSE death_loc.الدولة 
    END AS مكان_الوفاة,
    p.path,
    p.father_id,
    p.mother_id,
    p.صورة_شخصية,
    p.ملاحظات,
    p.تاريخ_الإنشاء,
    p.تاريخ_التحديث
FROM public.الأشخاص p
LEFT JOIN public.الأشخاص f ON p.father_id = f.id
LEFT JOIN public.الأشخاص gf ON f.father_id = gf.id
LEFT JOIN public.الأشخاص root ON root.id = ltree2text(subpath(p.path, 0, 1))::bigint
LEFT JOIN public.الفروع fr ON p.معرف_الفرع = fr.معرف_الفرع
LEFT JOIN public.المواقع birth_loc ON p.مكان_الميلاد = birth_loc.معرف_الموقع
LEFT JOIN public.المواقع death_loc ON p.مكان_الوفاة = death_loc.معرف_الموقع;

-- 8. HELPER FUNCTIONS FOR NATIONAL ID SEARCH

-- Function to search by national ID (men)
CREATE OR REPLACE FUNCTION public.search_by_national_id_men(national_id VARCHAR)
RETURNS TABLE (
    الاسم_الكامل TEXT,
    رقم_الهوية_وطنية VARCHAR,
    تاريخ_الميلاد DATE,
    مكان_الميلاد TEXT,
    اسم_الفرع TEXT,
    مستوى_الجيل INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.الاسم_الكامل,
        v.رقم_هوية_وطنية,
        v.تاريخ_الميلاد,
        v.مكان_الميلاد,
        v.اسم_الفرع,
        v.مستوى_الجيل
    FROM عرض_الأشخاص_كامل v
    WHERE v.رقم_هوية_وطنية = national_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search by national ID (women)
CREATE OR REPLACE FUNCTION public.search_by_national_id_women(national_id VARCHAR)
RETURNS TABLE (
    الاسم_الكامل TEXT,
    رقم_الهوية_وطنية VARCHAR,
    تاريخ_الميلاد DATE,
    اسم_العائلة TEXT,
    الحالة_الاجتماعية TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT_WS(' ', w.الاسم_الأول, w.اسم_الأب, w.اسم_العائلة) as الاسم_الكامل,
        w.رقم_هوية_وطنية,
        w.تاريخ_الميلاد,
        w.اسم_العائلة,
        w.الحالة_الاجتماعية
    FROM النساء w
    WHERE w.رقم_هوية_وطنية = national_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all descendants of a person
CREATE OR REPLACE FUNCTION public.get_descendants(person_id BIGINT)
RETURNS TABLE (
    الاسم_الكامل TEXT,
    مستوى_الجيل INTEGER,
    رقم_الهوية_وطنية VARCHAR,
    تاريخ_الميلاد DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.الاسم_الكامل,
        v.مستوى_الجيل,
        v.رقم_هوية_وطنية,
        v.تاريخ_الميلاد
    FROM عرض_الأشخاص_كامل v
    WHERE v.path <@ (SELECT path FROM الأشخاص WHERE id = person_id)
    AND v.id <> person_id
    ORDER BY v.path;
END;
$$ LANGUAGE plpgsql;

-- Function to get all ancestors of a person
CREATE OR REPLACE FUNCTION public.get_ancestors(person_id BIGINT)
RETURNS TABLE (
    الاسم_الكامل TEXT,
    مستوى_الجيل INTEGER,
    رقم_الهوية_وطنية VARCHAR,
    تاريخ_الميلاد DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.الاسم_الكامل,
        v.مستوى_الجيل,
        v.رقم_هوية_وطنية,
        v.تاريخ_الميلاد
    FROM عرض_الأشخاص_كامل v
    WHERE v.path @> (SELECT path FROM الأشخاص WHERE id = person_id)
    AND v.id <> person_id
    ORDER BY v.مستوى_الجيل;
END;
$$ LANGUAGE plpgsql;

-- Function to get siblings
CREATE OR REPLACE FUNCTION public.get_siblings(person_id BIGINT)
RETURNS TABLE (
    الاسم_الكامل TEXT,
    تاريخ_الميلاد DATE,
    رقم_الهوية_وطنية VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.الاسم_الكامل,
        v.تاريخ_الميلاد,
        v.رقم_هوية_وطنية
    FROM عرض_الأشخاص_كامل v
    WHERE v.father_id = (SELECT father_id FROM الأشخاص WHERE id = person_id)
    AND v.id <> person_id
    ORDER BY v.تاريخ_الميلاد;
END;
$$ LANGUAGE plpgsql;

-- 9. ROW LEVEL SECURITY
-- Enable row level security
ALTER TABLE public.الأشخاص ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.النساء ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.المواقع ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.الفروع ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies for الأشخاص table
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.الأشخاص;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.الأشخاص;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.الأشخاص;
    DROP POLICY IF EXISTS "Enable delete for all users" ON public.الأشخاص;
    
    -- Drop policies for النساء table
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.النساء;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.النساء;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.النساء;
    DROP POLICY IF EXISTS "Enable delete for all users" ON public.النساء;
    
    -- Drop policies for المواقع table
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.المواقع;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.المواقع;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.المواقع;
    
    -- Drop policies for الفروع table
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.الفروع;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.الفروع;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.الفروع;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Create new policies for الأشخاص table
CREATE POLICY "Enable read access for all users" ON public.الأشخاص
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.الأشخاص
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.الأشخاص
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.الأشخاص
    FOR DELETE USING (true);

-- Create new policies for النساء table
CREATE POLICY "Enable read access for all users" ON public.النساء
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.النساء
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.النساء
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.النساء
    FOR DELETE USING (true);

-- Create new policies for المواقع table
CREATE POLICY "Enable read access for all users" ON public.المواقع
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.المواقع
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.المواقع
    FOR UPDATE USING (true);

-- Create new policies for الفروع table
CREATE POLICY "Enable read access for all users" ON public.الفروع
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.الفروع
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.الفروع
    FOR UPDATE USING (true);

-- 10. SAMPLE DATA FOR TESTING

-- Initial Locations
INSERT INTO المواقع (الدولة, المنطقة, المدينة) VALUES 
('السعودية', 'نجد', 'الرياض'),
('السعودية', 'نجد', 'القصيم'),
('السعودية', 'الحجاز', 'مكة المكرمة'),
('السعودية', 'الحجاز', 'المدينة المنورة'),
('الكويت', NULL, 'الكويت'),
('الإمارات', 'أبوظبي', 'أبوظبي'),
('قطر', NULL, 'الدوحة'),
('البحرين', NULL, 'المنامة'),
('عمان', 'مسقط', 'مسقط')
ON CONFLICT (الدولة, المنطقة, المدينة) DO NOTHING;

-- Basic Branch
INSERT INTO الفروع (اسم_الفرع, وصف_الفرع, معرف_الموقع, تاريخ_التأسيس) VALUES 
('الفرع الرئيسي', 'الفرع الأساسي للعائلة', 1, '1800-01-01'),
('فرع الحجاز', 'فرع العائلة في منطقة الحجاز', 3, '1850-01-01'),
('فرع الخليج', 'فرع العائلة في دول الخليج', 5, '1900-01-01')
ON CONFLICT (اسم_الفرع) DO NOTHING;

-- Family Root (with Complete Data)
INSERT INTO الأشخاص (id, الاسم_الأول, is_root, father_id, تاريخ_الميلاد, مكان_الميلاد, معرف_الفرع, رقم_هوية_وطنية, الحالة_الاجتماعية, path) 
VALUES (100, 'آل النجدي', true, null, '1800-01-01', 1, 1, '1000000001', 'متزوج', '100')
ON CONFLICT (id) DO NOTHING;

-- Add some children to test the system
INSERT INTO الأشخاص (الاسم_الأول, father_id, تاريخ_الميلاد, معرف_الفرع, رقم_هوية_وطنية, الحالة_الاجتماعية, مكان_الميلاد) 
VALUES 
('محمد', 100, '1830-01-01', 1, '1234567890', 'متزوج', 1),
('أحمد', 100, '1835-01-01', 1, '1234567891', 'متزوج', 1),
('عبدالله', 100, '1840-01-01', 1, '1234567892', 'متزوج', 1)
ON CONFLICT (رقم_هوية_وطنية) DO NOTHING;

-- Add some women to test the women table
INSERT INTO النساء (الاسم_الأول, اسم_الأب, اسم_العائلة, تاريخ_الميلاد, معرف_الفرع, رقم_هوية_وطنية, الحالة_الاجتماعية, مكان_الميلاد) 
VALUES 
('فاطمة', 'محمد', 'آل النجدي', '1860-01-01', 1, '2234567890', 'متزوجة', 1),
('عائشة', 'أحمد', 'آل النجدي', '1865-01-01', 1, '2234567891', 'متزوجة', 1),
('خديجة', 'عبدالله', 'آل النجدي', '1870-01-01', 1, '2234567892', 'متزوجة', 1)
ON CONFLICT (رقم_هوية_وطنية) DO NOTHING;