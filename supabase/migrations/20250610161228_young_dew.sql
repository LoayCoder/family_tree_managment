/*
  # إضافة جدول الملفات الصوتية الشامل
  
  1. جدول الملفات الصوتية
    - معلومات أساسية وتقنية شاملة
    - ارتباطات مع الأشخاص والأحداث والمواقع
    - معلومات المحتوى والتصنيف
    - إحصائيات الاستخدام
  
  2. فهارس للبحث والأداء
    - فهارس أساسية ونصية
    - فهارس GIN للمصفوفات والبحث النصي
  
  3. وظائف البحث والإحصائيات
    - بحث بسيط ومتقدم
    - إحصائيات شاملة
    - وظائف مساعدة
  
  4. أمان وحماية
    - Row Level Security
    - سياسات الوصول
    - حماية بكلمة مرور
*/

-- ========================================
-- جدول الملفات الصوتية الشامل
-- يدعم كل أنواع التسجيلات الصوتية
-- ========================================

CREATE TABLE IF NOT EXISTS "الملفات_الصوتية" (
    "معرف_الملف_الصوتي"    SERIAL PRIMARY KEY,
    
    -- معلومات الملف الأساسية
    "عنوان_التسجيل"        VARCHAR(300) NOT NULL,
    "وصف_التسجيل"          TEXT,
    "نوع_التسجيل"           TEXT NOT NULL CHECK ("نوع_التسجيل" IN (
        'مقابلة_شخصية',     -- مقابلة مع فرد من العائلة
        'قصة_شفهية',        -- حكاية أو قصة مروية
        'شعر_وأدب',         -- قصائد أو أدب
        'أناشيد_تراثية',    -- أناشيد تراثية محافظة
        'أذان_ودعاء',       -- تسجيلات دينية
        'احتفال_ومناسبة',   -- تسجيلات من المناسبات
        'تعليم_وحكم',       -- تعاليم ونصائح
        'أخبار_وأحداث',     -- تسجيلات إخبارية
        'مكالمة_هاتفية',    -- مكالمات مهمة
        'خطبة_ومحاضرة',     -- خطب ومحاضرات
        'تلاوة_قرآن',       -- تسجيلات لتلاوة القرآن
        'أخرى'
    )),
    
    -- معلومات الملف التقنية
    "مسار_الملف"           TEXT NOT NULL, -- URL أو مسار في Supabase Storage
    "نوع_الملف"            VARCHAR(10) CHECK ("نوع_الملف" IN ('mp3', 'wav', 'ogg', 'm4a', 'aac')),
    "حجم_الملف"            BIGINT, -- بالبايت
    "مدة_التسجيل"          INTERVAL, -- المدة الزمنية
    "جودة_التسجيل"         TEXT CHECK ("جودة_التسجيل" IN ('عالية', 'متوسطة', 'منخفضة')),
    
    -- ارتباطات مع الجداول الأخرى
    "معرف_الشخص"           BIGINT REFERENCES "الأشخاص"("id") ON DELETE SET NULL, -- المتحدث الرئيسي
    "معرف_المرأة"          INTEGER REFERENCES "النساء"("id") ON DELETE SET NULL, -- إذا كانت المتحدثة امرأة
    "معرف_الحدث"           INTEGER REFERENCES "الأحداث"("معرف_الحدث") ON DELETE SET NULL, -- الحدث المرتبط
    "معرف_المكان"          INTEGER REFERENCES "المواقع"("معرف_الموقع") ON DELETE SET NULL, -- مكان التسجيل
    "معرف_القصة"           INTEGER, -- سيتم ربطه بجدول القصص عند إنشاؤه
    
    -- تفاصيل التسجيل
    "تاريخ_التسجيل"        DATE, -- متى تم التسجيل الأصلي
    "مكان_التسجيل_النصي"   TEXT, -- وصف نصي للمكان
    "المناسبة"             TEXT, -- مناسبة التسجيل
    "الحضور"               TEXT[], -- أسماء الحاضرين
    
    -- معلومات المحتوى
    "اللغة"                TEXT DEFAULT 'العربية',
    "اللهجة"               TEXT, -- "نجدية", "حجازية", "خليجية"
    "الكلمات_المفتاحية"    TEXT[], -- للبحث
    "النص_المكتوب"          TEXT, -- نسخ مكتوب للتسجيل
    "ملخص_المحتوى"         TEXT,
    "الشخصيات_المذكورة"    TEXT[], -- أسماء مذكورة في التسجيل
    "الأماكن_المذكورة"     TEXT[], -- أماكن مذكورة
    
    -- تقييم ومعلومات إضافية
    "أهمية_التسجيل"        TEXT CHECK ("أهمية_التسجيل" IN ('عالية','متوسطة','عادية')) DEFAULT 'متوسطة',
    "مستوى_الوضوح"        TEXT CHECK ("مستوى_الوضوح" IN ('ممتاز','جيد','متوسط','ضعيف')) DEFAULT 'جيد',
    "حالة_الحفظ"           TEXT CHECK ("حالة_الحفظ" IN ('ممتازة','جيدة','متوسطة','تحتاج_ترميم')) DEFAULT 'جيدة',
    "مصدر_التسجيل"         TEXT, -- "مؤرشف من كاسيت قديم", "تسجيل مباشر"
    
    -- معلومات فنية متقدمة
    "معدل_أخذ_العينات"     INTEGER, -- Sample Rate (مثل 44100)
    "معدل_البت"            INTEGER, -- Bit Rate (مثل 128, 320)
    "عدد_القنوات"          INTEGER DEFAULT 1, -- Mono = 1, Stereo = 2
    
    -- صورة مصاحبة
    "صورة_مرفقة"          TEXT, -- صورة للمتحدث أو المناسبة
    
    -- متاح للعامة أم خاص
    "هو_عام"               BOOLEAN DEFAULT FALSE, -- هل يمكن للجميع سماعه
    "كلمة_مرور"            TEXT, -- لحماية التسجيلات الحساسة
    
    -- معلومات الأرشفة
    "مدخل_البيانات"       TEXT, -- من أدخل البيانات
    "ملاحظات_أرشيفية"     TEXT,
    "تاريخ_الإدخال"        TIMESTAMP DEFAULT NOW(),
    "تاريخ_التحديث"       TIMESTAMP DEFAULT NOW(),
    "تاريخ_آخر_استماع"     TIMESTAMP,
    "عدد_مرات_الاستماع"    INTEGER DEFAULT 0
);

