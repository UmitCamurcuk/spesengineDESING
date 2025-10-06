import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
}

export const Radio: React.FC<RadioProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  variant = 'default',
  size = 'md',
  direction = 'vertical',
  className,
  name,
  ...props
}) => {
  const radioName = name || `radio-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: value
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-input bg-background hover:border-primary',
    primary: value
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-primary bg-background hover:bg-primary/10',
  };

  const handleChange = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </div>
      )}

      <div className={cn(
        'space-y-2',
        direction === 'horizontal' && 'flex flex-wrap gap-4'
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="radio"
                name={radioName}
                value={option.value}
                checked={value === option.value}
                onChange={() => handleChange(option.value)}
                disabled={option.disabled || props.disabled}
                className="sr-only"
                {...props}
              />
              <label
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer',
                  sizeClasses[size],
                  variantClasses[variant],
                  value === option.value && 'border-primary bg-primary text-primary-foreground',
                  value !== option.value && 'border-input bg-background hover:border-primary',
                  error && 'border-error',
                  (option.disabled || props.disabled) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {value === option.value && (
                  <div className={cn(
                    'rounded-full bg-current',
                    size === 'sm' && 'h-1 w-1',
                    size === 'md' && 'h-1.5 w-1.5',
                    size === 'lg' && 'h-2 w-2'
                  )} />
                )}
              </label>
            </div>
            
            <label className={cn(
              'text-sm text-foreground cursor-pointer',
              (option.disabled || props.disabled) && 'opacity-50 cursor-not-allowed'
            )}>
              {option.label}
            </label>
          </div>
        ))}
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

