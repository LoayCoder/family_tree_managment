-- First, let's check if all the necessary parent records exist and create them if needed
DO $$
DECLARE
    father1_exists BOOLEAN;
    father2_exists BOOLEAN;
    father3_exists BOOLEAN;
    father4_exists BOOLEAN;
    father5_exists BOOLEAN;
    father6_exists BOOLEAN;
    father7_exists BOOLEAN;
    father8_exists BOOLEAN;
    father10_exists BOOLEAN;
BEGIN
    -- Check if all required fathers exist
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 1) INTO father1_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 2) INTO father2_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 3) INTO father3_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 4) INTO father4_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 5) INTO father5_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 6) INTO father6_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 7) INTO father7_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 8) INTO father8_exists;
    SELECT EXISTS(SELECT 1 FROM "الأشخاص" WHERE id = 10) INTO father10_exists;
    
    -- Create root father with ID 1 if it doesn't exist
    IF NOT father1_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "is_root", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            1, 'عبدالله بن محمد آل النجدي', true, '1850-01-01', 1, 
            1, '9000000001', 'متزوج', '1'
        );
        RAISE NOTICE 'Created missing root father with ID 1';
    END IF;
    
    -- Create root father with ID 2 if it doesn't exist
    IF NOT father2_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "is_root", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            2, 'سعد بن عبدالرحمن آل النجدي', true, '1855-03-10', 5, 
            2, '9000000002', 'متزوج', '2'
        );
        RAISE NOTICE 'Created missing root father with ID 2';
    END IF;
    
    -- Create root father with ID 3 if it doesn't exist
    IF NOT father3_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "is_root", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            3, 'أحمد بن علي آل النجدي', true, '1860-07-22', 7, 
            3, '9000000003', 'متزوج', '3'
        );
        RAISE NOTICE 'Created missing root father with ID 3';
    END IF;
    
    -- Create second generation fathers if they don't exist
    IF NOT father4_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            4, 'محمد بن عبدالله آل النجدي', 1, '1875-02-15', 1, 
            1, '9000000004', 'متزوج', '1.4'
        );
        RAISE NOTICE 'Created missing father with ID 4';
    END IF;
    
    IF NOT father5_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            5, 'أحمد بن عبدالله آل النجدي', 1, '1878-05-20', 1, 
            1, '9000000005', 'متزوج', '1.5'
        );
        RAISE NOTICE 'Created missing father with ID 5';
    END IF;
    
    -- Create father with ID 6 if it doesn't exist
    IF NOT father6_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            6, 'عبدالرحمن بن عبدالله آل النجدي', 1, '1882-09-10', 1, 
            1, '9000000006', 'متزوج', '1.6'
        );
        RAISE NOTICE 'Created missing father with ID 6';
    END IF;
    
    -- Create father with ID 7 if it doesn't exist
    IF NOT father7_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            7, 'سالم بن عبدالله آل النجدي', 1, '1885-12-05', 1, 
            1, '9000000007', 'متزوج', '1.7'
        );
        RAISE NOTICE 'Created missing father with ID 7';
    END IF;
    
    -- Create father with ID 8 if it doesn't exist
    IF NOT father8_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            8, 'عبدالرحمن بن سعد آل النجدي', 2, '1880-04-18', 5, 
            2, '9000000008', 'متزوج', '2.8'
        );
        RAISE NOTICE 'Created missing father with ID 8';
    END IF;
    
    -- Create father with ID 10 if it doesn't exist
    IF NOT father10_exists THEN
        INSERT INTO "الأشخاص" (
            id, "الاسم_الأول", "father_id", "تاريخ_الميلاد", "مكان_الميلاد", 
            "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "path"
        ) VALUES (
            10, 'علي بن أحمد آل النجدي', 3, '1885-01-12', 7, 
            3, '9000000010', 'متزوج', '3.10'
        );
        RAISE NOTICE 'Created missing father with ID 10';
    END IF;
END $$;

