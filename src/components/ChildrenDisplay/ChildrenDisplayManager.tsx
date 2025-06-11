import React, { useState, useEffect } from 'react';
import { ChildCard, ChildrenDisplayState, childrenService } from '../../services/childrenService';
import { ChildrenCounter } from './ChildrenCounter';
import { ChildrenPreview } from './ChildrenPreview';

interface ChildrenDisplayManagerProps {
  personId: number;
  personName: string;
  initialChildrenCount?: number;
}

export const ChildrenDisplayManager: React.FC<ChildrenDisplayManagerProps> = ({
  personId,
  personName,
  initialChildrenCount = 0
}) => {
  const [displayState, setDisplayState] = useState<ChildrenDisplayState>({
    isExpanded: false,
    showingChildren: false,
    childrenLoadState: 'idle',
    displayMode: 'count',
    maxPreview: 3
  });

  const [children, setChildren] = useState<ChildCard[]>([]);
  const [childrenCount, setChildrenCount] = useState(initialChildrenCount);
  const [displayMode, setDisplayMode] = useState<'mini' | 'detailed'>('mini');

  // Load children count on mount
  useEffect(() => {
    if (initialChildrenCount === 0) {
      loadChildrenCount();
    }
  }, [personId, initialChildrenCount]);

  const loadChildrenCount = async () => {
    try {
      const count = await childrenService.getChildrenCount(personId);
      setChildrenCount(count);
    } catch (error) {
      console.error('Error loading children count:', error);
    }
  };

  const loadChildren = async () => {
    if (children.length > 0) return; // Already loaded

    setDisplayState(prev => ({ ...prev, childrenLoadState: 'loading' }));
    
    try {
      const childrenData = await childrenService.getPersonChildrenWithStats(personId);
      setChildren(childrenData);
      setChildrenCount(childrenData.length);
      setDisplayState(prev => ({ 
        ...prev, 
        childrenLoadState: 'loaded',
        showingChildren: true 
      }));
    } catch (error) {
      console.error('Error loading children:', error);
      setDisplayState(prev => ({ ...prev, childrenLoadState: 'error' }));
    }
  };

  const handleExpandChildren = async () => {
    if (!displayState.isExpanded) {
      setDisplayState(prev => ({ ...prev, isExpanded: true }));
      await loadChildren();
    } else {
      setDisplayState(prev => ({ 
        ...prev, 
        isExpanded: false, 
        showingChildren: false 
      }));
    }
  };

  const handleShowAllChildren = () => {
    // This could open a modal or navigate to a dedicated children page
    console.log('Show all children for:', personName);
    // For now, just expand the preview
    setDisplayState(prev => ({ ...prev, maxPreview: children.length }));
  };

  const handleChildSelect = (child: ChildCard) => {
    console.log('Selected child:', child.displayData.name);
    // This could navigate to the child's detail page or open a modal
  };

  const handleDisplayModeChange = (mode: 'mini' | 'detailed') => {
    setDisplayMode(mode);
  };

  if (childrenCount === 0) {
    return null; // Don't show anything if no children
  }

  return (
    <div className="children-display-manager">
      {/* Children Counter */}
      <ChildrenCounter
        count={childrenCount}
        onExpand={handleExpandChildren}
        loading={displayState.childrenLoadState === 'loading'}
        isExpanded={displayState.isExpanded}
      />

      {/* Children Preview */}
      {displayState.isExpanded && displayState.showingChildren && (
        <ChildrenPreview
          children={children}
          maxVisible={displayState.maxPreview}
          onShowAll={handleShowAllChildren}
          onChildSelect={handleChildSelect}
          displayMode={displayMode}
          onDisplayModeChange={handleDisplayModeChange}
        />
      )}

      {/* Error State */}
      {displayState.childrenLoadState === 'error' && (
        <div className="error-state">
          <p>حدث خطأ في تحميل بيانات الأطفال</p>
          <button onClick={loadChildren} className="retry-button">
            إعادة المحاولة
          </button>
        </div>
      )}

      <style jsx>{`
        .children-display-manager {
          margin-top: 12px;
        }

        .error-state {
          margin-top: 16px;
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          text-align: center;
        }

        .error-state p {
          color: #dc2626;
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .retry-button {
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .retry-button:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
};