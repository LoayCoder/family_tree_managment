import React, { ReactNode } from 'react';

interface ResponsiveTextProps {
  children: ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'right' | 'left' | 'center' | 'justify';
  color?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export default function ResponsiveText({
  children,
  className = '',
  size = 'base',
  weight = 'normal',
  align = 'right',
  color = 'gray-800',
  as: Component = 'p'
}: ResponsiveTextProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'text-xs sm:text-xs';
      case 'sm': return 'text-xs sm:text-sm';
      case 'base': return 'text-sm sm:text-base';
      case 'lg': return 'text-base sm:text-lg';
      case 'xl': return 'text-lg sm:text-xl';
      case '2xl': return 'text-xl sm:text-2xl';
      case '3xl': return 'text-2xl sm:text-3xl';
      case '4xl': return 'text-3xl sm:text-4xl md:text-5xl';
      default: return 'text-sm sm:text-base';
    }
  };

  const getWeightClass = () => {
    switch (weight) {
      case 'light': return 'font-light';
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case 'right': return 'text-right';
      case 'left': return 'text-left';
      case 'center': return 'text-center';
      case 'justify': return 'text-justify';
      default: return 'text-right';
    }
  };

  const getColorClass = () => {
    return `text-${color}`;
  };

  return (
    <Component className={`${getSizeClass()} ${getWeightClass()} ${getAlignClass()} ${getColorClass()} ${className}`}>
      {children}
    </Component>
  );
}