-- Now add sons of Abdulrahman bin Abdullah (third generation)
INSERT INTO "الأشخاص" (
  "الاسم_الأول", "father_id", "تاريخ_الميلاد", "تاريخ_الوفاة",
  "مكان_الميلاد", "مكان_الوفاة", "معرف_الفرع", "رقم_هوية_وطنية",
  "الحالة_الاجتماعية", "المنصب", "مستوى_التعليم", "ملاحظات", "path"
) VALUES 
(
  'سعد بن عبدالرحمن بن عبدالله', 6, '1930-01-20', NULL,
  1, NULL, 1, '9100000001', 'متزوج',
  'شاعر وكاتب', 'أدب عربي',
  'ورث موهبة الشعر من والده، له عدة دواوين', '1.6.16'
),
(
  'فهد بن عبدالرحمن بن عبدالله', 6, '1933-04-12', NULL,
  1, NULL, 1, '9100000002', 'متزوج',
  'صحفي', 'إعلام',
  'صحفي مشهور، يكتب في عدة صحف محلية', '1.6.17'
) ON CONFLICT ("رقم_هوية_وطنية") DO NOTHING;

-- Add sons of Salem bin Abdullah (third generation)
INSERT INTO "الأشخاص" (
  "الاسم_الأول", "father_id", "تاريخ_الميلاد", "تاريخ_الوفاة",
  "مكان_الميلاد", "مكان_الوفاة", "معرف_الفرع", "رقم_هوية_وطنية",
  "الحالة_الاجتماعية", "المنصب", "مستوى_التعليم", "ملاحظات", "path"
) VALUES 
(
  'عبدالله بن سالم بن عبدالله', 7, '1935-08-15', NULL,
  1, NULL, 1, '9100000003', 'متزوج',
  'مهندس زراعي', 'هندسة زراعية',
  'ورث اهتمام والده بالزراعة، طور مشاريع حديثة', '1.7.18'
),
(
  'محمد بن سالم بن عبدالله', 7, '1938-12-03', NULL,
  1, NULL, 1, '9100000004', 'متزوج',
  'تاجر', 'إدارة أعمال',
  'تاجر ناجح، يدير عدة مشاريع تجارية', '1.7.19'
) ON CONFLICT ("رقم_هوية_وطنية") DO NOTHING;

-- Add sons from other branches (third generation)
INSERT INTO "الأشخاص" (
  "الاسم_الأول", "father_id", "تاريخ_الميلاد", "تاريخ_الوفاة",
  "مكان_الميلاد", "مكان_الوفاة", "معرف_الفرع", "رقم_هوية_وطنية",
  "الحالة_الاجتماعية", "المنصب", "مستوى_التعليم", "ملاحظات", "path"
) VALUES 
(
  'ناصر بن عبدالرحمن بن سعد', 8, '1925-10-08', NULL,
  5, NULL, 2, '9100000005', 'متزوج',
  'تاجر حبوب', 'تجارة',
  'ورث تجارة الحبوب من والده وطورها', '2.8.20'
),
(
  'سعود بن علي بن أحمد', 10, '1930-02-14', NULL,
  7, NULL, 3, '9100000006', 'متزوج',
  'رجل أعمال', 'إدارة أعمال',
  'رجل أعمال ناجح في مجال البترول والغاز', '3.10.21'
) ON CONFLICT ("رقم_هوية_وطنية") DO NOTHING;

-- First, check if women exist and create them if needed
DO $$
DECLARE
    woman10_exists BOOLEAN;
    woman11_exists BOOLEAN;
    woman12_exists BOOLEAN;
