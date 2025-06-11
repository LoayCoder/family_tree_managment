import React, { ReactNode } from 'react';

interface ResponsiveButtonProps {
  children: ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function ResponsiveButton({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button',
  icon,
  iconPosition = 'left'
}: ResponsiveButtonProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'px-2 py-1 text-xs rounded-lg';
      case 'sm': return 'px-3 py-1.5 text-sm rounded-lg';
      case 'lg': return 'px-6 py-3 text-lg rounded-xl';
      case 'xl': return 'px-8 py-4 text-xl rounded-xl';
      case 'md':
      default: return 'px-4 py-2 text-base rounded-xl';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md';
      case 'secondary':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md';
      case 'outline':
        return 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50';
      case 'ghost':
        return 'bg-transparent text-emerald-600 hover:bg-emerald-50';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md';
    }
  };

  const getWidthClass = () => {
    return fullWidth ? 'w-full' : '';
  };

  const getDisabledClass = () => {
    return disabled ? 'opacity-50 cursor-not-allowed' : '';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-200
        ${getSizeClass()} ${getVariantClass()} ${getWidthClass()} ${getDisabledClass()} ${className}
      `}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
}