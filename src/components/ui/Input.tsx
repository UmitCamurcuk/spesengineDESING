import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'w-full px-2.5 py-1.5 text-xs bg-background text-foreground border rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-muted-foreground';

  const variantClasses = {
    default: error
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-input focus:border-ring focus:ring-ring/20',
    filled: error
      ? 'bg-error-background border-error focus:border-error focus:ring-error/20'
      : 'bg-muted border-border focus:bg-background focus:border-ring focus:ring-ring/20',
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-foreground">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <span className="text-muted-foreground text-xs">{leftIcon}</span>
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            leftIcon && 'pl-8',
            rightIcon && 'pr-8',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="text-muted-foreground text-xs">{rightIcon}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