-- ========================================
-- فهارس للبحث والأداء
-- ========================================

-- فهارس أساسية
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_عنوان" ON "الملفات_الصوتية" ("عنوان_التسجيل");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_نوع" ON "الملفات_الصوتية" ("نوع_التسجيل");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_شخص" ON "الملفات_الصوتية" ("معرف_الشخص");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_امرأة" ON "الملفات_الصوتية" ("معرف_المرأة");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_حدث" ON "الملفات_الصوتية" ("معرف_الحدث");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_مكان" ON "الملفات_الصوتية" ("معرف_المكان");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_تاريخ" ON "الملفات_الصوتية" ("تاريخ_التسجيل");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_أهمية" ON "الملفات_الصوتية" ("أهمية_التسجيل");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_وضوح" ON "الملفات_الصوتية" ("مستوى_الوضوح");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_حفظ" ON "الملفات_الصوتية" ("حالة_الحفظ");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_عام" ON "الملفات_الصوتية" ("هو_عام") WHERE "هو_عام" = TRUE;

-- فهارس للبحث النصي
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_كلمات" ON "الملفات_الصوتية" USING GIN ("الكلمات_المفتاحية");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_شخصيات" ON "الملفات_الصوتية" USING GIN ("الشخصيات_المذكورة");
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_أماكن" ON "الملفات_الصوتية" USING GIN ("الأماكن_المذكورة");

