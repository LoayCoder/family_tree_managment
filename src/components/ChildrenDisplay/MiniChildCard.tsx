import React from 'react';
import { Users, User } from 'lucide-react';
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
  const firstName = child.displayData.name.split(' ')[0];

  return (
    <div
      className="bg-white border rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between gap-3 hover:shadow-sm transition"
      onClick={onClick}
      dir="rtl"
      style={{
        borderRightColor: child.visualTheme.inheritedColor,
        borderRightWidth: '3px',
      }}
    >
      {/* Left Side: Icons */}
      <div className="flex items-center gap-1">
        {child.quickStats.childrenCount > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded">
            <span>{child.quickStats.childrenCount}</span>
            <Users size={12} />
          </div>
        )}

        <div className="relative w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-slate-600" />
          {child.quickStats.hasChildren && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white text-[8px] flex items-center justify-center border border-white rounded-full">
              👥
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Name */}
      <div className="flex-1 min-w-0 text-sm font-bold text-slate-800 text-right leading-snug">
        {firstName}
      </div>
    </div>
  );
};
