import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => {
      if (disabled) return;
      onCheckedChange?.(!checked);
    }}
    className={cn(
      'flex w-full items-center gap-4 rounded-xl border border-border/60 bg-background px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/60',
      className,
    )}
  >
    <span
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </span>
    <span className="flex-1">
      {label && <span className="text-sm font-semibold text-foreground">{label}</span>}
      {description && <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>}
    </span>
  </button>
);
