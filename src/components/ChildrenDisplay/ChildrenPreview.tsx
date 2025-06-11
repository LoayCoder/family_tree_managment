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
      <div className="no-children-message">
        <Users className="no-children-icon" />
        <p>لا يوجد أطفال مسجلون</p>
      </div>
    );
  }

  return (
    <div className="children-preview-container">
      {/* Controls */}
      <div className="children-controls">
        <div className="controls-left">
          <div className="filter-group">
            <label>الترتيب:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="control-select"
            >
              <option value="age">العمر</option>
              <option value="name">الاسم</option>
              <option value="children">عدد الأطفال</option>
            </select>
          </div>

          <div className="filter-group">
            <label>الحالة:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="control-select"
            >
              <option value="all">الكل</option>
              <option value="alive">أحياء</option>
              <option value="deceased">متوفون</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${displayMode === 'mini' ? 'active' : ''}`}
              onClick={() => onDisplayModeChange('mini')}
              title="عرض مصغر"
            >
              <List size={16} />
            </button>
            <button
              className={`toggle-btn ${displayMode === 'detailed' ? 'active' : ''}`}
              onClick={() => onDisplayModeChange('detailed')}
              title="عرض تفصيلي"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span>عرض {visibleChildren.length} من {sortedAndFilteredChildren.length} طفل</span>
        {sortedAndFilteredChildren.length !== children.length && (
          <span className="filter-note">
            (مفلتر من {children.length} إجمالي)
          </span>
        )}
      </div>
      
      {/* Children Grid - Landscape Optimized */}
      <div className={`children-grid ${displayMode} landscape`}>
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
        <div className="show-more-container">
          <button 
            className="show-more-button"
            onClick={onShowAll}
          >
            <Eye size={16} />
            <span>عرض جميع الأطفال ({sortedAndFilteredChildren.length})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style jsx>{`
        .children-preview-container {
          margin-top: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .no-children-message {
          text-align: center;
          padding: 20px 10px;
          color: #64748b;
        }

        .no-children-icon {
          width: 32px;
          height: 32px;
          margin: 0 auto 12px;
          color: #cbd5e1;
        }

        .children-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .controls-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .controls-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
        }

        .control-select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          background: white;
          color: #374151;
          cursor: pointer;
        }

        .control-select:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }

        .view-toggle {
          display: flex;
          background: white;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          overflow: hidden;
        }

        .toggle-btn {
          padding: 6px 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
        }

        .toggle-btn:hover {
          background: #f1f5f9;
        }

        .toggle-btn.active {
          background: #10b981;
          color: white;
        }

        .results-summary {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .filter-note {
          color: #94a3b8;
          font-style: italic;
        }

        .children-grid {
          display: grid;
          gap: 8px;
        }

        .children-grid.mini {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }

        .children-grid.mini.landscape {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }

        .children-grid.detailed {
          grid-template-columns: 1fr;
        }

        .show-more-container {
          margin-top: 16px;
          text-align: center;
        }

        .show-more-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .show-more-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          background: linear-gradient(135deg, #059669, #047857);
        }

        @media (max-width: 768px) {
          .children-controls {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }

          .controls-left {
            justify-content: space-between;
          }

          .controls-right {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};