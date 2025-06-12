import React from 'react';
import { Users, Heart, Calendar, MapPin, Award, User, Phone, FileText, Skull, ChevronRight } from 'lucide-react';
import { ChildCard } from '../../services/childrenService';

interface MiniChildCardProps {
  child: ChildCard;
  onClick: () => void;
  displayMode: 'mini' | 'detailed';
}

export const MiniChildCard: React.FC<MiniChildCardProps> = ({ 
  child, 
  onClick, 
  displayMode = 'mini' 
}) => {
  const ageDisplay = child.displayData.status === 'alive' 
    ? `${child.displayData.currentAge || 'غير محدد'} سنة`
    : `${child.displayData.birthYear} - متوفى`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (displayMode === 'detailed') {
    return (
      <div 
        className={`bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 mb-3 ${
          child.displayData.status === 'deceased' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' : ''
        }`}
        onClick={onClick}
        style={{ 
          borderRightColor: child.visualTheme.inheritedColor,
          borderRightWidth: '4px'
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            {child.quickStats.hasChildren && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                <Users size={10} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-slate-800 mb-1.5 truncate">{child.displayData.name}</h4>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                child.displayData.status === 'alive' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {child.displayData.status === 'alive' ? 'على قيد الحياة' : 'متوفى'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                الجيل {child.visualTheme.generationLevel}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {child.quickStats.childrenCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-600">
                <Users size={14} />
                <span>{child.quickStats.childrenCount}</span>
              </div>
            )}
            {child.quickStats.achievementsCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-600">
                <Award size={14} />
                <span>{child.quickStats.achievementsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          {child.fullData.birthDate && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-slate-600 font-medium">تاريخ الميلاد</span>
                <span className="block text-xs text-slate-800 font-semibold">{formatDate(child.fullData.birthDate)}</span>
              </div>
            </div>
          )}

          {child.fullData.location && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-slate-600 font-medium">مكان الميلاد</span>
                <span className="block text-xs text-slate-800 font-semibold">{child.fullData.location}</span>
              </div>
            </div>
          )}

          {child.fullData.position && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <User className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-slate-600 font-medium">المنصب</span>
                <span className="block text-xs text-slate-800 font-semibold">{child.fullData.position}</span>
              </div>
            </div>
          )}

          {child.fullData.nationalId && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-slate-600 font-medium">الهوية الوطنية</span>
                <span className="block text-xs text-slate-800 font-semibold" dir="ltr">{child.fullData.nationalId}</span>
              </div>
            </div>
          )}

          {child.quickStats.isMarried && child.quickStats.spouse && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 md:col-span-2">
              <Heart className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-red-600 font-medium">الزوجة</span>
                <span className="block text-xs text-red-800 font-semibold">{child.quickStats.spouse}</span>
              </div>
            </div>
          )}

          {child.fullData.education && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Award className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div>
                <span className="block text-xs text-slate-600 font-medium">التعليم</span>
                <span className="block text-xs text-slate-800 font-semibold">{child.fullData.education}</span>
              </div>
            </div>
          )}
        </div>

        {child.fullData.notes && (
          <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="text-xs font-semibold text-yellow-800 mb-1.5">ملاحظات</h5>
            <p className="text-xs text-yellow-700 leading-relaxed">{child.fullData.notes}</p>
          </div>
        )}

        {/* View Details Button */}
        <div className="mt-3 text-center">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
            <span>عرض التفاصيل</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Mini card mode - Optimized for all screen sizes
  return (
    <div 
      className={`bg-white border border-slate-200 rounded-lg p-2 cursor-pointer transition-all duration-300 flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 ${
        child.displayData.status === 'deceased' ? 'bg-gray-50 border-gray-300' : ''
      }`}
      onClick={onClick}
      style={{ 
        borderRightColor: child.visualTheme.inheritedColor,
        borderRightWidth: '3px'
      }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <User className="w-4 h-4 text-slate-600" />
        </div>
        {child.quickStats.hasChildren && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white border border-white">
            <Users size={8} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-slate-800 mb-0.5 truncate">{child.displayData.name}</h4>
        <p className="text-xs text-slate-600 mb-0.5 truncate">{ageDisplay}</p>
        
        {child.quickStats.isMarried && child.quickStats.spouse && (
          <div className="flex items-center gap-0.5 text-xs text-red-600 mt-0.5">
            <Heart size={8} />
            <span className="truncate max-w-20">{child.quickStats.spouse}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-0.5 items-end">
        {child.quickStats.childrenCount > 0 && (
          <span className="text-xs px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-medium whitespace-nowrap">
            👥 {child.quickStats.childrenCount}
          </span>
        )}
        {child.displayData.status === 'deceased' && (
          <span className="text-xs px-1 py-0.5 bg-gray-100 rounded text-gray-600 font-medium whitespace-nowrap">
            <Skull className="w-3 h-3 inline-block" />
          </span>
        )}
      </div>
    </div>
  );
};