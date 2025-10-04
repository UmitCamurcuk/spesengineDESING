import { env } from '../config/env';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
}

class MonitoringService {
  private isEnabled: boolean;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];

  constructor() {
    this.isEnabled = env.VITE_ENABLE_LOGGING;
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    if (!this.isEnabled) return;

    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.isEnabled) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
        this.recordMetric('first_paint', navigation.responseEnd - navigation.requestStart, 'ms');
      }
    });

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.recordMetric(`resource_${entry.name}`, entry.duration, 'ms');
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics if enabled
    if (env.VITE_ENABLE_ANALYTICS) {
      this.sendMetricToAnalytics(metric);
    }
  }

  /**
   * Report an error
   */
  reportError(error: ErrorReport): void {
    if (!this.isEnabled) return;

    this.errors.push(error);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Send to monitoring service
    this.sendErrorToMonitoring(error);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get error reports
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.metrics = [];
    this.errors = [];
  }

  /**
   * Send metric to analytics
   */
  private sendMetricToAnalytics(metric: PerformanceMetric): void {
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit,
        });
      }
    } catch (error) {
      console.warn('Failed to send metric to analytics:', error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private async sendErrorToMonitoring(error: ErrorReport): Promise<void> {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (err) {
      console.warn('Failed to send error to monitoring service:', err);
    }
  }
}

export const monitoring = new MonitoringService();

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitoring = () => {
  const startTimer = (name: string) => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      monitoring.recordMetric(name, end - start, 'ms');
    };
  };

  const recordCustomMetric = (name: string, value: number, unit: string = 'ms') => {
    monitoring.recordMetric(name, value, unit);
  };

  return {
    startTimer,
    recordCustomMetric,
  };
};

/**
 * Hook for error monitoring
 */
export const useErrorMonitoring = () => {
  const reportError = (error: Error, context?: string) => {
    monitoring.reportError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  };

  return {
    reportError,
  };
};
