import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, User, Calendar, Phone, Heart, Skull, Baby } from 'lucide-react';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService } from '../services/supabase';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import ResponsiveText from './responsive/ResponsiveText';

interface FamilyDirectoryProps {
  refreshTrigger: number;
}

interface FamilyMemberWithChildren extends FamilyMemberWithLevel {
  children: FamilyMemberWithChildren[];
  childrenCount: number;
}

export default function FamilyDirectory({ refreshTrigger }: FamilyDirectoryProps) {
  const [members, setMembers] = useState<FamilyMemberWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFamilyDirectory();
  }, [refreshTrigger]);

  const loadFamilyDirectory = async () => {
    setLoading(true);
    try {
      const data = await familyService.getFamilyTree();
      const structuredData = buildFamilyStructure(data);
      setMembers(structuredData);
    } catch (error) {
      console.error('Error loading family directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFamilyStructure = (flatMembers: FamilyMemberWithLevel[]): FamilyMemberWithChildren[] => {
    const memberMap = new Map<string, FamilyMemberWithChildren>();
    
    // Initialize all members with empty children arrays
    flatMembers.forEach(member => {
      memberMap.set(member.id, {
        ...member,
        children: [],
        childrenCount: 0
      });
    });

    const rootMembers: FamilyMemberWithChildren[] = [];

    // Build the tree structure
    flatMembers.forEach(member => {
      const memberWithChildren = memberMap.get(member.id)!;
      
      if (member.parent_id) {
        const parent = memberMap.get(member.parent_id);
        if (parent) {
          parent.children.push(memberWithChildren);
          parent.childrenCount = parent.children.length;
        }
      } else {
        rootMembers.push(memberWithChildren);
      }
    });

    return rootMembers;
  };

  const toggleCardExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedCards(newExpanded);
  };

  const filterMembers = (members: FamilyMemberWithChildren[], searchTerm: string): FamilyMemberWithChildren[] => {
    if (!searchTerm) return members;
    
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = member.children.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesSearch || hasMatchingChildren;
    }).map(member => ({
      ...member,
      children: member.children.filter(child =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | null, deathDate: string | null = null): string => {
    if (!birthDate) return 'غير محدد';
    
    const birth = new Date(birthDate);
    const endDate = deathDate ? new Date(deathDate) : new Date();
    const age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      return `${age - 1} سنة`;
    }
    
    return `${age} سنة`;
  };

  const filteredMembers = filterMembers(members, searchTerm);

  if (loading) {
    return (
      <ResponsiveContainer>
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-3 text-lg font-medium text-gray-600">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري تحميل دليل آل عمير...</span>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <ResponsiveText as="h2" size="2xl" weight="bold" color="gray-800">
                دليل آل عمير التفاعلي
              </ResponsiveText>
              <ResponsiveText size="sm" color="gray-600">
                عدد الأعضاء: {members.reduce((total, member) => total + 1 + member.childrenCount, 0)}
              </ResponsiveText>
            </div>
          </div>
          
          {/* Search */}
          <div className="w-full sm:w-auto max-w-md">
            <input
              type="text"
              placeholder="البحث في دليل آل عمير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>
        </div>

        {/* Family Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-600">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2" />
              <ResponsiveText as="h3" size="xl" weight="semibold" color="gray-600" className="mb-2">
                لا توجد نتائج
              </ResponsiveText>
              <ResponsiveText size="base" color="gray-500">
                لم يتم العثور على أعضاء يطابقون البحث
              </ResponsiveText>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                isExpanded={expandedCards.has(member.id)}
                onToggleExpansion={() => toggleCardExpansion(member.id)}
                formatDate={formatDate}
                calculateAge={calculateAge}
              />
            ))
          )}
        </div>
      </div>
    </ResponsiveContainer>
  );
}

interface FamilyMemberCardProps {
  member: FamilyMemberWithChildren;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  formatDate: (date: string | null) => string;
  calculateAge: (birthDate: string | null, deathDate?: string | null) => string;
}

function FamilyMemberCard({ 
  member, 
  isExpanded, 
  onToggleExpansion, 
  formatDate, 
  calculateAge 
}: FamilyMemberCardProps) {
  const getStatusColor = (isAlive: boolean | undefined) => {
    if (isAlive === false) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className={`bg-white rounded-3xl border-2 border-gray-100 overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
      member.is_alive === false ? 'opacity-95 bg-gradient-to-br from-gray-50 to-white' : 'bg-gradient-to-br from-white to-gray-50'
    }`}>
      {/* Card Header */}
      <div className="p-5 cursor-pointer transition-colors duration-200 hover:bg-gray-50" onClick={onToggleExpansion}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{member.name}</h3>
              <div className="flex gap-3 flex-wrap">
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(member.is_alive)}`}>
                  {member.is_alive === false ? (
                    <>
                      <Skull className="w-4 h-4" />
                      متوفى
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      على قيد الحياة
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  <Calendar className="w-4 h-4" />
                  {calculateAge(member.birth_date, member.date_of_death)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {member.childrenCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border border-yellow-200">
                <Baby className="w-4 h-4" />
                <span>{member.childrenCount}</span>
              </div>
            )}
            <button className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-green-500 hover:bg-green-50" aria-label={isExpanded ? 'طي' : 'توسيع'}>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {/* Member Details */}
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {member.birth_date && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-600 font-medium">تاريخ الميلاد</span>
                  <span className="block text-sm text-gray-800 font-semibold">{formatDate(member.birth_date)}</span>
                </div>
              </div>
            )}
            
            {member.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Phone className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-600 font-medium">الهاتف</span>
                  <span className="block text-sm text-gray-800 font-semibold" dir="ltr">{member.phone}</span>
                </div>
              </div>
            )}

            {member.gender && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <User className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-600 font-medium">الجنس</span>
                  <span className="block text-sm text-gray-800 font-semibold">{member.gender}</span>
                </div>
              </div>
            )}

            {member.is_alive === false && member.date_of_death && (
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl border border-gray-200">
                <Skull className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-600 font-medium">تاريخ الوفاة</span>
                  <span className="block text-sm text-gray-800 font-semibold">{formatDate(member.date_of_death)}</span>
                </div>
              </div>
            )}
          </div>

          {member.notes && (
            <div className="mt-5 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">ملاحظات</h4>
              <p className="text-sm text-yellow-700 leading-relaxed">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Children Section */}
        {member.children.length > 0 && (
          <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
            <h4 className="flex items-center gap-2 mt-5 mb-4 text-base font-semibold text-gray-800">
              <Baby className="w-5 h-5 text-green-600" />
              الأطفال ({member.children.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {member.children.map((child) => (
                <div key={child.id} className="bg-white rounded-xl p-3 border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-base font-semibold text-gray-800 mb-1 truncate">{child.name}</h5>
                        <span className="text-sm text-gray-600">
                          {calculateAge(child.birth_date, child.date_of_death)}
                        </span>
                      </div>
                    </div>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(child.is_alive)}`}>
                      {child.is_alive === false ? (
                        <Skull className="w-4 h-4" />
                      ) : (
                        <Heart className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                  {child.phone && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{child.phone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}