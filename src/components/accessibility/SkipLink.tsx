import React from 'react';
import { cn } from '../../utils/cn';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md',
        'z-50 focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  );
};

