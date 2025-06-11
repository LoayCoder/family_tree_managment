/*
  # إضافة الجداول المفقودة الحاسمة لنظام إدارة الأنساب

  1. الجداول الجديدة
    - `الأحداث` - لتوثيق الأحداث التاريخية المهمة
    - `ارتباط_النساء` - لربط النساء بالعائلة وأحداثها  
    - `المراجع` - لإرفاق المراجع والوثائق

  2. الأمان
    - تفعيل RLS على جميع الجداول الجديدة
    - إضافة سياسات للوصول العام

  3. الفهارس
    - فهارس محسنة للأداء على جميع الجداول
    - فهارس للبحث السريع

  4. المحفزات
    - محفزات تحديث التاريخ التلقائي
*/

-- 1. جدول الأحداث (الأحداث)
CREATE TABLE IF NOT EXISTS "الأحداث" (
    "معرف_الحدث" SERIAL PRIMARY KEY,
    "معرف_الشخص" BIGINT REFERENCES "الأشخاص"("id") ON DELETE CASCADE,
    "معرف_المرأة" INTEGER REFERENCES "النساء"("id") ON DELETE CASCADE,
    "نوع_الحدث" TEXT NOT NULL CHECK ("نوع_الحدث" IN ('ميلاد','وفاة','زواج','طلاق','تخرج','ترقية','انتقال','إنجاز','حج','عمرة','سفر','مرض','شفاء','أخرى')),
    "عنوان_الحدث" VARCHAR(300) NOT NULL,
    "وصف_الحدث" TEXT,
    "تاريخ_الحدث" DATE NOT NULL,
    "مكان_الحدث" INTEGER REFERENCES "المواقع"("معرف_الموقع") ON DELETE SET NULL,
    "أهمية_الحدث" TEXT CHECK ("أهمية_الحدث" IN ('عالية','متوسطة','عادية')) DEFAULT 'عادية',
    "هو_عام" BOOLEAN DEFAULT FALSE,
    "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
    "تاريخ_التحديث" TIMESTAMP DEFAULT NOW(),
    
    CHECK ("معرف_الشخص" IS NOT NULL OR "معرف_المرأة" IS NOT NULL)
);

-- 2. جدول ارتباط النساء (ارتباط_النساء)
CREATE TABLE IF NOT EXISTS "ارتباط_النساء" (
    "id" SERIAL PRIMARY KEY,
    "woman_id" INTEGER REFERENCES "النساء"("id") ON DELETE CASCADE,
    "person_id" BIGINT REFERENCES "الأشخاص"("id") ON DELETE CASCADE,
    "نوع_الارتباط" TEXT NOT NULL CHECK ("نوع_الارتباط" IN ('زوجة','أم','أخت','ابنة','جدة','عمة','خالة','حدث_مهم')),
    "السبب_أو_الحدث" TEXT NOT NULL,
    "تاريخ_الحدث" DATE,
    "مكان_الحدث" INTEGER REFERENCES "المواقع"("معرف_الموقع") ON DELETE SET NULL,
    "أهمية_الحدث" TEXT CHECK ("أهمية_الحدث" IN ('عالية','متوسطة','عادية')) DEFAULT 'عادية',
    "تفاصيل_إضافية" TEXT,
    "تاريخ_الإنشاء" TIMESTAMP DEFAULT NOW(),
    "تاريخ_التحديث" TIMESTAMP DEFAULT NOW()
);

