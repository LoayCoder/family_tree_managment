import React from 'react';
import { Users, Heart, User, Skull } from 'lucide-react';
import { ChildCard } from '../../services/childrenService';

interface MiniChildCardProps {
  child: ChildCard;
  onClick: () => void;
  displayMode: 'mini' | 'detailed';
}

export const MiniChildCard: React.FC<MiniChildCardProps> = ({
  child,
  onClick,
  displayMode,
}) => {
  const ageDisplay =
    child.displayData.status === 'alive'
      ? `${child.displayData.currentAge || 'غير محدد'} سنة`
      : `${child.displayData.birthYear} - متوفى`;

  return (
    <div
      className={`bg-white border rounded-lg p-3 cursor-pointer flex items-start gap-3 transition shadow-sm hover:shadow-md ${
        child.displayData.status === 'deceased' ? 'bg-gray-50 border-gray-300' : 'border-slate-200'
      }`}
      onClick={onClick}
      style={{
        borderRightColor: child.visualTheme.inheritedColor,
        borderRightWidth: '3px',
      }}
      dir="rtl"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 bg-slate-200 flex items-center justify-center rounded-lg">
          <User className="w-4 h-4 text-slate-600" />
        </div>
        {child.quickStats.hasChildren && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-white border border-white flex items-center justify-center">
            <Users size={10} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-right">
        {/* Name always on first line, no truncation */}
        <h4
          className="text-sm font-bold text-slate-800 leading-snug break-words"
          style={{ direction: 'rtl', wordBreak: 'break-word' }}
        >
          {child.displayData.name}
        </h4>

        {/* Secondary info */}
        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
          <div>{ageDisplay}</div>

          {child.quickStats.isMarried && child.quickStats.spouse && (
            <div className="flex items-center gap-1 text-red-600 mt-0.5">
              <Heart size={10} />
              <span className="truncate">{child.quickStats.spouse}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1 items-end mt-1">
        {child.quickStats.childrenCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium whitespace-nowrap">
            👥 {child.quickStats.childrenCount}
          </span>
        )}
        {child.displayData.status === 'deceased' && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
            <Skull className="w-3 h-3 inline-block" />
          </span>
        )}
      </div>
    </div>
  );
};
