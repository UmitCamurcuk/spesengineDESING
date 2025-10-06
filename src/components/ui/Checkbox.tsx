import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  className,
  id,
  checked,
  onChange,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: checked
      ? 'bg-primary border-primary text-primary-foreground'
      : 'border-input bg-background hover:border-primary',
    primary: checked
      ? 'bg-primary border-primary text-primary-foreground'
      : 'border-primary bg-background hover:bg-primary/10',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-start space-x-2">
        <div className="relative">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={cn(
              'sr-only',
              className
            )}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              'flex items-center justify-center rounded border-2 transition-all duration-200 cursor-pointer',
              sizeClasses[size],
              variantClasses[variant],
              error && 'border-error',
              props.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {checked && (
              <Check className={cn(
                'text-current',
                size === 'sm' && 'h-2 w-2',
                size === 'md' && 'h-3 w-3',
                size === 'lg' && 'h-4 w-4'
              )} />
            )}
          </label>
        </div>
        
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
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