-- 3. جدول المراجع (المراجع)
CREATE TABLE IF NOT EXISTS "المراجع" (
    "معرف_المرجع" SERIAL PRIMARY KEY,
    "معرف_الشخص" BIGINT REFERENCES "الأشخاص"("id") ON DELETE CASCADE,
    "معرف_المرأة" INTEGER REFERENCES "النساء"("id") ON DELETE CASCADE,
    "معرف_الحدث" INTEGER REFERENCES "الأحداث"("معرف_الحدث") ON DELETE CASCADE,
    "نوع_المرجع" TEXT NOT NULL CHECK ("نوع_المرجع" IN ('كتاب','وثيقة','صورة','فيديو','تسجيل_صوتي','رابط_ويب','مخطوطة','شهادة','عقد','رسالة','أخرى')),
    "عنوان_المرجع" VARCHAR(500) NOT NULL,
    "مؤلف_المرجع" VARCHAR(200),
    "رابط_المرجع" TEXT,
    "ملف_المرجع" TEXT,
    "تاريخ_المرجع" DATE,
    "رقم_الصفحة" VARCHAR(50),
    "ملاحظات" TEXT,
    "مستوى_الثقة" TEXT CHECK ("مستوى_الثقة" IN ('عالية','متوسطة','منخفضة')) DEFAULT 'متوسطة',
    "تاريخ_الإضافة" TIMESTAMP DEFAULT NOW(),
    "تاريخ_التحديث" TIMESTAMP DEFAULT NOW(),
    
    CHECK ("معرف_الشخص" IS NOT NULL OR "معرف_المرأة" IS NOT NULL OR "معرف_الحدث" IS NOT NULL)
);

-- إنشاء الفهارس للأداء المحسن

-- فهارس جدول الأحداث
CREATE INDEX IF NOT EXISTS "idx_الأحداث_شخص" ON "الأحداث"("معرف_الشخص");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_امرأة" ON "الأحداث"("معرف_المرأة");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_نوع" ON "الأحداث"("نوع_الحدث");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_تاريخ" ON "الأحداث"("تاريخ_الحدث");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_أهمية" ON "الأحداث"("أهمية_الحدث");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_مكان" ON "الأحداث"("مكان_الحدث");
CREATE INDEX IF NOT EXISTS "idx_الأحداث_عام" ON "الأحداث"("هو_عام") WHERE "هو_عام" = TRUE;

-- فهارس جدول ارتباط النساء
CREATE INDEX IF NOT EXISTS "idx_ارتباط_النساء_woman" ON "ارتباط_النساء"("woman_id");
CREATE INDEX IF NOT EXISTS "idx_ارتباط_النساء_person" ON "ارتباط_النساء"("person_id");
CREATE INDEX IF NOT EXISTS "idx_ارتباط_النساء_نوع" ON "ارتباط_النساء"("نوع_الارتباط");
CREATE INDEX IF NOT EXISTS "idx_ارتباط_النساء_تاريخ" ON "ارتباط_النساء"("تاريخ_الحدث");
CREATE INDEX IF NOT EXISTS "idx_ارتباط_النساء_أهمية" ON "ارتباط_النساء"("أهمية_الحدث");

-- فهارس جدول المراجع
CREATE INDEX IF NOT EXISTS "idx_المراجع_شخص" ON "المراجع"("معرف_الشخص");
CREATE INDEX IF NOT EXISTS "idx_المراجع_امرأة" ON "المراجع"("معرف_المرأة");
CREATE INDEX IF NOT EXISTS "idx_المراجع_حدث" ON "المراجع"("معرف_الحدث");
CREATE INDEX IF NOT EXISTS "idx_المراجع_نوع" ON "المراجع"("نوع_المرجع");
CREATE INDEX IF NOT EXISTS "idx_المراجع_ثقة" ON "المراجع"("مستوى_الثقة");
CREATE INDEX IF NOT EXISTS "idx_المراجع_تاريخ" ON "المراجع"("تاريخ_المرجع");
CREATE INDEX IF NOT EXISTS "idx_المراجع_عنوان" ON "المراجع"("عنوان_المرجع");

-- إنشاء محفزات التحديث التلقائي

-- محفز تحديث تاريخ التحديث لجدول الأحداث
CREATE TRIGGER "update_الأحداث_updated_at"
    BEFORE UPDATE ON "الأحداث"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- محفز تحديث تاريخ التحديث لجدول ارتباط النساء
CREATE TRIGGER "update_ارتباط_النساء_updated_at"
    BEFORE UPDATE ON "ارتباط_النساء"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- محفز تحديث تاريخ التحديث لجدول المراجع
CREATE TRIGGER "update_المراجع_updated_at"
    BEFORE UPDATE ON "المراجع"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- تفعيل أمان الصفوف (RLS)
ALTER TABLE "الأحداث" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ارتباط_النساء" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "المراجع" ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للوصول العام

