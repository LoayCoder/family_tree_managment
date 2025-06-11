import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Phone, FileText, Edit, X, Building, Heart, Skull, Users, Plus, ArrowLeft } from 'lucide-react';
import { arabicFamilyService, PersonWithDetails } from '../../services/arabicFamilyService';
import { supabase } from '../../services/arabicFamilyService';
import PersonForm from './PersonForm';
import WomanForm from './WomanForm';

interface PersonDetailsViewProps {
  personId: number;
  onClose: () => void;
  onDataUpdated: () => void;
}

interface Woman {
  id: number;
  الاسم_الأول: string;
  اسم_الأب?: string;
  اسم_العائلة?: string;
}

interface Relationship {
  id: number;
  woman_id: number;
  person_id: number;
  نوع_الارتباط: string;
  تاريخ_الحدث?: string;
  woman?: {
    الاسم_الأول: string;
    اسم_الأب?: string;
    اسم_العائلة?: string;
  };
}

export default function PersonDetailsView({ personId, onClose, onDataUpdated }: PersonDetailsViewProps) {
  const [person, setPerson] = useState<PersonWithDetails | null>(null);
  const [children, setChildren] = useState<PersonWithDetails[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'family' | 'add'>('details');
  const [addingType, setAddingType] = useState<'child' | 'wife' | null>(null);

  useEffect(() => {
    loadPersonData();
  }, [personId]);

  const loadPersonData = async () => {
    setLoading(true);
    try {
      // Load person details
      const personsData = await arabicFamilyService.getPersonsWithDetails();
      const foundPerson = personsData.find(p => p.id === personId);
      
      if (!foundPerson) {
        throw new Error('Person not found');
      }
      
      setPerson(foundPerson);
      
      // Load children
      const childrenData = personsData.filter(p => p.father_id === personId);
      setChildren(childrenData);
      
      // Load relationships (wives)
      if (supabase) {
        const { data: relationshipsData, error } = await supabase
          .from('ارتباط_النساء')
          .select(`
            id,
            woman_id,
            person_id,
            نوع_الارتباط,
            تاريخ_الحدث,
            النساء!inner (
              الاسم_الأول,
              اسم_الأب,
              اسم_العائلة
            )
          `)
          .eq('person_id', personId)
          .eq('نوع_الارتباط', 'زوجة');
        
        if (!error && relationshipsData) {
          const formattedRelationships = relationshipsData.map(rel => ({
            ...rel,
            woman: rel.النساء
          }));
          setRelationships(formattedRelationships);
        }
      }
    } catch (error) {
      console.error('Error loading person data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    loadPersonData();
    onDataUpdated();
  };

  const handleAddComplete = () => {
    setAddingType(null);
    setActiveTab('family');
    loadPersonData();
    onDataUpdated();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (isEditing && person) {
    return <PersonForm onSuccess={handleEditComplete} onCancel={() => setIsEditing(false)} editData={person} />;
  }

  if (addingType === 'child') {
    return (
      <PersonForm 
        onSuccess={handleAddComplete} 
        onCancel={() => setAddingType(null)} 
        editData={{ father_id: personId }}
      />
    );
  }

  if (addingType === 'wife') {
    return (
      <WomanForm 
        onSuccess={handleAddComplete} 
        onCancel={() => setAddingType(null)} 
      />
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-8 bg-red-50 rounded-xl border border-red-200">
            <h3 className="text-xl font-bold text-red-700 mb-2">لم يتم العثور على الشخص</h3>
            <p className="text-red-600 mb-4">لا يمكن العثور على بيانات الشخص المطلوب</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {person.الاسم_الكامل}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded-full text-blue-700">
                    الجيل {person.مستوى_الجيل}
                  </span>
                  {person.is_root && (
                    <span className="text-sm bg-amber-100 px-2 py-1 rounded-full text-amber-700">
                      جذر العائلة
                    </span>
                  )}
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                    {person.اسم_الفرع || 'غير محدد الفرع'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                title="تعديل البيانات"
              >
                <Edit className="w-6 h-6" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-6 py-4">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200 max-w-md mx-auto">
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5" />
              التفاصيل
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'family'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              العائلة
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-5 h-5" />
              إضافة
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-4">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column - Image */}
                  <div className="w-full md:w-1/3">
                    {person.صورة_شخصية ? (
                      <img 
                        src={person.صورة_شخصية} 
                        alt={person.الاسم_الأول} 
                        className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                        <User className="w-24 h-24 text-gray-300" />
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm text-gray-600">الحالة:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          person.تاريخ_الوفاة 
                            ? 'bg-gray-100 text-gray-700 border border-gray-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {person.تاريخ_الوفاة ? 'متوفى' : 'على قيد الحياة'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm text-gray-600">الجنس:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          person.الجنس === 'ذكر'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-pink-100 text-pink-700 border border-pink-200'
                        }`}>
                          {person.الجنس}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm text-gray-600">الحالة الاجتماعية:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                          {person.الحالة_الاجتماعية || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Details */}
                  <div className="w-full md:w-2/3 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        المعلومات الشخصية
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="text-sm text-gray-500">تاريخ الميلاد:</span>
                            <p className="font-medium text-gray-800">{formatDate(person.تاريخ_الميلاد)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="text-sm text-gray-500">مكان الميلاد:</span>
                            <p className="font-medium text-gray-800">{person.مكان_الميلاد || 'غير محدد'}</p>
                          </div>
                        </div>
                        
                        {person.تاريخ_الوفاة && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <Calendar className="w-5 h-5 text-gray-600" />
                              <div>
                                <span className="text-sm text-gray-500">تاريخ الوفاة:</span>
                                <p className="font-medium text-gray-800">{formatDate(person.تاريخ_الوفاة)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <MapPin className="w-5 h-5 text-gray-600" />
                              <div>
                                <span className="text-sm text-gray-500">مكان الوفاة:</span>
                                <p className="font-medium text-gray-800">{person.مكان_الوفاة || 'غير محدد'}</p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {person.رقم_هوية_وطنية && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <span className="text-sm text-gray-500">رقم الهوية الوطنية:</span>
                              <p className="font-medium text-gray-800 font-mono" dir="ltr">{person.رقم_هوية_وطنية}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        المعلومات المهنية والتعليمية
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <Building className="w-5 h-5 text-indigo-600" />
                          <div>
                            <span className="text-sm text-gray-500">المنصب أو المهنة:</span>
                            <p className="font-medium text-gray-800">{person.المنصب || 'غير محدد'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <div>
                            <span className="text-sm text-gray-500">مستوى التعليم:</span>
                            <p className="font-medium text-gray-800">{person.مستوى_التعليم || 'غير محدد'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {person.ملاحظات && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          ملاحظات
                        </h3>
                        
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-amber-800 whitespace-pre-line">{person.ملاحظات}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 space-y-8">
                {/* Wives Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    الزوجات
                  </h3>
                  
                  {relationships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relationships.map(relationship => (
                        <div key={relationship.id} className="bg-pink-50 rounded-xl border border-pink-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {relationship.woman?.الاسم_الأول} {relationship.woman?.اسم_الأب || ''} {relationship.woman?.اسم_العائلة || ''}
                              </h4>
                              {relationship.تاريخ_الحدث && (
                                <p className="text-sm text-gray-600 mt-1">
                                  تاريخ الزواج: {formatDate(relationship.تاريخ_الحدث)}
                                </p>
                              )}
                            </div>
                            <button
                              className="p-1 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">لا توجد زوجات مسجلة</p>
                    </div>
                  )}
                </div>
                
                {/* Children Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    الأبناء
                  </h3>
                  
                  {children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {children.map(child => (
                        <div key={child.id} className="bg-blue-50 rounded-xl border border-blue-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">{child.الاسم_الأول}</h4>
                              {child.تاريخ_الميلاد && (
                                <p className="text-sm text-gray-600 mt-1">
                                  تاريخ الميلاد: {formatDate(child.تاريخ_الميلاد)}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  child.تاريخ_الوفاة 
                                    ? 'bg-gray-100 text-gray-700 border border-gray-200' 
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {child.تاريخ_الوفاة ? 'متوفى' : 'على قيد الحياة'}
                                </span>
                              </div>
                            </div>
                            <button
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">لا يوجد أبناء مسجلين</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Tab */}
        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 space-y-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">إضافة بيانات جديدة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add Child */}
                  <div 
                    className="bg-blue-50 rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setAddingType('child')}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">إضافة ابن جديد</h4>
                    </div>
                    <p className="text-gray-600 mb-4">
                      إضافة ابن جديد لهذا الشخص مع تحديد جميع المعلومات الشخصية والعائلية
                    </p>
                    <div className="flex justify-end">
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        إضافة ابن
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Wife */}
                  <div 
                    className="bg-pink-50 rounded-xl border border-pink-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setAddingType('wife')}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-pink-100 rounded-xl">
                        <Heart className="w-8 h-8 text-pink-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">إضافة زوجة جديدة</h4>
                    </div>
                    <p className="text-gray-600 mb-4">
                      إضافة زوجة جديدة لهذا الشخص وربطها به في قاعدة البيانات
                    </p>
                    <div className="flex justify-end">
                      <div className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium">
                        إضافة زوجة
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}