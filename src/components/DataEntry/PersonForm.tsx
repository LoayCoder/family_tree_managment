import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { User, Calendar, MapPin, Phone, FileText, Save, X, Building, Hash, AlertCircle, Image, Skull, Heart, Trash2, Plus, Minus, Users, UserPlus, UserMinus, Check, Info } from 'lucide-react';
import { arabicFamilyService, PersonWithDetails, Location, Branch } from '../../services/arabicFamilyService';
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
  has_birth_data: boolean;
  has_death_data: boolean;
  additional_names: string[];
  ancestors: {
    name: string;
    notes: string;
  }[];
  wives: {
    name: string;
    father_name: string;
    family_name: string;
    birth_date: string;
    is_deceased: boolean;
    death_date: string;
    notes: string;
  }[];
  children: {
    name: string;
    gender: 'ذكر' | 'أنثى';
    birth_date: string;
    is_deceased: boolean;
    death_date: string;
    mother_id: number | '';
    notes: string;
  }[];
}

interface PersonFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: Partial<PersonWithDetails>;
}

interface Woman {
  id: number;
  الاسم_الأول: string;
  اسم_الأب?: string;
  اسم_العائلة?: string;
}

export default function PersonForm({ onSuccess, onCancel, editData }: PersonFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [women, setWomen] = useState<Woman[]>([]);
  const [fatherWives, setFatherWives] = useState<Woman[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalIdError, setNationalIdError] = useState<string>('');
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors }, setError, clearErrors } = useForm<PersonFormData>({
    defaultValues: editData ? {
      الاسم_الأول: editData.الاسم_الأول || '',
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
      has_birth_data: !!editData.تاريخ_الميلاد,
      has_death_data: !!editData.تاريخ_الوفاة,
      additional_names: [],
      ancestors: [],
      wives: [],
      children: []
    } : {
      الجنس: 'ذكر',
      is_root: false,
      الحالة_الاجتماعية: 'أعزب',
      is_deceased: false,
      has_birth_data: false,
      has_death_data: false,
      additional_names: [],
      ancestors: [],
      wives: [],
      children: []
    }
  });

  // Setup field arrays for dynamic fields
  const { fields: additionalNamesFields, append: appendAdditionalName, remove: removeAdditionalName } = useFieldArray({
    control,
    name: "additional_names"
  });

  const { fields: ancestorsFields, append: appendAncestor, remove: removeAncestor } = useFieldArray({
    control,
    name: "ancestors"
  });

  const { fields: wivesFields, append: appendWife, remove: removeWife } = useFieldArray({
    control,
    name: "wives"
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children"
  });

  // Watch form values for conditional rendering
  const watchDeathDate = watch('تاريخ_الوفاة');
  const watchIsRoot = watch('is_root');
  const watchNationalId = watch('رقم_هوية_وطنية');
  const watchIsDeceased = watch('is_deceased');
  const watchHasBirthData = watch('has_birth_data');
  const watchHasDeathData = watch('has_death_data');
  const watchMaritalStatus = watch('الحالة_الاجتماعية');
  const watchImageUrl = watch('صورة_شخصية');
  const watchFatherId = watch('father_id');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load father's wives when father is selected
  useEffect(() => {
    if (watchFatherId && watchFatherId !== '') {
      loadFatherWives(Number(watchFatherId));
    } else {
      setFatherWives([]);
    }
  }, [watchFatherId]);

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
      setValue('has_death_data', false);
    }
  }, [watchIsDeceased, setValue]);

  // Load existing wives and children if editing
  useEffect(() => {
    if (editData?.id) {
      loadExistingWivesAndChildren(editData.id);
    }
  }, [editData?.id]);

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

      // Load women for marriage relationship
      if (supabase) {
        const { data: womenData, error } = await supabase
          .from('النساء')
          .select('id, الاسم_الأول, اسم_الأب, اسم_العائلة')
          .order('الاسم_الأول');
        
        if (!error && womenData) {
          setWomen(womenData);
        }
      }

      // Set image preview if editing
      if (editData?.صورة_شخصية) {
        setImagePreview(editData.صورة_شخصية);
      }

      // If this is a root person, add initial ancestor field
      if (editData?.is_root) {
        appendAncestor({ name: '', notes: '' });
      }

      // If person is married, add initial wife field
      if (editData?.الحالة_الاجتماعية === 'متزوج') {
        appendWife({ name: '', father_name: '', family_name: '', birth_date: '', is_deceased: false, death_date: '', notes: '' });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFatherWives = async (fatherId: number) => {
    try {
      if (supabase) {
        // Get all women related to the father through ارتباط_النساء table
        const { data, error } = await supabase
          .from('ارتباط_النساء')
          .select(`
            woman_id,
            النساء!inner(id, الاسم_الأول, اسم_الأب, اسم_العائلة)
          `)
          .eq('person_id', fatherId)
          .eq('نوع_الارتباط', 'زوجة');
        
        if (!error && data) {
          const wives = data.map(item => ({
            id: item.النساء.id,
            الاسم_الأول: item.النساء.الاسم_الأول,
            اسم_الأب: item.النساء.اسم_الأب,
            اسم_العائلة: item.النساء.اسم_العائلة
          }));
          setFatherWives(wives);
        }
      }
    } catch (error) {
      console.error('Error loading father wives:', error);
    }
  };

  const loadExistingWivesAndChildren = async (personId: number) => {
    try {
      if (supabase) {
        // Load wives
        const { data: wivesData, error: wivesError } = await supabase
          .from('ارتباط_النساء')
          .select(`
            woman_id,
            النساء!inner(id, الاسم_الأول, اسم_الأب, اسم_العائلة, تاريخ_الميلاد, تاريخ_الوفاة, ملاحظات)
          `)
          .eq('person_id', personId)
          .eq('نوع_الارتباط', 'زوجة');
        
        if (!wivesError && wivesData && wivesData.length > 0) {
          // Clear existing wives
          while (wivesFields.length > 0) {
            removeWife(0);
          }
          
          // Add existing wives
          wivesData.forEach(item => {
            appendWife({
              name: item.النساء.الاسم_الأول,
              father_name: item.النساء.اسم_الأب || '',
              family_name: item.النساء.اسم_العائلة || '',
              birth_date: item.النساء.تاريخ_الميلاد || '',
              is_deceased: !!item.النساء.تاريخ_الوفاة,
              death_date: item.النساء.تاريخ_الوفاة || '',
              notes: item.النساء.ملاحظات || ''
            });
          });
        }

        // Load children
        const { data: childrenData, error: childrenError } = await supabase
          .from('الأشخاص')
          .select('*')
          .eq('father_id', personId);
        
        if (!childrenError && childrenData && childrenData.length > 0) {
          // Clear existing children
          while (childrenFields.length > 0) {
            removeChild(0);
          }
          
          // Add existing children
          childrenData.forEach(child => {
            appendChild({
              name: child.الاسم_الأول,
              gender: child.الجنس || 'ذكر',
              birth_date: child.تاريخ_الميلاد || '',
              is_deceased: !!child.تاريخ_الوفاة,
              death_date: child.تاريخ_الوفاة || '',
              mother_id: child.mother_id || '',
              notes: child.ملاحظات || ''
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading existing family data:', error);
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

  const addNameField = () => {
    appendAdditionalName('');
  };

  const addAncestorField = () => {
    appendAncestor({ name: '', notes: '' });
  };

  const addWifeField = () => {
    appendWife({ name: '', father_name: '', family_name: '', birth_date: '', is_deceased: false, death_date: '', notes: '' });
  };

  const addChildField = () => {
    appendChild({ name: '', gender: 'ذكر', birth_date: '', is_deceased: false, death_date: '', mother_id: '', notes: '' });
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
      // Combine the main name with additional names
      const fullName = [data.الاسم_الأول, ...data.additional_names.filter(name => name.trim() !== '')].join(' ');

      // Prepare person data
      const personData = {
        الاسم_الأول: fullName,
        is_root: data.is_root,
        تاريخ_الميلاد: data.has_birth_data ? data.تاريخ_الميلاد || undefined : undefined,
        تاريخ_الوفاة: data.is_deceased && data.has_death_data ? data.تاريخ_الوفاة || undefined : undefined,
        مكان_الميلاد: data.has_birth_data ? (data.مكان_الميلاد === '' ? null : data.مكان_الميلاد) : null,
        مكان_الوفاة: data.is_deceased && data.has_death_data ? (data.مكان_الوفاة === '' ? null : data.مكان_الوفاة) : null,
        رقم_هوية_وطنية: data.رقم_هوية_وطنية || undefined,
        الجنس: data.الجنس,
        الحالة_الاجتماعية: data.الحالة_الاجتماعية || undefined,
        المنصب: data.المنصب || undefined,
        مستوى_التعليم: data.مستوى_التعليم || undefined,
        father_id: data.father_id === '' ? null : data.father_id,
        mother_id: data.mother_id === '' ? null : data.mother_id,
        معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع,
        صورة_شخصية: data.صورة_شخصية || undefined,
        ملاحظات: data.ملاحظات || undefined
      };

      let personId: number;

      // Update or create person
      if (editData && editData.id) {
        await arabicFamilyService.updatePerson(editData.id, personData);
        personId = editData.id;
      } else {
        const newPerson = await arabicFamilyService.addPerson(personData);
        personId = newPerson.id;
      }

      // Process wives
      if (data.الحالة_الاجتماعية === 'متزوج' && data.wives.length > 0) {
        for (const wife of data.wives) {
          if (!wife.name.trim()) continue;

          // Add wife to النساء table
          const wifeData = {
            الاسم_الأول: wife.name,
            اسم_الأب: wife.father_name || undefined,
            اسم_العائلة: wife.family_name || undefined,
            تاريخ_الميلاد: wife.birth_date || undefined,
            تاريخ_الوفاة: wife.is_deceased ? wife.death_date || undefined : undefined,
            معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع,
            ملاحظات: wife.notes || undefined
          };

          let wifeId: number;
          const { data: newWife, error } = await supabase?.from('النساء').insert([wifeData]).select().single() || {};
          
          if (error) throw error;
          wifeId = newWife?.id;

          // Create relationship
          const relationshipData = {
            woman_id: wifeId,
            person_id: personId,
            نوع_الارتباط: 'زوجة',
            السبب_أو_الحدث: `زواج ${wife.name} من ${fullName}`,
            تاريخ_الحدث: new Date().toISOString().split('T')[0],
            أهمية_الحدث: 'متوسطة'
          };

          await supabase?.from('ارتباط_النساء').insert([relationshipData]);
        }
      }

      // Process children
      if (data.children.length > 0) {
        for (const child of data.children) {
          if (!child.name.trim()) continue;

          // Add child to الأشخاص table
          const childData = {
            الاسم_الأول: child.name,
            father_id: personId,
            mother_id: child.mother_id || null,
            تاريخ_الميلاد: child.birth_date || undefined,
            تاريخ_الوفاة: child.is_deceased ? child.death_date || undefined : undefined,
            الجنس: child.gender,
            معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع, // Inherit father's branch
            ملاحظات: child.notes || undefined
          };

          await arabicFamilyService.addPerson(childData);
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
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {editData?.id ? 'تعديل بيانات الشخص' : 'إضافة شخص جديد'}
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
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-6">
              <h2 className="text-2xl font-bold text-white">المعلومات الأساسية</h2>
              <p className="text-blue-100 mt-2">املأ جميع الحقول المطلوبة بدقة</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  الاسم
                </h3>
                
                <div className="space-y-4">
                  {/* First Name */}
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

                  {/* Additional Names */}
                  {additionalNamesFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          الاسم الإضافي {index + 1}
                        </label>
                        <input
                          {...register(`additional_names.${index}` as const)}
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder={`أدخل الاسم الإضافي ${index + 1}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAdditionalName(index)}
                        className="mt-8 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Name Button */}
                  <button
                    type="button"
                    onClick={addNameField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة اسم آخر
                  </button>
                </div>
              </div>

              {/* Root Person Checkbox */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...register('is_root')}
                    type="checkbox"
                    className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium text-amber-800">هذا الشخص هو جذر العائلة</span>
                    <p className="text-sm text-amber-600">حدد هذا الخيار إذا كان هذا الشخص هو المؤسس الأول للعائلة</p>
                  </div>
                </label>
              </div>

              {/* Ancestors Section (visible only for root person) */}
              {watchIsRoot && (
                <div className="space-y-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-800 border-b border-amber-200 pb-2 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    الأجداد والنسب
                  </h3>
                  <p className="text-amber-700 text-sm mb-4">
                    أدخل معلومات الأجداد والنسب لهذا الشخص الجذر
                  </p>

                  {ancestorsFields.map((field, index) => (
                    <div key={field.id} className="bg-white rounded-xl border border-amber-200 p-4 mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-amber-800">
                          {index === 0 ? 'الأب' : index === 1 ? 'الجد' : index === 2 ? 'الجد الأكبر' : `الجيل ${index + 1}`}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeAncestor(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">الاسم الكامل</label>
                          <input
                            {...register(`ancestors.${index}.name` as const)}
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            placeholder="أدخل الاسم الكامل"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                          <textarea
                            {...register(`ancestors.${index}.notes` as const)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                            placeholder="أي معلومات إضافية عن هذا الشخص"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addAncestorField}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة جد آخر
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    الجنس *
                  </label>
                  <select
                    {...register('الجنس', { required: 'الجنس مطلوب' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
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
                    الحالة الاجتماعية
                  </label>
                  <select
                    {...register('الحالة_الاجتماعية')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">اختر الحالة الاجتماعية</option>
                    <option value="أعزب">أعزب</option>
                    <option value="متزوج">متزوج</option>
                    <option value="مطلق">مطلق</option>
                    <option value="أرمل">أرمل</option>
                  </select>
                </div>
              </div>

              {/* Family Relations */}
              {!watchIsRoot && (
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
                            {person.الاسم_الكامل || person.الاسم_الأول}
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
                        disabled={!watchFatherId || fatherWives.length === 0}
                      >
                        <option value="">اختر الوالدة</option>
                        {fatherWives.map((woman) => (
                          <option key={woman.id} value={woman.id}>
                            {woman.الاسم_الأول} {woman.اسم_الأب || ''} {woman.اسم_العائلة || ''}
                          </option>
                        ))}
                      </select>
                      {watchFatherId && fatherWives.length === 0 && (
                        <p className="text-amber-600 text-xs">
                          لم يتم العثور على زوجات للوالد المحدد
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Birth Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات الولادة
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      {...register('has_birth_data')}
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">هل تتوفر بيانات الولادة؟</span>
                    </div>
                  </label>
                </div>
                
                {watchHasBirthData && (
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
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  معلومات الوفاة
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
                
                {watchIsDeceased && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        {...register('has_death_data')}
                        type="checkbox"
                        className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-800">هل تتوفر بيانات الوفاة؟</span>
                      </div>
                    </label>
                  </div>
                )}
                
                {watchIsDeceased && watchHasDeathData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="w-4 h-4" />
                        تاريخ الوفاة
                      </label>
                      <input
                        {...register('تاريخ_الوفاة')}
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
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

              {/* Branch and Additional Info */}
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
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="أدخل رقم الهاتف"
                      dir="ltr"
                    />
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

              {/* Wives Section - Only visible if married */}
              {watchMaritalStatus === 'متزوج' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    الزوجات
                  </h3>

                  {wivesFields.length === 0 ? (
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 text-center">
                      <Heart className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                      <p className="text-pink-700 mb-4">لم تتم إضافة أي زوجات بعد</p>
                      <button
                        type="button"
                        onClick={addWifeField}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة زوجة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {wivesFields.map((field, index) => (
                        <div key={field.id} className="bg-pink-50 border border-pink-200 rounded-xl p-5">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium text-pink-800 flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              {`الزوجة ${index + 1}`}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeWife(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Wife's Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الاسم الأول *</label>
                              <input
                                {...register(`wives.${index}.name` as const, { required: true })}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم الزوجة"
                              />
                            </div>

                            {/* Father's Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">اسم الأب</label>
                              <input
                                {...register(`wives.${index}.father_name` as const)}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم أب الزوجة"
                              />
                            </div>

                            {/* Family Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">اسم العائلة</label>
                              <input
                                {...register(`wives.${index}.family_name` as const)}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم عائلة الزوجة"
                              />
                            </div>

                            {/* Birth Date */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">تاريخ الميلاد</label>
                              <input
                                {...register(`wives.${index}.birth_date` as const)}
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                              />
                            </div>

                            {/* Is Deceased */}
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex items-center gap-2">
                                <Controller
                                  control={control}
                                  name={`wives.${index}.is_deceased` as const}
                                  render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">متوفاة</span>
                                    </label>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Death Date - Only shown if deceased */}
                            {watch(`wives.${index}.is_deceased`) && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">تاريخ الوفاة</label>
                                <input
                                  {...register(`wives.${index}.death_date` as const)}
                                  type="date"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                />
                              </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                              <textarea
                                {...register(`wives.${index}.notes` as const)}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
                                placeholder="أي معلومات إضافية عن الزوجة"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addWifeField}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة زوجة أخرى
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Children Section - Only visible if married */}
              {watchMaritalStatus === 'متزوج' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    الأبناء
                  </h3>

                  {childrenFields.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                      <Users className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                      <p className="text-blue-700 mb-4">لم تتم إضافة أي أبناء بعد</p>
                      <button
                        type="button"
                        onClick={addChildField}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة ابن
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {childrenFields.map((field, index) => (
                        <div key={field.id} className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium text-blue-800 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {`الابن ${index + 1}`}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeChild(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Child's Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الاسم *</label>
                              <input
                                {...register(`children.${index}.name` as const, { required: true })}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="أدخل اسم الابن"
                              />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الجنس</label>
                              <select
                                {...register(`children.${index}.gender` as const)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              >
                                <option value="ذكر">ذكر</option>
                                <option value="أنثى">أنثى</option>
                              </select>
                            </div>

                            {/* Mother */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الأم</label>
                              <select
                                {...register(`children.${index}.mother_id` as const)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              >
                                <option value="">اختر الأم</option>
                                {wivesFields.map((wife, wifeIndex) => {
                                  const wifeName = watch(`wives.${wifeIndex}.name`);
                                  if (!wifeName) return null;
                                  return (
                                    <option key={wife.id} value={`wife_${wifeIndex}`}>
                                      {wifeName}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Birth Date */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">تاريخ الميلاد</label>
                              <input
                                {...register(`children.${index}.birth_date` as const)}
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>

                            {/* Is Deceased */}
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex items-center gap-2">
                                <Controller
                                  control={control}
                                  name={`children.${index}.is_deceased` as const}
                                  render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">متوفى</span>
                                    </label>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Death Date - Only shown if deceased */}
                            {watch(`children.${index}.is_deceased`) && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">تاريخ الوفاة</label>
                                <input
                                  {...register(`children.${index}.death_date` as const)}
                                  type="date"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                              <textarea
                                {...register(`children.${index}.notes` as const)}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                placeholder="أي معلومات إضافية عن الابن"
                              />
                            </div>
                          </div>

                          {/* Inheritance Info */}
                          <div className="mt-4 bg-blue-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-700" />
                              <p className="text-sm text-blue-800">
                                سيرث هذا الابن معلومات الفرع العائلي من الأب تلقائياً
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addChildField}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة ابن آخر
                      </button>
                    </div>
                  )}
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
                disabled={isSubmitting || nationalIdError !== '' || isCheckingNationalId}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editData?.id ? 'تحديث البيانات' : 'حفظ البيانات'}
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