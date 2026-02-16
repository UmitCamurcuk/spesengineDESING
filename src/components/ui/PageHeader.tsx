import React from 'react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
}) => {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
      <div className="flex-1 min-w-0 space-y-0.5">
        <h1 className="text-lg font-semibold text-foreground break-words">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full md:w-auto md:pl-6">
          <div className="flex w-full md:w-auto md:justify-end">{action}</div>
        </div>
      )}
    </div>
  );
};
