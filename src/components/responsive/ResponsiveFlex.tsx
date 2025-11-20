import React, { ReactNode } from 'react';

interface ResponsiveFlexProps {
  children: ReactNode;
  className?: string;
  direction?: {
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
}

export default function ResponsiveFlex({
  children,
  className = '',
  direction = { xs: 'col', md: 'row' },
  align = 'center',
  justify = 'start',
  gap = 'md',
  wrap = false
}: ResponsiveFlexProps) {
  const getDirectionClass = () => {
    const classes = [];
    
    if (direction.xs) classes.push(`flex-${direction.xs}`);
    if (direction.sm) classes.push(`sm:flex-${direction.sm}`);
    if (direction.md) classes.push(`md:flex-${direction.md}`);
    if (direction.lg) classes.push(`lg:flex-${direction.lg}`);
    
    return classes.join(' ');
  };

  const getAlignClass = () => {
    switch (align) {
      case 'start': return 'items-start';
      case 'center': return 'items-center';
      case 'end': return 'items-end';
      case 'stretch': return 'items-stretch';
      default: return 'items-center';
    }
  };

  const getJustifyClass = () => {
    switch (justify) {
      case 'start': return 'justify-start';
      case 'center': return 'justify-center';
      case 'end': return 'justify-end';
      case 'between': return 'justify-between';
      case 'around': return 'justify-around';
      default: return 'justify-start';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 'none': return 'gap-0';
      case 'sm': return 'gap-2 sm:gap-3';
      case 'lg': return 'gap-5 sm:gap-6';
      case 'md':
      default: return 'gap-4';
    }
  };

  const getWrapClass = () => {
    return wrap ? 'flex-wrap' : 'flex-nowrap';
  };

  return (
    <div className={`flex ${getDirectionClass()} ${getAlignClass()} ${getJustifyClass()} ${getGapClass()} ${getWrapClass()} ${className}`}>
      {children}
    </div>
  );
}