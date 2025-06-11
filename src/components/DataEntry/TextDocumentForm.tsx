import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Save, X, MapPin, Calendar, User, Star, Globe, Tag, Book, Lock } from 'lucide-react';
import { arabicFamilyService, Location, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';

interface TextDocumentFormData {
  عنوان_النص: string;
  وصف_النص: string;
  نوع_النص: string;
  النص_الكامل: string;
  ملخص_النص: string;
  الكلمات_الافتتاحية: string;
  الكلمات_الختامية: string;
  مسار_الملف: string;
  نوع_الملف: string;
  عدد_الصفحات: number;
  معرف_الشخص: number | '';
  معرف_المرأة: number | '';
  معرف_الحدث: number | '';
  معرف_المكان: number | '';
  تاريخ_الكتابة: string;
  مكان_الكتابة_النصي: string;
  المناسبة: string;
  الكاتب_الأصلي: string;
  المستقبل: string;
  اللغة: string;
  اللهجة: string;
  الخط_المستخدم: string;
  الكلمات_المفتاحية: string;
  الشخصيات_المذكورة: string;
  الأماكن_المذكورة: string;
  التواريخ_المذكورة: string;
  أهمية_النص: 'عالية' | 'متوسطة' | 'عادية';
  مستوى_الوضوح: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  حالة_الحفظ: 'ممتازة' | 'جيدة' | 'متوسطة' | 'تحتاج_ترميم';
  حالة_الخط: 'واضح' | 'متوسط' | 'صعب_القراءة' | 'يحتاج_تفريغ';
  مستوى_الصحة: 'موثق' | 'محتمل' | 'يحتاج_تحقق' | 'مشكوك';
  مصدر_النص: string;
  طريقة_الحصول: string;
  المالك_الأصلي: string;
  حالة_النسخ: 'أصلي' | 'نسخة' | 'نسخة_مصورة' | 'مفرغ_نصياً';
  مفرغ_بواسطة: string;
  تاريخ_التفريغ: string;
  ملاحظات_التفريغ: string;
  صورة_الغلاف: string;
  صور_إضافية: string;
  صورة_صاحب_النص: string;
  هو_عام: boolean;
  كلمة_مرور: string;
  مستوى_الخصوصية: 'عام' | 'عائلة' | 'خاص' | 'سري';
  رقم_الأرشيف: string;
  موقع_الحفظ: string;
  مدخل_البيانات: string;
  ملاحظات_أرشيفية: string;
  العبرة_أو_الفائدة: string;
  ملاحظات_عامة: string;
}

interface TextDocumentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Woman {
  id: number;
  الاسم_الأول: string;
  اسم_الأب?: string;
  اسم_العائلة?: string;
}

interface Event {
  معرف_الحدث: number;
  عنوان_الحدث: string;
  نوع_الحدث: string;
}

export default function TextDocumentForm({ onSuccess, onCancel }: TextDocumentFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [women, setWomen] = useState<Woman[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TextDocumentFormData>({
    defaultValues: {
      نوع_الملف: 'pdf',
      اللغة: 'العربية',
      أهمية_النص: 'متوسطة',
      مستوى_الوضوح: 'جيد',
      حالة_الحفظ: 'جيدة',
      حالة_الخط: 'واضح',
      مستوى_الصحة: 'موثق',
      حالة_النسخ: 'أصلي',
      هو_عام: false,
      مستوى_الخصوصية: 'عائلة'
    }
  });

  const watchTextType = watch('نوع_النص');
  const watchFullText = watch('النص_الكامل');
  const watchPrivacyLevel = watch('مستوى_الخصوصية');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-calculate word count and extract first/last words
  useEffect(() => {
    if (watchFullText) {
      // Extract first 100 characters for opening words if not already set
      if (!watch('الكلمات_الافتتاحية')) {
        setValue('الكلمات_الافتتاحية', watchFullText.substring(0, 100));
      }
      
      // Extract last 100 characters for closing words if not already set
      if (!watch('الكلمات_الختامية')) {
        setValue('الكلمات_الختامية', watchFullText.substring(Math.max(0, watchFullText.length - 100)));
      }
    }
  }, [watchFullText, setValue, watch]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locationsData, personsData] = await Promise.all([
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getPersonsWithDetails()
      ]);
      
      setLocations(locationsData);
      setPersons(personsData);
      
      // Load women and events
      if (supabase) {
        const [womenResponse, eventsResponse] = await Promise.all([
          supabase
            .from('النساء')
            .select('id, الاسم_الأول, اسم_الأب, اسم_العائلة')
            .order('الاسم_الأول'),
          supabase
            .from('الأحداث')
            .select('معرف_الحدث, عنوان_الحدث, نوع_الحدث')
            .order('تاريخ_الحدث', { ascending: false })
        ]);
        
        if (!womenResponse.error && womenResponse.data) {
          setWomen(womenResponse.data);
        }
        
        if (!eventsResponse.error && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TextDocumentFormData) => {
    setIsSubmitting(true);
    try {
      // Convert keywords, people, places, and dates to arrays
      const keywords = data.الكلمات_المفتاحية.split(',').map(k => k.trim()).filter(k => k);
      const people = data.الشخصيات_المذكورة.split(',').map(p => p.trim()).filter(p => p);
      const places = data.الأماكن_المذكورة.split(',').map(p => p.trim()).filter(p => p);
      const dates = data.التواريخ_المذكورة.split(',').map(d => d.trim()).filter(d => d);
      const additionalImages = data.صور_إضافية.split(',').map(i => i.trim()).filter(i => i);
      
      // Calculate word count
      const wordCount = data.النص_الكامل.split(/\s+/).filter(word => word.length > 0).length;
      
      const textDocumentData = {
        عنوان_النص: data.عنوان_النص,
        وصف_النص: data.وصف_النص || undefined,
        نوع_النص: data.نوع_النص,
        النص_الكامل: data.النص_الكامل,
        ملخص_النص: data.ملخص_النص || undefined,
        الكلمات_الافتتاحية: data.الكلمات_الافتتاحية || undefined,
        الكلمات_الختامية: data.الكلمات_الختامية || undefined,
        مسار_الملف: data.مسار_الملف || undefined,
        نوع_الملف: data.نوع_الملف || undefined,
        عدد_الصفحات: data.عدد_الصفحات || undefined,
        عدد_الكلمات: wordCount,
        معرف_الشخص: data.معرف_الشخص || undefined,
        معرف_المرأة: data.معرف_المرأة || undefined,
        معرف_الحدث: data.معرف_الحدث || undefined,
        معرف_المكان: data.معرف_المكان || undefined,
        تاريخ_الكتابة: data.تاريخ_الكتابة || undefined,
        مكان_الكتابة_النصي: data.مكان_الكتابة_النصي || undefined,
        المناسبة: data.المناسبة || undefined,
        الكاتب_الأصلي: data.الكاتب_الأصلي || undefined,
        المستقبل: data.المستقبل || undefined,
        اللغة: data.اللغة,
        اللهجة: data.اللهجة || undefined,
        الخط_المستخدم: data.الخط_المستخدم || undefined,
        الكلمات_المفتاحية: keywords.length > 0 ? keywords : undefined,
        الشخصيات_المذكورة: people.length > 0 ? people : undefined,
        الأماكن_المذكورة: places.length > 0 ? places : undefined,
        التواريخ_المذكورة: dates.length > 0 ? dates : undefined,
        أهمية_النص: data.أهمية_النص,
        مستوى_الوضوح: data.مستوى_الوضوح,
        حالة_الحفظ: data.حالة_الحفظ,
        حالة_الخط: data.حالة_الخط,
        مستوى_الصحة: data.مستوى_الصحة,
        مصدر_النص: data.مصدر_النص || undefined,
        طريقة_الحصول: data.طريقة_الحصول || undefined,
        المالك_الأصلي: data.المالك_الأصلي || undefined,
        حالة_النسخ: data.حالة_النسخ,
        مفرغ_بواسطة: data.مفرغ_بواسطة || undefined,
        تاريخ_التفريغ: data.تاريخ_التفريغ || undefined,
        ملاحظات_التفريغ: data.ملاحظات_التفريغ || undefined,
        صورة_الغلاف: data.صورة_الغلاف || undefined,
        صور_إضافية: additionalImages.length > 0 ? additionalImages : undefined,
        صورة_صاحب_النص: data.صورة_صاحب_النص || undefined,
        هو_عام: data.هو_عام,
        كلمة_مرور: data.كلمة_مرور || undefined,
        مستوى_الخصوصية: data.مستوى_الخصوصية,
        رقم_الأرشيف: data.رقم_الأرشيف || undefined,
        موقع_الحفظ: data.موقع_الحفظ || undefined,
        مدخل_البيانات: data.مدخل_البيانات || undefined,
        ملاحظات_أرشيفية: data.ملاحظات_أرشيفية || undefined,
        العبرة_أو_الفائدة: data.العبرة_أو_الفائدة || undefined,
        ملاحظات_عامة: data.ملاحظات_عامة || undefined
      };

      if (supabase) {
        const { error } = await supabase
          .from('النصوص_والوثائق')
          .insert([textDocumentData]);
        
        if (error) throw error;
      } else {
        throw new Error('Supabase client not initialized');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving text document:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: <FileText className="w-4 h-4" /> },
    { id: 'content', label: 'المحتوى', icon: <Book className="w-4 h-4" /> },
    { id: 'metadata', label: 'البيانات الوصفية', icon: <Tag className="w-4 h-4" /> },
    { id: 'quality', label: 'الجودة والتوثيق', icon: <Star className="w-4 h-4" /> },
    { id: 'privacy', label: 'الخصوصية والأرشفة', icon: <Lock className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  إضافة نص أو وثيقة جديدة
                </h1>
                <p className="text-gray-600">توثيق نص مكتوب أو وثيقة للأرشيف العائلي</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6">
              <h2 className="text-2xl font-bold text-white">معلومات النص أو الوثيقة</h2>
              <p className="text-teal-100 mt-2">أدخل تفاصيل النص المكتوب أو الوثيقة</p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg mr-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-100 text-teal-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        عنوان النص *
                      </label>
                      <input
                        {...register('عنوان_النص', { required: 'عنوان النص مطلوب' })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل عنواناً وصفياً للنص"
                      />
                      {errors.عنوان_النص && (
                        <p className="text-red-500 text-sm">{errors.عنوان_النص.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        نوع النص *
                      </label>
                      <select
                        {...register('نوع_النص', { required: 'نوع النص مطلوب' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="">اختر نوع النص</option>
                        <option value="قصة_مكتوبة">قصة مكتوبة</option>
                        <option value="شعر_ونثر">شعر ونثر</option>
                        <option value="مذكرات_شخصية">مذكرات شخصية</option>
                        <option value="رسائل_شخصية">رسائل شخصية</option>
                        <option value="وثيقة_رسمية">وثيقة رسمية</option>
                        <option value="عقد_واتفاقية">عقد واتفاقية</option>
                        <option value="شهادة_ومؤهل">شهادة ومؤهل</option>
                        <option value="تقرير_طبي">تقرير طبي</option>
                        <option value="كتاب_ومؤلف">كتاب ومؤلف</option>
                        <option value="مقال_ومحاضرة">مقال ومحاضرة</option>
                        <option value="فتوى_ونصيحة">فتوى ونصيحة</option>
                        <option value="وصية_ووقف">وصية ووقف</option>
                        <option value="نسب_وشجرة">نسب وشجرة</option>
                        <option value="تاريخ_وأحداث">تاريخ وأحداث</option>
                        <option value="تعليم_وحكم">تعليم وحكم</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                      {errors.نوع_النص && (
                        <p className="text-red-500 text-sm">{errors.نوع_النص.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      وصف النص
                    </label>
                    <textarea
                      {...register('وصف_النص')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="أدخل وصفاً تفصيلياً للنص أو الوثيقة"
                    />
                  </div>

                  {/* Related Entities */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      الارتباطات
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          الكاتب (رجل)
                        </label>
                        <select
                          {...register('معرف_الشخص')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">اختر الكاتب</option>
                          {persons.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.الاسم_الكامل}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          الكاتبة (امرأة)
                        </label>
                        <select
                          {...register('معرف_المرأة')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">اختر الكاتبة</option>
                          {women.map((woman) => (
                            <option key={woman.id} value={woman.id}>
                              {woman.الاسم_الأول} {woman.اسم_الأب || ''} {woman.اسم_العائلة || ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4" />
                          الحدث المرتبط
                        </label>
                        <select
                          {...register('معرف_الحدث')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">اختر الحدث المرتبط</option>
                          {events.map((event) => (
                            <option key={event.معرف_الحدث} value={event.معرف_الحدث}>
                              {event.عنوان_الحدث} ({event.نوع_الحدث})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4" />
                          مكان الكتابة
                        </label>
                        <select
                          {...register('معرف_المكان')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">اختر مكان الكتابة</option>
                          {locations.map((location) => (
                            <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                              {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Writing Details */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      تفاصيل الكتابة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4" />
                          تاريخ الكتابة
                        </label>
                        <input
                          {...register('تاريخ_الكتابة')}
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4" />
                          مكان الكتابة (نصي)
                        </label>
                        <input
                          {...register('مكان_الكتابة_النصي')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل وصفاً لمكان الكتابة"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4" />
                          المناسبة
                        </label>
                        <input
                          {...register('المناسبة')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل مناسبة كتابة النص"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          الكاتب الأصلي (نصي)
                        </label>
                        <input
                          {...register('الكاتب_الأصلي')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل اسم الكاتب الأصلي"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          المستقبل
                        </label>
                        <input
                          {...register('المستقبل')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل اسم مستقبل النص (إن وجد)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      معلومات الملف
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <FileText className="w-4 h-4" />
                          مسار الملف
                        </label>
                        <input
                          {...register('مسار_الملف')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل رابط أو مسار الملف"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <FileText className="w-4 h-4" />
                          نوع الملف
                        </label>
                        <select
                          {...register('نوع_الملف')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">DOC</option>
                          <option value="docx">DOCX</option>
                          <option value="txt">TXT</option>
                          <option value="jpg">JPG</option>
                          <option value="png">PNG</option>
                          <option value="tiff">TIFF</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <FileText className="w-4 h-4" />
                          عدد الصفحات
                        </label>
                        <input
                          {...register('عدد_الصفحات', { valueAsNumber: true })}
                          type="number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل عدد صفحات الوثيقة"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      النص الكامل *
                    </label>
                    <textarea
                      {...register('النص_الكامل', { required: 'النص الكامل مطلوب' })}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="أدخل النص الكامل للوثيقة"
                    />
                    {errors.النص_الكامل && (
                      <p className="text-red-500 text-sm">{errors.النص_الكامل.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      ملخص النص
                    </label>
                    <textarea
                      {...register('ملخص_النص')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="أدخل ملخصاً للنص"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        الكلمات الافتتاحية
                      </label>
                      <textarea
                        {...register('الكلمات_الافتتاحية')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                        placeholder="أدخل الكلمات الافتتاحية للنص"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        الكلمات الختامية
                      </label>
                      <textarea
                        {...register('الكلمات_الختامية')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                        placeholder="أدخل الكلمات الختامية للنص"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      العبرة أو الفائدة
                    </label>
                    <textarea
                      {...register('العبرة_أو_الفائدة')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                      placeholder="أدخل العبرة أو الفائدة المستخلصة من النص"
                    />
                  </div>
                </div>
              )}

              {/* Metadata Tab */}
              {activeTab === 'metadata' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        اللغة
                      </label>
                      <input
                        {...register('اللغة')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل لغة النص"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        اللهجة
                      </label>
                      <input
                        {...register('اللهجة')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل اللهجة (مثل: نجدية، حجازية، فصحى)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        الخط المستخدم
                      </label>
                      <input
                        {...register('الخط_المستخدم')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل نوع الخط المستخدم (مثل: نسخ، رقعة، ديواني)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag className="w-4 h-4" />
                      الكلمات المفتاحية (مفصولة بفواصل)
                    </label>
                    <input
                      {...register('الكلمات_المفتاحية')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="أدخل الكلمات المفتاحية مفصولة بفواصل"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4" />
                        الشخصيات المذكورة (مفصولة بفواصل)
                      </label>
                      <input
                        {...register('الشخصيات_المذكورة')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل أسماء الشخصيات المذكورة مفصولة بفواصل"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="w-4 h-4" />
                        الأماكن المذكورة (مفصولة بفواصل)
                      </label>
                      <input
                        {...register('الأماكن_المذكورة')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل أسماء الأماكن المذكورة مفصولة بفواصل"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4" />
                        التواريخ المذكورة (مفصولة بفواصل)
                      </label>
                      <input
                        {...register('التواريخ_المذكورة')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل التواريخ المذكورة مفصولة بفواصل"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        صورة الغلاف
                      </label>
                      <input
                        {...register('صورة_الغلاف')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل رابط صورة الغلاف"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        صور إضافية (مفصولة بفواصل)
                      </label>
                      <input
                        {...register('صور_إضافية')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل روابط الصور الإضافية مفصولة بفواصل"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4" />
                        صورة صاحب النص
                      </label>
                      <input
                        {...register('صورة_صاحب_النص')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل رابط صورة صاحب النص"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quality and Documentation Tab */}
              {activeTab === 'quality' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Star className="w-4 h-4" />
                        أهمية النص
                      </label>
                      <select
                        {...register('أهمية_النص')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="عادية">عادية</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="عالية">عالية</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        مستوى الوضوح
                      </label>
                      <select
                        {...register('مستوى_الوضوح')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="ممتاز">ممتاز</option>
                        <option value="جيد">جيد</option>
                        <option value="متوسط">متوسط</option>
                        <option value="ضعيف">ضعيف</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        حالة الحفظ
                      </label>
                      <select
                        {...register('حالة_الحفظ')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="ممتازة">ممتازة</option>
                        <option value="جيدة">جيدة</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="تحتاج_ترميم">تحتاج ترميم</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        حالة الخط
                      </label>
                      <select
                        {...register('حالة_الخط')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="واضح">واضح</option>
                        <option value="متوسط">متوسط</option>
                        <option value="صعب_القراءة">صعب القراءة</option>
                        <option value="يحتاج_تفريغ">يحتاج تفريغ</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        مستوى الصحة
                      </label>
                      <select
                        {...register('مستوى_الصحة')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="موثق">موثق</option>
                        <option value="محتمل">محتمل</option>
                        <option value="يحتاج_تحقق">يحتاج تحقق</option>
                        <option value="مشكوك">مشكوك</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        حالة النسخ
                      </label>
                      <select
                        {...register('حالة_النسخ')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="أصلي">أصلي</option>
                        <option value="نسخة">نسخة</option>
                        <option value="نسخة_مصورة">نسخة مصورة</option>
                        <option value="مفرغ_نصياً">مفرغ نصياً</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        مصدر النص
                      </label>
                      <input
                        {...register('مصدر_النص')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل مصدر النص (مثل: أرشيف العائلة، مكتبة خاصة)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        طريقة الحصول
                      </label>
                      <input
                        {...register('طريقة_الحصول')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل طريقة الحصول على النص (مثل: وراثة، شراء، إهداء)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4" />
                        المالك الأصلي
                      </label>
                      <input
                        {...register('المالك_الأصلي')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل اسم المالك الأصلي للنص"
                      />
                    </div>
                  </div>

                  {/* Transcription Information */}
                  {watch('حالة_النسخ') === 'مفرغ_نصياً' && (
                    <div className="space-y-6 bg-teal-50 p-4 rounded-xl border border-teal-200">
                      <h4 className="font-medium text-teal-800">معلومات التفريغ</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            مفرغ بواسطة
                          </label>
                          <input
                            {...register('مفرغ_بواسطة')}
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                            placeholder="أدخل اسم الشخص الذي قام بالتفريغ"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar className="w-4 h-4" />
                            تاريخ التفريغ
                          </label>
                          <input
                            {...register('تاريخ_التفريغ')}
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FileText className="w-4 h-4" />
                            ملاحظات التفريغ
                          </label>
                          <textarea
                            {...register('ملاحظات_التفريغ')}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                            placeholder="أدخل ملاحظات حول عملية التفريغ"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy and Archiving Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Lock className="w-4 h-4" />
                        مستوى الخصوصية
                      </label>
                      <select
                        {...register('مستوى_الخصوصية')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      >
                        <option value="عائلة">عائلة (للعائلة فقط)</option>
                        <option value="عام">عام (للجميع)</option>
                        <option value="خاص">خاص (محدود)</option>
                        <option value="سري">سري (سري جداً)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Globe className="w-4 h-4" />
                        حالة النص
                      </label>
                      <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            {...register('هو_عام')}
                            type="checkbox"
                            className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                          />
                          <div>
                            <span className="font-medium text-gray-700">نص عام</span>
                            <p className="text-sm text-gray-500">حدد هذا الخيار إذا كان النص متاحاً للجميع</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {watchPrivacyLevel === 'خاص' || watchPrivacyLevel === 'سري' ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Lock className="w-4 h-4" />
                        كلمة مرور
                      </label>
                      <input
                        {...register('كلمة_مرور')}
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="أدخل كلمة مرور للنص (اختياري)"
                      />
                      <p className="text-sm text-gray-500">
                        إذا تم تعيين كلمة مرور، سيحتاج المستخدمون إلى إدخالها للوصول إلى النص
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      معلومات الأرشفة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <FileText className="w-4 h-4" />
                          رقم الأرشيف
                        </label>
                        <input
                          {...register('رقم_الأرشيف')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل رقم تصنيف النص في نظام الأرشفة"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4" />
                          موقع الحفظ
                        </label>
                        <input
                          {...register('موقع_الحفظ')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل موقع حفظ النسخة الأصلية"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          مدخل البيانات
                        </label>
                        <input
                          {...register('مدخل_البيانات')}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="أدخل اسم الشخص الذي أدخل البيانات"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        ملاحظات أرشيفية
                      </label>
                      <textarea
                        {...register('ملاحظات_أرشيفية')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                        placeholder="أدخل ملاحظات أرشيفية إضافية"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        ملاحظات عامة
                      </label>
                      <textarea
                        {...register('ملاحظات_عامة')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
                        placeholder="أدخل أي ملاحظات عامة إضافية"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-8 py-6 flex justify-between">
              <div className="flex gap-2">
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    السابق
                  </button>
                )}
                
                {activeTab !== 'privacy' && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1].id);
                      }
                    }}
                    className="px-4 py-2 text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    التالي
                  </button>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ النص
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}