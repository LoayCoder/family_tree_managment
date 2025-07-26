import React, { ReactNode } from 'react';
import { TreePine } from 'lucide-react';
import ResponsiveFlex from './ResponsiveFlex';

interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export default function ResponsiveHeader({
  title,
  subtitle,
  icon = <TreePine />,
  actions,
  className = '',
  gradient = true
}: ResponsiveHeaderProps) {
  return (
    <header className={`bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 py-3 sm:py-4 ${className}`}>
      <div className="container mx-auto">
        <ResponsiveFlex justify="between">
          <ResponsiveFlex gap="sm">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 text-white">
                {icon}
              </div>
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${gradient ? 'bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent' : 'text-gray-800'}`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </ResponsiveFlex>
          
          {actions && (
            <div className="flex items-center">
              {actions}
            </div>
          )}
        </ResponsiveFlex>
      </div>
    </header>
  );
}