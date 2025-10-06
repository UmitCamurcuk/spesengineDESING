import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  delay = 200,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = 0;
      let y = 0;

      switch (side) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip within viewport
      if (x < 8) x = 8;
      if (x + tooltipRect.width > viewportWidth - 8) {
        x = viewportWidth - tooltipRect.width - 8;
      }
      if (y < 8) y = 8;
      if (y + tooltipRect.height > viewportHeight - 8) {
        y = viewportHeight - tooltipRect.height - 8;
      }

      setPosition({ x, y });
    }
  }, [isVisible, side]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-2 py-1 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-md shadow-lg pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-popover border border-border rotate-45',
              side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
              side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
              side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
              side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            )}
          />
        </div>
      )}
    </>
  );
};

