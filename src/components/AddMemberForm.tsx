import React, { useState, useEffect } from 'react';
import { useForm, watch } from 'react-hook-form';
import { Plus, User, Calendar, Phone, FileText, Heart, Skull } from 'lucide-react';
import { FamilyMember, FamilyMemberFormData } from '../types/FamilyMember';
import { familyService } from '../services/supabase';

interface AddMemberFormProps {
  onMemberAdded: () => void;
}

export default function AddMemberForm({ onMemberAdded }: AddMemberFormProps) {
  const [parents, setParents] = useState<FamilyMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FamilyMemberFormData>({
    defaultValues: {
      is_alive: true,
      date_of_death: ''
    }
  });

  // Watch the is_alive and date_of_death fields for dynamic behavior
  const isAlive = watch('is_alive') === 'true';
  const dateOfDeath = watch('date_of_death');

  useEffect(() => {
    loadParents();
  }, []);

  // Handle automatic status changes based on date of death input
  useEffect(() => {
    if (dateOfDeath && dateOfDeath.trim() !== '') {
      setValue('is_alive', false);
    }
  }, [dateOfDeath, setValue]);

  // Handle clearing date of death when status changes to living
  useEffect(() => {
    if (isAlive) {
      setValue('date_of_death', '');
    }
  }, [isAlive, setValue]);

  const loadParents = async () => {
    try {
      const members = await familyService.getAllMembers();
      setParents(members);
    } catch (error) {
      console.error('Error loading parents:', error);
    }
  };

  const onSubmit = async (data: FamilyMemberFormData) => {
    setIsSubmitting(true);
    try {
      await familyService.addMember({
        name: data.name,
        parent_id: data.parent_id || null,
        birth_date: data.birth_date || null,
        gender: (data.gender as 'ذكر' | 'أنثى') || null,
        phone: data.phone || null,
        notes: data.notes || null,
        is_alive: data.is_alive === 'true',
        date_of_death: (data.is_alive === 'false' && data.date_of_death) ? data.date_of_death : null,
      });

      reset({
        name: '',
        parent_id: '',
        birth_date: '',
        gender: '',
        phone: '',
        notes: '',
        is_alive: true,
        date_of_death: ''
      });
      onMemberAdded();
      loadParents(); // Refresh parent options
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'تم إضافة العضو بنجاح!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
    } catch (error) {
      console.error('Error adding member:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'حدث خطأ أثناء إضافة العضو';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">إضافة عضو جديد للعائلة</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              الاسم الكامل
            </label>
            <input
              {...register('name', { required: 'الاسم مطلوب' })}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="أدخل الاسم الكامل"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Parent Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              الوالد/الوالدة
            </label>
            <select
              {...register('parent_id')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">اختر الوالد (اتركه فارغاً للجذر)</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              تاريخ الميلاد
            </label>
            <input
              {...register('birth_date')}
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              الجنس
            </label>
            <select
              {...register('gender')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">اختر الجنس</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="w-4 h-4" />
              رقم الهاتف
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="أدخل رقم الهاتف"
            />
          </div>

          {/* Status Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Heart className="w-4 h-4" />
              الحالة
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('is_alive')}
                    type="radio"
                    value="true"
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Heart className="w-4 h-4 text-emerald-600" />
                    على قيد الحياة
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('is_alive')}
                    type="radio"
                    value="false"
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Skull className="w-4 h-4 text-gray-600" />
                    متوفى
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Date of Death */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              تاريخ الوفاة
            </label>
            <input
              {...register('date_of_death', {
                required: !isAlive ? 'تاريخ الوفاة مطلوب للمتوفين' : false
              })}
              type="date"
              disabled={isAlive}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                isAlive ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
              }`}
            />
            {errors.date_of_death && (
              <p className="text-red-500 text-sm">{errors.date_of_death.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4" />
              ملاحظات
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
              placeholder="أضف أي ملاحظات إضافية"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              جاري الإضافة...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة العضو للعائلة
            </div>
          )}
        </button>
      </form>
    </div>
  );
}