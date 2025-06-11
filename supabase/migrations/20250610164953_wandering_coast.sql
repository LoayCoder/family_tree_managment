-- ========================================
-- تحديث جدول المراجع لدعم النصوص والوثائق
-- إضافة ربط مع جدول النصوص والوثائق
-- ========================================

-- إضافة عمود جديد لربط المراجع بالنصوص والوثائق
DO $$
BEGIN
    -- التحقق من وجود العمود قبل إضافته
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'المراجع' AND column_name = 'معرف_النص'
    ) THEN
        ALTER TABLE "المراجع" 
        ADD COLUMN "معرف_النص" INTEGER REFERENCES "النصوص_والوثائق"("معرف_النص") ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة فهرس للعمود الجديد
CREATE INDEX IF NOT EXISTS "idx_المراجع_نص" ON "المراجع" ("معرف_النص");

-- ========================================
-- تحديث القيود للسماح بربط المراجع بالنصوص
-- ========================================

-- حذف القيد القديم إذا كان موجوداً
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'المراجع_check' AND table_name = 'المراجع'
    ) THEN
        ALTER TABLE "المراجع" DROP CONSTRAINT "المراجع_check";
    END IF;
END $$;

-- إضافة القيد الجديد الذي يشمل النصوص والوثائق
ALTER TABLE "المراجع" 
ADD CONSTRAINT "المراجع_check" CHECK (
    ("معرف_الشخص" IS NOT NULL) OR 
    ("معرف_المرأة" IS NOT NULL) OR 
    ("معرف_الحدث" IS NOT NULL) OR 
    ("معرف_الملف_الصوتي" IS NOT NULL) OR
    ("معرف_النص" IS NOT NULL)
);

-- ========================================
-- تحديث وظائف البحث في المراجع
-- ========================================

