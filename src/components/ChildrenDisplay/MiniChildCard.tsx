import React from 'react';
import { Users } from 'lucide-react';
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
      className="bg-white border rounded-xl px-4 py-2 cursor-pointer flex items-center justify-between hover:shadow-sm transition"
      onClick={onClick}
      dir="rtl"
      style={{
        borderRightColor: child.visualTheme.inheritedColor,
        borderRightWidth: '3px',
      }}
    >
      {/* Right Side: Name */}
      <div className="text-sm font-bold text-slate-800 text-right leading-snug">
        {firstName}
      </div>

      {/* Left Side: Children Count */}
      {child.quickStats.childrenCount > 0 && (
        <div className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded">
          <span>{child.quickStats.childrenCount}</span>
          <Users size={12} />
        </div>
      )}
    </div>
  );
};
