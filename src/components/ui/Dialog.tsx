import React from 'react';
import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export type DialogType = 'info' | 'warning' | 'danger' | 'success';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

const dialogConfig = {
  info: {
    icon: Info,
    iconBg: 'bg-info-background',
    iconColor: 'text-info',
    confirmVariant: 'primary' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-background',
    iconColor: 'text-warning',
    confirmVariant: 'primary' as const,
  },
  danger: {
    icon: Trash2,
    iconBg: 'bg-error-background',
    iconColor: 'text-error',
    confirmVariant: 'danger' as const,
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-background',
    iconColor: 'text-success',
    confirmVariant: 'primary' as const,
  },
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
  children,
}) => {
  if (!open) return null;

  const config = dialogConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-popover rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 fade-in duration-200 border border-border">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border">
          <div className={cn('p-2 rounded-lg', config.iconBg)}>
            <Icon className={cn('h-4 w-4', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        {children && (
          <div className="p-4">
            {children}
          </div>
        )}

        {/* Footer */}
        {onConfirm && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={config.confirmVariant}
              onClick={handleConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
