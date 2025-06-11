-- Enable ltree extension for hierarchical data
CREATE EXTENSION IF NOT EXISTS ltree;

-- Drop existing triggers and functions to avoid conflicts
DROP TRIGGER IF EXISTS "update_المواقع_updated_at" ON "المواقع";
DROP TRIGGER IF EXISTS "update_الفروع_updated_at" ON "الفروع";
DROP TRIGGER IF EXISTS "update_النساء_updated_at" ON "النساء";
DROP TRIGGER IF EXISTS trg_set_person_path ON "الأشخاص";

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_person_path();
DROP FUNCTION IF EXISTS search_by_national_id_men(TEXT);
DROP FUNCTION IF EXISTS search_by_national_id_women(TEXT);
DROP FUNCTION IF EXISTS get_descendants(BIGINT);
DROP FUNCTION IF EXISTS get_ancestors(BIGINT);
DROP FUNCTION IF EXISTS get_siblings(BIGINT);
DROP FUNCTION IF EXISTS get_family_tree();

-- Drop existing view
DROP VIEW IF EXISTS "عرض_الأشخاص_كامل";

-- Create locations table (المواقع)
CREATE TABLE IF NOT EXISTS "المواقع" (
  "معرف_الموقع" SERIAL PRIMARY KEY,
  "الدولة" VARCHAR(100) NOT NULL,
  "المنطقة" VARCHAR(100),
  "المدينة" VARCHAR(100),
  "تفاصيل_إضافية" TEXT,
  "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
  "تاريخ_التحديث" TIMESTAMP DEFAULT NOW(),
  UNIQUE("الدولة", "المنطقة", "المدينة")
);

-- Create branches table (الفروع)
CREATE TABLE IF NOT EXISTS "الفروع" (
  "معرف_الفرع" SERIAL PRIMARY KEY,
  "اسم_الفرع" VARCHAR(200) UNIQUE NOT NULL,
  "وصف_الفرع" TEXT,
  "الفرع_الأصل" INTEGER REFERENCES "الفروع"("معرف_الفرع"),
  "معرف_الموقع" INTEGER REFERENCES "المواقع"("معرف_الموقع"),
  "تاريخ_التأسيس" DATE,
  "مسار_الفرع" LTREE,
  "ملاحظات" TEXT,
  "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
  "تاريخ_التحديث" TIMESTAMP DEFAULT NOW()
);

-- Create persons table (الأشخاص)
CREATE TABLE IF NOT EXISTS "الأشخاص" (
  "id" BIGSERIAL PRIMARY KEY,
  "الاسم_الأول" TEXT NOT NULL,
  "is_root" BOOLEAN DEFAULT FALSE,
  "تاريخ_الميلاد" DATE,
  "تاريخ_الوفاة" DATE,
  "مكان_الميلاد" INTEGER REFERENCES "المواقع"("معرف_الموقع"),
  "مكان_الوفاة" INTEGER REFERENCES "المواقع"("معرف_الموقع"),
  "رقم_هوية_وطنية" VARCHAR(20) UNIQUE,
  "الجنس" TEXT DEFAULT 'ذكر' CHECK ("الجنس" IN ('ذكر', 'أنثى')),
  "الحالة_الاجتماعية" TEXT CHECK ("الحالة_الاجتماعية" IN ('أعزب', 'متزوج', 'مطلق', 'أرمل')),
  "المنصب" TEXT,
  "مستوى_التعليم" TEXT,
  "father_id" BIGINT REFERENCES "الأشخاص"("id"),
  "mother_id" BIGINT REFERENCES "الأشخاص"("id"),
  "معرف_الفرع" INTEGER REFERENCES "الفروع"("معرف_الفرع"),
  "path" LTREE NOT NULL,
  "صورة_شخصية" TEXT,
  "ملاحظات" TEXT,
  "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
  "تاريخ_التحديث" TIMESTAMP DEFAULT NOW()
);

