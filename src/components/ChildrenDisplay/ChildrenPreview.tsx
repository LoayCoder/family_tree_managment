import React, { useState } from 'react';
import { ChevronRight, Grid, List, Users, Eye, Search, Filter, SortAsc, Heart } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState<string>('');

  const sortedAndFilteredChildren = React.useMemo(() => {
    let filtered = children;

    // Apply search filter first
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(child => 
        child.displayData.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
  }, [children, sortBy, filterStatus, searchTerm]);

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
      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto" dir="rtl">
  <div className="relative flex-1 min-w-[120px] max-w-[200px]">
    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
    <input
      type="text"
      placeholder="بحث..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pr-8 pl-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
    />
  </div>

  <div className="flex items-center gap-1">
    <SortAsc className="w-4 h-4 text-slate-500" />
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as any)}
      className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
    >
      <option value="age">العمر</option>
      <option value="name">الاسم</option>
      <option value="children">عدد الأطفال</option>
    </select>
  </div>

  <div className="flex items-center gap-1">
    <Filter className="w-4 h-4 text-slate-500" />
    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value as any)}
      className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-700"
    >
      <option value="all">الكل</option>
      <option value="alive">أحياء</option>
      <option value="deceased">متوفون</option>
    </select>
  </div>
</div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex bg-white border border-slate-300 rounded-md overflow-hidden">
            <button
              className={`px-2 py-1.5 border-none bg-transparent cursor-pointer transition-all duration-200 text-slate-600 hover:bg-slate-100 ${
                displayMode === 'mini' ? 'bg-emerald-500 text-white' : ''
              }`}
              onClick={() => onDisplayModeChange('mini')}
              title="عرض مصغر"
            >
              <List size={16} />
            </button>
            <button
              className={`px-2 py-1.5 border-none bg-transparent cursor-pointer transition-all duration-200 text-slate-600 hover:bg-slate-100 ${
                displayMode === 'detailed' ? 'bg-emerald-500 text-white' : ''
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
      
      {/* Children Grid - Optimized for all screen sizes */}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none rounded-lg font-semibold text-xs cursor-pointer transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:from-emerald-600 hover:to-emerald-700"
            onClick={onShowAll}
          >
            <Eye size={16} />
            <span>عرض جميع الأطفال ({sortedAndFilteredChildren.length})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* No Results Message */}
      {sortedAndFilteredChildren.length === 0 && (
        <div className="text-center py-6">
          <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">لا توجد نتائج تطابق معايير البحث</p>
        </div>
      )}
    </div>
  );
};