import React, { useState, useEffect } from 'react';
import { Crown, Search, Filter, User, GraduationCap, Briefcase, BookOpen, Award, Star, ArrowLeft, Plus, Eye } from 'lucide-react';
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

interface NotablesPageProps {
  onBack: () => void;
  onViewDetails: (notableId: number) => void;
  user?: any;
}

export default function NotablesPage({ onBack, onViewDetails, user }: NotablesPageProps) {
  const [notables, setNotables] = useState<Notable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

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
        .select('*')
        .order('category, full_name');

      if (error) throw error;

      setNotables(data || []);
      
      // Extract unique categories
      const categories = [...new Set((data || []).map(notable => notable.category))];
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Error loading notables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotables = notables.filter(notable => {
    const matchesSearch = notable.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notable.biography?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notable.positions?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || notable.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Current Tribal Leaders':
        return 'from-red-500 to-red-600';
      case 'Judges and Legal Experts':
        return 'from-blue-500 to-blue-600';
      case 'Business Leaders':
        return 'from-emerald-500 to-emerald-600';
      case 'Scholars and Academics':
        return 'from-purple-500 to-purple-600';
      case 'Poets and Artists':
        return 'from-pink-500 to-pink-600';
      case 'Historical Figures':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-red-500 rounded-2xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  الشخصيات البارزة في آل عمير
                </h1>
                <p className="text-gray-600">جاري تحميل البيانات...</p>
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
              <div className="p-3 bg-gradient-to-r from-amber-500 to-red-500 rounded-2xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  الشخصيات البارزة في آل عمير
                </h1>
                <p className="text-gray-600">تعرف على أبرز شخصيات القبيلة وإنجازاتهم</p>
              </div>
            </div>
            
            {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
              <button
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة شخصية
              </button>
            )}
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
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryTitle(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {availableCategories.map(category => {
            const count = notables.filter(n => n.category === category).length;
            return (
              <div key={category} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 text-center">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(category)} w-fit mx-auto mb-2`}>
                  <div className="text-white">
                    {getCategoryIcon(category)}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-600">{getCategoryTitle(category)}</div>
              </div>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotables.map((notable) => (
              <div
                key={notable.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => onViewDetails(notable.id)}
              >
                {/* Category Header */}
                <div className={`h-3 bg-gradient-to-r ${getCategoryColor(notable.category)}`}></div>
                
                <div className="p-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex-shrink-0">
                      {notable.profile_picture_url ? (
                        <img
                          src={notable.profile_picture_url}
                          alt={notable.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">
                        {notable.full_name || 'شخصية بارزة'}
                      </h3>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(notable.category)}`}>
                        {getCategoryIcon(notable.category)}
                        <span className="text-white">{getCategoryTitle(notable.category)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Position */}
                  {notable.positions && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">المناصب الحالية</span>
                      </div>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {truncateText(notable.positions, 100)}
                      </p>
                    </div>
                  )}

                  {/* Biography Preview */}
                  {notable.biography && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">نبذة مختصرة</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {truncateText(notable.biography, 120)}
                      </p>
                    </div>
                  )}

                  {/* Education Preview */}
                  {notable.education && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">التعليم</span>
                      </div>
                      <p className="text-sm text-purple-700 leading-relaxed">
                        {truncateText(notable.education, 80)}
                      </p>
                    </div>
                  )}

                  {/* Publications Preview */}
                  {notable.publications && (
                    <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">المؤلفات</span>
                      </div>
                      <p className="text-sm text-emerald-700 leading-relaxed">
                        {truncateText(notable.publications, 80)}
                      </p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(notable.id);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getCategoryColor(notable.category)} text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium text-sm`}
                    >
                      <Eye className="w-4 h-4" />
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for New Users */}
        {notables.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
            <div className="p-6 bg-amber-100 rounded-full w-fit mx-auto mb-6">
              <Crown className="w-16 h-16 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">مرحباً بك في صفحة الشخصيات البارزة</h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              هذه الصفحة مخصصة لعرض الشخصيات البارزة والمؤثرة في تاريخ آل عمير. 
              ستجد هنا القادة والعلماء والشعراء وأصحاب الإنجازات المميزة من أبناء القبيلة.
            </p>
            
            {user && (user.user_level === 'admin' || user.user_level === 'editor') && (
              <button
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-red-500 text-white rounded-2xl hover:from-amber-600 hover:to-red-600 transition-all duration-200 font-bold text-lg shadow-lg flex items-center gap-3 mx-auto"
              >
                <Plus className="w-6 h-6" />
                إضافة أول شخصية بارزة
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}