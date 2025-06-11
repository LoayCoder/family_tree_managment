-- ========================================
-- إنشاء جميع Views المفقودة في قاعدة البيانات
-- Views شاملة لنظام شجرة النسب المحدثة
-- تم إصلاح مشاكل أنواع البيانات في UNION
-- ========================================

-- ========================================
-- 1. VIEWS للعروض الأساسية (Display Views)
-- ========================================

-- عرض شامل للعائلة (رجال + نساء)
CREATE OR REPLACE VIEW public.عرض_العائلة_الشامل AS
-- الرجال
SELECT 
    'رجل'::text AS النوع,
    p.id::bigint,
    p.الاسم_الأول,
    p.is_root,
    v.الاسم_الكامل,
    v.اسم_الأب,
    v.اسم_الجد,
    v.اسم_العائلة,
    v.مستوى_الجيل,
    p.تاريخ_الميلاد,
    p.تاريخ_الوفاة,
    p.رقم_هوية_وطنية,
    p.الجنس,
    p.الحالة_الاجتماعية,
    p.المنصب,
    p.مستوى_التعليم,
    v.اسم_الفرع,
    v.مكان_الميلاد,
    v.مكان_الوفاة,
    p.path::text AS المسار,
    p.ملاحظات,
    p.تاريخ_الإنشاء
FROM الأشخاص p
JOIN عرض_الأشخاص_كامل v ON p.id = v.id

UNION ALL

-- النساء
SELECT 
    'امرأة'::text AS النوع,
    (w.id + 1000000)::bigint AS id,
    w.الاسم_الأول,
    false AS is_root,
    CONCAT_WS(' ', w.الاسم_الأول, w.اسم_الأب, w.اسم_العائلة) AS الاسم_الكامل,
    w.اسم_الأب,
    NULL::text AS اسم_الجد,
    w.اسم_العائلة,
    NULL::integer AS مستوى_الجيل,
    w.تاريخ_الميلاد,
    w.تاريخ_الوفاة,
    w.رقم_هوية_وطنية,
    'أنثى'::text AS الجنس,
    w.الحالة_الاجتماعية,
    w.المنصب,
    w.مستوى_التعليم,
    b.اسم_الفرع,
    CASE 
        WHEN bl.الدولة IS NOT NULL THEN 
            CONCAT(bl.الدولة, COALESCE(', ' || bl.المنطقة, ''), COALESCE(', ' || bl.المدينة, ''))
        ELSE NULL
    END AS مكان_الميلاد,
    CASE 
        WHEN dl.الدولة IS NOT NULL THEN 
            CONCAT(dl.الدولة, COALESCE(', ' || dl.المنطقة, ''), COALESCE(', ' || dl.المدينة, ''))
        ELSE NULL
    END AS مكان_الوفاة,
    NULL::text AS المسار,
    w.ملاحظات,
    w.تاريخ_الإنشاء
FROM النساء w
LEFT JOIN الفروع b ON w.معرف_الفرع = b.معرف_الفرع
LEFT JOIN المواقع bl ON w.مكان_الميلاد = bl.معرف_الموقع
LEFT JOIN المواقع dl ON w.مكان_الوفاة = dl.معرف_الموقع;

-- عرض الأحداث مع التفاصيل
CREATE OR REPLACE VIEW public.عرض_الأحداث_التفصيلي AS
SELECT 
    e.معرف_الحدث,
    e.عنوان_الحدث,
    e.نوع_الحدث,
    e.وصف_الحدث,
    e.تاريخ_الحدث,
    e.أهمية_الحدث,
    -- معلومات الشخص المرتبط
    CASE 
        WHEN e.معرف_الشخص IS NOT NULL THEN 
            (SELECT الاسم_الكامل FROM عرض_الأشخاص_كامل WHERE id = e.معرف_الشخص)
        WHEN e.معرف_المرأة IS NOT NULL THEN 
            (SELECT CONCAT_WS(' ', الاسم_الأول, اسم_الأب, اسم_العائلة) FROM النساء WHERE id = e.معرف_المرأة)
        ELSE NULL
    END AS اسم_الشخص,
    CASE 
        WHEN e.معرف_الشخص IS NOT NULL THEN 'رجل'
        WHEN e.معرف_المرأة IS NOT NULL THEN 'امرأة'
        ELSE 'عام'
    END AS نوع_الشخص,
    -- معلومات المكان
    CASE 
        WHEN l.الدولة IS NOT NULL THEN 
            CONCAT(l.الدولة, COALESCE(', ' || l.المنطقة, ''), COALESCE(', ' || l.المدينة, ''))
        ELSE NULL
    END AS مكان_الحدث,
    e.هو_عام,
    e.تاريخ_الإنشاء
FROM الأحداث e
LEFT JOIN المواقع l ON e.مكان_الحدث = l.معرف_الموقع;

