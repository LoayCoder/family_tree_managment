/*
  # إضافة ربط المراجع بالملفات الصوتية

  1. التحديثات
    - إضافة عمود `معرف_الملف_الصوتي` إلى جدول المراجع
    - إضافة فهرس للعمود الجديد
    - تحديث القيود للسماح بربط المراجع بالملفات الصوتية
    - إضافة دوال مساعدة للحصول على مراجع الملفات الصوتية

  2. الأمان
    - الحفاظ على سياسات RLS الموجودة
    - إضافة فهارس للأداء المحسن
*/

-- إضافة عمود معرف الملف الصوتي إلى جدول المراجع
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'المراجع' AND column_name = 'معرف_الملف_الصوتي'
    ) THEN
        ALTER TABLE "المراجع" 
        ADD COLUMN "معرف_الملف_الصوتي" INTEGER REFERENCES "الملفات_الصوتية"("معرف_الملف_الصوتي") ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة فهرس للعمود الجديد
CREATE INDEX IF NOT EXISTS "idx_المراجع_ملف_صوتي" ON "المراجع"("معرف_الملف_الصوتي");

-- تحديث القيد للسماح بربط المراجع بالملفات الصوتية
DO $$
BEGIN
    -- حذف القيد القديم إذا كان موجوداً
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'المراجع' AND constraint_name = 'المراجع_check'
    ) THEN
        ALTER TABLE "المراجع" DROP CONSTRAINT "المراجع_check";
    END IF;
    
    -- إضافة القيد الجديد
    ALTER TABLE "المراجع" 
    ADD CONSTRAINT "المراجع_check" 
    CHECK (
        "معرف_الشخص" IS NOT NULL OR 
        "معرف_المرأة" IS NOT NULL OR 
        "معرف_الحدث" IS NOT NULL OR 
        "معرف_الملف_الصوتي" IS NOT NULL
    );
END $$;

