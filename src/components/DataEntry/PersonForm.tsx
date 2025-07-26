import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Calendar, MapPin, FileText, Save, X, Building, Hash, Heart, Skull, Image, Trash2, AlertCircle, Crown, GraduationCap, Briefcase, BookOpen, Phone, Award, Star } from 'lucide-react';
import { arabicFamilyService, Location, Branch, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';
import { getCurrentUserLevel } from '../../utils/userUtils';

interface PersonFormData {
  الاسم_الأول: string;
  is_root: boolean;
  تاريخ_الميلاد: string;
  تاريخ_الوفاة: string;
  مكان_الميلاد: number | '';
  مكان_الوفاة: number | '';
  رقم_هوية_وطنية: string;
  الجنس: 'ذكر' | 'أنثى';
  الحالة_الاجتماعية: 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
  المنصب: string;
  مستوى_التعليم: string;
  father_id: number | '';
  mother_id: number | '';
  معرف_الفرع: number | '';
  صورة_شخصية: string;
  ملاحظات: string;
  is_deceased: boolean;
  // Notable member fields
  is_notable: boolean;
  notable_category: string;
  notable_biography: string;
  notable_education: string;
  notable_positions: string;
  notable_publications: string;
  notable_contact_info: string;
  notable_legacy: string;
  notable_profile_picture_url: string;
}

interface PersonFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: PersonWithDetails | { father_id?: number };
}