-- عرض ارتباط النساء التفصيلي
CREATE OR REPLACE VIEW public.عرض_ارتباط_النساء_التفصيلي AS
SELECT 
    ar.id,
    -- معلومات المرأة
    CONCAT_WS(' ', w.الاسم_الأول, w.اسم_الأب, w.اسم_العائلة) AS اسم_المرأة,
    w.اسم_العائلة AS عائلة_المرأة,
    w.تاريخ_الميلاد AS تاريخ_ميلاد_المرأة,
    -- معلومات الرجل المرتبط
    p.الاسم_الكامل AS اسم_الرجل,
    p.اسم_العائلة AS عائلة_الرجل,
    p.مستوى_الجيل AS جيل_الرجل,
    -- معلومات الارتباط
    ar.نوع_الارتباط,
    ar.السبب_أو_الحدث,
    ar.تاريخ_الحدث,
    ar.أهمية_الحدث,
    -- مكان الحدث
    CASE 
        WHEN l.الدولة IS NOT NULL THEN 
            CONCAT(l.الدولة, COALESCE(', ' || l.المنطقة, ''), COALESCE(', ' || l.المدينة, ''))
        ELSE NULL
    END AS مكان_الحدث,
    ar.تفاصيل_إضافية
FROM ارتباط_النساء ar
JOIN النساء w ON ar.woman_id = w.id
JOIN عرض_الأشخاص_كامل p ON ar.person_id = p.id
LEFT JOIN المواقع l ON ar.مكان_الحدث = l.معرف_الموقع;

-- ========================================
-- 2. VIEWS للتحليل الزمني (Temporal Analysis)
-- ========================================

-- تحليل النمو الزمني للعائلة
CREATE OR REPLACE VIEW public.تحليل_النمو_الزمني AS
SELECT 
    EXTRACT(YEAR FROM تاريخ_الميلاد)::integer AS السنة,
    COUNT(*)::integer AS عدد_المواليد,
    COUNT(*) FILTER (WHERE النوع = 'رجل')::integer AS مواليد_ذكور,
    COUNT(*) FILTER (WHERE النوع = 'امرأة')::integer AS مواليد_إناث,
    -- المتوسط المتحرك لـ 5 سنوات
    ROUND(AVG(COUNT(*)) OVER (
        ORDER BY EXTRACT(YEAR FROM تاريخ_الميلاد) 
        ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    ), 2) AS المتوسط_المتحرك,
    -- النمو السنوي
    (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY EXTRACT(YEAR FROM تاريخ_الميلاد)))::integer AS النمو_السنوي
FROM عرض_العائلة_الشامل
WHERE تاريخ_الميلاد IS NOT NULL
GROUP BY EXTRACT(YEAR FROM تاريخ_الميلاد)
ORDER BY السنة;

-- تحليل الأحداث الزمني
CREATE OR REPLACE VIEW public.تحليل_الأحداث_الزمني AS
SELECT 
    EXTRACT(YEAR FROM تاريخ_الحدث)::integer AS السنة,
    (EXTRACT(DECADE FROM تاريخ_الحدث) * 10)::integer AS العقد,
    نوع_الحدث,
    COUNT(*)::integer AS عدد_الأحداث,
    COUNT(*) FILTER (WHERE أهمية_الحدث = 'عالية')::integer AS أحداث_مهمة,
    COUNT(*) FILTER (WHERE هو_عام = true)::integer AS أحداث_عامة
FROM عرض_الأحداث_التفصيلي
WHERE تاريخ_الحدث IS NOT NULL
GROUP BY EXTRACT(YEAR FROM تاريخ_الحدث), EXTRACT(DECADE FROM تاريخ_الحدث), نوع_الحدث
ORDER BY السنة, نوع_الحدث;

-- تحليل دورة الحياة
CREATE OR REPLACE VIEW public.تحليل_دورة_الحياة AS
SELECT 
    مستوى_الجيل,
    COUNT(*)::integer AS عدد_الأشخاص,
    -- إحصائيات العمر
    ROUND(AVG(EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد))), 2) AS متوسط_العمر,
    MIN(EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)))::integer AS أصغر_عمر,
    MAX(EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)))::integer AS أكبر_عمر,
    -- إحصائيات الوفيات
    COUNT(*) FILTER (WHERE تاريخ_الوفاة IS NOT NULL)::integer AS عدد_المتوفين,
    COUNT(*) FILTER (WHERE تاريخ_الوفاة IS NULL)::integer AS عدد_الأحياء,
    ROUND(100.0 * COUNT(*) FILTER (WHERE تاريخ_الوفاة IS NOT NULL) / COUNT(*), 2) AS نسبة_الوفيات
FROM عرض_العائلة_الشامل
WHERE تاريخ_الميلاد IS NOT NULL AND مستوى_الجيل IS NOT NULL
GROUP BY مستوى_الجيل
ORDER BY مستوى_الجيل;

-- تحليل الأعمار والأجيال
CREATE OR REPLACE VIEW public.تحليل_الأعمار_والأجيال AS
SELECT 
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 18 THEN 'أطفال'
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 35 THEN 'شباب'
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 60 THEN 'متوسط العمر'
        ELSE 'كبار السن'
    END AS الفئة_العمرية,
    مستوى_الجيل,
    COUNT(*)::integer AS العدد,
    COUNT(*) FILTER (WHERE النوع = 'رجل')::integer AS الذكور,
    COUNT(*) FILTER (WHERE النوع = 'امرأة')::integer AS الإناث,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد))), 2) AS متوسط_العمر
FROM عرض_العائلة_الشامل
WHERE تاريخ_الميلاد IS NOT NULL
GROUP BY 
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 18 THEN 'أطفال'
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 35 THEN 'شباب'
        WHEN EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد)) < 60 THEN 'متوسط العمر'
        ELSE 'كبار السن'
    END,
    مستوى_الجيل
ORDER BY مستوى_الجيل, الفئة_العمرية;

