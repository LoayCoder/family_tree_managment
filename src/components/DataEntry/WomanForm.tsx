import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Calendar, MapPin, FileText, Save, X, Building, Hash, Heart, Skull, Image, Trash2, AlertCircle } from 'lucide-react';
import { arabicFamilyService, Location, Branch, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';

interface WomanFormData {
  الاسم_الأول: string;
  اسم_الأب: string;
  اسم_العائلة: string;
  تاريخ_الميلاد: string;
  تاريخ_الوفاة: string;
  مكان_الميلاد: number | '';
  مكان_الوفاة: number | '';
  رقم_هوية_وطنية: string;
  الحالة_الاجتماعية: 'عزباء' | 'متزوجة' | 'مطلقة' | 'أرملة';
  المنصب: string;
  مستوى_التعليم: string;
  معرف_الفرع: number | '';
  صورة_شخصية: string;
  ملاحظات: string;
  is_deceased: boolean;
  linked_person_id: number | '';
}

interface WomanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any; // Woman data for editing
}

export default function WomanForm({ onSuccess, onCancel, editData }: WomanFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalIdError, setNationalIdError] = useState<string>('');
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, setError, clearErrors } = useForm<WomanFormData>({
    defaultValues: editData ? {
      الاسم_الأول: editData.الاسم_الأول,
      اسم_الأب: editData.اسم_الأب || '',
      اسم_العائلة: editData.اسم_العائلة || '',
      تاريخ_الميلاد: editData.تاريخ_الميلاد || '',
      تاريخ_الوفاة: editData.تاريخ_الوفاة || '',
      مكان_الميلاد: editData.مكان_الميلاد || '',
      مكان_الوفاة: editData.مكان_الوفاة || '',
      رقم_هوية_وطنية: editData.رقم_هوية_وطنية || '',
      الحالة_الاجتماعية: editData.الحالة_الاجتماعية || 'عزباء',
      المنصب: editData.المنصب || '',
      مستوى_التعليم: editData.مستوى_التعليم || '',
      معرف_الفرع: editData.معرف_الفرع || '',
      صورة_شخصية: editData.صورة_شخصية || '',
      ملاحظات: editData.ملاحظات || '',
      is_deceased: !!editData.تاريخ_الوفاة,
      linked_person_id: ''
    } : {
      الحالة_الاجتماعية: 'عزباء',
      is_deceased: false,
      linked_person_id: ''
    }
  });

  const watchDeathDate = watch('تاريخ_الوفاة');
  const watchIsDeceased = watch('is_deceased');
  const watchMaritalStatus = watch('الحالة_الاجتماعية');
  const watchNationalId = watch('رقم_هوية_وطنية');
  const watchImageUrl = watch('صورة_شخصية');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced national ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchNationalId && watchNationalId.trim() !== '') {
        validateNationalId(watchNationalId.trim());
      } else {
        setNationalIdError('');
        clearErrors('رقم_هوية_وطنية');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [watchNationalId]);

  // Update image preview when URL changes
  useEffect(() => {
    if (watchImageUrl) {
      setImagePreview(watchImageUrl);
    } else {
      setImagePreview(null);
    }
  }, [watchImageUrl]);

  // Set death date to empty when is_deceased is false
  useEffect(() => {
    if (!watchIsDeceased) {
      setValue('تاريخ_الوفاة', '');
      setValue('مكان_الوفاة', '');
    }
  }, [watchIsDeceased, setValue]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locationsData, branchesData, personsData] = await Promise.all([
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getAllBranches(),
        arabicFamilyService.getPersonsWithDetails()
      ]);
      setLocations(locationsData);
      setBranches(branchesData);
      setPersons(personsData.filter(p => p.الجنس === 'ذكر')); // Only male persons for marriage relationship

      // Set image preview if editing
      if (editData?.صورة_شخصية) {
        setImagePreview(editData.صورة_شخصية);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateNationalId = async (nationalId: string) => {
    if (!nationalId || nationalId.trim() === '') {
      setNationalIdError('');
      clearErrors('رقم_هوية_وطنية');
      return;
    }

    setIsCheckingNationalId(true);
    try {
      const isUnique = await arabicFamilyService.isWomanNationalIdUnique(
        nationalId, 
        editData?.id
      );
      
      if (!isUnique) {
        const errorMessage = 'رقم الهوية الوطنية مستخدم بالفعل';
        setNationalIdError(errorMessage);
        setError('رقم_هوية_وطنية', {
          type: 'manual',
          message: errorMessage
        });
      } else {
        setNationalIdError('');
        clearErrors('رقم_هوية_وطنية');
      }
    } catch (error) {
      console.error('Error validating national ID:', error);
      setNationalIdError('خطأ في التحقق من رقم الهوية');
    } finally {
      setIsCheckingNationalId(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      alert('يرجى اختيار صورة بتنسيق JPG أو PNG فقط');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }

    try {
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setValue('صورة_شخصية', result);
      };
      reader.readAsDataURL(file);

      // Note: Supabase storage upload is commented out until the 'images' bucket is created
      // To enable storage upload, create an 'images' bucket in your Supabase project dashboard
      /*
      if (supabase) {
        const fileName = `woman_${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`profiles/${fileName}`, file);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(`profiles/${fileName}`);

        setValue('صورة_شخصية', publicUrlData.publicUrl);
        setImagePreview(publicUrlData.publicUrl);
      }
      */
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    }
  };

  const clearImage = () => {
    setValue('صورة_شخصية', '');
    setImagePreview(null);
  };

  const onSubmit = async (data: WomanFormData) => {
    // Final validation before submission
    if (data.رقم_هوية_وطنية && data.رقم_هوية_وطنية.trim() !== '') {
      const isUnique = await arabicFamilyService.isWomanNationalIdUnique(
        data.رقم_هوية_وطنية.trim(), 
        editData?.id
      );
      
      if (!isUnique) {
        setError('رقم_هوية_وطنية', {
          type: 'manual',
          message: 'رقم الهوية الوطنية مستخدم بالفعل'
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const womanData = {
        الاسم_الأول: data.الاسم_الأول,
        اسم_الأب: data.اسم_الأب || undefined,
        اسم_العائلة: data.اسم_العائلة || undefined,
        تاريخ_الميلاد: data.تاريخ_الميلاد || undefined,
        تاريخ_الوفاة: data.is_deceased ? data.تاريخ_الوفاة || undefined : undefined,
        مكان_الميلاد: data.مكان_الميلاد || undefined,
        مكان_الوفاة: data.is_deceased ? data.مكان_الوفاة || undefined : undefined,
        رقم_هوية_وطنية: data.رقم_هوية_وطنية || undefined,
        الحالة_الاجتماعية: data.الحالة_الاجتماعية || undefined,
        المنصب: data.المنصب || undefined,
        مستوى_التعليم: data.مستوى_التعليم || undefined,
        معرف_الفرع: data.معرف_الفرع || undefined,
        صورة_شخصية: data.صورة_شخصية || undefined,
        ملاحظات: data.ملاحظات || undefined
      };

      let womanId: number;

      if (editData) {
        await supabase?.from('النساء').update(womanData).eq('id', editData.id);
        womanId = editData.id;
      } else {
        const { data: newWoman, error } = await supabase?.from('النساء').insert([womanData]).select().single() || {};
        if (error) throw error;
        womanId = newWoman?.id;
      }

      // If woman is married and linked to a person, create relationship
      if (data.الحالة_الاجتماعية === 'متزوجة' && data.linked_person_id) {
        const relationshipData = {
          woman_id: womanId,
          person_id: data.linked_person_id,
          نوع_الارتباط: 'زوجة',
          السبب_أو_الحدث: `زواج ${data.الاسم_الأول} من ${persons.find(p => p.id === Number(data.linked_person_id))?.الاسم_الأول || 'شخص'}`,
          تاريخ_الحدث: new Date().toISOString().split('T')[0],
          أهمية_الحدث: 'متوسطة'
        };

        await supabase?.from('ارتباط_النساء').insert([relationshipData]);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving woman:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {editData ? 'تعديل بيانات المرأة' : 'إضافة امرأة جديدة'}
                </h1>
                <p className="text-gray-600">إدخال المعلومات الشخصية والعائلية</p>
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
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6">
              <h2 className="text-2xl font-bold text-white">المعلومات الأساسية</h2>
              <p className="text-pink-100 mt-2">املأ جميع الحقول المطلوبة بدقة</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    الاسم الأول *
                  </label>
                  <input
                    {...register('الاسم_الأول', { required: 'الاسم الأول مطلوب' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="أدخل الاسم الأول"
                  />
                  {errors.الاسم_الأول && (
                    <p className="text-red-500 text-sm">{errors.الاسم_الأول.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    اسم الأب
                  </label>
                  <input
                    {...register('اسم_الأب')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="أدخل اسم الأب"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    اسم العائلة
                  </label>
                  <input
                    {...register('اسم_العائلة')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="أدخل اسم العائلة"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Hash className="w-4 h-4" />
                    رقم الهوية الوطنية
                  </label>
                  <div className="relative">
                    <input
                      {...register('رقم_هوية_وطنية')}
                      type="text"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 transition-colors ${
                        nationalIdError || errors.رقم_هوية_وطنية 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-pink-500'
                      }`}
                      placeholder="أدخل رقم الهوية الوطنية"
                      dir="ltr"
                    />
                    {isCheckingNationalId && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {nationalIdError && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {(nationalIdError || errors.رقم_هوية_وطنية) && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {nationalIdError || errors.رقم_هوية_وطنية?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    الحالة الاجتماعية
                  </label>
                  <select
                    {...register('الحالة_الاجتماعية')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  >
                    <option value="عزباء">عزباء</option>
                    <option value="متزوجة">متزوجة</option>
                    <option value="مطلقة">مطلقة</option>
                    <option value="أرملة">أرملة</option>
                  </select>
                </div>
              </div>

              {/* Marriage Information (if married) */}
              {watchMaritalStatus === 'متزوجة' && (
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-4">
                  <h3 className="font-medium text-pink-800 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    معلومات الزواج
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      مرتبطة بأي رجل؟
                    </label>
                    <select
                      {...register('linked_person_id')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    >
                      <option value="">اختر الزوج من قاعدة البيانات</option>
                      {persons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.الاسم_الكامل}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-pink-600">
                      سيتم إنشاء علاقة زواج بين المرأة والرجل المختار
                    </p>
                  </div>
                </div>
              )}

              {/* Death Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات الحياة والوفاة
                </h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      {...register('is_deceased')}
                      type="checkbox"
                      className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <div className="flex items-center gap-2">
                      {watchIsDeceased ? (
                        <>
                          <Skull className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-800">المرأة متوفاة</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-5 h-5 text-pink-600 fill-current" />
                          <span className="font-medium text-gray-800">المرأة على قيد الحياة</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      تاريخ الميلاد
                    </label>
                    <input
                      {...register('تاريخ_الميلاد')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      مكان الميلاد
                    </label>
                    <select
                      {...register('مكان_الميلاد')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    >
                      <option value="">اختر مكان الميلاد</option>
                      {locations.map((location) => (
                        <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                          {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {watchIsDeceased && (
                    <>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4" />
                          تاريخ الوفاة
                        </label>
                        <input
                          {...register('تاريخ_الوفاة', {
                            required: watchIsDeceased ? 'تاريخ الوفاة مطلوب للمتوفين' : false
                          })}
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                        />
                        {errors.تاريخ_الوفاة && (
                          <p className="text-red-500 text-sm">{errors.تاريخ_الوفاة.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4" />
                          مكان الوفاة
                        </label>
                        <select
                          {...register('مكان_الوفاة')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                        >
                          <option value="">اختر مكان الوفاة</option>
                          {locations.map((location) => (
                            <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                              {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  المعلومات المهنية والتعليمية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="w-4 h-4" />
                      المنصب أو المهنة
                    </label>
                    <input
                      {...register('المنصب')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                      placeholder="أدخل المنصب أو المهنة"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      مستوى التعليم
                    </label>
                    <input
                      {...register('مستوى_التعليم')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                      placeholder="أدخل مستوى التعليم"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات إضافية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="w-4 h-4" />
                      الفرع العائلي
                    </label>
                    <select
                      {...register('معرف_الفرع')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    >
                      <option value="">اختر الفرع العائلي</option>
                      {branches.map((branch) => (
                        <option key={branch.معرف_الفرع} value={branch.معرف_الفرع}>
                          {branch.اسم_الفرع}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Image className="w-4 h-4" />
                    الصورة الشخصية
                  </label>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Image Preview */}
                    <div className="w-full md:w-1/3">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="معاينة الصورة" 
                            className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                            style={{ maxHeight: '200px' }}
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Options */}
                    <div className="w-full md:w-2/3 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">رفع صورة جديدة</label>
                        <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-pink-50 file:text-pink-700
                            hover:file:bg-pink-100
                            file:cursor-pointer"
                        />
                        <p className="text-xs text-gray-500">يمكنك رفع صورة بتنسيق JPG أو PNG بحجم أقصى 2 ميجابايت</p>
                        <p className="text-xs text-amber-600">ملاحظة: يتم حفظ الصورة محلياً حالياً. لتفعيل رفع الصور إلى التخزين السحابي، يجب إنشاء bucket باسم 'images' في مشروع Supabase</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">أو أدخل رابط الصورة</label>
                        <input
                          {...register('صورة_شخصية')}
                          type="url"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                          placeholder="أدخل رابط الصورة الشخصية"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    ملاحظات
                  </label>
                  <textarea
                    {...register('ملاحظات')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
                    placeholder="أضف أي ملاحظات إضافية"
                  />
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
                disabled={isSubmitting || nationalIdError !== '' || isCheckingNationalId}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editData ? 'تحديث البيانات' : 'حفظ البيانات'}
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