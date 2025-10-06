// Error Handling Utilities
import { ApiError } from '../api/types/api.types';

// Error types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error classification function
export const classifyError = (error: any): { type: ErrorType; severity: ErrorSeverity } => {
  // Network errors
  if (!navigator.onLine) {
    return { type: ErrorType.NETWORK_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // API errors
  if (error?.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return { type: ErrorType.VALIDATION_ERROR, severity: ErrorSeverity.LOW };
      case 401:
        return { type: ErrorType.AUTHENTICATION_ERROR, severity: ErrorSeverity.HIGH };
      case 403:
        return { type: ErrorType.AUTHORIZATION_ERROR, severity: ErrorSeverity.HIGH };
      case 404:
        return { type: ErrorType.NOT_FOUND_ERROR, severity: ErrorSeverity.LOW };
      case 408:
        return { type: ErrorType.TIMEOUT_ERROR, severity: ErrorSeverity.MEDIUM };
      case 500:
      case 502:
      case 503:
      case 504:
        return { type: ErrorType.SERVER_ERROR, severity: ErrorSeverity.CRITICAL };
      default:
        return { type: ErrorType.SERVER_ERROR, severity: ErrorSeverity.MEDIUM };
    }
  }

  // Timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return { type: ErrorType.TIMEOUT_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return { type: ErrorType.NETWORK_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // Default
  return { type: ErrorType.UNKNOWN_ERROR, severity: ErrorSeverity.MEDIUM };
};

// Error message generator
export const getErrorMessage = (error: any): string => {
  // AppError
  if (error instanceof AppError) {
    return error.message;
  }

  // API Error
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Axios error
  if (error?.message) {
    return error.message;
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
};

// User-friendly error messages
export const getUserFriendlyMessage = (error: any): string => {
  const { type } = classifyError(error);

  switch (type) {
    case ErrorType.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case ErrorType.AUTHENTICATION_ERROR:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action.';
    case ErrorType.NETWORK_ERROR:
      return 'Please check your internet connection and try again.';
    case ErrorType.SERVER_ERROR:
      return 'Our servers are experiencing issues. Please try again later.';
    case ErrorType.NOT_FOUND_ERROR:
      return 'The requested resource was not found.';
    case ErrorType.TIMEOUT_ERROR:
      return 'The request timed out. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Error logging
export const logError = (error: any, context?: string) => {
  const { type, severity } = classifyError(error);
  const message = getErrorMessage(error);
  
  const errorLog = {
    message,
    type,
    severity,
    code: error?.code || 'UNKNOWN',
    statusCode: error?.response?.status,
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Console logging
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorLog);
  }

  // Production logging (send to external service)
  if (import.meta.env.PROD) {
    // Here you would typically send to Sentry, LogRocket, etc.
    console.error('Production error:', errorLog);
  }
};

// Error recovery strategies
export const getRecoveryStrategy = (error: any): (() => void) | null => {
  const { type } = classifyError(error);

  switch (type) {
    case ErrorType.AUTHENTICATION_ERROR:
      return () => {
        // Clear auth tokens and redirect to login
        localStorage.removeItem('spes_auth_token');
        localStorage.removeItem('spes_refresh_token');
        window.location.href = '/login';
      };
    
    case ErrorType.NETWORK_ERROR:
      return () => {
        // Show retry option
        window.location.reload();
      };
    
    case ErrorType.SERVER_ERROR:
      return () => {
        // Show fallback UI or retry
        window.location.reload();
      };
    
    default:
      return null;
  }
};

// Error boundary error handler
export const handleErrorBoundaryError = (error: Error, errorInfo: any) => {
  logError(error, 'ErrorBoundary');
  
  // Send to external service in production
  if (import.meta.env.PROD) {
    // Send to Sentry, LogRocket, etc.
    console.error('ErrorBoundary error:', { error, errorInfo });
  }
};

// API error handler
export const handleApiError = (error: ApiError) => {
  logError(error, 'API');
  
  // Show user-friendly message
  const userMessage = getUserFriendlyMessage(error);
  
  // You could dispatch to a toast notification system here
  console.error('API Error:', userMessage);
  
  return userMessage;
};

// Form validation error handler
export const handleValidationError = (errors: Record<string, string[]>) => {
  const errorMessages = Object.entries(errors).map(([field, messages]) => 
    `${field}: ${messages.join(', ')}`
  ).join('; ');
  
  return `Validation failed: ${errorMessages}`;
};

// Retry mechanism
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

