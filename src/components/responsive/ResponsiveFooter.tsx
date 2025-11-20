import React from 'react';
import { TreePine, Heart } from 'lucide-react';

interface ResponsiveFooterProps {
  className?: string;
}

export default function ResponsiveFooter({ className = '' }: ResponsiveFooterProps) {
  return (
    <footer className={`bg-white/90 backdrop-blur-sm border-t border-gray-200 mt-8 sm:mt-12 ${className}`}>
      <div className="container mx-auto py-6 sm:py-8">
        <div className="text-center text-gray-600">
          <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
            <TreePine className="w-4 h-4 sm:w-5 sm:h-5" />
            شجرة آل عمير - حافظ على تراث عائلتك
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}