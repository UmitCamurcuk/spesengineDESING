import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
  wrap?: boolean; // allow horizontal scroll when false
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = 'default',
  wrap = true,
}) => {
  const baseClasses = wrap
    ? 'flex flex-wrap gap-2 md:gap-1 md:flex-nowrap overflow-x-hidden md:overflow-x-auto lg:overflow-visible scrollbar-none'
    : 'flex flex-nowrap gap-2 md:gap-1 overflow-x-auto scrollbar-none';

  const variantClasses = {
    default: 'border-b border-border',
    pills: 'bg-muted p-1 rounded-lg',
    underline: 'border-b border-border'
  };

  const getTabClasses = (tab: Tab, isActive: boolean) => {
    const base = cn(
      'flex items-center space-x-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      wrap ? 'whitespace-normal md:whitespace-nowrap' : 'whitespace-nowrap',
    );

    if (variant === 'pills') {
      return cn(
        base,
        'rounded-md',
        isActive 
          ? 'bg-background text-primary shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted-hover',
        tab.disabled && 'opacity-50 cursor-not-allowed'
      );
    }

    if (variant === 'underline') {
      return cn(
        base,
        'border-b-2 -mb-px',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
        tab.disabled && 'opacity-50 cursor-not-allowed'
      );
    }

    return cn(
      base,
      'border-b-2 -mb-px rounded-t-lg',
      isActive
        ? 'border-primary text-primary bg-background'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted',
      tab.disabled && 'opacity-50 cursor-not-allowed'
    );
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={getTabClasses(tab, isActive)}
            disabled={tab.disabled}
            type="button"
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span className={cn(
                'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, className }) => {
  return (
    <div className={cn('mt-6', className)}>
      {children}
    </div>
  );
};