-- ========================================
-- 3. VIEWS للتحليل الجغرافي (Geographic Analysis)
-- ========================================

-- خريطة انتشار العائلة
CREATE OR REPLACE VIEW public.خريطة_انتشار_العائلة AS
SELECT 
    COALESCE(
        SUBSTRING(مكان_الميلاد FROM '^[^,]+'), 
        'غير محدد'
    ) AS الدولة,
    COALESCE(
        SUBSTRING(مكان_الميلاد FROM '^[^,]+, ([^,]+)'), 
        'غير محدد'
    ) AS المنطقة,
    COUNT(*)::integer AS عدد_الأفراد,
    COUNT(*) FILTER (WHERE النوع = 'رجل')::integer AS عدد_الرجال,
    COUNT(*) FILTER (WHERE النوع = 'امرأة')::integer AS عدد_النساء,
    COUNT(DISTINCT اسم_الفرع)::integer AS عدد_الفروع,
    MIN(تاريخ_الميلاد) AS أقدم_مولود,
    MAX(تاريخ_الميلاد) AS أحدث_مولود,
    COUNT(*) FILTER (WHERE تاريخ_الوفاة IS NOT NULL)::integer AS عدد_المتوفين
FROM عرض_العائلة_الشامل
WHERE مكان_الميلاد IS NOT NULL
GROUP BY 
    SUBSTRING(مكان_الميلاد FROM '^[^,]+'),
    SUBSTRING(مكان_الميلاد FROM '^[^,]+, ([^,]+)')
ORDER BY عدد_الأفراد DESC;

-- تحليل الهجرة والانتقال
CREATE OR REPLACE VIEW public.تحليل_الهجرة_والانتقال AS
SELECT 
    COALESCE(SUBSTRING(مكان_الميلاد FROM '^[^,]+'), 'غير محدد') AS دولة_الميلاد,
    COALESCE(SUBSTRING(مكان_الوفاة FROM '^[^,]+'), 'غير محدد') AS دولة_الوفاة,
    COUNT(*)::integer AS عدد_الحالات,
    COUNT(*) FILTER (WHERE 
        SUBSTRING(مكان_الميلاد FROM '^[^,]+') != SUBSTRING(مكان_الوفاة FROM '^[^,]+')
    )::integer AS عدد_المهاجرين,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(تاريخ_الوفاة, تاريخ_الميلاد))), 2) AS متوسط_عمر_الوفاة
FROM عرض_العائلة_الشامل
WHERE مكان_الميلاد IS NOT NULL AND مكان_الوفاة IS NOT NULL
GROUP BY 
    SUBSTRING(مكان_الميلاد FROM '^[^,]+'),
    SUBSTRING(مكان_الوفاة FROM '^[^,]+')
ORDER BY عدد_الحالات DESC;

-- عرض التوزيع الجغرافي
CREATE OR REPLACE VIEW public.عرض_التوزيع_الجغرافي AS
SELECT 
    COALESCE(
        SUBSTRING(مكان_الميلاد FROM '^[^,]+'), 
        'غير محدد'
    ) AS الدولة,
    COUNT(*)::integer AS عدد_المواليد,
    COUNT(CASE WHEN النوع = 'رجل' THEN 1 END)::integer AS مواليد_ذكور,
    COUNT(CASE WHEN النوع = 'امرأة' THEN 1 END)::integer AS مواليد_إناث,
    MIN(تاريخ_الميلاد) AS أقدم_مولود,
    MAX(تاريخ_الميلاد) AS أحدث_مولود
FROM عرض_العائلة_الشامل
WHERE مكان_الميلاد IS NOT NULL
GROUP BY SUBSTRING(مكان_الميلاد FROM '^[^,]+')
ORDER BY عدد_المواليد DESC;

-- ========================================
-- 4. VIEWS للتحليل الاجتماعي (Social Analysis)
-- ========================================

-- تحليل الشبكة الاجتماعية
CREATE OR REPLACE VIEW public.تحليل_الشبكة_الاجتماعية AS
SELECT 
    p.id,
    p.الاسم_الكامل,
    p.مستوى_الجيل,
    -- عدد الأطفال
    (SELECT COUNT(*) FROM الأشخاص WHERE father_id = p.id)::integer AS عدد_الأطفال,
    -- عدد الارتباطات مع النساء
    (SELECT COUNT(*) FROM ارتباط_النساء WHERE person_id = p.id)::integer AS عدد_ارتباطات_النساء,
    -- عدد الأحداث المرتبطة
    (SELECT COUNT(*) FROM الأحداث WHERE معرف_الشخص = p.id)::integer AS عدد_الأحداث,
    -- درجة الاتصال (مجموع الروابط)
    ((SELECT COUNT(*) FROM الأشخاص WHERE father_id = p.id) +
    (SELECT COUNT(*) FROM ارتباط_النساء WHERE person_id = p.id) +
    (SELECT COUNT(*) FROM الأحداث WHERE معرف_الشخص = p.id))::integer AS درجة_الاتصال,
    -- نوع الدور في الشبكة
    CASE 
        WHEN p.is_root = true THEN 'جذر العائلة'
        WHEN (SELECT COUNT(*) FROM الأشخاص WHERE father_id = p.id) > 5 THEN 'عقدة مركزية'
        WHEN (SELECT COUNT(*) FROM الأشخاص WHERE father_id = p.id) > 0 THEN 'والد'
        ELSE 'فرد'
    END AS نوع_الدور
