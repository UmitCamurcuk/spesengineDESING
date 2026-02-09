import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-ring active:bg-primary-active',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover focus:ring-ring active:bg-secondary-active',
    outline: 'border border-border bg-background text-foreground hover:bg-muted focus:ring-ring active:bg-muted-hover',
    ghost: 'text-foreground hover:bg-muted focus:ring-ring active:bg-muted-hover',
    danger: 'bg-error text-error-foreground hover:bg-error-hover focus:ring-ring active:bg-error-hover',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs rounded-md gap-1',
    md: 'px-3.5 py-2 text-sm rounded-md gap-2',
    lg: 'px-4 py-2.5 text-sm rounded-md gap-2',
  };

  // Icon-only butonlar için iç padding'i ve gap'i sıkılaştır
  const isIconOnly = !children || (typeof children === 'string' && children.trim().length === 0);
  const iconOnlyClasses = isIconOnly ? 'px-2 py-2 gap-0' : '';

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        iconOnlyClasses,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span>{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};
