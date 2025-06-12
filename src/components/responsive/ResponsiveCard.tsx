import React, { ReactNode } from 'react';

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export default function ResponsiveCard({
  children,
  className = '',
  padding = 'md',
  hover = true,
  onClick
}: ResponsiveCardProps) {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return 'p-0';
      case 'sm': return 'p-3 sm:p-4';
      case 'lg': return 'p-5 sm:p-6 md:p-8';
      case 'md':
      default: return 'p-4 sm:p-6';
    }
  };

  const getHoverClass = () => {
    if (!hover) return '';
    return 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1';
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow border border-gray-100 overflow-hidden ${getPaddingClass()} ${getHoverClass()} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}