import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Save, X } from 'lucide-react';
import { arabicFamilyService } from '../../services/arabicFamilyService';

interface LocationFormData {
  الدولة: string;
  المنطقة: string;
  المدينة: string;
  تفاصيل_إضافية: string;
}

interface LocationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LocationForm({ onSuccess, onCancel }: LocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LocationFormData>();

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      const locationData = {
        الدولة: data.الدولة,
        المنطقة: data.المنطقة || undefined,
        المدينة: data.المدينة || undefined,
        تفاصيل_إضافية: data.تفاصيل_إضافية || undefined
      };

      await arabicFamilyService.addLocation(locationData);
      onSuccess();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  إضافة موقع جغرافي جديد
                </h1>
                <p className="text-gray-600">إضافة موقع جديد لقاعدة البيانات الجغرافية</p>
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
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6">
              <h2 className="text-2xl font-bold text-white">معلومات الموقع</h2>
              <p className="text-emerald-100 mt-2">أدخل تفاصيل الموقع الجغرافي</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Country */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  الدولة *
                </label>
                <input
                  {...register('الدولة', { required: 'اسم الدولة مطلوب' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل اسم الدولة"
                />
                {errors.الدولة && (
                  <p className="text-red-500 text-sm">{errors.الدولة.message}</p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  المنطقة أو الولاية
                </label>
                <input
                  {...register('المنطقة')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل اسم المنطقة أو الولاية"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  المدينة
                </label>
                <input
                  {...register('المدينة')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل اسم المدينة"
                />
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  تفاصيل إضافية
                </label>
                <textarea
                  {...register('تفاصيل_إضافية')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  placeholder="أضف أي تفاصيل إضافية عن الموقع (اختياري)"
                />
              </div>

              {/* Example */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-medium text-emerald-800 mb-2">مثال:</h4>
                <div className="text-sm text-emerald-700 space-y-1">
                  <p><strong>الدولة:</strong> السعودية</p>
                  <p><strong>المنطقة:</strong> منطقة الرياض</p>
                  <p><strong>المدينة:</strong> الرياض</p>
                  <p><strong>تفاصيل إضافية:</strong> العاصمة، حي النخيل</p>
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
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ الموقع
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