-- فهرس للبحث النصي الكامل
CREATE INDEX IF NOT EXISTS "idx_ملفات_صوتية_نص" ON "الملفات_الصوتية" 
    USING GIN (to_tsvector('arabic', COALESCE("النص_المكتوب", '') || ' ' || COALESCE("ملخص_المحتوى", '')));

-- ========================================
-- وظائف البحث في الملفات الصوتية
-- ========================================

-- البحث في الملفات الصوتية
CREATE OR REPLACE FUNCTION search_audio_files(search_term TEXT)
RETURNS TABLE (
    معرف_الملف INTEGER,
    عنوان_التسجيل VARCHAR,
    نوع_التسجيل TEXT,
    اسم_المتحدث TEXT,
    تاريخ_التسجيل DATE,
    مدة_التسجيل INTERVAL,
    أهمية_التسجيل TEXT,
    مستوى_الوضوح TEXT,
    حالة_الحفظ TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af."معرف_الملف_الصوتي",
        af."عنوان_التسجيل",
        af."نوع_التسجيل",
        COALESCE(p."الاسم_الأول", w."الاسم_الأول", 'غير محدد') as speaker_name,
        af."تاريخ_التسجيل",
        af."مدة_التسجيل",
        af."أهمية_التسجيل",
        af."مستوى_الوضوح",
        af."حالة_الحفظ"
    FROM "الملفات_الصوتية" af
    LEFT JOIN "الأشخاص" p ON af."معرف_الشخص" = p."id"
    LEFT JOIN "النساء" w ON af."معرف_المرأة" = w."id"
    WHERE af."عنوان_التسجيل" ILIKE '%' || search_term || '%'
       OR af."وصف_التسجيل" ILIKE '%' || search_term || '%'
       OR af."النص_المكتوب" ILIKE '%' || search_term || '%'
       OR af."ملخص_المحتوى" ILIKE '%' || search_term || '%'
       OR search_term = ANY(af."الكلمات_المفتاحية")
       OR search_term = ANY(af."الشخصيات_المذكورة")
       OR search_term = ANY(af."الأماكن_المذكورة")
    ORDER BY af."أهمية_التسجيل" DESC, af."تاريخ_التسجيل" DESC;
END;
$$ LANGUAGE plpgsql;

-- البحث المتقدم في الملفات الصوتية
CREATE OR REPLACE FUNCTION advanced_audio_search(
    search_term TEXT DEFAULT NULL,
    audio_type TEXT DEFAULT NULL,
    person_id BIGINT DEFAULT NULL,
    woman_id INTEGER DEFAULT NULL,
    event_id INTEGER DEFAULT NULL,
    importance_level TEXT DEFAULT NULL,
    clarity_level TEXT DEFAULT NULL,
    is_public BOOLEAN DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    معرف_الملف INTEGER,
    عنوان_التسجيل VARCHAR,
    نوع_التسجيل TEXT,
    اسم_المتحدث TEXT,
    تاريخ_التسجيل DATE,
    مدة_التسجيل INTERVAL,
    أهمية_التسجيل TEXT,
    مستوى_الوضوح TEXT,
    مكان_التسجيل TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af."معرف_الملف_الصوتي",
        af."عنوان_التسجيل",
        af."نوع_التسجيل",
        COALESCE(p."الاسم_الأول", w."الاسم_الأول", 'غير محدد') as speaker_name,
        af."تاريخ_التسجيل",
        af."مدة_التسجيل",
        af."أهمية_التسجيل",
        af."مستوى_الوضوح",
        CASE 
            WHEN loc."الدولة" IS NOT NULL THEN 
                loc."الدولة" || COALESCE(', ' || loc."المنطقة", '') || COALESCE(', ' || loc."المدينة", '')
            ELSE af."مكان_التسجيل_النصي"
        END as مكان_التسجيل
    FROM "الملفات_الصوتية" af
    LEFT JOIN "الأشخاص" p ON af."معرف_الشخص" = p."id"
    LEFT JOIN "النساء" w ON af."معرف_المرأة" = w."id"
    LEFT JOIN "المواقع" loc ON af."معرف_المكان" = loc."معرف_الموقع"
    WHERE (search_term IS NULL OR (
        af."عنوان_التسجيل" ILIKE '%' || search_term || '%'
        OR af."وصف_التسجيل" ILIKE '%' || search_term || '%'
        OR af."النص_المكتوب" ILIKE '%' || search_term || '%'
        OR search_term = ANY(af."الكلمات_المفتاحية")
    ))
    AND (audio_type IS NULL OR af."نوع_التسجيل" = audio_type)
    AND (person_id IS NULL OR af."معرف_الشخص" = person_id)
    AND (woman_id IS NULL OR af."معرف_المرأة" = woman_id)
    AND (event_id IS NULL OR af."معرف_الحدث" = event_id)
    AND (importance_level IS NULL OR af."أهمية_التسجيل" = importance_level)
    AND (clarity_level IS NULL OR af."مستوى_الوضوح" = clarity_level)
    AND (is_public IS NULL OR af."هو_عام" = is_public)
    AND (date_from IS NULL OR af."تاريخ_التسجيل" >= date_from)
    AND (date_to IS NULL OR af."تاريخ_التسجيل" <= date_to)
    ORDER BY af."أهمية_التسجيل" DESC, af."تاريخ_التسجيل" DESC;
END;
$$ LANGUAGE plpgsql;

-- إحصائيات الملفات الصوتية
CREATE OR REPLACE FUNCTION audio_statistics()
RETURNS TABLE (
    نوع_التسجيل TEXT,
    عدد_الملفات BIGINT,
    إجمالي_المدة INTERVAL,
    متوسط_المدة INTERVAL,
    إجمالي_الحجم BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af."نوع_التسجيل",
        COUNT(*) as file_count,
        SUM(af."مدة_التسجيل") as total_duration,
        AVG(af."مدة_التسجيل") as avg_duration,
        SUM(af."حجم_الملف") as total_size
    FROM "الملفات_الصوتية" af
    WHERE af."مدة_التسجيل" IS NOT NULL
    GROUP BY af."نوع_التسجيل"
    ORDER BY file_count DESC;
END;
$$ LANGUAGE plpgsql;

-- إحصائيات شاملة للأرشيف الصوتي
CREATE OR REPLACE FUNCTION comprehensive_audio_stats()
RETURNS TABLE (
    إجمالي_الملفات BIGINT,
    إجمالي_المدة INTERVAL,
    إجمالي_الحجم_بالميجابايت NUMERIC,
    عدد_الملفات_العامة BIGINT,
    عدد_الملفات_الخاصة BIGINT,
    أكثر_نوع_شيوعا TEXT,
    متوسط_جودة_التسجيل TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        SUM("مدة_التسجيل") as total_duration,
        ROUND(SUM("حجم_الملف")::NUMERIC / 1048576, 2) as total_size_mb,
        COUNT(*) FILTER (WHERE "هو_عام" = TRUE) as public_files,
        COUNT(*) FILTER (WHERE "هو_عام" = FALSE) as private_files,
        (SELECT "نوع_التسجيل" FROM "الملفات_الصوتية" 
         GROUP BY "نوع_التسجيل" 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_common_type,
        (SELECT "جودة_التسجيل" FROM "الملفات_الصوتية" 
         WHERE "جودة_التسجيل" IS NOT NULL
         GROUP BY "جودة_التسجيل" 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as avg_quality
    FROM "الملفات_الصوتية";
END;
$$ LANGUAGE plpgsql;

-- الحصول على ملفات صوتية لشخص معين
CREATE OR REPLACE FUNCTION get_person_audio_files(person_id BIGINT)
RETURNS TABLE (
    معرف_الملف INTEGER,
    عنوان_التسجيل VARCHAR,
    نوع_التسجيل TEXT,
    تاريخ_التسجيل DATE,
    مدة_التسجيل INTERVAL,
    أهمية_التسجيل TEXT,
    مسار_الملف TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af."معرف_الملف_الصوتي",
        af."عنوان_التسجيل",
        af."نوع_التسجيل",
        af."تاريخ_التسجيل",
        af."مدة_التسجيل",
        af."أهمية_التسجيل",
        af."مسار_الملف"
    FROM "الملفات_الصوتية" af
    WHERE af."معرف_الشخص" = person_id
    ORDER BY af."أهمية_التسجيل" DESC, af."تاريخ_التسجيل" DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Trigger لتحديث عدد الاستماع وآخر استماع
-- ========================================

CREATE OR REPLACE FUNCTION update_audio_listening_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم تحديث تاريخ آخر استماع، نزيد العدد
    IF OLD."تاريخ_آخر_استماع" IS DISTINCT FROM NEW."تاريخ_آخر_استماع" 
       AND NEW."تاريخ_آخر_استماع" IS NOT NULL THEN
        NEW."عدد_مرات_الاستماع" := COALESCE(OLD."عدد_مرات_الاستماع", 0) + 1;
    END IF;
    
    NEW."تاريخ_التحديث" := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_audio_stats
    BEFORE UPDATE ON "الملفات_الصوتية"
    FOR EACH ROW
    EXECUTE FUNCTION update_audio_listening_stats();

-- محفز تحديث تاريخ التحديث العام
CREATE TRIGGER "update_الملفات_الصوتية_updated_at"
    BEFORE UPDATE ON "الملفات_الصوتية"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security للملفات الصوتية
-- ========================================

ALTER TABLE "الملفات_الصوتية" ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة - الملفات العامة فقط أو بدون كلمة مرور
CREATE POLICY "Enable read access for public audio files" ON "الملفات_الصوتية"
    FOR SELECT USING ("هو_عام" = TRUE OR "كلمة_مرور" IS NULL);

-- سياسة للإدراج - متاح للجميع
CREATE POLICY "Enable insert for all users" ON "الملفات_الصوتية"
    FOR INSERT WITH CHECK (true);

-- سياسة للتحديث - متاح للجميع
CREATE POLICY "Enable update for all users" ON "الملفات_الصوتية"
    FOR UPDATE USING (true);

-- سياسة للحذف - متاح للجميع
CREATE POLICY "Enable delete for all users" ON "الملفات_الصوتية"
    FOR DELETE USING (true);

-- ========================================
-- بيانات تجريبية
-- ========================================

-- أمثلة على ملفات صوتية تجريبية
INSERT INTO "الملفات_الصوتية" (
    "عنوان_التسجيل", 
    "نوع_التسجيل", 
    "وصف_التسجيل", 
    "معرف_الشخص",
    "تاريخ_التسجيل", 
    "أهمية_التسجيل", 
    "الكلمات_المفتاحية",
    "مسار_الملف", 
    "نوع_الملف",
    "مدة_التسجيل",
    "جودة_التسجيل",
    "مستوى_الوضوح",
    "حالة_الحفظ",
    "اللهجة",
    "مصدر_التسجيل",
    "هو_عام"
) VALUES 
(
    'مقابلة مع الجد عبدالله - ذكريات الطفولة', 
    'مقابلة_شخصية',
    'يحكي الجد عبدالله عن ذكرياته في طفولته وقصص الماضي الجميل في الرياض القديمة',
    1, -- افتراض أن 1 هو معرف الجد عبدالله
    '2020-03-15',
    'عالية',
    ARRAY['ذكريات', 'طفولة', 'تاريخ', 'عائلة', 'الرياض', 'الماضي'],
    '/audio/grandfather_interview_001.mp3',
    'mp3',
    '00:45:30'::INTERVAL,
    'عالية',
    'ممتاز',
    'ممتازة',
    'نجدية',
    'تسجيل مباشر بجهاز رقمي',
    true
),
(
    'قصيدة في مدح الوطن - للجد عبدالله',
    'شعر_وأدب',
    'قصيدة جميلة في حب الوطن من إلقاء الجد عبدالله بصوته الرائع',
    1,
    '2019-12-06',
    'متوسطة',
    ARRAY['شعر', 'وطن', 'قصيدة', 'أدب'],
    '/audio/poem_homeland_001.mp3',
    'mp3',
    '00:08:15'::INTERVAL,
    'متوسطة',
    'جيد',
    'جيدة',
    'نجدية',
    'تسجيل من مناسبة عائلية',
    true
),
(
    'حكاية الذئب والراعي - قصة شعبية',
    'قصة_شفهية',
    'حكاية شعبية تراثية يرويها الجد عبدالله للأطفال',
    1,
    '2021-01-20',
    'متوسطة',
    ARRAY['حكاية', 'تراث', 'أطفال', 'قصة', 'شعبي'],
    '/audio/story_wolf_shepherd.mp3',
    'mp3',
    '00:12:45'::INTERVAL,
    'متوسطة', -- تم تصحيح القيمة من 'جيدة' إلى 'متوسطة'
    'ممتاز',
    'ممتازة',
    'نجدية',
    'تسجيل عائلي',
    true
),
(
    'دعاء وتلاوة من القرآن الكريم',
    'تلاوة_قرآن',
    'تلاوة عطرة من القرآن الكريم بصوت الجد عبدالله',
    1,
    '2020-05-10',
    'عالية',
    ARRAY['قرآن', 'تلاوة', 'دعاء', 'دين'],
    '/audio/quran_recitation_001.mp3',
    'mp3',
    '00:25:30'::INTERVAL,
    'عالية',
    'ممتاز',
    'ممتازة',
    'فصحى',
    'تسجيل في المسجد',
    true
) ON CONFLICT DO NOTHING;

-- ========================================
-- تعليقات وتوثيق
-- ========================================

COMMENT ON TABLE "الملفات_الصوتية" IS 'جدول شامل لحفظ وإدارة الملفات الصوتية للعائلة مع معلومات تفصيلية';
COMMENT ON COLUMN "الملفات_الصوتية"."مدة_التسجيل" IS 'مدة التسجيل بصيغة PostgreSQL INTERVAL مثل 00:05:30';
COMMENT ON COLUMN "الملفات_الصوتية"."الكلمات_المفتاحية" IS 'مصفوفة من الكلمات للبحث السريع';
COMMENT ON COLUMN "الملفات_الصوتية"."هو_عام" IS 'تحديد ما إذا كان التسجيل متاحاً للجميع أم خاص بالعائلة';
COMMENT ON COLUMN "الملفات_الصوتية"."الشخصيات_المذكورة" IS 'أسماء الأشخاص المذكورين في التسجيل';
COMMENT ON COLUMN "الملفات_الصوتية"."الأماكن_المذكورة" IS 'أسماء الأماكن المذكورة في التسجيل';
COMMENT ON COLUMN "الملفات_الصوتية"."النص_المكتوب" IS 'النص المكتوب للتسجيل الصوتي (transcript)';
COMMENT ON COLUMN "الملفات_الصوتية"."كلمة_مرور" IS 'كلمة مرور لحماية التسجيلات الحساسة';
COMMENT ON COLUMN "الملفات_الصوتية"."معدل_أخذ_العينات" IS 'Sample Rate بالهرتز (مثل 44100)';
COMMENT ON COLUMN "الملفات_الصوتية"."معدل_البت" IS 'Bit Rate بالكيلوبت في الثانية (مثل 128, 320)';