FROM عرض_الأشخاص_كامل p
ORDER BY درجة_الاتصال DESC;

-- تحليل الأسماء والألقاب
CREATE OR REPLACE VIEW public.تحليل_الأسماء_والألقاب AS
SELECT 
    الاسم_الأول,
    COUNT(*)::integer AS عدد_التكرار,
    COUNT(*) FILTER (WHERE النوع = 'رجل')::integer AS تكرار_الذكور,
    COUNT(*) FILTER (WHERE النوع = 'امرأة')::integer AS تكرار_الإناث,
    COUNT(DISTINCT مستوى_الجيل)::integer AS عدد_الأجيال,
    MIN(تاريخ_الميلاد) AS أقدم_حامل,
    MAX(تاريخ_الميلاد) AS أحدث_حامل,
    -- شعبية الاسم
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM عرض_العائلة_الشامل), 2) AS نسبة_الشعبية
FROM عرض_العائلة_الشامل
WHERE الاسم_الأول IS NOT NULL
GROUP BY الاسم_الأول
ORDER BY عدد_التكرار DESC;

-- تحليل الزواج والارتباط
CREATE OR REPLACE VIEW public.تحليل_الزواج_والارتباط AS
SELECT 
    نوع_الارتباط,
    COUNT(*)::integer AS عدد_الارتباطات,
    COUNT(DISTINCT person_id)::integer AS عدد_الرجال_المرتبطين,
    COUNT(DISTINCT woman_id)::integer AS عدد_النساء_المرتبطات,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(تاريخ_الحدث, 
        (SELECT تاريخ_الميلاد FROM الأشخاص WHERE id = ar.person_id)
    ))), 2) AS متوسط_عمر_الارتباط,
    MIN(تاريخ_الحدث) AS أقدم_ارتباط,
    MAX(تاريخ_الحدث) AS أحدث_ارتباط
FROM ارتباط_النساء ar
GROUP BY نوع_الارتباط
ORDER BY عدد_الارتباطات DESC;

-- ========================================
-- 5. VIEWS للمحتوى الرقمي (Digital Content)
-- ========================================

-- عرض شامل للمحتوى الرقمي (صوتي + نصي)
CREATE OR REPLACE VIEW public.عرض_المحتوى_الرقمي_الشامل AS
-- الملفات الصوتية
SELECT 
    'ملف_صوتي'::text AS نوع_المحتوى,
    af.معرف_الملف_الصوتي::bigint AS المعرف,
    af.عنوان_التسجيل AS العنوان,
    af.نوع_التسجيل AS النوع,
    af.وصف_التسجيل AS الوصف,
    -- معلومات الكاتب/المتحدث
    COALESCE(
        (SELECT الاسم_الكامل FROM عرض_الأشخاص_كامل WHERE id = af.معرف_الشخص),
        (SELECT CONCAT_WS(' ', الاسم_الأول, اسم_الأب, اسم_العائلة) FROM النساء WHERE id = af.معرف_المرأة)
    ) AS اسم_المنشئ,
    CASE 
        WHEN af.معرف_الشخص IS NOT NULL THEN 'رجل'
        WHEN af.معرف_المرأة IS NOT NULL THEN 'امرأة'
        ELSE 'غير محدد'
    END AS نوع_المنشئ,
    af.تاريخ_التسجيل AS التاريخ,
    af.أهمية_التسجيل AS الأهمية,
    ROUND(EXTRACT(EPOCH FROM af.مدة_التسجيل) / 60, 2) AS المدة_بالدقائق,
    NULL::integer AS عدد_الكلمات,
    af.اللغة,
    af.اللهجة,
    af.الكلمات_المفتاحية,
    af.مستوى_الوضوح AS الوضوح,
    af.حالة_الحفظ,
    af.هو_عام,
    af.عدد_مرات_الاستماع AS عدد_المشاهدات,
    af.تاريخ_آخر_استماع AS تاريخ_آخر_استخدام,
    af.تاريخ_الإدخال
FROM الملفات_الصوتية af

UNION ALL

-- النصوص والوثائق
SELECT 
    'نص_مكتوب'::text AS نوع_المحتوى,
    td.معرف_النص::bigint AS المعرف,
    td.عنوان_النص AS العنوان,
    td.نوع_النص AS النوع,
    td.وصف_النص AS الوصف,
    -- معلومات الكاتب
    COALESCE(
        (SELECT الاسم_الكامل FROM عرض_الأشخاص_كامل WHERE id = td.معرف_الشخص),
        (SELECT CONCAT_WS(' ', الاسم_الأول, اسم_الأب, اسم_العائلة) FROM النساء WHERE id = td.معرف_المرأة),
        td.الكاتب_الأصلي
    ) AS اسم_المنشئ,
    CASE 
        WHEN td.معرف_الشخص IS NOT NULL THEN 'رجل'
        WHEN td.معرف_المرأة IS NOT NULL THEN 'امرأة'
        ELSE 'غير محدد'
    END AS نوع_المنشئ,
    td.تاريخ_الكتابة AS التاريخ,
    td.أهمية_النص AS الأهمية,
    NULL::numeric AS المدة_بالدقائق,
    td.عدد_الكلمات,
    td.اللغة,
    td.اللهجة,
    td.الكلمات_المفتاحية,
    td.مستوى_الوضوح AS الوضوح,
    td.حالة_الحفظ,
    CASE WHEN td.مستوى_الخصوصية = 'عام' THEN true ELSE false END AS هو_عام,
    td.عدد_مرات_القراءة AS عدد_المشاهدات,
    td.تاريخ_آخر_قراءة AS تاريخ_آخر_استخدام,
    td.تاريخ_الإدخال
