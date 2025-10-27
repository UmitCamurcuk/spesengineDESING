import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast } from '../components/ui/Toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
}

interface ToastRecord {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ShowToastFn = {
  (message: string, type?: ToastType, duration?: number): string;
  (options: ToastOptions): string;
};

interface ToastContextType {
  showToast: ShowToastFn;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const buildToastRecord = useCallback((input: string | ToastOptions, fallbackType?: ToastType, fallbackDuration?: number): ToastRecord => {
    const baseId = typeof input === 'object' && input.id ? input.id : Math.random().toString(36).slice(2, 11);

    if (typeof input === 'string') {
      return {
        id: baseId,
        type: fallbackType ?? 'info',
        title: input,
        duration: fallbackDuration,
      };
    }

    const resolvedType = input.type ?? fallbackType ?? 'info';
    const resolvedTitle = input.title ?? input.message ?? 'Notification';
    const resolvedMessage = input.title ? input.message : undefined;

    return {
      id: baseId,
      type: resolvedType,
      title: resolvedTitle,
      message: resolvedMessage,
      duration: input.duration ?? fallbackDuration,
    };
  }, []);

  const showToastImpl = useCallback((arg1: string | ToastOptions, arg2?: ToastType, arg3?: number) => {
    const toast = buildToastRecord(arg1, arg2, arg3);
    setToasts((prev) => [...prev, toast]);
    return toast.id;
  }, [buildToastRecord]);

  const showToast = useMemo<ShowToastFn>(() => {
    const fn = ((arg1: string | ToastOptions, arg2?: ToastType, arg3?: number) => showToastImpl(arg1, arg2, arg3)) as ShowToastFn;
    return fn;
  }, [showToastImpl]);

  const success = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'info', duration });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
