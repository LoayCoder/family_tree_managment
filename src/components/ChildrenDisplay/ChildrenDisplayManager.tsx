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
  const [error, setError] = useState<string | null>(null);

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
      setError('فشل في تحميل عدد الأبناء');
    }
  };

  const loadChildren = async () => {
    if (children.length > 0) return; // Already loaded

    setDisplayState(prev => ({ ...prev, childrenLoadState: 'loading' }));
    setError(null);
    
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
      setError('فشل في تحميل بيانات الأبناء');
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
    // For now, just log the selection
    
    // In a real implementation, you might do:
    // navigate(`/person/${child.id}`);
    // or
    // openModal(child);
  };

  const handleDisplayModeChange = (mode: 'mini' | 'detailed') => {
    setDisplayMode(mode);
  };

  if (childrenCount === 0) {
    return null; // Don't show anything if no children
  }

  return (
    <div className="children-display-manager mt-3">
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
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={loadChildren} 
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
};