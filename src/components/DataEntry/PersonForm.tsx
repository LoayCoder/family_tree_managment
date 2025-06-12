import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { User, Calendar, MapPin, FileText, Save, X, Building, Hash, Heart, Skull, Image, Trash2, AlertCircle, Plus, Users, UserPlus, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { arabicFamilyService, Location, Branch, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';

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
  has_birth_info: boolean;
  has_death_info: boolean;
  
  // Root family information
  father_name?: string;
  father_note?: string;
  grandfather_name?: string;
  grandfather_note?: string;
  greatgrandfather_name?: string;
  greatgrandfather_note?: string;
  
  // Children information
  children: {
    name: string;
    gender: 'ذكر' | 'أنثى';
    birth_date?: string;
    notes?: string;
  }[];
  
  // Wives information
  wives: {
    name: string;
    father_name?: string;
    family_name?: string;
    marriage_date?: string;
    marriage_status: 'متزوجة' | 'مطلقة' | 'أرملة';
    notes?: string;
  }[];
}

interface PersonFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any; // Person data for editing
}

export default function PersonForm({ onSuccess, onCancel, editData }: PersonFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [mothers, setMothers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalIdError, setNationalIdError] = useState<string>('');
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showChildrenSection, setShowChildrenSection] = useState(false);
  const [showWivesSection, setShowWivesSection] = useState(false);
  const [showRootFamilySection, setShowRootFamilySection] = useState(false);

  const { register, handleSubmit, watch, setValue, control, formState: { errors }, setError, clearErrors, getValues } = useForm<PersonFormData>({
    defaultValues: editData ? {
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
      has_birth_info: !!editData.تاريخ_الميلاد,
      has_death_info: !!editData.تاريخ_الوفاة,
      children: [],
      wives: []
    } : {
      الجنس: 'ذكر',
      الحالة_الاجتماعية: 'أعزب',
      is_root: false,
      is_deceased: false,
      has_birth_info: false,
      has_death_info: false,
      father_id: editData?.father_id || '',
      children: [],
      wives: []
    }
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children"
  });

  const { fields: wivesFields, append: appendWife, remove: removeWife } = useFieldArray({
    control,
    name: "wives"
  });

  const watchIsRoot = watch('is_root');
  const watchIsDeceased = watch('is_deceased');
  const watchHasBirthInfo = watch('has_birth_info');
  const watchHasDeathInfo = watch('has_death_info');
  const watchMaritalStatus = watch('الحالة_الاجتماعية');
  const watchNationalId = watch('رقم_هوية_وطنية');
  const watchImageUrl = watch('صورة_شخصية');
  const watchFatherId = watch('father_id');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update mothers list when father changes
  useEffect(() => {
    if (watchFatherId) {
      loadMothersForFather(Number(watchFatherId));
    } else {
      setMothers([]);
    }
  }, [watchFatherId]);

  // Show root family section when is_root is checked
  useEffect(() => {
    setShowRootFamilySection(watchIsRoot);
  }, [watchIsRoot]);

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
      setValue('has_death_info', false);
    }
  }, [watchIsDeceased, setValue]);

  // Load children and wives if editing
  useEffect(() => {
    if (editData?.id) {
      loadChildrenAndWives(editData.id);
    }
  }, [editData]);

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

      // Set image preview if editing
      if (editData?.صورة_شخصية) {
        setImagePreview(editData.صورة_شخصية);
      }

      // If father_id is provided in editData, load mothers for that father
      if (editData?.father_id) {
        loadMothersForFather(editData.father_id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMothersForFather = async (fatherId: number) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get all women related to this father
      const { data, error } = await supabase
        .from('ارتباط_النساء')
        .select(`
          woman_id,
          نوع_الارتباط,
          النساء!inner(id, الاسم_الأول, اسم_الأب, اسم_العائلة)
        `)
        .eq('person_id', fatherId)
        .eq('نوع_الارتباط', 'زوجة');

      if (error) throw error;

      if (data) {
        const mothersData = data.map(item => ({
          id: item.woman_id,
          name: `${item.النساء.الاسم_الأول} ${item.النساء.اسم_الأب || ''} ${item.النساء.اسم_العائلة || ''}`.trim()
        }));
        setMothers(mothersData);
      }
    } catch (error) {
      console.error('Error loading mothers:', error);
    }
  };

  const loadChildrenAndWives = async (personId: number) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Load children
      const { data: childrenData, error: childrenError } = await supabase
        .from('الأشخاص')
        .select('*')
        .eq('father_id', personId);

      if (childrenError) throw childrenError;

      if (childrenData && childrenData.length > 0) {
        // Format children data
        const formattedChildren = childrenData.map(child => ({
          name: child.الاسم_الأول,
          gender: child.الجنس || 'ذكر',
          birth_date: child.تاريخ_الميلاد || '',
          notes: child.ملاحظات || ''
        }));

        // Set children in form
        formattedChildren.forEach(child => {
          appendChild(child);
        });

        setShowChildrenSection(true);
      }

      // Load wives
      const { data: wivesData, error: wivesError } = await supabase
        .from('ارتباط_النساء')
        .select(`
          woman_id,
          نوع_الارتباط,
          تاريخ_الحدث,
          النساء!inner(id, الاسم_الأول, اسم_الأب, اسم_العائلة)
        `)
        .eq('person_id', personId)
        .eq('نوع_الارتباط', 'زوجة');

      if (wivesError) throw wivesError;

      if (wivesData && wivesData.length > 0) {
        // Format wives data
        const formattedWives = wivesData.map(wife => ({
          name: wife.النساء.الاسم_الأول,
          father_name: wife.النساء.اسم_الأب || '',
          family_name: wife.النساء.اسم_العائلة || '',
          marriage_date: wife.تاريخ_الحدث || '',
          marriage_status: 'متزوجة' as 'متزوجة' | 'مطلقة' | 'أرملة',
          notes: ''
        }));

        // Set wives in form
        formattedWives.forEach(wife => {
          appendWife(wife);
        });

        setShowWivesSection(true);
      }
    } catch (error) {
      console.error('Error loading children and wives:', error);
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
        const fileName = `person_${Date.now()}_${file.name}`;
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

  const onSubmit = async (data: PersonFormData) => {
    // Final validation before submission
    if (data.رقم_هوية_وطنية && data.رقم_هوية_وطنية.trim() !== '') {
      const isUnique = await arabicFamilyService.isPersonNationalIdUnique(
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
      // Prepare person data
      const personData = {
        الاسم_الأول: data.الاسم_الأول,
        is_root: data.is_root,
        تاريخ_الميلاد: data.has_birth_info ? data.تاريخ_الميلاد || undefined : undefined,
        تاريخ_الوفاة: data.is_deceased && data.has_death_info ? data.تاريخ_الوفاة || undefined : undefined,
        مكان_الميلاد: data.has_birth_info ? data.مكان_الميلاد || undefined : undefined,
        مكان_الوفاة: data.is_deceased && data.has_death_info ? data.مكان_الوفاة || undefined : undefined,
        رقم_هوية_وطنية: data.رقم_هوية_وطنية || undefined,
        الجنس: data.الجنس || 'ذكر',
        الحالة_الاجتماعية: data.الحالة_الاجتماعية || undefined,
        المنصب: data.المنصب || undefined,
        مستوى_التعليم: data.مستوى_التعليم || undefined,
        father_id: data.is_root ? undefined : (data.father_id || undefined),
        mother_id: data.is_root ? undefined : (data.mother_id || undefined),
        معرف_الفرع: data.معرف_الفرع || undefined,
        صورة_شخصية: data.صورة_شخصية || undefined,
        ملاحظات: data.ملاحظات || undefined
      };

      let personId: number;

      if (editData) {
        // Update existing person
        await arabicFamilyService.updatePerson(editData.id, personData);
        personId = editData.id;
      } else {
        // Add new person
        const newPerson = await arabicFamilyService.addPerson(personData);
        personId = newPerson.id;

        // If this is a root person, create ancestors
        if (data.is_root && data.father_name) {
          // Create father
          const fatherData = {
            الاسم_الأول: data.father_name,
            is_root: false,
            معرف_الفرع: data.معرف_الفرع || undefined,
            ملاحظات: data.father_note || undefined
          };
          const father = await arabicFamilyService.addPerson(fatherData);
          
          // Update the person with father_id
          await arabicFamilyService.updatePerson(personId, { father_id: father.id });
          
          // Create grandfather if provided
          if (data.grandfather_name) {
            const grandfatherData = {
              الاسم_الأول: data.grandfather_name,
              is_root: false,
              معرف_الفرع: data.معرف_الفرع || undefined,
              ملاحظات: data.grandfather_note || undefined
            };
            const grandfather = await arabicFamilyService.addPerson(grandfatherData);
            
            // Update father with grandfather_id
            await arabicFamilyService.updatePerson(father.id, { father_id: grandfather.id });
            
            // Create great-grandfather if provided
            if (data.greatgrandfather_name) {
              const greatGrandfatherData = {
                الاسم_الأول: data.greatgrandfather_name,
                is_root: false,
                معرف_الفرع: data.معرف_الفرع || undefined,
                ملاحظات: data.greatgrandfather_note || undefined
              };
              const greatGrandfather = await arabicFamilyService.addPerson(greatGrandfatherData);
              
              // Update grandfather with great-grandfather_id
              await arabicFamilyService.updatePerson(grandfather.id, { father_id: greatGrandfather.id });
            }
          }
        }
      }

      // Process children if any
      if (data.children && data.children.length > 0) {
        for (const child of data.children) {
          if (child.name) {
            const childData = {
              الاسم_الأول: child.name,
              father_id: personId,
              الجنس: child.gender || 'ذكر',
              تاريخ_الميلاد: child.birth_date || undefined,
              معرف_الفرع: data.معرف_الفرع || undefined, // Inherit branch from father
              ملاحظات: child.notes || undefined
            };
            await arabicFamilyService.addPerson(childData);
          }
        }
      }

      // Process wives if any
      if (data.wives && data.wives.length > 0 && supabase) {
        for (const wife of data.wives) {
          if (wife.name) {
            // First add the woman
            const { data: womanData, error: womanError } = await supabase
              .from('النساء')
              .insert([{
                الاسم_الأول: wife.name,
                اسم_الأب: wife.father_name || undefined,
                اسم_العائلة: wife.family_name || undefined,
                الحالة_الاجتماعية: wife.marriage_status || 'متزوجة',
                معرف_الفرع: data.معرف_الفرع || undefined, // Same branch as husband
                ملاحظات: wife.notes || undefined
              }])
              .select()
              .single();

            if (womanError) throw womanError;

            if (womanData) {
              // Then create the relationship
              const { error: relationError } = await supabase
                .from('ارتباط_النساء')
                .insert([{
                  woman_id: womanData.id,
                  person_id: personId,
                  نوع_الارتباط: 'زوجة',
                  تاريخ_الحدث: wife.marriage_date || undefined,
                  السبب_أو_الحدث: `زواج ${wife.name} من ${data.الاسم_الأول}`,
                  أهمية_الحدث: 'متوسطة'
                }]);

              if (relationError) throw relationError;
            }
          }
        }
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
                  {editData ? 'تعديل بيانات الشخص' : 'إضافة شخص جديد'}
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
              {/* Root Family Checkbox */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...register('is_root')}
                    type="checkbox"
                    className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium text-amber-800">هذا الشخص هو جذر العائلة</span>
                    <p className="text-sm text-amber-600">حدد هذا الخيار إذا كان هذا الشخص هو بداية شجرة العائلة</p>
                  </div>
                </label>
              </div>

              {/* Root Family Information */}
              {watchIsRoot && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      معلومات الأجداد
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRootFamilySection(!showRootFamilySection)}
                      className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      {showRootFamilySection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {showRootFamilySection && (
                    <div className="space-y-6">
                      {/* Father Information */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-amber-800">
                          <User className="w-4 h-4" />
                          اسم الأب
                        </label>
                        <input
                          {...register('father_name')}
                          type="text"
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
                          placeholder="أدخل اسم الأب"
                        />
                        <textarea
                          {...register('father_note')}
                          rows={2}
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none bg-white"
                          placeholder="ملاحظات عن الأب (اختياري)"
                        />
                      </div>

                      {/* Grandfather Information */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-amber-800">
                          <User className="w-4 h-4" />
                          اسم الجد
                        </label>
                        <input
                          {...register('grandfather_name')}
                          type="text"
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
                          placeholder="أدخل اسم الجد"
                        />
                        <textarea
                          {...register('grandfather_note')}
                          rows={2}
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none bg-white"
                          placeholder="ملاحظات عن الجد (اختياري)"
                        />
                      </div>

                      {/* Great-grandfather Information */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-amber-800">
                          <User className="w-4 h-4" />
                          اسم الجد الأكبر
                        </label>
                        <input
                          {...register('greatgrandfather_name')}
                          type="text"
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
                          placeholder="أدخل اسم الجد الأكبر (اختياري)"
                        />
                        <textarea
                          {...register('greatgrandfather_note')}
                          rows={2}
                          className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none bg-white"
                          placeholder="ملاحظات عن الجد الأكبر (اختياري)"
                        />
                      </div>
                    </div>
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

                {!watchIsRoot && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الأب
                    </label>
                    <select
                      {...register('father_id')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">اختر الأب</option>
                      {persons
                        .filter(person => person.الجنس === 'ذكر')
                        .map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.الاسم_الكامل}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {!watchIsRoot && watchFatherId && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      الأم
                    </label>
                    <select
                      {...register('mother_id')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">اختر الأم</option>
                      {mothers.map((mother) => (
                        <option key={mother.id} value={mother.id}>
                          {mother.name}
                        </option>
                      ))}
                    </select>
                    {mothers.length === 0 && (
                      <p className="text-amber-600 text-sm">لا توجد زوجات مسجلة لهذا الأب</p>
                    )}
                  </div>
                )}

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
                    <Heart className="w-4 h-4" />
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
              </div>

              {/* Birth Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      {...register('has_birth_info')}
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-800">هل تتوفر معلومات الميلاد؟</span>
                    </div>
                  </label>
                </div>
                
                {watchHasBirthInfo && (
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
                  </div>
                )}
              </div>

              {/* Death Information */}
              <div className="space-y-6">
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
                          <Heart className="w-5 h-5 text-blue-600 fill-current" />
                          <span className="font-medium text-gray-800">الشخص على قيد الحياة</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                
                {watchIsDeceased && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        {...register('has_death_info')}
                        type="checkbox"
                        className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-800">هل تتوفر معلومات الوفاة؟</span>
                      </div>
                    </label>
                  </div>
                )}
                
                {watchIsDeceased && watchHasDeathInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4" />
                        تاريخ الوفاة
                      </label>
                      <input
                        {...register('تاريخ_الوفاة', {
                          required: watchIsDeceased && watchHasDeathInfo ? 'تاريخ الوفاة مطلوب للمتوفين' : false
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
                  </div>
                )}
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
                      <FileText className="w-4 h-4" />
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

              {/* Children Section - Only show if married */}
              {watchMaritalStatus === 'متزوج' && (
                <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      الأبناء
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChildrenSection(!showChildrenSection)}
                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        {showChildrenSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => appendChild({ name: '', gender: 'ذكر', birth_date: '', notes: '' })}
                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {showChildrenSection && (
                    <div className="space-y-4">
                      {childrenFields.map((field, index) => (
                        <div key={field.id} className="bg-white rounded-xl border border-blue-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-blue-800">الابن {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeChild(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                الاسم *
                              </label>
                              <input
                                {...register(`children.${index}.name` as const, { required: true })}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="أدخل اسم الابن"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                الجنس
                              </label>
                              <select
                                {...register(`children.${index}.gender` as const)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              >
                                <option value="ذكر">ذكر</option>
                                <option value="أنثى">أنثى</option>
                              </select>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                تاريخ الميلاد
                              </label>
                              <input
                                {...register(`children.${index}.birth_date` as const)}
                                type="date"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                ملاحظات
                              </label>
                              <input
                                {...register(`children.${index}.notes` as const)}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="ملاحظات إضافية"
                              />
                            </div>
                          </div>
                          
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                            <p>سيرث هذا الابن نفس فرع الأب تلقائياً</p>
                          </div>
                        </div>
                      ))}
                      
                      {childrenFields.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-blue-600">لم تتم إضافة أي أبناء بعد</p>
                          <button
                            type="button"
                            onClick={() => appendChild({ name: '', gender: 'ذكر', birth_date: '', notes: '' })}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            إضافة ابن
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wives Section - Only show if married */}
              {watchMaritalStatus === 'متزوج' && (
                <div className="space-y-4 bg-pink-50 border border-pink-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-pink-800 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      الزوجات
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowWivesSection(!showWivesSection)}
                        className="p-2 text-pink-700 hover:bg-pink-100 rounded-lg transition-colors"
                      >
                        {showWivesSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => appendWife({ 
                          name: '', 
                          father_name: '', 
                          family_name: '', 
                          marriage_date: '', 
                          marriage_status: 'متزوجة', 
                          notes: '' 
                        })}
                        className="p-2 text-pink-700 hover:bg-pink-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {showWivesSection && (
                    <div className="space-y-4">
                      {wivesFields.map((field, index) => (
                        <div key={field.id} className="bg-white rounded-xl border border-pink-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-pink-800">الزوجة {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeWife(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                الاسم الأول *
                              </label>
                              <input
                                {...register(`wives.${index}.name` as const, { required: true })}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم الزوجة"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                اسم الأب
                              </label>
                              <input
                                {...register(`wives.${index}.father_name` as const)}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="اسم أب الزوجة"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                اسم العائلة
                              </label>
                              <input
                                {...register(`wives.${index}.family_name` as const)}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="اسم عائلة الزوجة"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                تاريخ الزواج
                              </label>
                              <input
                                {...register(`wives.${index}.marriage_date` as const)}
                                type="date"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                حالة الزواج
                              </label>
                              <select
                                {...register(`wives.${index}.marriage_status` as const)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                              >
                                <option value="متزوجة">متزوجة</option>
                                <option value="مطلقة">مطلقة</option>
                                <option value="أرملة">أرملة</option>
                              </select>
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium text-gray-700">
                                ملاحظات
                              </label>
                              <textarea
                                {...register(`wives.${index}.notes` as const)}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
                                placeholder="ملاحظات إضافية"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {wivesFields.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-pink-600">لم تتم إضافة أي زوجات بعد</p>
                          <button
                            type="button"
                            onClick={() => appendWife({ 
                              name: '', 
                              father_name: '', 
                              family_name: '', 
                              marriage_date: '', 
                              marriage_status: 'متزوجة', 
                              notes: '' 
                            })}
                            className="mt-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            إضافة زوجة
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات إضافية
                </h3>

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
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
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