-- دالة للحصول على مراجع ملف صوتي معين
CREATE OR REPLACE FUNCTION get_audio_file_references(audio_file_id INTEGER)
RETURNS TABLE(
    معرف_المرجع INTEGER,
    نوع_المرجع TEXT,
    عنوان_المرجع VARCHAR(500),
    مؤلف_المرجع VARCHAR(200),
    رابط_المرجع TEXT,
    ملف_المرجع TEXT,
    تاريخ_المرجع DATE,
    رقم_الصفحة VARCHAR(50),
    مستوى_الثقة TEXT,
    ملاحظات TEXT,
    تاريخ_الإضافة TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        م."معرف_المرجع",
        م."نوع_المرجع",
        م."عنوان_المرجع",
        م."مؤلف_المرجع",
        م."رابط_المرجع",
        م."ملف_المرجع",
        م."تاريخ_المرجع",
        م."رقم_الصفحة",
        م."مستوى_الثقة",
        م."ملاحظات",
        م."تاريخ_الإضافة"
    FROM "المراجع" م
    WHERE م."معرف_الملف_الصوتي" = audio_file_id
    ORDER BY م."تاريخ_الإضافة" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على جميع المراجع مع تفاصيل الارتباط
CREATE OR REPLACE FUNCTION get_comprehensive_references()
RETURNS TABLE(
    معرف_المرجع INTEGER,
    نوع_المرجع TEXT,
    عنوان_المرجع VARCHAR(500),
    مؤلف_المرجع VARCHAR(200),
    رابط_المرجع TEXT,
    تاريخ_المرجع DATE,
    مستوى_الثقة TEXT,
    نوع_الارتباط TEXT,
    اسم_المرتبط TEXT,
    تفاصيل_الارتباط TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        م."معرف_المرجع",
        م."نوع_المرجع",
        م."عنوان_المرجع",
        م."مؤلف_المرجع",
        م."رابط_المرجع",
        م."تاريخ_المرجع",
        م."مستوى_الثقة",
        CASE 
            WHEN م."معرف_الشخص" IS NOT NULL THEN 'شخص'
            WHEN م."معرف_المرأة" IS NOT NULL THEN 'امرأة'
            WHEN م."معرف_الحدث" IS NOT NULL THEN 'حدث'
            WHEN م."معرف_الملف_الصوتي" IS NOT NULL THEN 'ملف_صوتي'
            ELSE 'غير_محدد'
        END as نوع_الارتباط,
        CASE 
            WHEN م."معرف_الشخص" IS NOT NULL THEN ش."الاسم_الأول"
            WHEN م."معرف_المرأة" IS NOT NULL THEN ن."الاسم_الأول"
            WHEN م."معرف_الحدث" IS NOT NULL THEN ح."عنوان_الحدث"
            WHEN م."معرف_الملف_الصوتي" IS NOT NULL THEN ص."عنوان_التسجيل"
            ELSE 'غير_محدد'
        END as اسم_المرتبط,
        CASE 
            WHEN م."معرف_الشخص" IS NOT NULL THEN 'مرجع خاص بالشخص: ' || ش."الاسم_الأول"
            WHEN م."معرف_المرأة" IS NOT NULL THEN 'مرجع خاص بالمرأة: ' || ن."الاسم_الأول"
            WHEN م."معرف_الحدث" IS NOT NULL THEN 'مرجع خاص بالحدث: ' || ح."عنوان_الحدث"
            WHEN م."معرف_الملف_الصوتي" IS NOT NULL THEN 'مرجع خاص بالملف الصوتي: ' || ص."عنوان_التسجيل"
            ELSE 'مرجع عام'
        END as تفاصيل_الارتباط
    FROM "المراجع" م
    LEFT JOIN "الأشخاص" ش ON م."معرف_الشخص" = ش."id"
    LEFT JOIN "النساء" ن ON م."معرف_المرأة" = ن."id"
    LEFT JOIN "الأحداث" ح ON م."معرف_الحدث" = ح."معرف_الحدث"
    LEFT JOIN "الملفات_الصوتية" ص ON م."معرف_الملف_الصوتي" = ص."معرف_الملف_الصوتي"
    ORDER BY م."تاريخ_الإضافة" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة للبحث في المراجع حسب النوع والارتباط
CREATE OR REPLACE FUNCTION search_references_by_type(
    reference_type TEXT DEFAULT NULL,
    linked_type TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    trust_level TEXT DEFAULT NULL
)
RETURNS TABLE(
    معرف_المرجع INTEGER,
    نوع_المرجع TEXT,
    عنوان_المرجع VARCHAR(500),
    مؤلف_المرجع VARCHAR(200),
    مستوى_الثقة TEXT,
    نوع_الارتباط TEXT,
    اسم_المرتبط TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        م."معرف_المرجع",
        م."نوع_المرجع",
        م."عنوان_المرجع",
        م."مؤلف_المرجع",
        م."مستوى_الثقة",
        CASE 
            WHEN م."معرف_الشخص" IS NOT NULL THEN 'شخص'
            WHEN م."معرف_المرأة" IS NOT NULL THEN 'امرأة'
            WHEN م."معرف_الحدث" IS NOT NULL THEN 'حدث'
            WHEN م."معرف_الملف_الصوتي" IS NOT NULL THEN 'ملف_صوتي'
            ELSE 'غير_محدد'
        END as نوع_الارتباط,
        CASE 
            WHEN م."معرف_الشخص" IS NOT NULL THEN ش."الاسم_الأول"
            WHEN م."معرف_المرأة" IS NOT NULL THEN ن."الاسم_الأول"
            WHEN م."معرف_الحدث" IS NOT NULL THEN ح."عنوان_الحدث"
            WHEN م."معرف_الملف_الصوتي" IS NOT NULL THEN ص."عنوان_التسجيل"
            ELSE 'غير_محدد'
        END as اسم_المرتبط
    FROM "المراجع" م
    LEFT JOIN "الأشخاص" ش ON م."معرف_الشخص" = ش."id"
    LEFT JOIN "النساء" ن ON م."معرف_المرأة" = ن."id"
    LEFT JOIN "الأحداث" ح ON م."معرف_الحدث" = ح."معرف_الحدث"
    LEFT JOIN "الملفات_الصوتية" ص ON م."معرف_الملف_الصوتي" = ص."معرف_الملف_الصوتي"
    WHERE (reference_type IS NULL OR م."نوع_المرجع" = reference_type)
    AND (linked_type IS NULL OR (
        (linked_type = 'شخص' AND م."معرف_الشخص" IS NOT NULL) OR
        (linked_type = 'امرأة' AND م."معرف_المرأة" IS NOT NULL) OR
        (linked_type = 'حدث' AND م."معرف_الحدث" IS NOT NULL) OR
        (linked_type = 'ملف_صوتي' AND م."معرف_الملف_الصوتي" IS NOT NULL)
    ))
    AND (search_term IS NULL OR (
        م."عنوان_المرجع" ILIKE '%' || search_term || '%' OR
        م."مؤلف_المرجع" ILIKE '%' || search_term || '%' OR
        م."ملاحظات" ILIKE '%' || search_term || '%'
    ))
    AND (trust_level IS NULL OR م."مستوى_الثقة" = trust_level)
    ORDER BY م."تاريخ_الإضافة" DESC;
END;
$$ LANGUAGE plpgsql;

-- دالة لإحصائيات المراجع
CREATE OR REPLACE FUNCTION references_statistics()
RETURNS TABLE(
    نوع_المرجع TEXT,
    عدد_المراجع BIGINT,
    عدد_مراجع_الأشخاص BIGINT,
    عدد_مراجع_النساء BIGINT,
    عدد_مراجع_الأحداث BIGINT,
    عدد_مراجع_الملفات_الصوتية BIGINT,
    متوسط_مستوى_الثقة TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        م."نوع_المرجع",
        COUNT(*) as total_references,
        COUNT(*) FILTER (WHERE م."معرف_الشخص" IS NOT NULL) as person_refs,
        COUNT(*) FILTER (WHERE م."معرف_المرأة" IS NOT NULL) as woman_refs,
        COUNT(*) FILTER (WHERE م."معرف_الحدث" IS NOT NULL) as event_refs,
        COUNT(*) FILTER (WHERE م."معرف_الملف_الصوتي" IS NOT NULL) as audio_refs,
        (SELECT م2."مستوى_الثقة" 
         FROM "المراجع" م2 
         WHERE م2."نوع_المرجع" = م."نوع_المرجع"
         GROUP BY م2."مستوى_الثقة" 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as avg_trust_level
    FROM "المراجع" م
    GROUP BY م."نوع_المرجع"
    ORDER BY total_references DESC;
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية للمراجع المرتبطة بالملفات الصوتية
INSERT INTO "المراجع" (
    "معرف_الملف_الصوتي",
    "نوع_المرجع",
    "عنوان_المرجع",
    "مؤلف_المرجع",
    "تاريخ_المرجع",
    "مستوى_الثقة",
    "ملاحظات"
) VALUES 
(
    1, -- معرف الملف الصوتي الأول (مقابلة الجد)
    'تسجيل_صوتي',
    'مقابلة صوتية مع الجد عبدالله - الجزء الأول',
    'أرشيف العائلة',
    '2020-03-15',
    'عالية',
    'تسجيل أصلي عالي الجودة يحتوي على معلومات تاريخية مهمة'
),
(
    2, -- معرف الملف الصوتي الثاني (القصيدة)
    'تسجيل_صوتي',
    'قصيدة في مدح الوطن - تسجيل صوتي',
    'الجد عبدالله بن محمد',
    '2019-12-06',
    'عالية',
    'تسجيل نادر لقصيدة من تأليف وإلقاء الجد'
),
(
    3, -- معرف الملف الصوتي الثالث (الحكاية)
    'تسجيل_صوتي',
    'حكاية الذئب والراعي - تراث شفهي',
    'التراث الشعبي',
    '2021-01-20',
    'متوسطة',
    'حكاية تراثية محفوظة من الذاكرة الشعبية'
),
(
    4, -- معرف الملف الصوتي الرابع (التلاوة)
    'تسجيل_صوتي',
    'تلاوة قرآنية بصوت الجد عبدالله',
    'الجد عبدالله بن محمد',
    '2020-05-10',
    'عالية',
    'تسجيل لتلاوة عطرة من القرآن الكريم'
),
(
    1, -- مرجع إضافي للملف الأول
    'وثيقة',
    'نسخة مكتوبة من المقابلة مع الجد',
    'كاتب المقابلة',
    '2020-03-16',
    'عالية',
    'نسخة مكتوبة كاملة من المقابلة الصوتية'
) ON CONFLICT DO NOTHING;

-- تعليقات وتوثيق
COMMENT ON COLUMN "المراجع"."معرف_الملف_الصوتي" IS 'معرف الملف الصوتي المرتبط بهذا المرجع';

-- إنشاء عرض شامل للملفات الصوتية مع مراجعها
CREATE OR REPLACE VIEW "عرض_الملفات_الصوتية_مع_المراجع" AS
SELECT 
    ص."معرف_الملف_الصوتي",
    ص."عنوان_التسجيل",
    ص."نوع_التسجيل",
    ص."تاريخ_التسجيل",
    ص."مدة_التسجيل",
    ص."أهمية_التسجيل",
    ص."مستوى_الوضوح",
    ص."حالة_الحفظ",
    COALESCE(ش."الاسم_الأول", ن."الاسم_الأول", 'غير محدد') as "اسم_المتحدث",
    COUNT(م."معرف_المرجع") as "عدد_المراجع",
    ARRAY_AGG(
        CASE 
            WHEN م."معرف_المرجع" IS NOT NULL THEN 
                م."نوع_المرجع" || ': ' || م."عنوان_المرجع"
            ELSE NULL
        END
    ) FILTER (WHERE م."معرف_المرجع" IS NOT NULL) as "قائمة_المراجع"
FROM "الملفات_الصوتية" ص
LEFT JOIN "الأشخاص" ش ON ص."معرف_الشخص" = ش."id"
LEFT JOIN "النساء" ن ON ص."معرف_المرأة" = ن."id"
LEFT JOIN "المراجع" م ON ص."معرف_الملف_الصوتي" = م."معرف_الملف_الصوتي"
GROUP BY 
    ص."معرف_الملف_الصوتي",
    ص."عنوان_التسجيل",
    ص."نوع_التسجيل",
    ص."تاريخ_التسجيل",
    ص."مدة_التسجيل",
    ص."أهمية_التسجيل",
    ص."مستوى_الوضوح",
    ص."حالة_الحفظ",
    ش."الاسم_الأول",
    ن."الاسم_الأول"
ORDER BY ص."تاريخ_التسجيل" DESC;

COMMENT ON VIEW "عرض_الملفات_الصوتية_مع_المراجع" IS 'عرض شامل للملفات الصوتية مع عدد ومعلومات المراجع المرتبطة بها';