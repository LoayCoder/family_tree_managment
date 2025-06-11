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

  return (
    <button 
      className={`inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-500 rounded-lg cursor-pointer transition-all duration-300 text-xs font-semibold text-blue-700 mt-1.5 shadow-sm hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
        isExpanded ? 'bg-gradient-to-r from-green-100 to-green-200 border-green-500 text-green-700' : ''
      }`}
      onClick={onExpand}
      disabled={loading}
    >
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        <span className="min-w-3.5 text-center font-bold">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : count}
        </span>
        <span className="font-medium">
          {count === 1 ? 'ابن' : count === 2 ? 'ابنان' : 'أبناء'}
        </span>
        <ChevronDown 
          className={`w-2.5 h-2.5 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          } ${loading ? 'animate-spin' : ''}`}
        />
      </div>
    </button>
  );
};