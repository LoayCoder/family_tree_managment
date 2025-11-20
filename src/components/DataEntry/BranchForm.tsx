import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Save, X, MapPin, Calendar, FileText } from 'lucide-react';
import { arabicFamilyService, Location, Branch } from '../../services/arabicFamilyService';

interface BranchFormData {
  اسم_الفرع: string;
  وصف_الفرع: string;
  الفرع_الأصل: number | '';
  معرف_الموقع: number | '';
  تاريخ_التأسيس: string;
  ملاحظات: string;
}

interface BranchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BranchForm({ onSuccess, onCancel }: BranchFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BranchFormData>();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locationsData, branchesData] = await Promise.all([
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getAllBranches()
      ]);
      setLocations(locationsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      const branchData = {
        اسم_الفرع: data.اسم_الفرع,
        وصف_الفرع: data.وصف_الفرع || undefined,
        الفرع_الأصل: data.الفرع_الأصل || undefined,
        معرف_الموقع: data.معرف_الموقع || undefined,
        تاريخ_التأسيس: data.تاريخ_التأسيس || undefined,
        ملاحظات: data.ملاحظات || undefined
      };

      await arabicFamilyService.addBranch(branchData);
      onSuccess();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  إضافة فرع عائلي جديد
                </h1>
                <p className="text-gray-600">إنشاء فرع جديد لآل عمير مع الموقع الجغرافي</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
              <h2 className="text-2xl font-bold text-white">معلومات الفرع العائلي</h2>
              <p className="text-purple-100 mt-2">أدخل تفاصيل الفرع الجديد</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Branch Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building className="w-4 h-4" />
                  اسم الفرع *
                </label>
                <input
                  {...register('اسم_الفرع', { required: 'اسم الفرع مطلوب' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="أدخل اسم الفرع العائلي"
                />
                {errors.اسم_الفرع && (
                  <p className="text-red-500 text-sm">{errors.اسم_الفرع.message}</p>
                )}
              </div>

              {/* Branch Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  وصف الفرع
                </label>
                <textarea
                  {...register('وصف_الفرع')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                  placeholder="أدخل وصفاً للفرع العائلي"
                />
              </div>

              {/* Parent Branch */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building className="w-4 h-4" />
                  الفرع الأصل
                </label>
                <select
                  {...register('الفرع_الأصل')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">اختر الفرع الأصل (اتركه فارغاً للفرع الرئيسي)</option>
                  {branches.map((branch) => (
                    <option key={branch.معرف_الفرع} value={branch.معرف_الفرع}>
                      {branch.اسم_الفرع}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  الموقع الجغرافي
                </label>
                <select
                  {...register('معرف_الموقع')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">اختر الموقع الجغرافي</option>
                  {locations.map((location) => (
                    <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                      {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Establishment Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  تاريخ التأسيس
                </label>
                <input
                  {...register('تاريخ_التأسيس')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  ملاحظات
                </label>
                <textarea
                  {...register('ملاحظات')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                  placeholder="أضف أي ملاحظات إضافية"
                />
              </div>

              {/* Example */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-medium text-purple-800 mb-2">مثال:</h4>
                <div className="text-sm text-purple-700 space-y-1">
                  <p><strong>اسم الفرع:</strong> فرع آل عمير بالرياض</p>
                  <p><strong>وصف الفرع:</strong> فرع آل عمير في مدينة الرياض، تأسس في عام 1950</p>
                  <p><strong>الفرع الأصل:</strong> الفرع الرئيسي</p>
                  <p><strong>الموقع:</strong> السعودية، منطقة الرياض، الرياض</p>
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ الفرع
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