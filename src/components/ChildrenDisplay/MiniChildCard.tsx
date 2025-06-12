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
      className={`bg-white border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition shadow-sm hover:shadow-md ${
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
        <h4
          className="text-xs font-semibold text-slate-800 leading-normal w-full overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ direction: 'rtl' }}
        >
          {child.displayData.name}
        </h4>

        <p className="text-xs text-slate-600">{ageDisplay}</p>

        {child.quickStats.isMarried && child.quickStats.spouse && (
          <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5 truncate">
            <Heart size={8} />
            <span className="truncate">{child.quickStats.spouse}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0.5 items-end">
        {child.quickStats.childrenCount > 0 && (
          <span className="text-xs px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
            👥 {child.quickStats.childrenCount}
          </span>
        )}
        {child.displayData.status === 'deceased' && (
          <span className="text-xs px-1 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
            <Skull className="w-3 h-3 inline-block" />
          </span>
        )}
      </div>
    </div>
  );
};
