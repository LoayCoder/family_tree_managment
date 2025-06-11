import React, { useState, useEffect } from 'react';
import { TreePine, Users, Search, Filter } from 'lucide-react';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService } from '../services/supabase';
import MemberCard from './MemberCard';

interface FamilyTreeProps {
  refreshTrigger: number;
}

export default function FamilyTree({ refreshTrigger }: FamilyTreeProps) {
  const [members, setMembers] = useState<FamilyMemberWithLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    loadFamilyTree();
  }, [refreshTrigger]);

  const loadFamilyTree = async () => {
    setLoading(true);
    try {
      const data = await familyService.getFamilyTree();
      setMembers(data);
    } catch (error) {
      console.error('Error loading family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (memberId: string) => {
    // For now, just show an alert. You can implement a proper edit modal later
    alert(`تعديل العضو: ${memberId}`);
  };

  const handleDelete = async (memberId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
      try {
        await familyService.deleteMember(memberId);
        loadFamilyTree();
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'تم حذف العضو بنجاح!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      } catch (error) {
        console.error('Error deleting member:', error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.textContent = 'حدث خطأ أثناء حذف العضو';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
      }
    }
  };

  // Filter members based on search and level
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === null || member.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Group members by level
  const membersByLevel = filteredMembers.reduce((acc, member) => {
    if (!acc[member.level]) acc[member.level] = [];
    acc[member.level].push(member);
    return acc;
  }, {} as Record<number, FamilyMemberWithLevel[]>);

  const uniqueLevels = [...new Set(members.map(m => m.level))].sort((a, b) => a - b);

  const getLevelTitle = (level: number) => {
    const titles = [
      'الأجداد والجذور',
      'الآباء والأمهات',
      'الأبناء والبنات',
      'الأحفاد',
      'أبناء الأحفاد',
      'الجيل السادس'
    ];
    return titles[level] || `الجيل ${level + 1}`;
  };

  const getLevelIcon = (level: number) => {
    return level === 0 ? <TreePine className="w-5 h-5" /> : <Users className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-600">جاري تحميل شجرة العائلة...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
          <TreePine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">شجرة العائلة</h2>
          <p className="text-gray-600">عدد الأعضاء: {members.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن عضو في العائلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedLevel ?? ''}
            onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : null)}
            className="pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">جميع الأجيال</option>
            {uniqueLevels.map(level => (
              <option key={level} value={level}>
                {getLevelTitle(level)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Family Tree Display */}
      {Object.keys(membersByLevel).length === 0 ? (
        <div className="text-center py-12">
          <TreePine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد أعضاء</h3>
          <p className="text-gray-500">ابدأ بإضافة أعضاء جدد لبناء شجرة العائلة</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(membersByLevel)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, levelMembers]) => (
              <div key={level} className="space-y-4">
                {/* Level Header */}
                <div className="flex items-center gap-3 pb-4 border-b-2 border-emerald-100">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    {getLevelIcon(parseInt(level))}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {getLevelTitle(parseInt(level))}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {levelMembers.length} عضو في هذا الجيل
                    </p>
                  </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {levelMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}