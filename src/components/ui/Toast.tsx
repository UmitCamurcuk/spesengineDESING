import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success-background',
    borderColor: 'border-success/20',
    iconColor: 'text-success',
    titleColor: 'text-foreground',
    messageColor: 'text-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-error-background',
    borderColor: 'border-error/20',
    iconColor: 'text-error',
    titleColor: 'text-foreground',
    messageColor: 'text-muted-foreground',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning-background',
    borderColor: 'border-warning/20',
    iconColor: 'text-warning',
    titleColor: 'text-foreground',
    messageColor: 'text-muted-foreground',
  },
  info: {
    icon: Info,
    bgColor: 'bg-info-background',
    borderColor: 'border-info/20',
    iconColor: 'text-info',
    titleColor: 'text-foreground',
    messageColor: 'text-muted-foreground',
  },
};

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-lg border shadow-lg max-w-md w-full animate-in slide-in-from-top-5 fade-in duration-300',
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-semibold', config.titleColor)}>{title}</h4>
        {message && (
          <p className={cn('text-xs mt-0.5', config.messageColor)}>{message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className={cn(
          'flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors',
          config.iconColor
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => onClose(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};