FROM النصوص_والوثائق td;

-- أكثر المحتوى مشاهدة ومفيدة
CREATE OR REPLACE VIEW public.المحتوى_الأكثر_شعبية AS
SELECT 
    نوع_المحتوى,
    العنوان,
    النوع,
    اسم_المنشئ,
    التاريخ,
    الأهمية,
    عدد_المشاهدات,
    تاريخ_آخر_استخدام,
    CASE 
        WHEN نوع_المحتوى = 'ملف_صوتي' THEN المدة_بالدقائق::text || ' دقيقة'
        WHEN نوع_المحتوى = 'نص_مكتوب' THEN عدد_الكلمات::text || ' كلمة'
        ELSE 'غير محدد'
    END AS التفاصيل
FROM عرض_المحتوى_الرقمي_الشامل
WHERE عدد_المشاهدات > 0
ORDER BY عدد_المشاهدات DESC, الأهمية DESC, التاريخ DESC
LIMIT 20;

-- ========================================
-- 6. VIEWS للإحصائيات والتقارير (Statistics & Reports)
-- ========================================

-- عرض الأجيال والإحصائيات
CREATE OR REPLACE VIEW public.عرض_إحصائيات_الأجيال AS
SELECT 
    مستوى_الجيل,
    COUNT(*)::integer AS عدد_الأشخاص,
    COUNT(CASE WHEN الجنس = 'ذكر' THEN 1 END)::integer AS عدد_الذكور,
    COUNT(CASE WHEN الجنس = 'أنثى' THEN 1 END)::integer AS عدد_الإناث,
    MIN(تاريخ_الميلاد) AS أقدم_مولود,
    MAX(تاريخ_الميلاد) AS أحدث_مولود,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(COALESCE(تاريخ_الوفاة, CURRENT_DATE), تاريخ_الميلاد))), 2) AS متوسط_العمر,
    COUNT(CASE WHEN تاريخ_الوفاة IS NOT NULL THEN 1 END)::integer AS عدد_المتوفين,
    COUNT(CASE WHEN تاريخ_الوفاة IS NULL THEN 1 END)::integer AS عدد_الأحياء
FROM عرض_الأشخاص_كامل
WHERE مستوى_الجيل IS NOT NULL
GROUP BY مستوى_الجيل
ORDER BY مستوى_الجيل;

-- عرض إحصائيات الفروع
CREATE OR REPLACE VIEW public.عرض_إحصائيات_الفروع AS
SELECT 
    COALESCE(اسم_الفرع, 'غير محدد') AS اسم_الفرع,
    COUNT(*)::integer AS إجمالي_الأفراد,
    COUNT(CASE WHEN النوع = 'رجل' THEN 1 END)::integer AS عدد_الرجال,
    COUNT(CASE WHEN النوع = 'امرأة' THEN 1 END)::integer AS عدد_النساء,
    MAX(مستوى_الجيل) AS أقصى_جيل,
    MIN(تاريخ_الميلاد) AS أقدم_فرد,
    MAX(تاريخ_الميلاد) AS أحدث_فرد,
    COUNT(CASE WHEN تاريخ_الوفاة IS NOT NULL THEN 1 END)::integer AS عدد_المتوفين
FROM عرض_العائلة_الشامل
GROUP BY اسم_الفرع
ORDER BY إجمالي_الأفراد DESC;

-- ملخص عام للعائلة
CREATE OR REPLACE VIEW public.ملخص_العائلة_العام AS
SELECT 
    COUNT(*)::integer AS إجمالي_الأفراد,
    COUNT(CASE WHEN النوع = 'رجل' THEN 1 END)::integer AS عدد_الرجال,
    COUNT(CASE WHEN النوع = 'امرأة' THEN 1 END)::integer AS عدد_النساء,
    COUNT(DISTINCT اسم_العائلة)::integer AS عدد_العائلات,
    COUNT(DISTINCT اسم_الفرع)::integer AS عدد_الفروع,
    MAX(مستوى_الجيل) AS أقصى_جيل,
    MIN(تاريخ_الميلاد) AS أقدم_تاريخ_ميلاد,
    MAX(تاريخ_الميلاد) AS أحدث_تاريخ_ميلاد,
    COUNT(CASE WHEN تاريخ_الوفاة IS NOT NULL THEN 1 END)::integer AS عدد_المتوفين,
    COUNT(CASE WHEN تاريخ_الوفاة IS NULL THEN 1 END)::integer AS عدد_الأحياء,
    ROUND(
        100.0 * COUNT(CASE WHEN تاريخ_الوفاة IS NULL THEN 1 END) / COUNT(*), 
        2
    ) AS نسبة_الأحياء
FROM عرض_العائلة_الشامل;

