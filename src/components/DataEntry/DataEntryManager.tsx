import React, { useState } from 'react';
import { Plus, Users, MapPin, Building, Calendar, FileText, Volume2, Download, Upload, Database, FileSpreadsheet } from 'lucide-react';
import PersonForm from './PersonForm';
import WomanForm from './WomanForm';
import LocationForm from './LocationForm';
import BranchForm from './BranchForm';
import EventForm from './EventForm';
import AudioFileForm from './AudioFileForm';
import TextDocumentForm from './TextDocumentForm';
import ExportImportManager from './ExportImportManager';
import ExcelImportExport from './ExcelImportExport';
import PersonDetailsView from './PersonDetailsView';
import { arabicFamilyService } from '../../services/arabicFamilyService';

type FormType = 'person' | 'woman' | 'location' | 'branch' | 'event' | 'audio' | 'text' | 'export-import' | 'excel' | 'person-details';

interface FormOption {
  id: FormType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

export default function DataEntryManager() {
  const [activeForm, setActiveForm] = useState<FormType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  const formOptions: FormOption[] = [
    {
      id: 'person',
      title: 'إضافة شخص (رجل)',
      description: 'إضافة رجل جديد إلى شجرة آل عمير مع كامل المعلومات',
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'woman',
      title: 'إضافة امرأة',
      description: 'إضافة امرأة جديدة مع معلومات الارتباط العائلي',
      icon: <Users className="w-6 h-6" />,
      color: 'pink',
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      id: 'location',
      title: 'إضافة موقع جغرافي',
      description: 'إضافة موقع جديد (دولة، منطقة، مدينة)',
      icon: <MapPin className="w-6 h-6" />,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'branch',
      title: 'إضافة فرع عائلي',
      description: 'إضافة فرع جديد لآل عمير مع الموقع الجغرافي',
      icon: <Building className="w-6 h-6" />,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'event',
      title: 'إضافة حدث',
      description: 'توثيق حدث مهم في تاريخ آل عمير',
      icon: <Calendar className="w-6 h-6" />,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'audio',
      title: 'إضافة ملف صوتي',
      description: 'رفع وتوثيق تسجيل صوتي للأرشيف العائلي',
      icon: <Volume2 className="w-6 h-6" />,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'text',
      title: 'إضافة نص أو وثيقة',
      description: 'إضافة نص مكتوب أو وثيقة للأرشيف',
      icon: <FileText className="w-6 h-6" />,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      id: 'excel',
      title: 'استيراد/تصدير Excel',
      description: 'تصدير أو استيراد البيانات بتنسيق Excel',
      icon: <FileSpreadsheet className="w-6 h-6" />,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'export-import',
      title: 'تصدير واستيراد JSON',
      description: 'تصدير البيانات أو استيراد بيانات بتنسيق JSON',
      icon: <Database className="w-6 h-6" />,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600'
    }
  ];

  const handleDataAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveForm(null);
    // Show success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    successDiv.textContent = 'تم حفظ البيانات بنجاح!';
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  };

  const handlePersonSelect = async (personId: number) => {
    setSelectedPersonId(personId);
    setActiveForm('person-details');
  };

  const renderActiveForm = () => {
    switch (activeForm) {
      case 'person':
        return <PersonForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'woman':
        return <WomanForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'location':
        return <LocationForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'branch':
        return <BranchForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'event':
        return <EventForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'audio':
        return <AudioFileForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'text':
        return <TextDocumentForm onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'export-import':
        return <ExportImportManager onCancel={() => setActiveForm(null)} />;
      case 'excel':
        return <ExcelImportExport onSuccess={handleDataAdded} onCancel={() => setActiveForm(null)} />;
      case 'person-details':
        return selectedPersonId ? (
          <PersonDetailsView 
            personId={selectedPersonId} 
            onClose={() => setActiveForm(null)} 
            onDataUpdated={handleDataAdded} 
          />
        ) : null;
      default:
        return null;
    }
  };

  if (activeForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        {renderActiveForm()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                مركز إدخال البيانات
              </h1>
              <p className="text-gray-600 text-lg">إضافة وإدارة جميع بيانات شجرة آل عمير</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center py-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            اختر نوع البيانات المراد إضافتها
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            استخدم النماذج التالية لإضافة معلومات جديدة إلى قاعدة بيانات آل عمير.
            جميع النماذج مصممة لضمان دقة وشمولية البيانات المدخلة.
          </p>
        </div>

        {/* Form Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {formOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setActiveForm(option.id)}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden cursor-pointer"
            >
              {/* Header with gradient */}
              <div className={`h-3 bg-gradient-to-r ${option.gradient}`}></div>
              
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${option.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {option.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                      {option.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {option.description}
                </p>

                {/* Action Button */}
                <div className="flex justify-end">
                  <div className={`px-4 py-2 bg-gradient-to-r ${option.gradient} text-white rounded-lg text-sm font-medium group-hover:shadow-lg transition-all duration-300`}>
                    ابدأ الإدخال
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Person Search Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">البحث عن شخص لتعديل بياناته</h3>
            <p className="text-gray-600">ابحث عن شخص موجود في قاعدة البيانات لعرض تفاصيله أو تعديل بياناته</p>
          </div>

          <PersonSearchSection onPersonSelect={handlePersonSelect} />
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">إحصائيات سريعة</h3>
            <p className="text-gray-600">نظرة عامة على البيانات المدخلة حديثاً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-700">إدخال جديد</div>
              <div className="text-sm text-blue-600">أشخاص ونساء</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-emerald-700">مواقع جديدة</div>
              <div className="text-sm text-emerald-600">أماكن وفروع</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-orange-700">أحداث مهمة</div>
              <div className="text-sm text-orange-600">توثيق التاريخ</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-purple-700">محتوى رقمي</div>
              <div className="text-sm text-purple-600">صوتيات ونصوص</div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-amber-800 mb-3">نصائح لإدخال البيانات</h4>
              <ul className="space-y-2 text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>تأكد من دقة التواريخ والأسماء قبل الحفظ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>استخدم الأرقام الوطنية للتأكد من عدم التكرار</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>أضف المراجع والمصادر لتوثيق المعلومات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>استخدم خاصية التصدير لعمل نسخ احتياطية دورية</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Person Search Component
interface PersonSearchSectionProps {
  onPersonSelect: (personId: number) => void;
}

function PersonSearchSection({ onPersonSelect }: PersonSearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const results = await arabicFamilyService.searchPersons(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching persons:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="ابحث بالاسم أو رقم الهوية..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !searchTerm.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'بحث'
          )}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((person) => (
            <div
              key={person.id}
              onClick={() => onPersonSelect(person.id)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{person.الاسم_الكامل}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      الجيل {person.مستوى_الجيل}
                    </span>
                    {person.رقم_هوية_وطنية && (
                      <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full text-blue-600 font-mono" dir="ltr">
                        {person.رقم_هوية_وطنية}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchTerm && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">لم يتم العثور على نتائج</p>
        </div>
      )}
    </div>
  );
}