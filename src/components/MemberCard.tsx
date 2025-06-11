import React from 'react';
import { User, Calendar, Phone, Edit3, Trash2, Heart, Skull, MapPin, FileText } from 'lucide-react';
import { FamilyMemberWithLevel } from '../types/FamilyMember';

interface MemberCardProps {
  member: FamilyMemberWithLevel;
  onEdit: (memberId: string) => void;
  onDelete: (memberId: string) => void;
}

export default function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
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

  const getGenderColor = (gender: string | null) => {
    switch (gender) {
      case 'ذكر':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'أنثى':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLevelGradient = (level: number) => {
    const gradients = [
      'from-purple-500 to-purple-600', // Root level
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    return gradients[level % gradients.length] || gradients[0];
  };

  const getStatusColor = (isAlive: boolean | undefined) => {
    if (isAlive === false) {
      return 'bg-gray-50 text-gray-700 border-gray-300';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getStatusIcon = (isAlive: boolean | undefined) => {
    if (isAlive === false) {
      return <Skull className="w-4 h-4 text-gray-600" />;
    }
    return <Heart className="w-4 h-4 text-emerald-600 fill-current" />;
  };

  const getStatusText = (isAlive: boolean | undefined) => {
    if (isAlive === false) {
      return 'متوفى';
    }
    return 'على قيد الحياة';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden ${
      member.is_alive === false ? 'opacity-95 bg-gradient-to-br from-gray-50 to-white' : 'bg-gradient-to-br from-white to-gray-50'
    }`}>
      {/* Header with level indicator */}
      <div className={`h-3 bg-gradient-to-r ${getLevelGradient(member.level)} relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
      
      <div className="p-6">
        {/* Member Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${getLevelGradient(member.level)} shadow-lg`}>
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{member.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  الجيل {member.level + 1}
                </span>
                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(member.is_alive)}`}>
                  {getStatusIcon(member.is_alive)}
                  {getStatusText(member.is_alive)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(member.id)}
              className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:scale-110"
              title="تعديل"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
              title="حذف"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Member Details Grid */}
        <div className="space-y-4">
          {/* Age and Birth Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">معلومات العمر</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">العمر:</span>
                <span className="font-medium text-gray-800">
                  {calculateAge(member.birth_date, member.date_of_death)}
                  {member.is_alive === false && ' (عند الوفاة)'}
                </span>
              </div>
              {member.birth_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">تاريخ الميلاد:</span>
                  <span className="font-medium text-gray-800">{formatDate(member.birth_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Death Information (if applicable) */}
          {member.is_alive === false && member.date_of_death && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Skull className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-700">معلومات الوفاة</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">تاريخ الوفاة:</span>
                <span className="font-medium text-gray-800">{formatDate(member.date_of_death)}</span>
              </div>
            </div>
          )}

          {/* Gender and Contact Info */}
          <div className="grid grid-cols-1 gap-3">
            {/* Gender */}
            {member.gender && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">الجنس:</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getGenderColor(member.gender)}`}>
                  {member.gender}
                </span>
              </div>
            )}

            {/* Phone */}
            {member.phone && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">الهاتف:</span>
                </div>
                <span className="font-medium text-gray-800 font-mono" dir="ltr">{member.phone}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {member.notes && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">ملاحظات</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-3 rounded-xl">
                {member.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer with timestamps */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>تم الإنشاء: {member.created_at ? formatDate(member.created_at) : 'غير محدد'}</span>
            {member.updated_at && member.updated_at !== member.created_at && (
              <span>آخر تحديث: {formatDate(member.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}