BEGIN
    -- Check if women exist
    SELECT EXISTS(SELECT 1 FROM "النساء" WHERE id = 10) INTO woman10_exists;
    SELECT EXISTS(SELECT 1 FROM "النساء" WHERE id = 11) INTO woman11_exists;
    SELECT EXISTS(SELECT 1 FROM "النساء" WHERE id = 12) INTO woman12_exists;
    
    -- Create women if they don't exist
    IF NOT woman10_exists THEN
        INSERT INTO "النساء" (
            id, "الاسم_الأول", "اسم_الأب", "اسم_العائلة", "تاريخ_الميلاد",
            "مكان_الميلاد", "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "ملاحظات"
        ) VALUES (
            10, 'أمل', 'محمد', 'آل النجدي', '1925-03-20',
            1, 1, '9200000001', 'متزوجة', 'ابنة محمد بن عبدالله، طبيبة'
        );
        RAISE NOTICE 'Created missing woman with ID 10';
    END IF;
    
    IF NOT woman11_exists THEN
        INSERT INTO "النساء" (
            id, "الاسم_الأول", "اسم_الأب", "اسم_العائلة", "تاريخ_الميلاد",
            "مكان_الميلاد", "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "ملاحظات"
        ) VALUES (
            11, 'سعاد', 'أحمد', 'آل النجدي', '1930-07-15',
            2, 1, '9200000002', 'متزوجة', 'ابنة أحمد بن عبدالله، معلمة'
        );
        RAISE NOTICE 'Created missing woman with ID 11';
    END IF;
    
    IF NOT woman12_exists THEN
        INSERT INTO "النساء" (
            id, "الاسم_الأول", "اسم_الأب", "اسم_العائلة", "تاريخ_الميلاد",
            "مكان_الميلاد", "معرف_الفرع", "رقم_هوية_وطنية", "الحالة_الاجتماعية", "ملاحظات"
        ) VALUES (
            12, 'منيرة', 'عبدالرحمن', 'آل النجدي', '1935-11-10',
            1, 1, '9200000003', 'متزوجة', 'ابنة عبدالرحمن بن عبدالله، شاعرة'
        );
        RAISE NOTICE 'Created missing woman with ID 12';
    END IF;
END $$;

-- Now add women relationships
INSERT INTO "ارتباط_النساء" (
  "woman_id", "person_id", "نوع_الارتباط", "السبب_أو_الحدث", 
  "تاريخ_الحدث", "مكان_الحدث", "أهمية_الحدث", "تفاصيل_إضافية"
) VALUES 
-- More daughters - only add if the person exists
(10, 4, 'ابنة', 'ولادة أمل بنت محمد', '1925-03-20', 1, 'متوسطة', 'أول طبيبة في العائلة'),
(11, 5, 'ابنة', 'ولادة سعاد بنت أحمد', '1930-07-15', 2, 'متوسطة', 'معلمة مشهورة'),
(12, 6, 'ابنة', 'ولادة منيرة بنت عبدالرحمن', '1935-11-10', 1, 'متوسطة', 'شاعرة موهوبة')
ON CONFLICT DO NOTHING;

-- Add third generation events
INSERT INTO "الأحداث" (
  "معرف_الشخص", "نوع_الحدث", "عنوان_الحدث", "وصف_الحدث",
  "تاريخ_الحدث", "مكان_الحدث", "أهمية_الحدث", "هو_عام"
) VALUES 
-- Third generation events for persons that exist
(4, 'إنجاز', 'توسعة تجارة العائلة', 'قام محمد بتوسعة تجارة العائلة بشكل كبير', '1940-05-20', 1, 'عالية', true),
(5, 'تعيين', 'تعيين كقاضي كبير', 'تم تعيين أحمد في منصب قضائي مرموق', '1942-06-15', 2, 'عالية', true),
(6, 'إنجاز', 'نشر ديوان شعر كبير', 'نشر عبدالرحمن ديوان شعر حقق شهرة واسعة', '1944-03-10', 1, 'عالية', true),
(7, 'إنجاز', 'تطوير مشروع زراعي رائد', 'طور سالم مشروعاً زراعياً رائداً في المنطقة', '1950-09-25', 1, 'عالية', true)
ON CONFLICT DO NOTHING;

