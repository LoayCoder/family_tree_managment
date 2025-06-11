import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Volume2, Save, X, MapPin, Calendar, FileText, User, Star, Clock, Music, Tag, Mic, Globe } from 'lucide-react';
import { arabicFamilyService, Location, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';

interface AudioFileFormData {
  عنوان_التسجيل: string;
  وصف_التسجيل: string;
  نوع_التسجيل: string;
  مسار_الملف: string;
  نوع_الملف: string;
  حجم_الملف?: number;
  مدة_التسجيل_دقائق: number;
  مدة_التسجيل_ثواني: number;
  جودة_التسجيل: string;
  معرف_الشخص: number | '';
  معرف_المرأة: number | '';
  معرف_الحدث: number | '';
  معرف_المكان: number | '';
  تاريخ_التسجيل: string;
  مكان_التسجيل_النصي: string;
  المناسبة: string;
  الحضور: string;
  اللغة: string;
  اللهجة: string;
  الكلمات_المفتاحية: string;
  النص_المكتوب: string;
  ملخص_المحتوى: string;
  الشخصيات_المذكورة: string;
  الأماكن_المذكورة: string;
  أهمية_التسجيل: 'عالية' | 'متوسطة' | 'عادية';
  مستوى_الوضوح: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  حالة_الحفظ: 'ممتازة' | 'جيدة' | 'متوسطة' | 'تحتاج_ترميم';
  مصدر_التسجيل: string;
  هو_عام: boolean;
  كلمة_مرور?: string;
}

interface AudioFileFormProps {
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

export default function AudioFileForm({ onSuccess, onCancel }: AudioFileFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [women, setWomen] = useState<Woman[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AudioFileFormData>({
    defaultValues: {
      نوع_الملف: 'mp3',
      جودة_التسجيل: 'متوسطة',
      اللغة: 'العربية',
      أهمية_التسجيل: 'متوسطة',
      مستوى_الوضوح: 'جيد',
      حالة_الحفظ: 'جيدة',
      هو_عام: false
    }
  });

  const watchIsPublic = watch('هو_عام');

  useEffect(() => {
    loadInitialData();
  }, []);

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

  const onSubmit = async (data: AudioFileFormData) => {
    setIsSubmitting(true);
    try {
      // Convert minutes and seconds to interval format
      const minutes = parseInt(data.مدة_التسجيل_دقائق.toString()) || 0;
      const seconds = parseInt(data.مدة_التسجيل_ثواني.toString()) || 0;
      const totalSeconds = minutes * 60 + seconds;
      
      // Convert keywords, people, and places to arrays
      const keywords = data.الكلمات_المفتاحية.split(',').map(k => k.trim()).filter(k => k);
      const people = data.الشخصيات_المذكورة.split(',').map(p => p.trim()).filter(p => p);
      const places = data.الأماكن_المذكورة.split(',').map(p => p.trim()).filter(p => p);
      const attendees = data.الحضور.split(',').map(a => a.trim()).filter(a => a);
      
      const audioFileData = {
        عنوان_التسجيل: data.عنوان_التسجيل,
        وصف_التسجيل: data.وصف_التسجيل || undefined,
        نوع_التسجيل: data.نوع_التسجيل,
        مسار_الملف: data.مسار_الملف,
        نوع_الملف: data.نوع_الملف,
        حجم_الملف: data.حجم_الملف || undefined,
        مدة_التسجيل: `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`,
        جودة_التسجيل: data.جودة_التسجيل,
        معرف_الشخص: data.معرف_الشخص || undefined,
        معرف_المرأة: data.معرف_المرأة || undefined,
        معرف_الحدث: data.معرف_الحدث || undefined,
        معرف_المكان: data.معرف_المكان || undefined,
        تاريخ_التسجيل: data.تاريخ_التسجيل || undefined,
        مكان_التسجيل_النصي: data.مكان_التسجيل_النصي || undefined,
        المناسبة: data.المناسبة || undefined,
        الحضور: attendees.length > 0 ? attendees : undefined,
        اللغة: data.اللغة,
        اللهجة: data.اللهجة || undefined,
        الكلمات_المفتاحية: keywords.length > 0 ? keywords : undefined,
        النص_المكتوب: data.النص_المكتوب || undefined,
        ملخص_المحتوى: data.ملخص_المحتوى || undefined,
        الشخصيات_المذكورة: people.length > 0 ? people : undefined,
        الأماكن_المذكورة: places.length > 0 ? places : undefined,
        أهمية_التسجيل: data.أهمية_التسجيل,
        مستوى_الوضوح: data.مستوى_الوضوح,
        حالة_الحفظ: data.حالة_الحفظ,
        مصدر_التسجيل: data.مصدر_التسجيل || undefined,
        هو_عام: data.هو_عام,
        كلمة_مرور: data.كلمة_مرور || undefined
      };

      if (supabase) {
        const { error } = await supabase
          .from('الملفات_الصوتية')
          .insert([audioFileData]);
        
        if (error) throw error;
      } else {
        throw new Error('Supabase client not initialized');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving audio file:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  إضافة ملف صوتي جديد
                </h1>
                <p className="text-gray-600">توثيق تسجيل صوتي للأرشيف العائلي</p>
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
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6">
              <h2 className="text-2xl font-bold text-white">معلومات الملف الصوتي</h2>
              <p className="text-indigo-100 mt-2">أدخل تفاصيل التسجيل الصوتي</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      عنوان التسجيل *
                    </label>
                    <input
                      {...register('عنوان_التسجيل', { required: 'عنوان التسجيل مطلوب' })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل عنواناً وصفياً للتسجيل"
                    />
                    {errors.عنوان_التسجيل && (
                      <p className="text-red-500 text-sm">{errors.عنوان_التسجيل.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Music className="w-4 h-4" />
                      نوع التسجيل *
                    </label>
                    <select
                      {...register('نوع_التسجيل', { required: 'نوع التسجيل مطلوب' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">اختر نوع التسجيل</option>
                      <option value="مقابلة_شخصية">مقابلة شخصية</option>
                      <option value="قصة_شفهية">قصة شفهية</option>
                      <option value="شعر_وأدب">شعر وأدب</option>
                      <option value="أناشيد_تراثية">أناشيد تراثية</option>
                      <option value="أذان_ودعاء">أذان ودعاء</option>
                      <option value="احتفال_ومناسبة">احتفال ومناسبة</option>
                      <option value="تعليم_وحكم">تعليم وحكم</option>
                      <option value="أخبار_وأحداث">أخبار وأحداث</option>
                      <option value="مكالمة_هاتفية">مكالمة هاتفية</option>
                      <option value="خطبة_ومحاضرة">خطبة ومحاضرة</option>
                      <option value="تلاوة_قرآن">تلاوة قرآن</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                    {errors.نوع_التسجيل && (
                      <p className="text-red-500 text-sm">{errors.نوع_التسجيل.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    وصف التسجيل
                  </label>
                  <textarea
                    {...register('وصف_التسجيل')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="أدخل وصفاً تفصيلياً للتسجيل الصوتي"
                  />
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
                      مسار الملف *
                    </label>
                    <input
                      {...register('مسار_الملف', { required: 'مسار الملف مطلوب' })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل رابط أو مسار الملف"
                    />
                    {errors.مسار_الملف && (
                      <p className="text-red-500 text-sm">{errors.مسار_الملف.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      نوع الملف
                    </label>
                    <select
                      {...register('نوع_الملف')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="mp3">MP3</option>
                      <option value="wav">WAV</option>
                      <option value="ogg">OGG</option>
                      <option value="m4a">M4A</option>
                      <option value="aac">AAC</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      حجم الملف (بالبايت)
                    </label>
                    <input
                      {...register('حجم_الملف', { valueAsNumber: true })}
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل حجم الملف بالبايت"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      مدة التسجيل
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <input
                            {...register('مدة_التسجيل_دقائق', { valueAsNumber: true })}
                            type="number"
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-r-none rounded-l-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="الدقائق"
                          />
                          <div className="bg-gray-100 px-4 py-3 border-y border-r border-gray-300 rounded-l-none rounded-r-xl text-gray-500">
                            دقيقة
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <input
                            {...register('مدة_التسجيل_ثواني', { valueAsNumber: true })}
                            type="number"
                            min="0"
                            max="59"
                            className="w-full px-4 py-3 border border-gray-300 rounded-r-none rounded-l-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="الثواني"
                          />
                          <div className="bg-gray-100 px-4 py-3 border-y border-r border-gray-300 rounded-l-none rounded-r-xl text-gray-500">
                            ثانية
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Star className="w-4 h-4" />
                      جودة التسجيل
                    </label>
                    <select
                      {...register('جودة_التسجيل')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="عالية">عالية</option>
                      <option value="متوسطة">متوسطة</option>
                      <option value="منخفضة">منخفضة</option>
                    </select>
                  </div>
                </div>
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
                      الشخص المتحدث (رجل)
                    </label>
                    <select
                      {...register('معرف_الشخص')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">اختر الشخص المتحدث</option>
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
                      المرأة المتحدثة
                    </label>
                    <select
                      {...register('معرف_المرأة')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">اختر المرأة المتحدثة</option>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                      مكان التسجيل
                    </label>
                    <select
                      {...register('معرف_المكان')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">اختر مكان التسجيل</option>
                      {locations.map((location) => (
                        <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                          {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Recording Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  تفاصيل التسجيل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      تاريخ التسجيل
                    </label>
                    <input
                      {...register('تاريخ_التسجيل')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      مكان التسجيل (نصي)
                    </label>
                    <input
                      {...register('مكان_التسجيل_النصي')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل وصفاً لمكان التسجيل"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل مناسبة التسجيل"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الحضور (مفصولين بفواصل)
                    </label>
                    <input
                      {...register('الحضور')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل أسماء الحاضرين مفصولة بفواصل"
                    />
                  </div>
                </div>
              </div>

              {/* Language and Content */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  اللغة والمحتوى
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      اللغة
                    </label>
                    <input
                      {...register('اللغة')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل لغة التسجيل"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل اللهجة (مثل: نجدية، حجازية، خليجية)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag className="w-4 h-4" />
                      الكلمات المفتاحية (مفصولة بفواصل)
                    </label>
                    <input
                      {...register('الكلمات_المفتاحية')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل الكلمات المفتاحية مفصولة بفواصل"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الشخصيات المذكورة (مفصولة بفواصل)
                    </label>
                    <input
                      {...register('الشخصيات_المذكورة')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل أسماء الأماكن المذكورة مفصولة بفواصل"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Mic className="w-4 h-4" />
                      مصدر التسجيل
                    </label>
                    <input
                      {...register('مصدر_التسجيل')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="أدخل مصدر التسجيل (مثل: تسجيل مباشر، مؤرشف من كاسيت)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    ملخص المحتوى
                  </label>
                  <textarea
                    {...register('ملخص_المحتوى')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="أدخل ملخصاً لمحتوى التسجيل"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    النص المكتوب (transcript)
                  </label>
                  <textarea
                    {...register('النص_المكتوب')}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="أدخل النص المكتوب للتسجيل الصوتي (اختياري)"
                  />
                </div>
              </div>

              {/* Quality and Importance */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  الجودة والأهمية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Star className="w-4 h-4" />
                      أهمية التسجيل
                    </label>
                    <select
                      {...register('أهمية_التسجيل')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="ممتازة">ممتازة</option>
                      <option value="جيدة">جيدة</option>
                      <option value="متوسطة">متوسطة</option>
                      <option value="تحتاج_ترميم">تحتاج ترميم</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  إعدادات الخصوصية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Globe className="w-4 h-4" />
                      حالة التسجيل
                    </label>
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          {...register('هو_عام')}
                          type="checkbox"
                          className="w-5 h-5 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-medium text-gray-700">تسجيل عام</span>
                          <p className="text-sm text-gray-500">حدد هذا الخيار إذا كان التسجيل متاحاً للجميع</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {!watchIsPublic && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="w-4 h-4" />
                        كلمة مرور (اختياري)
                      </label>
                      <input
                        {...register('كلمة_مرور')}
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="أدخل كلمة مرور للتسجيل (اختياري)"
                      />
                      <p className="text-sm text-gray-500">
                        إذا تم تعيين كلمة مرور، سيحتاج المستخدمون إلى إدخالها للوصول إلى التسجيل
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4">
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
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ الملف الصوتي
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}