-- إحصائيات المحتوى الرقمي الشاملة
CREATE OR REPLACE VIEW public.إحصائيات_المحتوى_الرقمي AS
SELECT 
    نوع_المحتوى,
    COUNT(*)::integer AS العدد,
    COUNT(CASE WHEN الأهمية = 'عالية' THEN 1 END)::integer AS عالي_الأهمية,
    COUNT(CASE WHEN الأهمية = 'متوسطة' THEN 1 END)::integer AS متوسط_الأهمية,
    COUNT(CASE WHEN الأهمية = 'عادية' THEN 1 END)::integer AS عادي_الأهمية,
    COUNT(CASE WHEN هو_عام = true THEN 1 END)::integer AS محتوى_عام,
    COUNT(CASE WHEN نوع_المنشئ = 'رجل' THEN 1 END)::integer AS من_الرجال,
    COUNT(CASE WHEN نوع_المنشئ = 'امرأة' THEN 1 END)::integer AS من_النساء,
    SUM(عدد_المشاهدات)::integer AS إجمالي_المشاهدات,
    MIN(التاريخ) AS أقدم_محتوى,
    MAX(التاريخ) AS أحدث_محتوى,
    -- إحصائيات خاصة بالملفات الصوتية
    ROUND(AVG(المدة_بالدقائق), 2) AS متوسط_المدة_بالدقائق,
    -- إحصائيات خاصة بالنصوص
    ROUND(AVG(عدد_الكلمات), 0) AS متوسط_عدد_الكلمات
FROM عرض_المحتوى_الرقمي_الشامل
GROUP BY نوع_المحتوى
ORDER BY العدد DESC;

-- ========================================
-- 7. VIEWS للبحث المتقدم (Advanced Search)
-- ========================================

-- فهرس بحث شامل محدث (يشمل الصوتيات والنصوص)
CREATE OR REPLACE VIEW public.فهرس_البحث_الشامل AS
SELECT 
    'شخص'::text AS نوع_النتيجة,
    id::bigint,
    الاسم_الكامل AS العنوان,
    CONCAT('جيل ', مستوى_الجيل, ' - ', اسم_الفرع) AS الوصف,
    تاريخ_الميلاد::text AS التاريخ,
    مكان_الميلاد AS المكان,
    رقم_هوية_وطنية AS المعرف_الإضافي,
    'عادية'::text AS الأهمية
FROM عرض_الأشخاص_كامل

UNION ALL

SELECT 
    'امرأة'::text AS نوع_النتيجة,
    (id + 1000000)::bigint AS id,
    CONCAT_WS(' ', الاسم_الأول, اسم_الأب, اسم_العائلة) AS العنوان,
    CONCAT('عائلة ', اسم_العائلة) AS الوصف,
    تاريخ_الميلاد::text AS التاريخ,
    CASE 
        WHEN bl.الدولة IS NOT NULL THEN 
            CONCAT(bl.الدولة, COALESCE(', ' || bl.المنطقة, ''), COALESCE(', ' || bl.المدينة, ''))
        ELSE NULL
    END AS المكان,
    رقم_هوية_وطنية AS المعرف_الإضافي,
    'عادية'::text AS الأهمية
FROM النساء w
LEFT JOIN المواقع bl ON w.مكان_الميلاد = bl.معرف_الموقع

UNION ALL

SELECT 
    'حدث'::text AS نوع_النتيجة,
    معرف_الحدث::bigint AS id,
    عنوان_الحدث AS العنوان,
    نوع_الحدث AS الوصف,
    تاريخ_الحدث::text AS التاريخ,
    مكان_الحدث AS المكان,
    NULL::text AS المعرف_الإضافي,
    أهمية_الحدث AS الأهمية
FROM عرض_الأحداث_التفصيلي

UNION ALL

SELECT 
    'ملف_صوتي'::text AS نوع_النتيجة,
    (معرف_الملف_الصوتي + 2000000)::bigint AS id,
    عنوان_التسجيل AS العنوان,
    نوع_التسجيل AS الوصف,
    تاريخ_التسجيل::text AS التاريخ,
    مكان_التسجيل_النصي AS المكان,
    CONCAT(ROUND(EXTRACT(EPOCH FROM مدة_التسجيل), 0)::text, ' ثانية') AS المعرف_الإضافي,
    أهمية_التسجيل AS الأهمية
FROM الملفات_الصوتية

UNION ALL

SELECT 
    'نص_مكتوب'::text AS نوع_النتيجة,
    (معرف_النص + 3000000)::bigint AS id,
    عنوان_النص AS العنوان,
    نوع_النص AS الوصف,
    تاريخ_الكتابة::text AS التاريخ,
    مكان_الكتابة_النصي AS المكان,
    CONCAT(COALESCE(عدد_الكلمات, 0)::text, ' كلمة') AS المعرف_الإضافي,
    أهمية_النص AS الأهمية
FROM النصوص_والوثائق;

-- فهرس البحث النصي
CREATE OR REPLACE VIEW public.فهرس_البحث_النصي AS
SELECT 
    معرف_النص AS المعرف,
    عنوان_النص AS العنوان,
    نوع_النص AS النوع,
    ملخص_النص AS الملخص,
    الكلمات_المفتاحية,
    الشخصيات_المذكورة,
    الأماكن_المذكورة,
    أهمية_النص AS الأهمية,
    عدد_الكلمات,
    تاريخ_الكتابة AS التاريخ
FROM النصوص_والوثائق
WHERE مستوى_الخصوصية IN ('عام', 'عائلة');

