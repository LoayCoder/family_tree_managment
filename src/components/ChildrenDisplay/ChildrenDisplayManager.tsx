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

  // Load children count initially if not provided
  useEffect(() => {
    if (initialChildrenCount === 0) {
      loadChildrenCount();
    }
  }, [personId]);

  const loadChildrenCount = async () => {
    try {
      const count = await childrenService.getChildrenCount(personId);
      setChildrenCount(count);
    } catch (error) {
      console.error('Error loading children count:', error);
      setError('فشل في تحميل عدد الأبناء');
    }
  };

  const handleExpandChildren = async () => {
    const willExpand = !displayState.isExpanded;

    setDisplayState(prev => ({
      ...prev,
      isExpanded: willExpand,
      showingChildren: willExpand && children.length > 0,
      childrenLoadState:
        willExpand && children.length === 0 ? 'loading' : prev.childrenLoadState
    }));

    if (willExpand && children.length === 0) {
      try {
        const childrenData = await childrenService.getPersonChildrenWithStats(personId);
        setChildren(childrenData);
        setChildrenCount(childrenData.length);
        setDisplayState(prev => ({
          ...prev,
          childrenLoadState: 'loaded',
          showingChildren: true
        }));
      } catch (err) {
        console.error('Error loading children:', err);
        setDisplayState(prev => ({
          ...prev,
          childrenLoadState: 'error',
          showingChildren: false
        }));
        setError('فشل في تحميل بيانات الأبناء');
      }
    }
  };

  const handleShowAllChildren = () => {
    setDisplayState(prev => ({ ...prev, maxPreview: children.length }));
  };

  const handleChildSelect = (child: ChildCard) => {
    console.log('Selected child:', child.displayData.name);
    // Navigate to child detail or open modal
  };

  const handleDisplayModeChange = (mode: 'mini' | 'detailed') => {
    setDisplayMode(mode);
  };

  if (childrenCount === 0) return null;

  return (
    <div className="children-display-manager mt-3">
      {/* Toggle button */}
      <ChildrenCounter
        count={childrenCount}
        onExpand={handleExpandChildren}
        loading={displayState.childrenLoadState === 'loading'}
        isExpanded={displayState.isExpanded}
      />

      {/* Child Cards */}
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

      {/* Error display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={handleExpandChildren}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
};
