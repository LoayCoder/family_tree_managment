import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { User, Calendar, MapPin, Phone, FileText, Save, X, Building, Hash, AlertCircle, Image, Skull, Heart, Trash2, Plus, Minus, Users, UserPlus } from 'lucide-react';
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
  additional_names: string[];
  wives: {
    id?: number;
    الاسم_الأول: string;
    اسم_الأب: string;
    اسم_العائلة: string;
    تاريخ_الميلاد: string;
    تاريخ_الوفاة: string;
    الحالة_الاجتماعية: 'عزباء' | 'متزوجة' | 'مطلقة' | 'أرملة';
    ملاحظات: string;
    is_deceased: boolean;
  }[];
  children: {
    id?: number;
    الاسم_الأول: string;
    تاريخ_الميلاد: string;
    تاريخ_الوفاة: string;
    الجنس: 'ذكر' | 'أنثى';
    mother_id: number | '';
    is_deceased: boolean;
    ملاحظات: string;
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
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalIdError, setNationalIdError] = useState<string>('');
  const [isCheckingNationalId, setIsCheckingNationalId] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalNames, setAdditionalNames] = useState<string[]>([]);

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
      additional_names: [],
      wives: [],
      children: []
    } : {
      الجنس: 'ذكر',
      is_root: false,
      الحالة_الاجتماعية: 'أعزب',
      is_deceased: false,
      additional_names: [],
      wives: [],
      children: []
    }
  });

  const { fields: wifeFields, append: appendWife, remove: removeWife } = useFieldArray({
    control,
    name: "wives"
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children"
  });

  const watchDeathDate = watch('تاريخ_الوفاة');
  const watchIsRoot = watch('is_root');
  const watchNationalId = watch('رقم_هوية_وطنية');
  const watchIsDeceased = watch('is_deceased');
  const watchMaritalStatus = watch('الحالة_الاجتماعية');
  const watchImageUrl = watch('صورة_شخصية');
  const watchBranchId = watch('معرف_الفرع');

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

  // Load existing wives and children if editing
  useEffect(() => {
    if (editData?.id) {
      loadWivesAndChildren(editData.id);
    }
  }, [editData?.id]);

  const loadWivesAndChildren = async (personId: number) => {
    try {
      if (!supabase) return;

      // Load wives
      const { data: wivesData, error: wivesError } = await supabase
        .from('ارتباط_النساء')
        .select(`
          id,
          woman_id,
          النساء!inner (
            id,
            الاسم_الأول,
            اسم_الأب,
            اسم_العائلة,
            تاريخ_الميلاد,
            تاريخ_الوفاة,
            الحالة_الاجتماعية,
            ملاحظات
          )
        `)
        .eq('person_id', personId)
        .eq('نوع_الارتباط', 'زوجة');

      if (!wivesError && wivesData) {
        const formattedWives = wivesData.map(relation => ({
          id: relation.النساء.id,
          الاسم_الأول: relation.النساء.الاسم_الأول,
          اسم_الأب: relation.النساء.اسم_الأب || '',
          اسم_العائلة: relation.النساء.اسم_العائلة || '',
          تاريخ_الميلاد: relation.النساء.تاريخ_الميلاد || '',
          تاريخ_الوفاة: relation.النساء.تاريخ_الوفاة || '',
          الحالة_الاجتماعية: relation.النساء.الحالة_الاجتماعية || 'متزوجة',
          ملاحظات: relation.النساء.ملاحظات || '',
          is_deceased: !!relation.النساء.تاريخ_الوفاة
        }));
        
        // Set wives in form
        setValue('wives', formattedWives);
      }

      // Load children
      const { data: childrenData, error: childrenError } = await supabase
        .from('الأشخاص')
        .select('*')
        .eq('father_id', personId);

      if (!childrenError && childrenData) {
        const formattedChildren = childrenData.map(child => ({
          id: child.id,
          الاسم_الأول: child.الاسم_الأول,
          تاريخ_الميلاد: child.تاريخ_الميلاد || '',
          تاريخ_الوفاة: child.تاريخ_الوفاة || '',
          الجنس: child.الجنس || 'ذكر',
          mother_id: child.mother_id || '',
          is_deceased: !!child.تاريخ_الوفاة,
          ملاحظات: child.ملاحظات || ''
        }));
        
        // Set children in form
        setValue('children', formattedChildren);
      }
    } catch (error) {
      console.error('Error loading wives and children:', error);
    }
  };

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
    setAdditionalNames([...additionalNames, '']);
  };

  const removeNameField = (index: number) => {
    const newNames = [...additionalNames];
    newNames.splice(index, 1);
    setAdditionalNames(newNames);
  };

  const updateAdditionalName = (index: number, value: string) => {
    const newNames = [...additionalNames];
    newNames[index] = value;
    setAdditionalNames(newNames);
  };

  const addWife = () => {
    appendWife({
      الاسم_الأول: '',
      اسم_الأب: '',
      اسم_العائلة: '',
      تاريخ_الميلاد: '',
      تاريخ_الوفاة: '',
      الحالة_الاجتماعية: 'متزوجة',
      ملاحظات: '',
      is_deceased: false
    });
  };

  const addChild = () => {
    appendChild({
      الاسم_الأول: '',
      تاريخ_الميلاد: '',
      تاريخ_الوفاة: '',
      الجنس: 'ذكر',
      mother_id: '',
      is_deceased: false,
      ملاحظات: ''
    });
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
      const fullName = [data.الاسم_الأول, ...additionalNames.filter(name => name.trim() !== '')].join(' ');

      const personData = {
        الاسم_الأول: fullName,
        is_root: data.is_root,
        تاريخ_الميلاد: data.تاريخ_الميلاد || undefined,
        تاريخ_الوفاة: data.is_deceased ? data.تاريخ_الوفاة || undefined : undefined,
        مكان_الميلاد: data.مكان_الميلاد === '' ? null : data.مكان_الميلاد,
        مكان_الوفاة: data.is_deceased ? (data.مكان_الوفاة === '' ? null : data.مكان_الوفاة) : null,
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

      if (editData && editData.id) {
        await arabicFamilyService.updatePerson(editData.id, personData);
        personId = editData.id;
      } else {
        const newPerson = await arabicFamilyService.addPerson(personData);
        personId = newPerson.id;
      }

      // Process Wives
      if (data.wives && data.wives.length > 0) {
        for (const wife of data.wives) {
          if (!wife.الاسم_الأول) continue; // Skip empty entries
          
          try {
            // Add or update wife
            let wifeId: number;
            
            if (wife.id) {
              // Update existing wife
              await supabase?.from('النساء').update({
                الاسم_الأول: wife.الاسم_الأول,
                اسم_الأب: wife.اسم_الأب || undefined,
                اسم_العائلة: wife.اسم_العائلة || undefined,
                تاريخ_الميلاد: wife.تاريخ_الميلاد || undefined,
                تاريخ_الوفاة: wife.is_deceased ? wife.تاريخ_الوفاة || undefined : undefined,
                الحالة_الاجتماعية: wife.الحالة_الاجتماعية || 'متزوجة',
                معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع, // Inherit branch from husband
                ملاحظات: wife.ملاحظات || undefined
              }).eq('id', wife.id);
              
              wifeId = wife.id;
            } else {
              // Add new wife
              const { data: newWife, error } = await supabase?.from('النساء').insert([{
                الاسم_الأول: wife.الاسم_الأول,
                اسم_الأب: wife.اسم_الأب || undefined,
                اسم_العائلة: wife.اسم_العائلة || undefined,
                تاريخ_الميلاد: wife.تاريخ_الميلاد || undefined,
                تاريخ_الوفاة: wife.is_deceased ? wife.تاريخ_الوفاة || undefined : undefined,
                الحالة_الاجتماعية: wife.الحالة_الاجتماعية || 'متزوجة',
                معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع, // Inherit branch from husband
                ملاحظات: wife.ملاحظات || undefined
              }]).select().single() || {};
              
              if (error) throw error;
              wifeId = newWife?.id;
            }
            
            // Create relationship if it doesn't exist
            const { data: existingRelation } = await supabase?.from('ارتباط_النساء')
              .select('id')
              .eq('woman_id', wifeId)
              .eq('person_id', personId)
              .eq('نوع_الارتباط', 'زوجة')
              .maybeSingle() || {};
              
            if (!existingRelation) {
              await supabase?.from('ارتباط_النساء').insert([{
                woman_id: wifeId,
                person_id: personId,
                نوع_الارتباط: 'زوجة',
                السبب_أو_الحدث: `زواج ${wife.الاسم_الأول} من ${fullName}`,
                تاريخ_الحدث: new Date().toISOString().split('T')[0],
                أهمية_الحدث: 'متوسطة'
              }]);
            }
          } catch (error) {
            console.error('Error processing wife:', error);
          }
        }
      }

      // Process Children
      if (data.children && data.children.length > 0) {
        for (const child of data.children) {
          if (!child.الاسم_الأول) continue; // Skip empty entries
          
          try {
            // Prepare child data - inherit branch from father
            const childData = {
              الاسم_الأول: child.الاسم_الأول,
              father_id: personId,
              mother_id: child.mother_id || undefined,
              تاريخ_الميلاد: child.تاريخ_الميلاد || undefined,
              تاريخ_الوفاة: child.is_deceased ? child.تاريخ_الوفاة || undefined : undefined,
              الجنس: child.الجنس || 'ذكر',
              معرف_الفرع: data.معرف_الفرع === '' ? null : data.معرف_الفرع, // Inherit branch from father
              ملاحظات: child.ملاحظات || undefined
            };
            
            if (child.id) {
              // Update existing child
              await arabicFamilyService.updatePerson(child.id, childData);
            } else {
              // Add new child
              await arabicFamilyService.addPerson(childData);
            }
          } catch (error) {
            console.error('Error processing child:', error);
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
                  {additionalNames.map((name, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          الاسم الإضافي {index + 1}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => updateAdditionalName(index, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder={`أدخل الاسم الإضافي ${index + 1}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNameField(index)}
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
                      >
                        <option value="">اختر الوالدة</option>
                        {persons.filter(p => p.الجنس === 'أنثى').map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.الاسم_الكامل || person.الاسم_الأول}
                          </option>
                        ))}
                      </select>
                    </div>
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

              {/* Wives Section */}
              {watchMaritalStatus === 'متزوج' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    الزوجات
                  </h3>

                  {wifeFields.length === 0 ? (
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 text-center">
                      <Heart className="w-10 h-10 text-pink-500 mx-auto mb-3" />
                      <p className="text-pink-700 mb-4">لم تتم إضافة أي زوجات بعد</p>
                      <button
                        type="button"
                        onClick={addWife}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة زوجة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {wifeFields.map((field, index) => (
                        <div key={field.id} className="bg-pink-50 border border-pink-200 rounded-xl p-5 relative">
                          <button
                            type="button"
                            onClick={() => removeWife(index)}
                            className="absolute top-3 left-3 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <h4 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5" />
                            الزوجة {index + 1}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">الاسم الأول *</label>
                              <input
                                {...register(`wives.${index}.الاسم_الأول` as const, { required: true })}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل الاسم الأول"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">اسم الأب</label>
                              <input
                                {...register(`wives.${index}.اسم_الأب` as const)}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم الأب"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">اسم العائلة</label>
                              <input
                                {...register(`wives.${index}.اسم_العائلة` as const)}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                placeholder="أدخل اسم العائلة"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">تاريخ الميلاد</label>
                              <input
                                {...register(`wives.${index}.تاريخ_الميلاد` as const)}
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                              />
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  {...register(`wives.${index}.is_deceased` as const)}
                                  type="checkbox"
                                  className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                                />
                                <span className="text-sm font-medium text-gray-700">متوفاة</span>
                              </label>
                            </div>
                            
                            {watch(`wives.${index}.is_deceased`) && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">تاريخ الوفاة</label>
                                <input
                                  {...register(`wives.${index}.تاريخ_الوفاة` as const)}
                                  type="date"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                              <textarea
                                {...register(`wives.${index}.ملاحظات` as const)}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
                                placeholder="أضف أي ملاحظات إضافية"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addWife}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة زوجة أخرى
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Children Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  الأبناء
                </h3>

                {childrenFields.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                    <p className="text-blue-700 mb-4">لم تتم إضافة أي أبناء بعد</p>
                    <button
                      type="button"
                      onClick={addChild}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة ابن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {childrenFields.map((field, index) => (
                      <div key={field.id} className="bg-blue-50 border border-blue-200 rounded-xl p-5 relative">
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="absolute top-3 left-3 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          الابن {index + 1}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">الاسم *</label>
                            <input
                              {...register(`children.${index}.الاسم_الأول` as const, { required: true })}
                              type="text"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="أدخل اسم الابن"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">الجنس</label>
                            <select
                              {...register(`children.${index}.الجنس` as const)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="ذكر">ذكر</option>
                              <option value="أنثى">أنثى</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">تاريخ الميلاد</label>
                            <input
                              {...register(`children.${index}.تاريخ_الميلاد` as const)}
                              type="date"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">الأم</label>
                            <select
                              {...register(`children.${index}.mother_id` as const)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="">اختر الأم</option>
                              {wifeFields.map((wife, wifeIndex) => (
                                <option 
                                  key={wife.id} 
                                  value={watch(`wives.${wifeIndex}.id`) || ''}
                                >
                                  {watch(`wives.${wifeIndex}.الاسم_الأول`) || `الزوجة ${wifeIndex + 1}`}
                                </option>
                              ))}
                              {women.map((woman) => (
                                <option key={woman.id} value={woman.id}>
                                  {woman.الاسم_الأول} {woman.اسم_الأب || ''} {woman.اسم_العائلة || ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                {...register(`children.${index}.is_deceased` as const)}
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">متوفى</span>
                            </label>
                          </div>
                          
                          {watch(`children.${index}.is_deceased`) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">تاريخ الوفاة</label>
                              <input
                                {...register(`children.${index}.تاريخ_الوفاة` as const)}
                                type="date"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                            <textarea
                              {...register(`children.${index}.ملاحظات` as const)}
                              rows={2}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                              placeholder="أضف أي ملاحظات إضافية"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addChild}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة ابن آخر
                    </button>
                  </div>
                )}
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