-- Create women table (النساء)
CREATE TABLE IF NOT EXISTS "النساء" (
  "id" SERIAL PRIMARY KEY,
  "الاسم_الأول" TEXT NOT NULL,
  "اسم_الأب" TEXT,
  "اسم_العائلة" TEXT,
  "تاريخ_الميلاد" DATE,
  "تاريخ_الوفاة" DATE,
  "مكان_الميلاد" INTEGER REFERENCES "المواقع"("معرف_الموقع"),
  "مكان_الوفاة" INTEGER REFERENCES "المواقع"("معرف_الموقع"),
  "رقم_هوية_وطنية" VARCHAR(20) UNIQUE,
  "الحالة_الاجتماعية" TEXT CHECK ("الحالة_الاجتماعية" IN ('عزباء', 'متزوجة', 'مطلقة', 'أرملة')),
  "المنصب" TEXT,
  "مستوى_التعليم" TEXT,
  "معرف_الفرع" INTEGER REFERENCES "الفروع"("معرف_الفرع"),
  "صورة_شخصية" TEXT,
  "ملاحظات" TEXT,
  "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
  "تاريخ_التحديث" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_المواقع_الدولة" ON "المواقع"("الدولة");
CREATE INDEX IF NOT EXISTS "idx_المواقع_المنطقة" ON "المواقع"("المنطقة");
CREATE INDEX IF NOT EXISTS "idx_المواقع_المدينة" ON "المواقع"("المدينة");

CREATE INDEX IF NOT EXISTS "idx_الفروع_اسم" ON "الفروع"("اسم_الفرع");
CREATE INDEX IF NOT EXISTS "idx_الفروع_مسار" ON "الفروع" USING GIST("مسار_الفرع");

CREATE INDEX IF NOT EXISTS "idx_الأشخاص_اسم" ON "الأشخاص"("الاسم_الأول");
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_هوية" ON "الأشخاص"("رقم_هوية_وطنية") WHERE "رقم_هوية_وطنية" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_father" ON "الأشخاص"("father_id");
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_path" ON "الأشخاص" USING GIST("path");
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_جذر" ON "الأشخاص"("is_root") WHERE "is_root" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_فرع" ON "الأشخاص"("معرف_الفرع");
CREATE INDEX IF NOT EXISTS "idx_الأشخاص_ميلاد" ON "الأشخاص"("تاريخ_الميلاد");

CREATE INDEX IF NOT EXISTS "idx_النساء_اسم" ON "النساء"("الاسم_الأول");
CREATE INDEX IF NOT EXISTS "idx_النساء_عائلة" ON "النساء"("اسم_العائلة");
CREATE INDEX IF NOT EXISTS "idx_النساء_هوية" ON "النساء"("رقم_هوية_وطنية") WHERE "رقم_هوية_وطنية" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_النساء_فرع" ON "النساء"("معرف_الفرع");

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."تاريخ_التحديث" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update person path
CREATE OR REPLACE FUNCTION update_person_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."father_id" IS NULL THEN
        -- Root person
        NEW."path" = NEW."id"::text::ltree;
    ELSE
        -- Child person - get parent's path and append this person's id
        SELECT "path" || NEW."id"::text::ltree INTO NEW."path"
        FROM "الأشخاص" 
        WHERE "id" = NEW."father_id";
        
        -- If parent path is null, make this a root
        IF NEW."path" IS NULL THEN
            NEW."path" = NEW."id"::text::ltree;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER "update_المواقع_updated_at"
    BEFORE UPDATE ON "المواقع"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_الفروع_updated_at"
    BEFORE UPDATE ON "الفروع"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_النساء_updated_at"
    BEFORE UPDATE ON "النساء"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for person path updates
CREATE TRIGGER trg_set_person_path
    BEFORE INSERT OR UPDATE OF "father_id" ON "الأشخاص"
    FOR EACH ROW EXECUTE FUNCTION update_person_path();

-- Create comprehensive view for persons with full details
CREATE OR REPLACE VIEW "عرض_الأشخاص_كامل" AS
WITH person_hierarchy AS (
  SELECT 
    p.*,
    f."الاسم_الأول" as "اسم_الأب",
    gf."الاسم_الأول" as "اسم_الجد",
    CASE 
      WHEN gf."الاسم_الأول" IS NOT NULL THEN 
        p."الاسم_الأول" || ' ' || f."الاسم_الأول" || ' ' || gf."الاسم_الأول"
      WHEN f."الاسم_الأول" IS NOT NULL THEN 
        p."الاسم_الأول" || ' ' || f."الاسم_الأول"
      ELSE 
        p."الاسم_الأول"
    END as "الاسم_الكامل",
    nlevel(p."path") as "مستوى_الجيل"
  FROM "الأشخاص" p
  LEFT JOIN "الأشخاص" f ON p."father_id" = f."id"
  LEFT JOIN "الأشخاص" gf ON f."father_id" = gf."id"
)
SELECT 
  ph."id",
  ph."الاسم_الأول",
  ph."is_root",
  ph."اسم_الأب",
  ph."اسم_الجد",
  COALESCE(ph."اسم_الجد", 'آل ' || ph."الاسم_الأول") as "اسم_العائلة",
  ph."الاسم_الكامل",
  ph."مستوى_الجيل",
  ph."تاريخ_الميلاد",
  ph."تاريخ_الوفاة",
  ph."رقم_هوية_وطنية",
  ph."الجنس",
  ph."الحالة_الاجتماعية",
  ph."المنصب",
  ph."مستوى_التعليم",
  b."اسم_الفرع",
  CASE 
    WHEN bl."الدولة" IS NOT NULL THEN 
      bl."الدولة" || COALESCE(', ' || bl."المنطقة", '') || COALESCE(', ' || bl."المدينة", '')
    ELSE NULL
  END as "مكان_الميلاد",
  CASE 
    WHEN dl."الدولة" IS NOT NULL THEN 
      dl."الدولة" || COALESCE(', ' || dl."المنطقة", '') || COALESCE(', ' || dl."المدينة", '')
    ELSE NULL
  END as "مكان_الوفاة",
  ph."path",
  ph."father_id",
  ph."mother_id",
  ph."صورة_شخصية",
  ph."ملاحظات",
  ph."تاريخ_الإنشاء",
  ph."تاريخ_التحديث"
FROM person_hierarchy ph
LEFT JOIN "الفروع" b ON ph."معرف_الفرع" = b."معرف_الفرع"
LEFT JOIN "المواقع" bl ON ph."مكان_الميلاد" = bl."معرف_الموقع"
LEFT JOIN "المواقع" dl ON ph."مكان_الوفاة" = dl."معرف_الموقع";

-- Create search functions
CREATE OR REPLACE FUNCTION search_by_national_id_men(national_id TEXT)
RETURNS TABLE(LIKE "عرض_الأشخاص_كامل") AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "عرض_الأشخاص_كامل"
    WHERE "رقم_هوية_وطنية" = national_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_by_national_id_women(national_id TEXT)
RETURNS TABLE(LIKE "النساء") AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "النساء"
    WHERE "رقم_هوية_وطنية" = national_id;
END;
$$ LANGUAGE plpgsql;

-- Create relationship functions
CREATE OR REPLACE FUNCTION get_descendants(person_id BIGINT)
RETURNS TABLE(LIKE "عرض_الأشخاص_كامل") AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "عرض_الأشخاص_كامل" p1
    WHERE EXISTS (
        SELECT 1 FROM "الأشخاص" p2 
        WHERE p2."id" = person_id 
        AND p1."path" ~ (p2."path"::text || '.*')::lquery
        AND p1."id" != person_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ancestors(person_id BIGINT)
RETURNS TABLE(LIKE "عرض_الأشخاص_كامل") AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "عرض_الأشخاص_كامل" p1
    WHERE EXISTS (
        SELECT 1 FROM "الأشخاص" p2 
        WHERE p2."id" = person_id 
        AND p2."path" ~ (p1."path"::text || '.*')::lquery
        AND p1."id" != person_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_siblings(person_id BIGINT)
RETURNS TABLE(LIKE "عرض_الأشخاص_كامل") AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "عرض_الأشخاص_كامل"
    WHERE "father_id" = (
        SELECT "father_id" FROM "الأشخاص" WHERE "id" = person_id
    )
    AND "id" != person_id
    AND "father_id" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create family tree function for compatibility with existing app
CREATE OR REPLACE FUNCTION get_family_tree()
RETURNS TABLE(
    id UUID,
    name TEXT,
    parent_id UUID,
    birth_date DATE,
    gender TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_alive BOOLEAN,
    date_of_death DATE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE family_tree AS (
        -- Base case: root members (no parent)
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
            fm.is_alive,
            fm.date_of_death,
            0 as level
        FROM family_members fm
        WHERE fm.parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: children
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
            fm.is_alive,
            fm.date_of_death,
            ft.level + 1
        FROM family_members fm
        INNER JOIN family_tree ft ON fm.parent_id = ft.id
    )
    SELECT * FROM family_tree
    ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE "المواقع" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "الفروع" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "الأشخاص" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "النساء" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON "المواقع";
DROP POLICY IF EXISTS "Enable insert for all users" ON "المواقع";
DROP POLICY IF EXISTS "Enable update for all users" ON "المواقع";

DROP POLICY IF EXISTS "Enable read access for all users" ON "الفروع";
DROP POLICY IF EXISTS "Enable insert for all users" ON "الفروع";
DROP POLICY IF EXISTS "Enable update for all users" ON "الفروع";

DROP POLICY IF EXISTS "Enable read access for all users" ON "الأشخاص";
DROP POLICY IF EXISTS "Enable insert for all users" ON "الأشخاص";
DROP POLICY IF EXISTS "Enable update for all users" ON "الأشخاص";
DROP POLICY IF EXISTS "Enable delete for all users" ON "الأشخاص";

DROP POLICY IF EXISTS "Enable read access for all users" ON "النساء";
DROP POLICY IF EXISTS "Enable insert for all users" ON "النساء";
DROP POLICY IF EXISTS "Enable update for all users" ON "النساء";
DROP POLICY IF EXISTS "Enable delete for all users" ON "النساء";

-- Create policies for public access (can be restricted later)
CREATE POLICY "Enable read access for all users" ON "المواقع" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "المواقع" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "المواقع" FOR UPDATE TO public USING (true);

CREATE POLICY "Enable read access for all users" ON "الفروع" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "الفروع" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "الفروع" FOR UPDATE TO public USING (true);

CREATE POLICY "Enable read access for all users" ON "الأشخاص" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "الأشخاص" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "الأشخاص" FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "الأشخاص" FOR DELETE TO public USING (true);

CREATE POLICY "Enable read access for all users" ON "النساء" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "النساء" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "النساء" FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "النساء" FOR DELETE TO public USING (true);

-- Insert sample data
INSERT INTO "المواقع" ("الدولة", "المنطقة", "المدينة") VALUES
('السعودية', 'الرياض', 'الرياض'),
('السعودية', 'مكة المكرمة', 'مكة المكرمة'),
('السعودية', 'المدينة المنورة', 'المدينة المنورة'),
('السعودية', 'الشرقية', 'الدمام'),
('الإمارات', 'دبي', 'دبي'),
('الكويت', 'الكويت', 'الكويت')
ON CONFLICT ("الدولة", "المنطقة", "المدينة") DO NOTHING;

INSERT INTO "الفروع" ("اسم_الفرع", "وصف_الفرع", "معرف_الموقع") VALUES
('الفرع الرئيسي', 'الفرع الأصلي للعائلة', 1),
('فرع مكة المكرمة', 'فرع العائلة في مكة المكرمة', 2),
('فرع المدينة المنورة', 'فرع العائلة في المدينة المنورة', 3),
('فرع الشرقية', 'فرع العائلة في المنطقة الشرقية', 4)
ON CONFLICT ("اسم_الفرع") DO NOTHING;

-- Insert sample root person
INSERT INTO "الأشخاص" (
    "الاسم_الأول", 
    "is_root", 
    "تاريخ_الميلاد", 
    "معرف_الفرع", 
    "رقم_هوية_وطنية",
    "path"
) VALUES (
    'عبدالله بن محمد آل سعود', 
    true, 
    '1850-01-01', 
    1, 
    '1000000001',
    '1'
) ON CONFLICT ("رقم_هوية_وطنية") DO NOTHING;

-- Insert sample women
INSERT INTO "النساء" (
    "الاسم_الأول",
    "اسم_الأب", 
    "اسم_العائلة",
    "تاريخ_الميلاد",
    "معرف_الفرع",
    "رقم_هوية_وطنية"
) VALUES (
    'فاطمة',
    'أحمد',
    'آل الأحمد',
    '1875-01-01',
    1,
    '2000000001'
) ON CONFLICT ("رقم_هوية_وطنية") DO NOTHING;