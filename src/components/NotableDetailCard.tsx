import React, { useState, useEffect } from 'react';
import { Crown, ArrowLeft, User, GraduationCap, Briefcase, BookOpen, Phone, Mail, Award, MapPin, Calendar, FileText, Edit, Trash2, Star } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface Notable {
  id: number;
  person_id?: number;
  woman_id?: number;
  full_name?: string;
  category: string;
  biography?: string;
  education?: string;
  positions?: string;
  publications?: string;
  contact_info?: string;
  legacy?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface NotableDetailCardProps {
  notableId: number;
  onBack: () => void;
  user?: any;
}

export default function NotableDetailCard({ notableId, onBack, user }: NotableDetailCardProps) {
  const [notable, setNotable] = useState<Notable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotableDetails();
  }, [notableId]);

  const loadNotableDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('notables')
        .select('*')
        .eq('id', notableId)
        .single();

      if (error) throw error;
      setNotable(data);
    } catch (error: any) {
      console.error('Error loading notable details:', error);
      setError('فشل في تحميل تفاصيل الشخصية');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'Judges and Legal Experts':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'Business Leaders':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
      case 'Scholars and Academics':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'Poets and Artists':
        return 'bg-gradient-to-r from-pink-500 to-pink-600 text-white';
      case 'Historical Figures':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders':
        return <Crown className="w-6 h-6" />;
      case 'Judges and Legal Experts':
        return <Award className="w-6 h-6" />;
      case 'Business Leaders':
        return <Briefcase className="w-6 h-6" />;
      case 'Scholars and Academics':
        return <GraduationCap className="w-6 h-6" />;
      case 'Poets and Artists':
        return <Star className="w-6 h-6" />;
      case 'Historical Figures':
        return <BookOpen className="w-6 h-6" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders':
        return 'القيادات القبلية الحالية';
      case 'Judges and Legal Experts':
        return 'القضاة والخبراء القانونيون';
      case 'Business Leaders':
        return 'قادة الأعمال';
      case 'Scholars and Academics':
        return 'العلماء والأكاديميون';
      case 'Poets and Artists':
        return 'الشعراء والفنانون';
      case 'Historical Figures':
        return 'الشخصيات التاريخية';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-600">جاري تحميل تفاصيل الشخصية...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-6">
            <User className="w-12 h-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">خطأ في التحميل</h2>
          
          <p className="text-gray-600 mb-6">
            {error || 'لم يتم العثور على تفاصيل هذه الشخصية'}
          </p>
          
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className={`p-3 rounded-2xl shadow-lg ${getCategoryColor(notable.category)}`}>
                {getCategoryIcon(notable.category)}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  {notable.full_name || 'شخصية بارزة'}
                </h1>
                <p className="text-gray-600">{getCategoryTitle(notable.category)}</p>
              </div>
            </div>
            
            {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {user.user_level === 'admin' && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Hero Section */}
            <div className={`relative p-8 sm:p-12 ${getCategoryColor(notable.category)}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Profile Picture */}
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white flex-shrink-0">
                  {notable.profile_picture_url ? (
                    <img
                      src={notable.profile_picture_url}
                      alt={notable.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <User className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Basic Info */}
                <div className="text-center md:text-right text-white flex-1">
                  <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                    {notable.full_name || 'شخصية بارزة'}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                    {getCategoryIcon(notable.category)}
                    <span className="text-xl font-semibold">
                      {getCategoryTitle(notable.category)}
                    </span>
                  </div>
                  
                  {notable.positions && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                      <h3 className="text-lg font-semibold mb-2">المناصب الحالية</h3>
                      <p className="text-white/90 leading-relaxed">{notable.positions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="p-8 sm:p-12 space-y-8">
              {/* Biography */}
              {notable.biography && (
                <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">السيرة الذاتية</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {notable.biography}
                  </div>
                </section>
              )}

              {/* Education */}
              {notable.education && (
                <section className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">التعليم والمؤهلات</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {notable.education}
                  </div>
                </section>
              )}

              {/* Publications */}
              {notable.publications && (
                <section className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">المؤلفات والإنجازات</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {notable.publications}
                  </div>
                </section>
              )}

              {/* Legacy */}
              {notable.legacy && (
                <section className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">الإرث والتأثير</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {notable.legacy}
                  </div>
                </section>
              )}

              {/* Contact Information */}
              {notable.contact_info && (
                <section className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Phone className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">معلومات التواصل</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {notable.contact_info}
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">معلومات إضافية</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">تاريخ الإضافة:</span>
                      <p className="font-medium text-gray-800">{formatDate(notable.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-500">آخر تحديث:</span>
                      <p className="font-medium text-gray-800">{formatDate(notable.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  العودة للقائمة
                </button>
                
                {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
                  <div className="flex items-center gap-3">
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold flex items-center gap-2"
                    >
                      <Edit className="w-5 h-5" />
                      تعديل البيانات
                    </button>
                    
                    {user.user_level === 'admin' && (
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold flex items-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        حذف الشخصية
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}