import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'bg-card rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'shadow-sm border border-border hover:bg-card-hover',
    outlined: 'border border-border',
    elevated: 'shadow-md border border-border hover:shadow-lg',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between border-b border-border pb-3 mb-4',
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  );
};
