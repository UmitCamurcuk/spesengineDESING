import React from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  className,
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'w-full px-3 py-2 text-sm bg-background text-foreground border rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-muted-foreground resize-none';

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
        <label htmlFor={textareaId} className="block text-xs font-medium text-foreground">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