export default function PersonForm({ onSuccess, onCancel, editData }: PersonFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalIdError, setNationalIdError] = useState<string>('');
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notableImagePreview, setNotableImagePreview] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<string>('');
  const [pendingSubmission, setPendingSubmission] = useState(false);

  const isEditing = editData && 'id' in editData;

  const { register, handleSubmit, watch, setValue, formState: { errors }, setError, clearErrors } = useForm<PersonFormData>({
    defaultValues: isEditing ? {
      الاسم_الأول: editData.الاسم_الأول,
      is_root: editData.is_root || false,
      تاريخ_الميلاد: editData.تاريخ_الميلاد || '',
      تاريخ_الوفاة: editData.تاريخ_الوفاة || '',
      مكان_الميلاد: editData.مكان_الميلاد || '',
      مكان_الوفاة: editData.مكان_الوفاة || '',
      رقم_هوية_وطنية: editData.رقم_هوية_وطنية || '',
      الجنس: editData.الجنس || 'ذكر',
      الحالة_الاجتماعية: editData.الحالة_الاجتماعية || 'أعزب',
      المنصب: editData.المنصب || '',
      مستوى_التعليم: editData.مستوى_التعليم || '',
      father_id: editData.father_id || '',
      mother_id: editData.mother_id || '',
      معرف_الفرع: editData.معرف_الفرع || '',
      صورة_شخصية: editData.صورة_شخصية || '',
      ملاحظات: editData.ملاحظات || '',
      is_deceased: !!editData.تاريخ_الوفاة,
      is_notable: editData.is_notable || false,
      notable_category: editData.notable_category || '',
      notable_biography: editData.notable_biography || '',
      notable_education: editData.notable_education || '',
      notable_positions: editData.notable_positions || '',
      notable_publications: editData.notable_publications || '',
      notable_contact_info: editData.notable_contact_info || '',
      notable_legacy: editData.notable_legacy || '',
      notable_profile_picture_url: editData.notable_profile_picture_url || ''
    } : {
      الجنس: 'ذكر',
      الحالة_الاجتماعية: 'أعزب',
      is_root: false,
      is_deceased: false,
      father_id: editData?.father_id || '',
      is_notable: false,
      notable_category: ''
    }
  });

  const watchDeathDate = watch('تاريخ_الوفاة');
  const watchIsDeceased = watch('is_deceased');
  const watchNationalId = watch('رقم_هوية_وطنية');
  const watchImageUrl = watch('صورة_شخصية');
  const watchIsNotable = watch('is_notable');
  const watchNotableImageUrl = watch('notable_profile_picture_url');

  useEffect(() => {
    loadInitialData();
    checkUserLevel();
  }, []);

  const checkUserLevel = async () => {
    try {
      const level = await getCurrentUserLevel();
      setUserLevel(level);
    } catch (error) {
      console.error('Error getting user level:', error);
    }
  };

  // Debounced national ID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchNationalId && watchNationalId.trim() !== '') {
        validateNationalId(watchNationalId.trim());
      } else {
        setNationalIdError('');
        clearErrors('رقم_هوية_وطنية');
      }
    }, 500);

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

  // Update notable image preview when URL changes
  useEffect(() => {
    if (watchNotableImageUrl) {
      setNotableImagePreview(watchNotableImageUrl);
    } else {
      setNotableImagePreview(null);
    }
  }, [watchNotableImageUrl]);

  // Set death date to empty when is_deceased is false
  useEffect(() => {
    if (!watchIsDeceased) {
      setValue('تاريخ_الوفاة', '');
      setValue('مكان_الوفاة', '');
    }
  }, [watchIsDeceased, setValue]);

  // Clear notable fields when is_notable is unchecked
  useEffect(() => {
    if (!watchIsNotable) {
      setValue('notable_category', '');
      setValue('notable_biography', '');
      setValue('notable_education', '');
      setValue('notable_positions', '');
      setValue('notable_publications', '');
      setValue('notable_contact_info', '');
      setValue('notable_legacy', '');
      setValue('notable_profile_picture_url', '');
      setNotableImagePreview(null);
    }
  }, [watchIsNotable, setValue]);

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
      setPersons(personsData);

      // Set image previews if editing
      if (isEditing && editData.صورة_شخصية) {
        setImagePreview(editData.صورة_شخصية);
      }
      if (isEditing && editData.notable_profile_picture_url) {
        setNotableImagePreview(editData.notable_profile_picture_url);
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
      const isUnique = await arabicFamilyService.isPersonNationalIdUnique(
        nationalId, 
        isEditing ? editData.id : undefined
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

    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      alert('يرجى اختيار صورة بتنسيق JPG أو PNG فقط');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setValue('صورة_شخصية', result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    }
  };

  const handleNotableImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      alert('يرجى اختيار صورة بتنسيق JPG أو PNG فقط');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNotableImagePreview(result);
        setValue('notable_profile_picture_url', result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading notable image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    }
  };

  const clearImage = () => {
    setValue('صورة_شخصية', '');
    setImagePreview(null);
  };

  const clearNotableImage = () => {
    setValue('notable_profile_picture_url', '');
    setNotableImagePreview(null);
  };

  const onSubmit = async (data: PersonFormData) => {
    // Final validation before submission
    if (data.رقم_هوية_وطنية && data.رقم_هوية_وطنية.trim() !== '') {
      const isUnique = await arabicFamilyService.isPersonNationalIdUnique(
        data.رقم_هوية_وطنية.trim(), 
        isEditing ? editData.id : undefined
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
      const personData = {
        الاسم_الأول: data.الاسم_الأول,
        is_root: data.is_root,
        تاريخ_الميلاد: data.تاريخ_الميلاد || undefined,
        تاريخ_الوفاة: data.is_deceased ? data.تاريخ_الوفاة || undefined : undefined,
        مكان_الميلاد: data.مكان_الميلاد || undefined,
        مكان_الوفاة: data.is_deceased ? data.مكان_الوفاة || undefined : undefined,
        رقم_هوية_وطنية: data.رقم_هوية_وطنية || undefined,
        الجنس: data.الجنس,
        الحالة_الاجتماعية: data.الحالة_الاجتماعية || undefined,
        المنصب: data.المنصب || undefined,
        مستوى_التعليم: data.مستوى_التعليم || undefined,
        father_id: data.father_id || undefined,
        mother_id: data.mother_id || undefined,
        معرف_الفرع: data.معرف_الفرع || undefined,
        صورة_شخصية: data.صورة_شخصية || undefined,
        ملاحظات: data.ملاحظات || undefined
      };

      let personId: number;

      // Check if user is family_secretary for immediate approval
      if (userLevel === 'family_secretary') {
        // Family secretary can make changes directly
        if (isEditing) {
          await arabicFamilyService.updatePerson(editData.id, personData);
          personId = editData.id;
        } else {
          const newPerson = await arabicFamilyService.addPerson(personData);
          personId = newPerson.id;
        }
      } else {
        // Level manager or other roles - submit for approval
        const changeType = isEditing ? 'update' : 'insert';
        const originalPersonId = isEditing ? editData.id : null;
        
        // Add notable fields to person data if applicable
        if (data.is_notable && data.notable_category) {
          Object.assign(personData, {
            is_notable: data.is_notable,
            notable_category: data.notable_category,
            notable_biography: data.notable_biography || undefined,
            notable_education: data.notable_education || undefined,
            notable_positions: data.notable_positions || undefined,
            notable_publications: data.notable_publications || undefined,
            notable_contact_info: data.notable_contact_info || undefined,
            notable_legacy: data.notable_legacy || undefined,
            notable_profile_picture_url: data.notable_profile_picture_url || undefined
          });
        }
        
        const { data: result, error } = await supabase!.rpc('submit_person_change', {
          p_change_type: changeType,
          p_original_person_id: originalPersonId,
          p_person_data: personData
        });
        
        if (error) throw error;
        
        if (result === -1) {
          // Immediate approval (family secretary)
          personId = originalPersonId || 0;
        } else {
          // Submitted for approval
          setPendingSubmission(true);
          setTimeout(() => {
            onSuccess();
          }, 2000);
          return;
        }
      }

      // Handle notable information for family secretary direct changes
      if (userLevel === 'family_secretary' && data.is_notable && data.notable_category) {
        const notableData = {
          person_id: personId,
          category: data.notable_category,
          biography: data.notable_biography || undefined,
          education: data.notable_education || undefined,
          positions: data.notable_positions || undefined,
          publications: data.notable_publications || undefined,
          contact_info: data.notable_contact_info || undefined,
          legacy: data.notable_legacy || undefined,
          profile_picture_url: data.notable_profile_picture_url || undefined
        };

        if (isEditing && editData.notable_id) {
          // Update existing notable record
          await arabicFamilyService.updateNotable(editData.notable_id, notableData);
        } else {
          // Create new notable record
          await arabicFamilyService.addNotable(notableData);
        }
      } else if (isEditing && editData.notable_id) {
        // Remove notable status if unchecked
        await arabicFamilyService.deleteNotable(editData.notable_id);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {isEditing ? 'تعديل بيانات الشخص' : 'إضافة شخص جديد'}
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
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
              <h2 className="text-2xl font-bold text-white">المعلومات الأساسية</h2>
              <p className="text-blue-100 mt-2">املأ جميع الحقول المطلوبة بدقة</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Pending Submission Message */}
              {pendingSubmission && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-4">
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-800 mb-2">تم إرسال الطلب للموافقة</h3>
                  <p className="text-amber-700">
                    تم إرسال {isEditing ? 'تعديل' : 'إضافة'} بيانات الشخص إلى أمين العائلة للموافقة عليها.
                    ستتلقى إشعاراً عند الموافقة على الطلب أو رفضه.
                  </p>
                </div>
              )}

              {/* User Level Info */}
              {userLevel && userLevel !== 'family_secretary' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-blue-800">مستوى المستخدم: </span>
                      <span className="text-blue-700">
                        {userLevel === 'level_manager' ? 'مدير فرع' :
                         userLevel === 'content_writer' ? 'كاتب محتوى' :
                         userLevel === 'family_member' ? 'عضو عائلة' : userLevel}
                      </span>
                    </div>
                  </div>
                  {userLevel === 'level_manager' && (
                    <p className="text-blue-600 text-sm mt-2">
                      جميع التغييرات التي تقوم بها ستُرسل إلى أمين العائلة للموافقة عليها قبل تطبيقها.
                    </p>
                  )}
                </div>
              )}

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="أدخل الاسم الأول"
                  />
                  {errors.الاسم_الأول && (
                    <p className="text-red-500 text-sm">{errors.الاسم_الأول.message}</p>
                  )}
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
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors ${
                        nationalIdError || errors.رقم_هوية_وطنية 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="أدخل رقم الهوية الوطنية"
                      dir="ltr"
                    />
                    {isCheckingNationalId && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                    الجنس
                  </label>
                  <select
                    {...register('الجنس')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    الحالة الاجتماعية
                  </label>
                  <select
                    {...register('الحالة_الاجتماعية')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="أعزب">أعزب</option>
                    <option value="متزوج">متزوج</option>
                    <option value="مطلق">مطلق</option>
                    <option value="أرمل">أرمل</option>
                  </select>
                </div>
              </div>

              {/* Family Relationships */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  العلاقات العائلية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الوالد
                    </label>
                    <select
                      {...register('father_id')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">اختر الوالد</option>
                      {persons.filter(p => p.الجنس === 'ذكر').map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.الاسم_الكامل}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الوالدة
                    </label>
                    <select
                      {...register('mother_id')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">اختر الوالدة</option>
                      {persons.filter(p => p.الجنس === 'أنثى').map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.الاسم_الكامل}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="w-4 h-4" />
                      الفرع العائلي
                    </label>
                    <select
                      {...register('معرف_الفرع')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">اختر الفرع العائلي</option>
                      {branches.map((branch) => (
                        <option key={branch.معرف_الفرع} value={branch.معرف_الفرع}>
                          {branch.اسم_الفرع}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          {...register('is_root')}
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-800">جذر العائلة</span>
                        </div>
                      </label>
                      <p className="text-sm text-blue-600 mt-2 mr-8">
                        حدد هذا الخيار إذا كان هذا الشخص هو الجد الأكبر أو مؤسس الفرع
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                          <span className="font-medium text-gray-800">الشخص متوفى</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-5 h-5 text-emerald-600 fill-current" />
                          <span className="font-medium text-gray-800">الشخص على قيد الحياة</span>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      مكان الميلاد
                    </label>
                    <select
                      {...register('مكان_الميلاد')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="أدخل المنصب أو المهنة"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <GraduationCap className="w-4 h-4" />
                      مستوى التعليم
                    </label>
                    <input
                      {...register('مستوى_التعليم')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="أدخل مستوى التعليم"
                    />
                  </div>
                </div>
              </div>

              {/* Notable Member Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  الشخصيات البارزة
                </h3>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      {...register('is_notable')}
                      type="checkbox"
                      className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-800">هل هذا العضو شخصية بارزة؟</span>
                    </div>
                  </label>
                  <p className="text-sm text-amber-600 mt-2 mr-8">
                    حدد هذا الخيار إذا كان هذا الشخص من الشخصيات البارزة أو المؤثرة في القبيلة
                  </p>
                </div>

                {/* Notable Information Fields - Conditional Display */}
                {watchIsNotable && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 space-y-6">
                    <h4 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      معلومات الشخصية البارزة
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Award className="w-4 h-4" />
                        فئة الشخصية البارزة *
                      </label>
                      <select
                        {...register('notable_category', { 
                          required: watchIsNotable ? 'فئة الشخصية البارزة مطلوبة' : false 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      >
                        <option value="">اختر الفئة</option>
                        <option value="Current Tribal Leaders">القيادات القبلية الحالية</option>
                        <option value="Judges and Legal Experts">القضاة والخبراء القانونيون</option>
                        <option value="Business Leaders">قادة الأعمال</option>
                        <option value="Scholars and Academics">العلماء والأكاديميون</option>
                        <option value="Poets and Artists">الشعراء والفنانون</option>
                        <option value="Historical Figures">الشخصيات التاريخية</option>
                      </select>
                      {errors.notable_category && (
                        <p className="text-red-500 text-sm">{errors.notable_category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4" />
                        السيرة الذاتية
                      </label>
                      <textarea
                        {...register('notable_biography')}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                        placeholder="أدخل السيرة الذاتية التفصيلية للشخصية البارزة"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <GraduationCap className="w-4 h-4" />
                          التعليم والمؤهلات
                        </label>
                        <textarea
                          {...register('notable_education')}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                          placeholder="أدخل المؤهلات التعليمية والشهادات"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Briefcase className="w-4 h-4" />
                          المناصب والوظائف
                        </label>
                        <textarea
                          {...register('notable_positions')}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                          placeholder="أدخل المناصب الحالية والسابقة"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <BookOpen className="w-4 h-4" />
                          المؤلفات والإنجازات
                        </label>
                        <textarea
                          {...register('notable_publications')}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                          placeholder="أدخل المؤلفات والإنجازات المهمة"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Award className="w-4 h-4" />
                          الإرث والتأثير
                        </label>
                        <textarea
                          {...register('notable_legacy')}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                          placeholder="أدخل الإرث والتأثير الذي تركه"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="w-4 h-4" />
                        معلومات التواصل (للاستخدام الداخلي)
                      </label>
                      <textarea
                        {...register('notable_contact_info')}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                        placeholder="أدخل معلومات التواصل (لن تظهر للعامة)"
                      />
                      <p className="text-xs text-amber-600">
                        هذه المعلومات للاستخدام الداخلي فقط ولن تظهر في العرض العام
                      </p>
                    </div>

                    {/* Notable Profile Picture */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Image className="w-4 h-4" />
                        صورة الشخصية البارزة (منفصلة)
                      </label>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="w-full md:w-1/3">
                          {notableImagePreview ? (
                            <div className="relative">
                              <img 
                                src={notableImagePreview} 
                                alt="معاينة صورة الشخصية البارزة" 
                                className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                                style={{ maxHeight: '200px' }}
                              />
                              <button
                                type="button"
                                onClick={clearNotableImage}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                              <Crown className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        <div className="w-full md:w-2/3 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">رفع صورة جديدة</label>
                            <input
                              type="file"
                              accept="image/jpeg, image/png"
                              onChange={handleNotableImageUpload}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-medium
                                file:bg-amber-50 file:text-amber-700
                                hover:file:bg-amber-100
                                file:cursor-pointer"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">أو أدخل رابط الصورة</label>
                            <input
                              {...register('notable_profile_picture_url')}
                              type="url"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                              placeholder="أدخل رابط صورة الشخصية البارزة"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات إضافية
                </h3>

                {/* Regular Profile Picture */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Image className="w-4 h-4" />
                    الصورة الشخصية
                  </label>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start">
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
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            file:cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">أو أدخل رابط الصورة</label>
                        <input
                          {...register('صورة_شخصية')}
                          type="url"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
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
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {userLevel === 'family_secretary' ? 'جاري الحفظ...' : 'جاري الإرسال للموافقة...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {userLevel === 'family_secretary' 
                      ? (isEditing ? 'تحديث البيانات' : 'حفظ البيانات')
                      : (isEditing ? 'إرسال التعديل للموافقة' : 'إرسال للموافقة')
                    }
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