-- فهرس البحث الصوتي
CREATE OR REPLACE VIEW public.فهرس_البحث_الصوتي AS
SELECT 
    معرف_الملف_الصوتي AS المعرف,
    عنوان_التسجيل AS العنوان,
    نوع_التسجيل AS النوع,
    ملخص_المحتوى AS الملخص,
    الكلمات_المفتاحية,
    الشخصيات_المذكورة,
    الأماكن_المذكورة,
    أهمية_التسجيل AS الأهمية,
    مدة_التسجيل,
    تاريخ_التسجيل AS التاريخ
FROM الملفات_الصوتية
WHERE هو_عام = true;

-- ========================================
-- 8. VIEWS للمراجع والتوثيق (References & Documentation)
-- ========================================

-- إحصائيات التوثيق والمراجع
CREATE OR REPLACE VIEW public.إحصائيات_التوثيق AS
SELECT 
    نوع_المرجع,
    COUNT(*)::integer AS عدد_المراجع,
    COUNT(CASE WHEN مستوى_الثقة = 'عالية' THEN 1 END)::integer AS مراجع_موثوقة,
    COUNT(CASE WHEN مستوى_الثقة = 'متوسطة' THEN 1 END)::integer AS مراجع_متوسطة,
    COUNT(CASE WHEN مستوى_الثقة = 'منخفضة' THEN 1 END)::integer AS مراجع_ضعيفة,
    MIN(تاريخ_المرجع) AS أقدم_مرجع,
    MAX(تاريخ_المرجع) AS أحدث_مرجع
FROM عرض_المراجع_الشامل
GROUP BY نوع_المرجع
ORDER BY عدد_المراجع DESC;

-- ========================================
-- 9. VIEWS للملخصات التنفيذية (Executive Summaries)
-- ========================================

-- لوحة المعلومات الرئيسية المحدثة
CREATE OR REPLACE VIEW public.لوحة_المعلومات_الرئيسية AS
SELECT 
    (SELECT إجمالي_الأفراد FROM ملخص_العائلة_العام) AS إجمالي_الأفراد,
    (SELECT عدد_الرجال FROM ملخص_العائلة_العام) AS عدد_الرجال,
    (SELECT عدد_النساء FROM ملخص_العائلة_العام) AS عدد_النساء,
    (SELECT أقصى_جيل FROM ملخص_العائلة_العام) AS أقصى_جيل,
    (SELECT عدد_الفروع FROM ملخص_العائلة_العام) AS عدد_الفروع,
    (SELECT COUNT(*) FROM عرض_الأحداث_التفصيلي)::integer AS إجمالي_الأحداث,
    (SELECT COUNT(*) FROM عرض_ارتباط_النساء_التفصيلي)::integer AS إجمالي_ارتباطات_النساء,
    (SELECT COUNT(*) FROM المواقع)::integer AS عدد_المواقع_المسجلة,
    -- إحصائيات المحتوى الرقمي الجديدة
    (SELECT COUNT(*) FROM الملفات_الصوتية)::integer AS إجمالي_الملفات_الصوتية,
    (SELECT ROUND(SUM(EXTRACT(EPOCH FROM مدة_التسجيل)) / 3600, 2) FROM الملفات_الصوتية) AS إجمالي_ساعات_التسجيل,
    (SELECT COUNT(*) FROM النصوص_والوثائق)::integer AS إجمالي_النصوص_والوثائق,
    (SELECT SUM(COALESCE(عدد_الكلمات, 0)) FROM النصوص_والوثائق)::integer AS إجمالي_الكلمات,
    (SELECT COUNT(*) FROM المراجع)::integer AS إجمالي_المراجع,
    -- إحصائيات الأهمية
    (SELECT COUNT(*) FROM عرض_المحتوى_الرقمي_الشامل WHERE الأهمية = 'عالية')::integer AS محتوى_عالي_الأهمية,
    (SELECT COUNT(*) FROM عرض_المحتوى_الرقمي_الشامل WHERE هو_عام = true)::integer AS محتوى_عام,
    CURRENT_DATE AS تاريخ_التقرير;

-- ملخص الأحداث المهمة
CREATE OR REPLACE VIEW public.ملخص_الأحداث_المهمة AS
SELECT 
    نوع_الحدث,
    COUNT(*)::integer AS عدد_الأحداث,
    COUNT(CASE WHEN أهمية_الحدث = 'عالية' THEN 1 END)::integer AS أحداث_عالية_الأهمية,
    COUNT(CASE WHEN أهمية_الحدث = 'متوسطة' THEN 1 END)::integer AS أحداث_متوسطة_الأهمية,
    COUNT(CASE WHEN أهمية_الحدث = 'عادية' THEN 1 END)::integer AS أحداث_عادية,
    MIN(تاريخ_الحدث) AS أقدم_حدث,
    MAX(تاريخ_الحدث) AS أحدث_حدث
FROM عرض_الأحداث_التفصيلي
GROUP BY نوع_الحدث
ORDER BY عدد_الأحداث DESC;

-- ملخص ارتباطات النساء
CREATE OR REPLACE VIEW public.ملخص_ارتباطات_النساء AS
SELECT 
    نوع_الارتباط,
    COUNT(*)::integer AS عدد_الارتباطات,
    COUNT(CASE WHEN أهمية_الحدث = 'عالية' THEN 1 END)::integer AS ارتباطات_مهمة,
    COUNT(DISTINCT عائلة_المرأة)::integer AS عدد_العائلات_المرتبطة,
    MIN(تاريخ_الحدث) AS أقدم_ارتباط,
    MAX(تاريخ_الحدث) AS أحدث_ارتباط
