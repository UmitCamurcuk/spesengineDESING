import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface FocusIndicatorProps {
  children: React.ReactNode;
  className?: string;
  showOnFocus?: boolean;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  className,
  showOnFocus = true
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !showOnFocus) return;

    const handleFocus = () => {
      element.classList.add('focus-visible');
    };

    const handleBlur = () => {
      element.classList.remove('focus-visible');
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [showOnFocus]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
};