-- سياسات جدول الأحداث
CREATE POLICY "Enable read access for all users" ON "الأحداث" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "الأحداث" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "الأحداث" FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "الأحداث" FOR DELETE TO public USING (true);

-- سياسات جدول ارتباط النساء
CREATE POLICY "Enable read access for all users" ON "ارتباط_النساء" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "ارتباط_النساء" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "ارتباط_النساء" FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "ارتباط_النساء" FOR DELETE TO public USING (true);

-- سياسات جدول المراجع
CREATE POLICY "Enable read access for all users" ON "المراجع" FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "المراجع" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "المراجع" FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "المراجع" FOR DELETE TO public USING (true);

-- إنشاء دوال مساعدة للاستعلامات المتقدمة

-- دالة للحصول على أحداث شخص معين
CREATE OR REPLACE FUNCTION get_person_events(person_id BIGINT)
RETURNS TABLE(
    معرف_الحدث INTEGER,
    نوع_الحدث TEXT,
    عنوان_الحدث VARCHAR(300),
    وصف_الحدث TEXT,
    تاريخ_الحدث DATE,
    مكان_الحدث TEXT,
    أهمية_الحدث TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ا."معرف_الحدث",
        ا."نوع_الحدث",
        ا."عنوان_الحدث",
        ا."وصف_الحدث",
        ا."تاريخ_الحدث",
        CASE 
            WHEN م."الدولة" IS NOT NULL THEN 
                م."الدولة" || COALESCE(', ' || م."المنطقة", '') || COALESCE(', ' || م."المدينة", '')
            ELSE NULL
        END as مكان_الحدث,
        ا."أهمية_الحدث"
    FROM "الأحداث" ا
    LEFT JOIN "المواقع" م ON ا."مكان_الحدث" = م."معرف_الموقع"
    WHERE ا."معرف_الشخص" = person_id
    ORDER BY ا."تاريخ_الحدث" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على أحداث امرأة معينة
CREATE OR REPLACE FUNCTION get_woman_events(woman_id INTEGER)
RETURNS TABLE(
    معرف_الحدث INTEGER,
    نوع_الحدث TEXT,
    عنوان_الحدث VARCHAR(300),
    وصف_الحدث TEXT,
    تاريخ_الحدث DATE,
    مكان_الحدث TEXT,
    أهمية_الحدث TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ا."معرف_الحدث",
        ا."نوع_الحدث",
        ا."عنوان_الحدث",
        ا."وصف_الحدث",
        ا."تاريخ_الحدث",
        CASE 
            WHEN م."الدولة" IS NOT NULL THEN 
                م."الدولة" || COALESCE(', ' || م."المنطقة", '') || COALESCE(', ' || م."المدينة", '')
            ELSE NULL
        END as مكان_الحدث,
        ا."أهمية_الحدث"
    FROM "الأحداث" ا
    LEFT JOIN "المواقع" م ON ا."مكان_الحدث" = م."معرف_الموقع"
    WHERE ا."معرف_المرأة" = woman_id
    ORDER BY ا."تاريخ_الحدث" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على ارتباطات امرأة معينة
CREATE OR REPLACE FUNCTION get_woman_relationships(woman_id INTEGER)
RETURNS TABLE(
    اسم_الشخص TEXT,
    نوع_الارتباط TEXT,
    السبب_أو_الحدث TEXT,
    تاريخ_الحدث DATE,
    مكان_الحدث TEXT,
    أهمية_الحدث TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ش."الاسم_الأول" as اسم_الشخص,
        ار."نوع_الارتباط",
        ار."السبب_أو_الحدث",
        ار."تاريخ_الحدث",
        CASE 
            WHEN م."الدولة" IS NOT NULL THEN 
                م."الدولة" || COALESCE(', ' || م."المنطقة", '') || COALESCE(', ' || م."المدينة", '')
            ELSE NULL
        END as مكان_الحدث,
        ار."أهمية_الحدث"
    FROM "ارتباط_النساء" ار
    LEFT JOIN "الأشخاص" ش ON ار."person_id" = ش."id"
    LEFT JOIN "المواقع" م ON ار."مكان_الحدث" = م."معرف_الموقع"
    WHERE ار."woman_id" = woman_id
    ORDER BY ار."تاريخ_الحدث" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على مراجع شخص معين
CREATE OR REPLACE FUNCTION get_person_references(person_id BIGINT)
RETURNS TABLE(
    نوع_المرجع TEXT,
    عنوان_المرجع VARCHAR(500),
    مؤلف_المرجع VARCHAR(200),
    رابط_المرجع TEXT,
    تاريخ_المرجع DATE,
    مستوى_الثقة TEXT,
    ملاحظات TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        م."نوع_المرجع",
        م."عنوان_المرجع",
        م."مؤلف_المرجع",
        م."رابط_المرجع",
        م."تاريخ_المرجع",
        م."مستوى_الثقة",
        م."ملاحظات"
    FROM "المراجع" م
    WHERE م."معرف_الشخص" = person_id
    ORDER BY م."تاريخ_الإضافة" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على الأحداث العامة
CREATE OR REPLACE FUNCTION get_public_events()
RETURNS TABLE(
    معرف_الحدث INTEGER,
    نوع_الحدث TEXT,
    عنوان_الحدث VARCHAR(300),
    وصف_الحدث TEXT,
    تاريخ_الحدث DATE,
    مكان_الحدث TEXT,
    أهمية_الحدث TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ا."معرف_الحدث",
        ا."نوع_الحدث",
        ا."عنوان_الحدث",
        ا."وصف_الحدث",
        ا."تاريخ_الحدث",
        CASE 
            WHEN م."الدولة" IS NOT NULL THEN 
                م."الدولة" || COALESCE(', ' || م."المنطقة", '') || COALESCE(', ' || م."المدينة", '')
            ELSE NULL
        END as مكان_الحدث,
        ا."أهمية_الحدث"
    FROM "الأحداث" ا
    LEFT JOIN "المواقع" م ON ا."مكان_الحدث" = م."معرف_الموقع"
    WHERE ا."هو_عام" = TRUE
    ORDER BY ا."تاريخ_الحدث" DESC;
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية

-- إدراج أحداث تجريبية
INSERT INTO "الأحداث" (
    "معرف_الشخص",
    "نوع_الحدث",
    "عنوان_الحدث",
    "وصف_الحدث",
    "تاريخ_الحدث",
    "مكان_الحدث",
    "أهمية_الحدث",
    "هو_عام"
) VALUES 
(
    1,
    'ميلاد',
    'ولادة عبدالله بن محمد آل سعود',
    'ولادة مؤسس العائلة في الرياض',
    '1850-01-01',
    1,
    'عالية',
    true
),
(
    1,
    'زواج',
    'زواج عبدالله بن محمد',
    'زواج مؤسس العائلة من فاطمة آل الأحمد',
    '1875-06-15',
    1,
    'عالية',
    false
) ON CONFLICT DO NOTHING;

-- إدراج ارتباطات النساء التجريبية
INSERT INTO "ارتباط_النساء" (
    "woman_id",
    "person_id",
    "نوع_الارتباط",
    "السبب_أو_الحدث",
    "تاريخ_الحدث",
    "مكان_الحدث",
    "أهمية_الحدث"
) VALUES 
(
    1,
    1,
    'زوجة',
    'زواج فاطمة من عبدالله بن محمد',
    '1875-06-15',
    1,
    'عالية'
) ON CONFLICT DO NOTHING;

-- إدراج مراجع تجريبية
INSERT INTO "المراجع" (
    "معرف_الشخص",
    "نوع_المرجع",
    "عنوان_المرجع",
    "مؤلف_المرجع",
    "تاريخ_المرجع",
    "مستوى_الثقة",
    "ملاحظات"
) VALUES 
(
    1,
    'وثيقة',
    'شهادة ميلاد عبدالله بن محمد آل سعود',
    'سجلات الأحوال المدنية',
    '1850-01-01',
    'عالية',
    'وثيقة رسمية من الأرشيف الوطني'
),
(
    1,
    'كتاب',
    'تاريخ آل سعود وأنسابهم',
    'المؤرخ أحمد بن علي',
    '1920-01-01',
    'متوسطة',
    'مرجع تاريخي موثق'
) ON CONFLICT DO NOTHING;