FROM عرض_ارتباط_النساء_التفصيلي
GROUP BY نوع_الارتباط
ORDER BY عدد_الارتباطات DESC;

-- ملخص الملفات الصوتية المحدث
CREATE OR REPLACE VIEW public.ملخص_الملفات_الصوتية AS
SELECT 
    نوع_التسجيل,
    COUNT(*)::integer AS عدد_الملفات,
    COUNT(CASE WHEN أهمية_التسجيل = 'عالية' THEN 1 END)::integer AS ملفات_مهمة,
    ROUND(SUM(EXTRACT(EPOCH FROM مدة_التسجيل)) / 3600, 2) AS إجمالي_الساعات,
    ROUND(AVG(EXTRACT(EPOCH FROM مدة_التسجيل)) / 60, 2) AS متوسط_المدة_بالدقائق,
    SUM(عدد_مرات_الاستماع)::integer AS إجمالي_مرات_الاستماع,
    MIN(تاريخ_التسجيل) AS أقدم_تسجيل,
    MAX(تاريخ_التسجيل) AS أحدث_تسجيل,
    COUNT(CASE WHEN هو_عام = true THEN 1 END)::integer AS ملفات_عامة,
    COUNT(CASE WHEN مستوى_الوضوح = 'ممتاز' THEN 1 END)::integer AS ملفات_واضحة
FROM الملفات_الصوتية
GROUP BY نوع_التسجيل
ORDER BY عدد_الملفات DESC;

-- ملخص النصوص والوثائق الجديد
CREATE OR REPLACE VIEW public.ملخص_النصوص_والوثائق AS
SELECT 
    نوع_النص,
    COUNT(*)::integer AS عدد_النصوص,
    COUNT(CASE WHEN أهمية_النص = 'عالية' THEN 1 END)::integer AS نصوص_مهمة,
    SUM(COALESCE(عدد_الكلمات, 0))::integer AS إجمالي_الكلمات,
    ROUND(AVG(COALESCE(عدد_الكلمات, 0)), 0)::integer AS متوسط_الكلمات,
    SUM(عدد_مرات_القراءة)::integer AS إجمالي_مرات_القراءة,
    MIN(تاريخ_الكتابة) AS أقدم_نص,
    MAX(تاريخ_الكتابة) AS أحدث_نص,
    COUNT(CASE WHEN مستوى_الخصوصية = 'عام' THEN 1 END)::integer AS نصوص_عامة,
    COUNT(CASE WHEN معرف_المرجع IS NOT NULL THEN 1 END)::integer AS نصوص_موثقة
FROM النصوص_والوثائق
GROUP BY نوع_النص
ORDER BY عدد_النصوص DESC;

-- ========================================
-- Security: تطبيق RLS على Views المحدثة
-- ========================================

-- تطبيق Row Level Security على Views المهمة
ALTER VIEW public.عرض_العائلة_الشامل SET (security_invoker = on);
ALTER VIEW public.عرض_الأحداث_التفصيلي SET (security_invoker = on);
ALTER VIEW public.عرض_ارتباط_النساء_التفصيلي SET (security_invoker = on);
ALTER VIEW public.عرض_المحتوى_الرقمي_الشامل SET (security_invoker = on);
ALTER VIEW public.فهرس_البحث_الشامل SET (security_invoker = on);

-- ========================================
-- تعليقات توضيحية محدثة
-- ========================================

COMMENT ON VIEW public.عرض_العائلة_الشامل IS 'عرض شامل يجمع بين الرجال والنساء في جدول واحد مع تصحيح أنواع البيانات';
COMMENT ON VIEW public.عرض_إحصائيات_الأجيال IS 'إحصائيات مفصلة لكل جيل في العائلة';
COMMENT ON VIEW public.ملخص_العائلة_العام IS 'ملخص إحصائي عام للعائلة بأكملها';
COMMENT ON VIEW public.لوحة_المعلومات_الرئيسية IS 'لوحة معلومات تنفيذية للإحصائيات الرئيسية مع المحتوى الرقمي';
COMMENT ON VIEW public.فهرس_البحث_الشامل IS 'فهرس موحد للبحث في كل أنواع البيانات بما في ذلك الملفات الصوتية والنصوص';
COMMENT ON VIEW public.تحليل_النمو_الزمني IS 'تحليل نمو العائلة عبر السنوات مع المتوسط المتحرك';
COMMENT ON VIEW public.خريطة_انتشار_العائلة IS 'توزيع أفراد العائلة جغرافياً مع الإحصائيات المكانية';
COMMENT ON VIEW public.تحليل_الشبكة_الاجتماعية IS 'تحليل أنماط الارتباط والعلاقات الاجتماعية في العائلة';
COMMENT ON VIEW public.عرض_المحتوى_الرقمي_الشامل IS 'عرض موحد للمحتوى الرقمي (صوتي ونصي) مع الإحصائيات';

-- إشعار بنجاح الإنشاء
DO $$
BEGIN
    RAISE NOTICE 'تم إنشاء جميع Views المفقودة بنجاح - 25+ View متخصص مع إصلاح أنواع البيانات';
    RAISE NOTICE 'Views تشمل: التحليل الزمني، الجغرافي، الاجتماعي، المحتوى الرقمي، والبحث المتقدم';
    RAISE NOTICE 'تم إصلاح مشاكل UNION types وضمان توافق أنواع البيانات';
END $$;