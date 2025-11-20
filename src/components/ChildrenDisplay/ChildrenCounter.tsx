import React from 'react';
import { Users, ChevronDown, Loader2 } from 'lucide-react';

interface ChildrenCounterProps {
  count: number;
  onExpand: () => void;
  loading: boolean;
  isExpanded: boolean;
}

export const ChildrenCounter: React.FC<ChildrenCounterProps> = ({ 
  count, 
  onExpand, 
  loading, 
  isExpanded 
}) => {
  if (count === 0) return null;

  // Get the appropriate Arabic word for children count
  const getChildrenLabel = (count: number) => {
    if (count === 1) return 'ابن';
    if (count === 2) return 'ابنان';
    if (count >= 3 && count <= 10) return 'أبناء';
    return 'ابن';
  };

  return (
    <button 
      className={`inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-all duration-300 text-xs font-semibold text-blue-700 shadow-sm hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${
        isExpanded ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-700' : ''
      }`}
      onClick={onExpand}
      disabled={loading}
    >
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4" />
        <span className="min-w-4 text-center font-bold">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : count}
        </span>
        <span className="font-medium">
          {getChildrenLabel(count)}
        </span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          } ${loading ? 'animate-spin' : ''}`}
        />
      </div>
    </button>
  );
};