-- وظيفة للحصول على مراجع نص معين
CREATE OR REPLACE FUNCTION get_text_references(text_id INTEGER)
RETURNS TABLE (
    معرف_المرجع INTEGER,
    نوع_المرجع TEXT,
    عنوان_المرجع VARCHAR,
    مؤلف_المرجع VARCHAR,
    تاريخ_المرجع DATE,
    مستوى_الثقة TEXT,
    ملاحظات TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r."معرف_المرجع",
        r."نوع_المرجع",
        r."عنوان_المرجع",
        r."مؤلف_المرجع",
        r."تاريخ_المرجع",
        r."مستوى_الثقة",
        r."ملاحظات"
    FROM "المراجع" r
    WHERE r."معرف_النص" = text_id
    ORDER BY r."مستوى_الثقة" DESC, r."تاريخ_المرجع" DESC;
END;
$$ LANGUAGE plpgsql;

-- وظيفة للبحث في المراجع حسب النوع
CREATE OR REPLACE FUNCTION search_references_by_type(ref_type TEXT)
RETURNS TABLE (
    معرف_المرجع INTEGER,
    عنوان_المرجع VARCHAR,
    نوع_المرجع TEXT,
    مؤلف_المرجع VARCHAR,
    نوع_المحتوى TEXT,
    عنوان_المحتوى TEXT,
    مستوى_الثقة TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r."معرف_المرجع",
        r."عنوان_المرجع",
        r."نوع_المرجع",
        r."مؤلف_المرجع",
        CASE 
            WHEN r."معرف_الشخص" IS NOT NULL THEN 'شخص'
            WHEN r."معرف_المرأة" IS NOT NULL THEN 'امرأة'
            WHEN r."معرف_الحدث" IS NOT NULL THEN 'حدث'
            WHEN r."معرف_الملف_الصوتي" IS NOT NULL THEN 'ملف صوتي'
            WHEN r."معرف_النص" IS NOT NULL THEN 'نص ووثيقة'
            ELSE 'غير محدد'
        END as content_type,
        COALESCE(
            (SELECT "الاسم_الكامل" FROM "عرض_الأشخاص_كامل" WHERE "id" = r."معرف_الشخص"),
            (SELECT CONCAT_WS(' ', "الاسم_الأول", "اسم_الأب", "اسم_العائلة") FROM "النساء" WHERE "id" = r."معرف_المرأة"),
            (SELECT "عنوان_الحدث" FROM "الأحداث" WHERE "معرف_الحدث" = r."معرف_الحدث"),
            (SELECT "عنوان_التسجيل" FROM "الملفات_الصوتية" WHERE "معرف_الملف_الصوتي" = r."معرف_الملف_الصوتي"),
            (SELECT "عنوان_النص" FROM "النصوص_والوثائق" WHERE "معرف_النص" = r."معرف_النص"),
            'غير محدد'
        ) as content_title,
        r."مستوى_الثقة"
    FROM "المراجع" r
    WHERE r."نوع_المرجع" = ref_type
    ORDER BY r."مستوى_الثقة" DESC, r."تاريخ_الإضافة" DESC;
END;
$$ LANGUAGE plpgsql;

-- إحصائيات المراجع الشاملة
CREATE OR REPLACE FUNCTION comprehensive_references_stats()
RETURNS TABLE (
    إجمالي_المراجع BIGINT,
    مراجع_الأشخاص BIGINT,
    مراجع_النساء BIGINT,
    مراجع_الأحداث BIGINT,
    مراجع_الملفات_الصوتية BIGINT,
    مراجع_النصوص BIGINT,
    أكثر_نوع_مرجع_شيوعا TEXT,
    متوسط_مستوى_الثقة TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_refs,
        COUNT(*) FILTER (WHERE "معرف_الشخص" IS NOT NULL) as person_refs,
        COUNT(*) FILTER (WHERE "معرف_المرأة" IS NOT NULL) as woman_refs,
        COUNT(*) FILTER (WHERE "معرف_الحدث" IS NOT NULL) as event_refs,
        COUNT(*) FILTER (WHERE "معرف_الملف_الصوتي" IS NOT NULL) as audio_refs,
        COUNT(*) FILTER (WHERE "معرف_النص" IS NOT NULL) as text_refs,
        (SELECT "نوع_المرجع" FROM "المراجع" 
         GROUP BY "نوع_المرجع" 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_common_ref_type,
        (SELECT "مستوى_الثقة" FROM "المراجع" 
         WHERE "مستوى_الثقة" IS NOT NULL
         GROUP BY "مستوى_الثقة" 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as avg_trust_level
    FROM "المراجع";
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- View محدث للمراجع مع النصوص
-- ========================================

CREATE OR REPLACE VIEW "عرض_المراجع_الشامل" AS
SELECT 
    r."معرف_المرجع",
    r."نوع_المرجع",
    r."عنوان_المرجع",
    r."مؤلف_المرجع",
    r."تاريخ_المرجع",
    r."مستوى_الثقة",
    -- نوع المحتوى المرتبط
    CASE 
        WHEN r."معرف_الشخص" IS NOT NULL THEN 'شخص'
        WHEN r."معرف_المرأة" IS NOT NULL THEN 'امرأة'
        WHEN r."معرف_الحدث" IS NOT NULL THEN 'حدث'
        WHEN r."معرف_الملف_الصوتي" IS NOT NULL THEN 'ملف صوتي'
        WHEN r."معرف_النص" IS NOT NULL THEN 'نص ووثيقة'
        ELSE 'غير محدد'
    END AS "نوع_المحتوى",
    -- عنوان المحتوى المرتبط
    COALESCE(
        (SELECT "الاسم_الكامل" FROM "عرض_الأشخاص_كامل" WHERE "id" = r."معرف_الشخص"),
        (SELECT CONCAT_WS(' ', "الاسم_الأول", "اسم_الأب", "اسم_العائلة") FROM "النساء" WHERE "id" = r."معرف_المرأة"),
        (SELECT "عنوان_الحدث" FROM "الأحداث" WHERE "معرف_الحدث" = r."معرف_الحدث"),
        (SELECT "عنوان_التسجيل" FROM "الملفات_الصوتية" WHERE "معرف_الملف_الصوتي" = r."معرف_الملف_الصوتي"),
        (SELECT "عنوان_النص" FROM "النصوص_والوثائق" WHERE "معرف_النص" = r."معرف_النص"),
        'غير محدد'
    ) AS "عنوان_المحتوى",
    -- معرفات المحتوى
    r."معرف_الشخص",
    r."معرف_المرأة",
    r."معرف_الحدث",
    r."معرف_الملف_الصوتي",
    r."معرف_النص",
    -- معلومات إضافية
    r."رابط_المرجع",
    r."ملف_المرجع",
    r."رقم_الصفحة",
    r."ملاحظات",
    r."تاريخ_الإضافة",
    r."تاريخ_التحديث"
FROM "المراجع" r;

-- ========================================
-- بيانات تجريبية للمراجع المرتبطة بالنصوص
-- ========================================

-- إضافة مراجع للنصوص الموجودة
INSERT INTO "المراجع" (
    "معرف_النص",
    "نوع_المرجع",
    "عنوان_المرجع",
    "مؤلف_المرجع",
    "تاريخ_المرجع",
    "مستوى_الثقة",
    "ملاحظات"
) VALUES 
(
    1, -- مذكرات الجد عبدالله
    'مخطوطة',
    'المخطوطة الأصلية لمذكرات رحلة الحج',
    'عبدالله بن محمد آل النجدي',
    '1950-07-15',
    'عالية',
    'مخطوطة أصلية محفوظة في أرشيف العائلة، مكتوبة بخط المؤلف'
),
(
    2, -- قصيدة الرثاء
    'وثيقة',
    'النسخة الأصلية للقصيدة مكتوبة بخط اليد',
    'محمد بن عبدالله آل النجدي',
    '1965-03-20',
    'عالية',
    'مكتوبة على ورق قديم، محفوظة في مجموعة الشعر العائلي'
),
(
    3, -- وثيقة البيع
    'عقد',
    'وثيقة البيع الأصلية مع أختام الشهود',
    'كاتب العدل في الدرعية',
    '1921-05-10',
    'عالية',
    'وثيقة رسمية مختومة ومشهودة، حالة الحفظ ممتازة'
),
(
    4, -- الرسالة
    'رسالة',
    'الرسالة الأصلية بخط الوالد',
    'عبدالله بن محمد آل النجدي',
    '1955-11-25',
    'متوسطة',
    'رسالة شخصية محفوظة في مراسلات العائلة'
) ON CONFLICT DO NOTHING;

-- ========================================
-- تعليقات توضيحية
-- ========================================

COMMENT ON COLUMN "المراجع"."معرف_النص" IS 'معرف النص أو الوثيقة المرتبطة بهذا المرجع';

-- إشعار بنجاح التحديث
DO $$
BEGIN
    RAISE NOTICE 'تم تحديث جدول المراجع بنجاح لدعم النصوص والوثائق';
END $$;