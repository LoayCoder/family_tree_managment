import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, User, Calendar, Phone, FileText, Volume2, BookOpen, Filter, X, Loader2 } from 'lucide-react';
import { arabicFamilyService } from '../services/arabicFamilyService';

interface SearchResult {
  id: number;
  title: string;
  type: string;
  description: string;
  date?: string;
  location?: string;
  additionalInfo?: string;
  importance?: string;
}

interface Location {
  معرف_الموقع: number;
  الدولة: string;
  المنطقة?: string;
  المدينة?: string;
}

interface Branch {
  معرف_الفرع: number;
  اسم_الفرع: string;
}

export default function AdvancedSearchComponent() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Search states
  const [nationalIdSearch, setNationalIdSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  
  // Active search type
  const [activeSearchType, setActiveSearchType] = useState<'general' | 'nationalId' | 'branch' | 'location' | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [locationsData, branchesData] = await Promise.all([
        arabicFamilyService.getAllLocations(),
        arabicFamilyService.getAllBranches()
      ]);
      setLocations(locationsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setActiveSearchType(null);
    setNationalIdSearch('');
    setSelectedBranch('');
    setSelectedLocation('');
    setGeneralSearch('');
  };

  const handleGeneralSearch = async () => {
    if (!generalSearch.trim()) return;
    
    setLoading(true);
    setActiveSearchType('general');
    
    try {
      const results = await arabicFamilyService.searchPersons(generalSearch);
      const formattedResults: SearchResult[] = results.map(person => ({
        id: person.id,
        title: person.الاسم_الكامل || person.الاسم_الأول,
        type: 'شخص',
        description: `الجيل ${person.مستوى_الجيل} - ${person.اسم_الفرع || 'غير محدد'}`,
        date: person.تاريخ_الميلاد || undefined,
        location: person.مكان_الميلاد || undefined,
        additionalInfo: person.رقم_هوية_وطنية || undefined,
        importance: 'عادية'
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error in general search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNationalIdSearch = async () => {
    if (!nationalIdSearch.trim()) return;
    
    setLoading(true);
    setActiveSearchType('nationalId');
    
    try {
      // البحث في الرجال والنساء
      const [menResults, womenResults] = await Promise.all([
        arabicFamilyService.searchByNationalIdMen(nationalIdSearch),
        arabicFamilyService.searchByNationalIdWomen(nationalIdSearch)
      ]);
      
      const formattedResults: SearchResult[] = [
        ...menResults.map((person: any) => ({
          id: person.id,
          title: person.الاسم_الكامل || person.الاسم_الأول,
          type: 'رجل',
          description: `الجيل ${person.مستوى_الجيل} - ${person.اسم_الفرع || 'غير محدد'}`,
          date: person.تاريخ_الميلاد || undefined,
          location: person.مكان_الميلاد || undefined,
          additionalInfo: person.رقم_هوية_وطنية,
          importance: 'عالية'
        })),
        ...womenResults.map((woman: any) => ({
          id: woman.id + 1000000,
          title: `${woman.الاسم_الأول} ${woman.اسم_الأب || ''} ${woman.اسم_العائلة || ''}`.trim(),
          type: 'امرأة',
          description: `عائلة ${woman.اسم_العائلة || 'غير محدد'}`,
          date: woman.تاريخ_الميلاد || undefined,
          location: undefined,
          additionalInfo: woman.رقم_هوية_وطنية,
          importance: 'عالية'
        }))
      ];
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error in national ID search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSearch = async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    setActiveSearchType('branch');
    
    try {
      // Find the branch name from the selected branch ID
      const selectedBranchData = branches.find(branch => branch.معرف_الفرع === parseInt(selectedBranch));
      if (!selectedBranchData) {
        setSearchResults([]);
        return;
      }

      const results = await arabicFamilyService.getPersonsByBranchName(selectedBranchData.اسم_الفرع);
      const formattedResults: SearchResult[] = results.map(person => ({
        id: person.id,
        title: person.الاسم_الكامل || person.الاسم_الأول,
        type: 'شخص',
        description: `الجيل ${person.مستوى_الجيل} - ${person.اسم_الفرع}`,
        date: person.تاريخ_الميلاد || undefined,
        location: person.مكان_الميلاد || undefined,
        additionalInfo: person.رقم_هوية_وطنية || undefined,
        importance: 'متوسطة'
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error in branch search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setActiveSearchType('location');
    
    try {
      // البحث في الأشخاص حسب الموقع
      const allPersons = await arabicFamilyService.getPersonsWithDetails();
      const locationData = locations.find(loc => loc.معرف_الموقع === parseInt(selectedLocation));
      
      if (!locationData) {
        setSearchResults([]);
        return;
      }
      
      const locationString = `${locationData.الدولة}${locationData.المنطقة ? ', ' + locationData.المنطقة : ''}${locationData.المدينة ? ', ' + locationData.المدينة : ''}`;
      
      const filteredResults = allPersons.filter(person => 
        person.مكان_الميلاد?.includes(locationData.الدولة) ||
        person.مكان_الوفاة?.includes(locationData.الدولة)
      );
      
      const formattedResults: SearchResult[] = filteredResults.map(person => ({
        id: person.id,
        title: person.الاسم_الكامل || person.الاسم_الأول,
        type: 'شخص',
        description: `الجيل ${person.مستوى_الجيل} - ${person.اسم_الفرع || 'غير محدد'}`,
        date: person.تاريخ_الميلاد || undefined,
        location: person.مكان_الميلاد || undefined,
        additionalInfo: person.رقم_هوية_وطنية || undefined,
        importance: 'متوسطة'
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error in location search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getSearchTypeTitle = () => {
    switch (activeSearchType) {
      case 'general': return 'نتائج البحث العام';
      case 'nationalId': return 'نتائج البحث بالهوية الوطنية';
      case 'branch': return 'نتائج البحث بالفرع';
      case 'location': return 'نتائج البحث بالموقع';
      default: return 'نتائج البحث';
    }
  };

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'عالية': return 'bg-red-100 text-red-800 border-red-200';
      case 'متوسطة': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'عادية': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">البحث المتقدم</h2>
            <p className="text-gray-600">ابحث في قاعدة البيانات باستخدام معايير مختلفة</p>
          </div>
        </div>

        {/* Clear Search Button */}
        {(searchResults.length > 0 || activeSearchType) && (
          <div className="mb-6">
            <button
              onClick={clearSearch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              مسح البحث
            </button>
          </div>
        )}

        {/* Search Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* General Search */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              البحث العام
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ابحث بالاسم أو أي معلومة..."
                value={generalSearch}
                onChange={(e) => setGeneralSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGeneralSearch()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleGeneralSearch}
                disabled={loading || !generalSearch.trim()}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && activeSearchType === 'general' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                بحث
              </button>
            </div>
          </div>

          {/* National ID Search */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              البحث بالهوية الوطنية
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="أدخل رقم الهوية الوطنية"
                value={nationalIdSearch}
                onChange={(e) => setNationalIdSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNationalIdSearch()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                dir="ltr"
              />
              <button
                onClick={handleNationalIdSearch}
                disabled={loading || !nationalIdSearch.trim()}
                className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && activeSearchType === 'nationalId' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                بحث
              </button>
            </div>
          </div>

          {/* Branch Search */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              البحث بالفرع
            </h3>
            <div className="space-y-3">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">اختر الفرع</option>
                {branches.map(branch => (
                  <option key={branch.معرف_الفرع} value={branch.معرف_الفرع}>
                    {branch.اسم_الفرع}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBranchSearch}
                disabled={loading || !selectedBranch}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && activeSearchType === 'branch' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Building className="w-4 h-4" />
                )}
                بحث
              </button>
            </div>
          </div>

          {/* Location Search */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              البحث بالموقع
            </h3>
            <div className="space-y-3">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">اختر الموقع</option>
                {locations.map(location => (
                  <option key={location.معرف_الموقع} value={location.معرف_الموقع}>
                    {location.الدولة}{location.المنطقة && `, ${location.المنطقة}`}{location.المدينة && `, ${location.المدينة}`}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLocationSearch}
                disabled={loading || !selectedLocation}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && activeSearchType === 'location' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                بحث
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">{getSearchTypeTitle()}</h3>
            <span className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-700">
              {searchResults.length} نتيجة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 p-6"
              >
                {/* Result Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{result.title}</h4>
                      <span className="text-sm text-gray-600">{result.type}</span>
                    </div>
                  </div>
                  {result.importance && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImportanceColor(result.importance)}`}>
                      {result.importance}
                    </span>
                  )}
                </div>

                {/* Result Details */}
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">{result.description}</p>
                  
                  {result.date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-medium">{formatDate(result.date)}</span>
                    </div>
                  )}

                  {result.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">المكان:</span>
                      <span className="font-medium">{result.location}</span>
                    </div>
                  )}

                  {result.additionalInfo && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">معلومات إضافية:</span>
                      <span className="font-medium font-mono" dir="ltr">{result.additionalInfo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {activeSearchType && searchResults.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">لم يتم العثور على نتائج تطابق معايير البحث المحددة</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-600">جاري البحث...</p>
          </div>
        </div>
      )}
    </div>
  );
}