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
      className={`children-counter-badge ${isExpanded ? 'expanded' : ''}`}
      onClick={onExpand}
      disabled={loading}
    >
      <div className="counter-content">
        <Users className="counter-icon" size={14} />
        <span className="counter-number">
          {loading ? <Loader2 className="animate-spin" size={12} /> : count}
        </span>
        <span className="counter-label">
          {count === 1 ? 'ابن' : count === 2 ? 'ابنان' : 'أبناء'}
        </span>
        <ChevronDown 
          className={`expand-icon ${isExpanded ? 'rotated' : ''} ${loading ? 'spinning' : ''}`} 
          size={10} 
        />
      </div>

      <style jsx>{`
        .children-counter-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 11px;
          font-weight: 600;
          color: #0369a1;
          margin-top: 6px;
          box-shadow: 0 1px 2px rgba(14, 165, 233, 0.1);
        }

        .children-counter-badge:hover {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-color: #0284c7;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
        }

        .children-counter-badge.expanded {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border-color: #10b981;
          color: #047857;
        }

        .children-counter-badge:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .counter-content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .counter-icon {
          color: currentColor;
        }

        .counter-number {
          font-weight: 700;
          min-width: 14px;
          text-align: center;
        }

        .counter-label {
          font-weight: 500;
        }

        .expand-icon {
          transition: transform 0.3s ease;
          color: currentColor;
        }

        .expand-icon.rotated {
          transform: rotate(180deg);
        }

        .expand-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};