import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { ChildCard } from '../../services/childrenService';
import { MiniChildCard } from './MiniChildCard';

interface ChildrenPreviewProps {
  children: ChildCard[];
  maxVisible: number;
  onShowAll: () => void;
  onChildSelect: (child: ChildCard) => void;
  displayMode: 'mini' | 'detailed';
  onDisplayModeChange: (mode: 'mini' | 'detailed') => void;
}

export const ChildrenPreview: React.FC<ChildrenPreviewProps> = ({
  children,
  maxVisible,
  onShowAll,
  onChildSelect,
  displayMode,
}) => {
  const visibleChildren = children.slice(0, maxVisible);
  const hasMore = children.length > maxVisible;

  if (children.length === 0) {
    return (
      <div className="text-center py-5 text-slate-500">
        <Users className="w-8 h-8 mx-auto mb-3 text-slate-300" />
        <p>لا يوجد أطفال مسجلون</p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      {/* Count Display */}
      <div className="text-xs text-slate-600 mb-3">
        عرض {visibleChildren.length} من {children.length} طفل
      </div>

      {/* Full-Width Vertical Stack */}
      <div className="flex flex-col gap-3">
        {visibleChildren.map((child) => (
          <div className="w-full" key={child.id}>
            <MiniChildCard
              child={child}
              onClick={() => onChildSelect(child)}
              displayMode={displayMode}
            />
          </div>
        ))}
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition"
            onClick={onShowAll}
          >
            <span>عرض جميع الأطفال ({children.length})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