-- Add more audio files
INSERT INTO "الملفات_الصوتية" (
  "عنوان_التسجيل", "نوع_التسجيل", "وصف_التسجيل", "معرف_الشخص",
  "تاريخ_التسجيل", "أهمية_التسجيل", "الكلمات_المفتاحية",
  "مسار_الملف", "نوع_الملف", "مدة_التسجيل", "جودة_التسجيل",
  "مستوى_الوضوح", "حالة_الحفظ", "اللهجة", "مصدر_التسجيل", "هو_عام"
) VALUES 
(
  'حديث مع الشيخ أحمد عن القضاء', 'مقابلة_شخصية',
  'مقابلة مع الشيخ أحمد عن تجربته في سلك القضاء', 5,
  '2020-03-10', 'عالية', ARRAY['قضاء', 'شريعة', 'تاريخ', 'تجربة'],
  '/audio/sheikh_ahmed_interview.mp3', 'mp3', '00:55:30'::INTERVAL,
  'عالية', 'ممتاز', 'ممتازة', 'فصحى', 'تسجيل مباشر', true
),
(
  'قصائد عبدالرحمن بن عبدالله', 'شعر_وأدب',
  'مجموعة من قصائد الشاعر عبدالرحمن بن عبدالله', 6,
  '2019-07-25', 'متوسطة', ARRAY['شعر', 'أدب', 'قصائد', 'تراث'],
  '/audio/abdulrahman_poems.mp3', 'mp3', '00:32:20'::INTERVAL,
  'متوسطة', 'جيد', 'جيدة', 'نجدية', 'تسجيل عائلي', true
)
ON CONFLICT DO NOTHING;

-- Add more text documents
INSERT INTO "النصوص_والوثائق" (
  "عنوان_النص", "نوع_النص", "النص_الكامل", "ملخص_النص", "معرف_الشخص",
  "تاريخ_الكتابة", "أهمية_النص", "الكلمات_المفتاحية", "الكاتب_الأصلي",
  "اللهجة", "مصدر_النص", "مستوى_الخصوصية", "هو_عام"
) VALUES 
(
  'أحكام قضائية للشيخ أحمد', 'وثيقة_رسمية',
  'بسم الله الرحمن الرحيم، هذه مجموعة من الأحكام القضائية التي أصدرتها خلال فترة عملي كقاضي في المحكمة الشرعية...',
  'مجموعة من الأحكام القضائية المهمة التي أصدرها الشيخ أحمد', 5,
  '1940-09-01', 'عالية', ARRAY['قضاء', 'أحكام', 'شريعة', 'توثيق'],
  'أحمد بن عبدالله آل النجدي', 'فصحى', 'وثائق رسمية', 'عائلة', true
),
(
  'مذكرات سالم عن الزراعة الحديثة', 'مذكرات_شخصية',
  'بدأت رحلتي مع الزراعة الحديثة عندما سافرت إلى مصر وشاهدت التقنيات الجديدة هناك. عدت محملاً بالأفكار والخطط لتطوير الزراعة في منطقتنا...',
  'مذكرات سالم بن عبدالله عن تجربته في تطوير الزراعة الحديثة', 7,
  '1950-04-10', 'متوسطة', ARRAY['زراعة', 'تطوير', 'تقنيات', 'مذكرات'],
  'سالم بن عبدالله آل النجدي', 'نجدية', 'مذكرات شخصية', 'عائلة', true
)
ON CONFLICT DO NOTHING;

-- Add more references
INSERT INTO "المراجع" (
  "معرف_الشخص", "نوع_المرجع", "عنوان_المرجع", "مؤلف_المرجع",
  "تاريخ_المرجع", "مستوى_الثقة", "ملاحظات"
) VALUES 
(5, 'كتاب', 'تاريخ القضاء في نجد', 'مؤرخ المنطقة',
 '1960-05-20', 'عالية', 'كتاب يوثق تاريخ القضاء ويذكر الشيخ أحمد'),
(7, 'وثيقة', 'براءة اختراع لتقنية ري', 'مكتب براءات الاختراع',
 '1948-08-15', 'عالية', 'براءة اختراع لتقنية ري طورها سالم')
ON CONFLICT DO NOTHING;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'تم إضافة بيانات الجيل الثالث والبيانات الإضافية بنجاح';
END $$;