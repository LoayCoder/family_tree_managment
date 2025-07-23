import React, { useState, useEffect } from 'react';
import { Crown, User, ArrowLeft, Search, Filter, MapPin, Calendar, Building, Phone, Mail, Award, BookOpen, Users, Star, Heart, Eye, Edit, Plus } from 'lucide-react';
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
  person?: {
    الاسم_الكامل: string;
    تاريخ_الميلاد?: string;
    مكان_الميلاد?: string;
    المنصب?: string;
    مستوى_التعليم?: string;
  };
  woman?: {
    الاسم_الأول: string;
    اسم_الأب?: string;
    اسم_العائلة?: string;
    تاريخ_الميلاد?: string;
    المنصب?: string;
    مستوى_التعليم?: string;
  };
}

interface NotablesPageProps {
  onBack: () => void;
  user?: any;
}

export default function NotablesPage({ onBack, user }: NotablesPageProps) {
  const [notables, setNotables] = useState<Notable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedNotable, setSelectedNotable] = useState<Notable | null>(null);

  const categories = [
    'Current Tribal Leaders',
    'Judges and Legal Experts', 
    'Business Leaders',
    'Scholars and Academics',
    'Poets and Artists',
    'Historical Figures'
  ];

  const categoryTranslations: Record<string, string> = {
    'Current Tribal Leaders': 'قادة القبيلة الحاليون',
    'Judges and Legal Experts': 'القضاة وخبراء القانون',
    'Business Leaders': 'رجال الأعمال',
    'Scholars and Academics': 'العلماء والأكاديميون',
    'Poets and Artists': 'الشعراء والفنانون',
    'Historical Figures': 'الشخصيات التاريخية'
  };

  useEffect(() => {
    loadNotables();
  }, []);

  const loadNotables = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('notables')
        .select(`
          *,
          الأشخاص!notables_person_id_fkey(
            الاسم_الكامل,
            تاريخ_الميلاد,
            مكان_الميلاد,
            المنصب,
            مستوى_التعليم
          ),
          النساء!notables_woman_id_fkey(
            الاسم_الأول,
            اسم_الأب,
            اسم_العائلة,
            تاريخ_الميلاد,
            المنصب,
            مستوى_التعليم
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedNotables = data?.map(notable => ({
        ...notable,
        person: notable.الأشخاص,
        woman: notable.النساء
      })) || [];

      setNotables(formattedNotables);
    } catch (error) {
      console.error('Error loading notables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotables = notables.filter(notable => {
    const name = notable.full_name || 
                 notable.person?.الاسم_الكامل || 
                 `${notable.woman?.الاسم_الأول || ''} ${notable.woman?.اسم_الأب || ''} ${notable.woman?.اسم_العائلة || ''}`.trim();
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notable.biography && notable.biography.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || notable.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders': return <Crown className="w-5 h-5" />;
      case 'Judges and Legal Experts': return <Award className="w-5 h-5" />;
      case 'Business Leaders': return <Building className="w-5 h-5" />;
      case 'Scholars and Academics': return <BookOpen className="w-5 h-5" />;
      case 'Poets and Artists': return <Star className="w-5 h-5" />;
      case 'Historical Figures': return <Users className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders': return 'from-amber-500 to-amber-600 text-amber-600';
      case 'Judges and Legal Experts': return 'from-purple-500 to-purple-600 text-purple-600';
      case 'Business Leaders': return 'from-emerald-500 to-emerald-600 text-emerald-600';
      case 'Scholars and Academics': return 'from-blue-500 to-blue-600 text-blue-600';
      case 'Poets and Artists': return 'from-pink-500 to-pink-600 text-pink-600';
      case 'Historical Figures': return 'from-gray-500 to-gray-600 text-gray-600';
      default: return 'from-gray-500 to-gray-600 text-gray-600';
    }
  };

  const getNotableName = (notable: Notable) => {
    if (notable.full_name) return notable.full_name;
    if (notable.person) return notable.person.الاسم_الكامل;
    if (notable.woman) {
      return `${notable.woman.الاسم_الأول} ${notable.woman.اسم_الأب || ''} ${notable.woman.اسم_العائلة || ''}`.trim();
    }
    return 'غير محدد';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  شخصيات بارزة من آل عمير
                </h1>
                <p className="text-gray-600">جاري تحميل الشخصيات...</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الشخصيات البارزة...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
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
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  شخصيات بارزة من آل عمير
                </h1>
                <p className="text-gray-600">أعلام ووجهاء القبيلة عبر التاريخ</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {filteredNotables.length} شخصية
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث في الشخصيات البارزة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
            
            <div className="relative min-w-[250px]">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                <option value="">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {categoryTranslations[category] || category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Notable Button for Admins/Editors */}
        {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
          <div className="mb-8">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg">
              <Plus className="w-5 h-5" />
              إضافة شخصية بارزة جديدة
            </button>
          </div>
        )}

        {/* Categories Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map(category => {
            const count = notables.filter(n => n.category === category).length;
            const colorClass = getCategoryColor(category);
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-amber-50 border-amber-300 shadow-md'
                    : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass.split(' ').slice(0, 2).join(' ')} w-fit mx-auto mb-2`}>
                  <div className="text-white">
                    {getCategoryIcon(category)}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-1">
                  {categoryTranslations[category]}
                </div>
                <div className="text-xs text-gray-500">
                  {count} شخصية
                </div>
              </button>
            );
          })}
        </div>

        {/* Notables Grid */}
        {filteredNotables.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
            <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد شخصيات</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory ? 'لم يتم العثور على شخصيات تطابق معايير البحث' : 'لم يتم إضافة أي شخصيات بارزة بعد'}
            </p>
            {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
              <button className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors">
                إضافة أول شخصية بارزة
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotables.map((notable) => (
              <div
                key={notable.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => setSelectedNotable(notable)}
              >
                {/* Profile Image */}
                <div className="h-48 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                  {notable.profile_picture_url ? (
                    <img
                      src={notable.profile_picture_url}
                      alt={getNotableName(notable)}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-20 h-20 text-amber-300" />
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(notable.category).split(' ').slice(0, 2).join(' ')} text-white`}>
                      {getCategoryIcon(notable.category)}
                      {categoryTranslations[notable.category]}
                    </span>
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {getNotableName(notable)}
                  </h3>
                  
                  {/* Position/Title */}
                  {(notable.person?.المنصب || notable.woman?.المنصب || notable.positions) && (
                    <p className="text-amber-600 font-medium text-sm mb-3">
                      {notable.person?.المنصب || notable.woman?.المنصب || notable.positions}
                    </p>
                  )}

                  {/* Biography Preview */}
                  {notable.biography && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {notable.biography.length > 150 
                        ? notable.biography.substring(0, 150) + '...'
                        : notable.biography
                      }
                    </p>
                  )}

                  {/* Education */}
                  {(notable.person?.مستوى_التعليم || notable.woman?.مستوى_التعليم || notable.education) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{notable.person?.مستوى_التعليم || notable.woman?.مستوى_التعليم || notable.education}</span>
                    </div>
                  )}

                  {/* Birth Date */}
                  {(notable.person?.تاريخ_الميلاد || notable.woman?.تاريخ_الميلاد) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(notable.person?.تاريخ_الميلاد || notable.woman?.تاريخ_الميلاد)}</span>
                    </div>
                  )}

                  {/* Read More */}
                  <div className="flex justify-end mt-4">
                    <button className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors">
                      <Eye className="w-4 h-4" />
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notable Details Modal */}
        {selectedNotable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedNotable(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(selectedNotable.category).split(' ').slice(0, 2).join(' ')}`}>
                        <div className="text-white">
                          {getCategoryIcon(selectedNotable.category)}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {categoryTranslations[selectedNotable.category]}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {getNotableName(selectedNotable)}
                    </h2>
                    
                    {(selectedNotable.person?.المنصب || selectedNotable.woman?.المنصب || selectedNotable.positions) && (
                      <p className="text-amber-600 font-medium">
                        {selectedNotable.person?.المنصب || selectedNotable.woman?.المنصب || selectedNotable.positions}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
                      <button className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedNotable(null)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column - Image and Basic Info */}
                  <div className="lg:w-1/3">
                    {/* Profile Image */}
                    <div className="mb-6">
                      {selectedNotable.profile_picture_url ? (
                        <img
                          src={selectedNotable.profile_picture_url}
                          alt={getNotableName(selectedNotable)}
                          className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl border border-gray-200 flex items-center justify-center">
                          <User className="w-24 h-24 text-amber-300" />
                        </div>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-3">
                      {(selectedNotable.person?.تاريخ_الميلاد || selectedNotable.woman?.تاريخ_الميلاد) && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <Calendar className="w-5 h-5 text-amber-600" />
                          <div>
                            <span className="block text-sm text-amber-600 font-medium">تاريخ الميلاد</span>
                            <span className="block text-sm text-gray-800 font-semibold">
                              {formatDate(selectedNotable.person?.تاريخ_الميلاد || selectedNotable.woman?.تاريخ_الميلاد)}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedNotable.person?.مكان_الميلاد && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="block text-sm text-emerald-600 font-medium">مكان الميلاد</span>
                            <span className="block text-sm text-gray-800 font-semibold">
                              {selectedNotable.person.مكان_الميلاد}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedNotable.contact_info && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="block text-sm text-blue-600 font-medium">معلومات التواصل</span>
                            <span className="block text-sm text-gray-800 font-semibold">
                              {selectedNotable.contact_info}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Detailed Information */}
                  <div className="lg:w-2/3 space-y-6">
                    {/* Biography */}
                    {selectedNotable.biography && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          السيرة الذاتية
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl">
                          {selectedNotable.biography}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {(selectedNotable.person?.مستوى_التعليم || selectedNotable.woman?.مستوى_التعليم || selectedNotable.education) && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          التعليم والمؤهلات
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <p className="text-gray-700 leading-relaxed">
                            {selectedNotable.person?.مستوى_التعليم || selectedNotable.woman?.مستوى_التعليم || selectedNotable.education}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Positions */}
                    {(selectedNotable.person?.المنصب || selectedNotable.woman?.المنصب || selectedNotable.positions) && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          المناصب والمسؤوليات
                        </h3>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedNotable.person?.المنصب || selectedNotable.woman?.المنصب || selectedNotable.positions}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Publications */}
                    {selectedNotable.publications && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          المؤلفات والإنجازات
                        </h3>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedNotable.publications}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Legacy */}
                    {selectedNotable.legacy && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          الإرث والتأثير
                        </h3>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedNotable.legacy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for Empty State */}
        {notables.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full w-fit mx-auto mb-6">
                <Crown className="w-16 h-16 text-amber-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                شخصيات بارزة من آل عمير
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                هذا القسم مخصص لعرض الشخصيات البارزة والمؤثرة من أبناء قبيلة آل عمير عبر التاريخ.
                سيتم إضافة المزيد من الشخصيات قريباً لتوثيق إنجازاتهم ومساهماتهم في خدمة القبيلة والمجتمع.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    قادة وشيوخ القبيلة
                  </h4>
                  <p className="text-amber-700 text-sm">
                    الشخصيات القيادية التي تولت مسؤوليات قيادة القبيلة وإدارة شؤونها
                  </p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    العلماء والمفكرون
                  </h4>
                  <p className="text-blue-700 text-sm">
                    العلماء والمثقفون الذين أثروا الحياة الفكرية والثقافية للقبيلة
                  </p>
                </div>
                
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    رجال الأعمال
                  </h4>
                  <p className="text-emerald-700 text-sm">
                    رواد الأعمال والتجار الذين ساهموا في التنمية الاقتصادية
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    الشعراء والأدباء
                  </h4>
                  <p className="text-purple-700 text-sm">
                    الشعراء والأدباء الذين أبدعوا في مجال الأدب والشعر العربي
                  </p>
                </div>
              </div>

              {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
                <div className="mt-8">
                  <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg font-semibold">
                    ابدأ بإضافة الشخصيات البارزة
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}