import React, { useState } from 'react';
import { ChevronRight, Grid, List, Users, Eye } from 'lucide-react';
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
  onDisplayModeChange
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'children'>('age');
  const [filterStatus, setFilterStatus] = useState<'all' | 'alive' | 'deceased'>('all');

  const sortedAndFilteredChildren = React.useMemo(() => {
    let filtered = children;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(child => child.displayData.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayData.name.localeCompare(b.displayData.name, 'ar');
        case 'age':
          const ageA = a.displayData.currentAge || 0;
          const ageB = b.displayData.currentAge || 0;
          return ageB - ageA; // Newest first
        case 'children':
          return b.quickStats.childrenCount - a.quickStats.childrenCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [children, sortBy, filterStatus]);

  const visibleChildren = sortedAndFilteredChildren.slice(0, maxVisible);
  const hasMore = sortedAndFilteredChildren.length > maxVisible;

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
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 pb-3 border-b border-slate-200">
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-600">الترتيب:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="age">العمر</option>
              <option value="name">الاسم</option>
              <option value="children">عدد الأطفال</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-600">الحالة:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">الكل</option>
              <option value="alive">أحياء</option>
              <option value="deceased">متوفون</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`px-2 py-1.5 border-none bg-transparent cursor-pointer transition-all duration-200 text-slate-600 hover:bg-slate-100 ${
                displayMode === 'mini' ? 'bg-green-500 text-white' : ''
              }`}
              onClick={() => onDisplayModeChange('mini')}
              title="عرض مصغر"
            >
              <List size={16} />
            </button>
            <button
              className={`px-2 py-1.5 border-none bg-transparent cursor-pointer transition-all duration-200 text-slate-600 hover:bg-slate-100 ${
                displayMode === 'detailed' ? 'bg-green-500 text-white' : ''
              }`}
              onClick={() => onDisplayModeChange('detailed')}
              title="عرض تفصيلي"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-xs text-slate-600 mb-3 flex gap-1.5 items-center">
        <span>عرض {visibleChildren.length} من {sortedAndFilteredChildren.length} طفل</span>
        {sortedAndFilteredChildren.length !== children.length && (
          <span className="text-slate-400 italic">
            (مفلتر من {children.length} إجمالي)
          </span>
        )}
      </div>
      
      {/* Children Grid - Landscape Optimized */}
      <div className={`grid gap-2 ${
        displayMode === 'mini' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {visibleChildren.map(child => (
          <MiniChildCard 
            key={child.id}
            child={child}
            onClick={() => onChildSelect(child)}
            displayMode={displayMode}
          />
        ))}
      </div>
      
      {/* Show More Button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white border-none rounded-lg font-semibold text-xs cursor-pointer transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:from-green-600 hover:to-green-700"
            onClick={onShowAll}
          >
            <Eye size={16} />
            <span>عرض جميع الأطفال ({sortedAndFilteredChildren.length})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};