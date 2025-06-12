import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  User, Users, TreePine, Heart, Plus, Minus, Trash2, Save, 
  X, ChevronDown, ChevronUp, Crown, UserPlus, UserMinus 
} from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface AncestorField {
  name: string;
  generation: number;
}

interface WifeField {
  name: string;
  id: string;
}

interface ChildField {
  name: string;
  mother_id: string;
}

interface FamilyTreeFormData {
  fullName: string;
  isRoot: boolean;
  ancestors: AncestorField[];
  wives: WifeField[];
  children: ChildField[];
  birthDate?: string;
  deathDate?: string;
  notes?: string;
}

export default function FamilyTreeEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAncestors, setShowAncestors] = useState(false);
  const [ancestorSections, setAncestorSections] = useState<{[key: number]: boolean}>({});
  const [wivesSection, setWivesSection] = useState(true);
  const [childrenSection, setChildrenSection] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FamilyTreeFormData>({
    defaultValues: {
      fullName: '',
      isRoot: false,
      ancestors: [],
      wives: [{ name: '', id: Date.now().toString() }],
      children: [],
      birthDate: '',
      deathDate: '',
      notes: ''
    }
  });

  const { fields: ancestorFields, append: appendAncestor, remove: removeAncestor } = useFieldArray({
    control,
    name: 'ancestors'
  });

  const { fields: wifeFields, append: appendWife, remove: removeWife } = useFieldArray({
    control,
    name: 'wives'
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: 'children'
  });

  const watchIsRoot = watch('isRoot');
  const watchWives = watch('wives');

  // Update ancestor sections when isRoot changes
  useEffect(() => {
    setShowAncestors(watchIsRoot);
    
    // If becoming root and no ancestors, add father field
    if (watchIsRoot && ancestorFields.length === 0) {
      appendAncestor({ name: '', generation: 1 });
      setAncestorSections({ 1: true });
    }
  }, [watchIsRoot, ancestorFields.length, appendAncestor]);

  const getGenerationTitle = (generation: number) => {
    const titles = [
      'الأب',
      'الجد',
      'الجد الأكبر',
      'جد الجد',
      'الجد الخامس',
      'الجد السادس',
      'الجد السابع',
      'الجد الثامن',
      'الجد التاسع',
      'الجد العاشر'
    ];
    
    return titles[generation - 1] || `الجد رقم ${generation}`;
  };

  const addAncestor = () => {
    const nextGeneration = ancestorFields.length + 1;
    appendAncestor({ name: '', generation: nextGeneration });
    setAncestorSections({ ...ancestorSections, [nextGeneration]: true });
  };

  const addWife = () => {
    appendWife({ name: '', id: Date.now().toString() });
  };

  const addChild = () => {
    if (wifeFields.length > 0) {
      appendChild({ 
        name: '', 
        mother_id: wifeFields[0].id 
      });
    } else {
      appendChild({ 
        name: '', 
        mother_id: '' 
      });
    }
  };

  const toggleSection = (section: string, index?: number) => {
    if (section === 'ancestors' && index !== undefined) {
      setAncestorSections({
        ...ancestorSections,
        [index]: !ancestorSections[index]
      });
    } else if (section === 'wives') {
      setWivesSection(!wivesSection);
    } else if (section === 'children') {
      setChildrenSection(!childrenSection);
    }
  };

  const onSubmit = async (data: FamilyTreeFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Form data:', data);
      
      // Here you would normally save the data to your database
      // For this example, we'll just simulate a successful submission
      
      // Example of how you might save to Supabase:
      if (supabase) {
        // First, create the main person
        const { data: personData, error: personError } = await supabase
          .from('الأشخاص')
          .insert([{
            الاسم_الأول: data.fullName,
            is_root: data.isRoot,
            تاريخ_الميلاد: data.birthDate || null,
            تاريخ_الوفاة: data.deathDate || null,
            ملاحظات: data.notes || null,
            // The path will be set automatically by the trigger
            path: '0'
          }])
          .select()
          .single();
          
        if (personError) throw personError;
        
        // If we have wives, add them
        if (data.wives.length > 0) {
          const wivesPromises = data.wives.filter(wife => wife.name.trim() !== '').map(async (wife) => {
            const { data: wifeData, error: wifeError } = await supabase
              .from('النساء')
              .insert([{
                الاسم_الأول: wife.name,
                اسم_العائلة: data.fullName.split(' ').pop() || '',
                الحالة_الاجتماعية: 'متزوجة'
              }])
              .select()
              .single();
              
            if (wifeError) throw wifeError;
            
            // Create relationship
            const { error: relationError } = await supabase
              .from('ارتباط_النساء')
              .insert([{
                woman_id: wifeData.id,
                person_id: personData.id,
                نوع_الارتباط: 'زوجة',
                السبب_أو_الحدث: `زواج ${wifeData.الاسم_الأول} من ${personData.الاسم_الأول}`
              }]);
              
            if (relationError) throw relationError;
            
            return { ...wifeData, originalId: wife.id };
          });
          
          const wivesData = await Promise.all(wivesPromises);
          
          // If we have children, add them
          if (data.children.length > 0) {
            const childrenPromises = data.children.filter(child => child.name.trim() !== '').map(async (child) => {
              // Find the actual wife ID from our saved wives
              const wifeMatch = wivesData.find(w => w.originalId === child.mother_id);
              
              const { error: childError } = await supabase
                .from('الأشخاص')
                .insert([{
                  الاسم_الأول: child.name,
                  father_id: personData.id,
                  // The path will be set automatically by the trigger
                  path: '0'
                }]);
                
              if (childError) throw childError;
            });
            
            await Promise.all(childrenPromises);
          }
        }
      }
      
      setSuccessMessage('تم حفظ بيانات العائلة بنجاح!');
      
      // Reset form after successful submission
      setValue('fullName', '');
      setValue('isRoot', false);
      setValue('ancestors', []);
      setValue('wives', [{ name: '', id: Date.now().toString() }]);
      setValue('children', []);
      setValue('birthDate', '');
      setValue('deathDate', '');
      setValue('notes', '');
      
    } catch (error) {
      console.error('Error saving family tree data:', error);
      setErrorMessage('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md">
          <TreePine className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">نموذج إدخال شجرة العائلة</h2>
          <p className="text-gray-600">أدخل معلومات العائلة بالتفصيل</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-start gap-3">
          <div className="p-1 bg-emerald-100 rounded-full">
            <Save className="w-5 h-5 text-emerald-600" />
          </div>
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
          <div className="p-1 bg-red-100 rounded-full">
            <X className="w-5 h-5 text-red-600" />
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              المعلومات الشخصية
            </h3>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                الاسم الكامل *
              </label>
              <div className="flex gap-2">
                <input
                  {...register('fullName', { required: 'الاسم الكامل مطلوب' })}
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل الاسم الكامل"
                />
                <button
                  type="button"
                  onClick={() => setValue('fullName', '')}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="مسح"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Root Checkbox */}
            <div className="flex items-center gap-3">
              <input
                {...register('isRoot')}
                type="checkbox"
                id="isRoot"
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isRoot" className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-medium">هذا الشخص هو جذر العائلة</span>
              </label>
            </div>

            {/* Birth and Death Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  تاريخ الميلاد
                </label>
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  تاريخ الوفاة
                </label>
                <input
                  {...register('deathDate')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ملاحظات
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                placeholder="أي معلومات إضافية عن هذا الشخص"
              />
            </div>
          </div>
        </div>

        {/* Ancestral Lineage Section */}
        {watchIsRoot && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                سلسلة النسب
              </h3>
              <button
                type="button"
                onClick={addAncestor}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                إضافة جد
              </button>
            </div>

            <div className="space-y-4">
              {ancestorFields.map((field, index) => (
                <div key={field.id} className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {getGenerationTitle(index + 1)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSection('ancestors', index + 1)}
                        className="p-1 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        {ancestorSections[index + 1] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAncestor(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {ancestorSections[index + 1] && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          {...register(`ancestors.${index}.name` as const)}
                          type="text"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                          placeholder={`اسم ${getGenerationTitle(index + 1)} كاملاً`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedAncestors = [...ancestorFields];
                            updatedAncestors[index] = { ...updatedAncestors[index], name: '' };
                            setValue('ancestors', updatedAncestors);
                          }}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="مسح"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wives Section */}
        <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-pink-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              الزوجات
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSection('wives')}
                className="p-1 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
              >
                {wivesSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={addWife}
                className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                إضافة زوجة
              </button>
            </div>
          </div>

          {wivesSection && (
            <div className="space-y-4">
              {wifeFields.map((field, index) => (
                <div key={field.id} className="bg-white rounded-xl p-4 border border-pink-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-pink-800 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {`الزوجة ${index + 1}`}
                    </h4>
                    {wifeFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWife(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      {...register(`wives.${index}.name` as const)}
                      type="text"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                      placeholder="اسم الزوجة كاملاً"
                    />
                    <input type="hidden" {...register(`wives.${index}.id` as const)} />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedWives = [...wifeFields];
                        updatedWives[index] = { ...updatedWives[index], name: '' };
                        setValue('wives', updatedWives);
                      }}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="مسح"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Children Section */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              الأبناء
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSection('children')}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {childrenSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={addChild}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                disabled={wifeFields.length === 0 || !wifeFields[0].name}
              >
                <Plus className="w-4 h-4" />
                إضافة ابن
              </button>
            </div>
          </div>

          {childrenSection && (
            <div className="space-y-4">
              {childrenFields.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-xl border border-blue-200">
                  <Users className="w-12 h-12 text-blue-200 mx-auto mb-2" />
                  <p className="text-blue-600">لا يوجد أبناء حتى الآن</p>
                  <button
                    type="button"
                    onClick={addChild}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 text-sm"
                    disabled={wifeFields.length === 0 || !wifeFields[0].name}
                  >
                    <UserPlus className="w-4 h-4" />
                    إضافة ابن
                  </button>
                </div>
              ) : (
                childrenFields.map((field, index) => (
                  <div key={field.id} className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-800 flex items-center gap-2">
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

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          {...register(`children.${index}.name` as const)}
                          type="text"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="اسم الابن كاملاً"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedChildren = [...childrenFields];
                            updatedChildren[index] = { ...updatedChildren[index], name: '' };
                            setValue('children', updatedChildren);
                          }}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="مسح"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {wifeFields.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            الأم
                          </label>
                          <select
                            {...register(`children.${index}.mother_id` as const)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">اختر الأم</option>
                            {wifeFields.map((wife, wifeIndex) => (
                              <option key={wife.id} value={wife.id}>
                                {wife.name || `الزوجة ${wifeIndex + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ شجرة العائلة
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}