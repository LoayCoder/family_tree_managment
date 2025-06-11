import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Save, X, MapPin, FileText, User, Star, Globe } from 'lucide-react';
import { arabicFamilyService, Location, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';

interface EventFormData {
  معرف_الشخص: number | '';
  معرف_المرأة: number | '';
  نوع_الحدث: string;
  عنوان_الحدث: string;
  وصف_الحدث: string;
  تاريخ_الحدث: string;
  مكان_الحدث: number | '';
  أهمية_الحدث: 'عالية' | 'متوسطة' | 'عادية';
  هو_عام: boolean;
}

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Woman {
  id: number;
  الاسم_الأول: string;
  اسم_الأب?: string;
  اسم_العائلة?: string;
}

export default function EventForm({ onSuccess, onCancel }: EventFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [women, setWomen] = useState<Woman[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      أهمية_الحدث: 'عادية',
      هو_عام: false
    }
  });

  const watchEventType = watch('نوع_الحدث');
  const watchPersonId = watch('معرف_الشخص');
  const watchWomanId = watch('معرف_المرأة');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Clear the other person field when one is selected
  useEffect(() => {
    if (watchPersonId && watchPersonId !== '') {
      setValue('معرف_المرأة', '');
    }
  }, [watchPersonId, setValue]);

  useEffect(() => {
    if (watchWomanId && watchWomanId !== '') {
      setValue('معرف_الشخص', '');
    }
  }, [watchWomanId, setValue]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locationsData, personsData] = await Promise.all([
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getPersonsWithDetails()
      ]);
      
      setLocations(locationsData);
      setPersons(personsData);
      
      // Load women
      if (supabase) {
        const { data: womenData, error } = await supabase
          .from('النساء')
          .select('id, الاسم_الأول, اسم_الأب, اسم_العائلة')
          .order('الاسم_الأول');
        
        if (!error && womenData) {
          setWomen(womenData);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      if (!data.معرف_الشخص && !data.معرف_المرأة) {
        alert('يجب اختيار شخص أو امرأة مرتبطة بالحدث');
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        معرف_الشخص: data.معرف_الشخص || undefined,
        معرف_المرأة: data.معرف_المرأة || undefined,
        نوع_الحدث: data.نوع_الحدث,
        عنوان_الحدث: data.عنوان_الحدث,
        وصف_الحدث: data.وصف_الحدث || undefined,
        تاريخ_الحدث: data.تاريخ_الحدث,
        مكان_الحدث: data.مكان_الحدث || undefined,
        أهمية_الحدث: data.أهمية_الحدث,
        هو_عام: data.هو_عام
      };

      if (supabase) {
        const { error } = await supabase
          .from('الأحداث')
          .insert([eventData]);
        
        if (error) throw error;
      } else {
        throw new Error('Supabase client not initialized');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  إضافة حدث جديد
                </h1>
                <p className="text-gray-600">توثيق حدث مهم في تاريخ العائلة</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <h2 className="text-2xl font-bold text-white">معلومات الحدث</h2>
              <p className="text-orange-100 mt-2">أدخل تفاصيل الحدث المراد توثيقه</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Event Type and Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4" />
                    نوع الحدث *
                  </label>
                  <select
                    {...register('نوع_الحدث', { required: 'نوع الحدث مطلوب' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="">اختر نوع الحدث</option>
                    <option value="ميلاد">ميلاد</option>
                    <option value="وفاة">وفاة</option>
                    <option value="زواج">زواج</option>
                    <option value="طلاق">طلاق</option>
                    <option value="تخرج">تخرج</option>
                    <option value="ترقية">ترقية</option>
                    <option value="انتقال">انتقال</option>
                    <option value="إنجاز">إنجاز</option>
                    <option value="حج">حج</option>
                    <option value="عمرة">عمرة</option>
                    <option value="سفر">سفر</option>
                    <option value="مرض">مرض</option>
                    <option value="شفاء">شفاء</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  {errors.نوع_الحدث && (
                    <p className="text-red-500 text-sm">{errors.نوع_الحدث.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    عنوان الحدث *
                  </label>
                  <input
                    {...register('عنوان_الحدث', { required: 'عنوان الحدث مطلوب' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="أدخل عنواناً وصفياً للحدث"
                  />
                  {errors.عنوان_الحدث && (
                    <p className="text-red-500 text-sm">{errors.عنوان_الحدث.message}</p>
                  )}
                </div>
              </div>

              {/* Related Person */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  الشخص المرتبط بالحدث
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الشخص (رجل)
                    </label>
                    <select
                      {...register('معرف_الشخص')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="">اختر الشخص</option>
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
                      المرأة
                    </label>
                    <select
                      {...register('معرف_المرأة')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="">اختر المرأة</option>
                      {women.map((woman) => (
                        <option key={woman.id} value={woman.id}>
                          {woman.الاسم_الأول} {woman.اسم_الأب || ''} {woman.اسم_العائلة || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p>يجب اختيار شخص أو امرأة واحدة على الأقل مرتبطة بالحدث</p>
                </div>
              </div>

              {/* Date and Location */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  تاريخ ومكان الحدث
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      تاريخ الحدث *
                    </label>
                    <input
                      {...register('تاريخ_الحدث', { required: 'تاريخ الحدث مطلوب' })}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                    {errors.تاريخ_الحدث && (
                      <p className="text-red-500 text-sm">{errors.تاريخ_الحدث.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      مكان الحدث
                    </label>
                    <select
                      {...register('مكان_الحدث')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="">اختر مكان الحدث</option>
                      {locations.map((location) => (
                        <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                          {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  وصف الحدث
                </label>
                <textarea
                  {...register('وصف_الحدث')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  placeholder="أدخل وصفاً تفصيلياً للحدث"
                />
              </div>

              {/* Importance and Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Star className="w-4 h-4" />
                    أهمية الحدث
                  </label>
                  <select
                    {...register('أهمية_الحدث')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="عادية">عادية</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="عالية">عالية</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4" />
                    حالة الحدث
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        {...register('هو_عام')}
                        type="checkbox"
                        className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <span className="font-medium text-gray-700">حدث عام</span>
                        <p className="text-sm text-gray-500">حدد هذا الخيار إذا كان الحدث عاماً ومتاحاً للجميع</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Event Type Suggestions */}
              {watchEventType && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="font-medium text-orange-800 mb-2">اقتراحات لحدث من نوع "{watchEventType}":</h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    {watchEventType === 'ميلاد' && (
                      <>
                        <p><strong>عنوان مقترح:</strong> ولادة [اسم المولود]</p>
                        <p><strong>وصف مقترح:</strong> ولادة [اسم المولود] في [المكان] بتاريخ [التاريخ]</p>
                      </>
                    )}
                    {watchEventType === 'زواج' && (
                      <>
                        <p><strong>عنوان مقترح:</strong> زواج [اسم الزوج] من [اسم الزوجة]</p>
                        <p><strong>وصف مقترح:</strong> تم عقد قران [اسم الزوج] على [اسم الزوجة] في [المكان] بتاريخ [التاريخ]</p>
                      </>
                    )}
                    {watchEventType === 'وفاة' && (
                      <>
                        <p><strong>عنوان مقترح:</strong> وفاة [اسم المتوفى]</p>
                        <p><strong>وصف مقترح:</strong> انتقل إلى رحمة الله تعالى [اسم المتوفى] في [المكان] بتاريخ [التاريخ]</p>
                      </>
                    )}
                    {watchEventType === 'تخرج' && (
                      <>
                        <p><strong>عنوان مقترح:</strong> تخرج [الاسم] من [اسم المؤسسة التعليمية]</p>
                        <p><strong>وصف مقترح:</strong> تخرج [الاسم] من [اسم المؤسسة التعليمية] بتخصص [التخصص] بتاريخ [التاريخ]</p>
                      </>
                    )}
                  </div>
                </div>
              )}
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
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ الحدث
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