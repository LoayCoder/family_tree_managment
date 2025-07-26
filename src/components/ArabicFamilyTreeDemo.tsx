import React, { useState, useEffect } from 'react';
import { TreePine, Users, Search, MapPin, Building, User, Crown, Heart, Calendar, Phone, FileText, Database, BarChart3, Globe } from 'lucide-react';
import { arabicFamilyService, PersonWithDetails, Location, Branch } from '../services/arabicFamilyService';
import { ChildrenDisplayManager } from './ChildrenDisplay/ChildrenDisplayManager';
import AdvancedSearchComponent from './AdvancedSearchComponent';
import PersonCard from './PersonCard';

export default function ArabicFamilyTreeDemo() {
  const [persons, setPersons] = useState<PersonWithDetails[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'search' | 'stats'>('tree');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [personsData, locationsData, branchesData, statsData] = await Promise.all([
        arabicFamilyService.getPersonsWithDetails(),
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getAllBranches(),
        arabicFamilyService.getFamilyStatistics()
      ]);

      setPersons(personsData);
      setLocations(locationsData);
      setBranches(branchesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    try {
      const results = await arabicFamilyService.searchPersons(searchTerm);
      setPersons(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleGenerationFilter = async (generation: number | null) => {
    setSelectedGeneration(generation);
    
    if (generation === null) {
      loadData();
      return;
    }

    try {
      const results = await arabicFamilyService.getPersonsByGeneration(generation);
      setPersons(results);
    } catch (error) {
      console.error('Error filtering by generation:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGenerationTitle = (level: number) => {
    const titles = [
      'الجيل الأول - الأجداد',
      'الجيل الثاني - الآباء',
      'الجيل الثالث - الأبناء',
      'الجيل الرابع - الأحفاد',
      'الجيل الخامس - أبناء الأحفاد',
      'الجيل السادس'
    ];
    return titles[level - 1] || `الجيل ${level}`;
  };

  const groupPersonsByGeneration = () => {
    return persons.reduce((acc, person) => {
      const level = person.مستوى_الجيل;
      if (!acc[level]) acc[level] = [];
      acc[level].push(person);
      return acc;
    }, {} as Record<number, PersonWithDetails[]>);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-600">جاري تحميل نظام شجرة آل عمير العربية...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  نظام شجرة آل عمير المتقدم
                </h1>
                <p className="text-gray-600 text-sm">نظام إدارة الأنساب والفروع الجغرافية مع البحث بالهوية الوطنية</p>
              </div>
            </div>
            
            {statistics && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">الرجال:</span>
                  <span className="font-bold text-blue-600">{statistics.totalMen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span className="text-gray-600">النساء:</span>
                  <span className="font-bold text-pink-600">{statistics.totalWomen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-600">الفروع:</span>
                  <span className="font-bold text-emerald-600">{statistics.totalBranches}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-4">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200 w-full max-w-4xl">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
              <button
                onClick={() => setActiveTab('tree')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'tree'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <TreePine className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">شجرة آل عمير</span>
                <span className="sm:hidden">الشجرة</span>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'search'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">البحث المتقدم</span>
                <span className="sm:hidden">البحث</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'stats'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">الإحصائيات</span>
                <span className="sm:hidden">الإحصائيات</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tree View */}
        {activeTab === 'tree' && (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث بالاسم أو رقم الهوية الوطنية..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold"
                >
                  بحث
                </button>
                <select
                  value={selectedGeneration || ''}
                  onChange={(e) => handleGenerationFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="">جميع الأجيال</option>
                  {statistics && Object.keys(statistics.generationCounts).map(level => (
                    <option key={level} value={level}>
                      {getGenerationTitle(parseInt(level))} ({statistics.generationCounts[level]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Family Tree Display - Landscape Optimized */}
            <div className="space-y-6">
              {Object.entries(groupPersonsByGeneration())
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, levelPersons]) => (
                  <div key={level} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    {/* Generation Header */}
                    <div className="flex items-center gap-4 mb-4 pb-3 border-b-2 border-emerald-100">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                        {parseInt(level) === 1 ? <Crown className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {getGenerationTitle(parseInt(level))}
                        </h3>
                        <p className="text-gray-600">
                          {levelPersons.length} شخص في هذا الجيل
                        </p>
                      </div>
                    </div>

                    {/* Persons Grid - Landscape Optimized */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {levelPersons.map((person) => (
                        <PersonCard key={person.id} person={person} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Search View */}
        {activeTab === 'search' && <AdvancedSearchComponent />}

        {/* Statistics View */}
        {activeTab === 'stats' && statistics && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard
                title="إجمالي الرجال"
                value={statistics.totalMen}
                icon={<Users className="w-8 h-8" />}
                color="blue"
              />
              <StatCard
                title="إجمالي النساء"
                value={statistics.totalWomen}
                icon={<Heart className="w-8 h-8" />}
                color="pink"
              />
              <StatCard
                title="عدد الفروع"
                value={statistics.totalBranches}
                icon={<Building className="w-8 h-8" />}
                color="emerald"
              />
              <StatCard
                title="المواقع الجغرافية"
                value={statistics.totalLocations}
                icon={<Globe className="w-8 h-8" />}
                color="purple"
              />
              <StatCard
                title="أقصى جيل"
                value={statistics.maxGeneration}
                icon={<Users className="w-8 h-8" />}
                color="amber"
              />
              <StatCard
                title="الأحداث المهمة"
                value={statistics.totalEvents || 0}
                icon={<Calendar className="w-8 h-8" />}
                color="red"
              />
            </div>

            {/* Generation Statistics */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">إحصائيات الأجيال</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {Object.entries(statistics.generationCounts).map(([level, count]) => (
                  <div key={level} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">
                        {getGenerationTitle(parseInt(level))}
                      </span>
                      <span className="text-xl font-bold text-purple-600">
                        {count as number}
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((count as number) / Math.max(...Object.values(statistics.generationCounts))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'pink' | 'emerald' | 'purple' | 'amber' | 'red';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    pink: 'from-pink-500 to-pink-600 text-pink-600',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    amber: 'from-amber-500 to-amber-600 text-amber-600',
    red: 'from-red-500 to-red-600 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs font-medium">{title}</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{value.toLocaleString('ar-SA')}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}