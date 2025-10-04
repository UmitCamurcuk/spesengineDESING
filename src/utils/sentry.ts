import { env } from '../config/env';

// Sentry configuration
interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any;
}

class SentryService {
  private isEnabled: boolean;
  private config: SentryConfig | null = null;

  constructor() {
    this.isEnabled = !!env.VITE_SENTRY_DSN;
    this.initialize();
  }

  private initialize(): void {
    if (!this.isEnabled || !env.VITE_SENTRY_DSN) return;

    this.config = {
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_APP_ENVIRONMENT,
      release: env.VITE_APP_VERSION,
      tracesSampleRate: env.VITE_APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      beforeSend: this.beforeSend,
    };

    // Initialize Sentry
    this.initSentry();
  }

  private initSentry(): void {
    if (!this.config) return;

    try {
      // Dynamic import to avoid bundling Sentry in development
      import('@sentry/react').then((Sentry) => {
        Sentry.init({
          dsn: this.config!.dsn,
          environment: this.config!.environment,
          release: this.config!.release,
          tracesSampleRate: this.config!.tracesSampleRate,
          beforeSend: this.config!.beforeSend,
          integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay(),
          ],
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });
      });
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  private beforeSend = (event: any): any => {
    // Filter out sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Filter out development errors
    if (env.VITE_APP_ENVIRONMENT === 'development') {
      return null;
    }

    return event;
  };

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: any): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context,
          },
        });
      });
    } catch (err) {
      console.warn('Failed to capture exception:', err);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureMessage(message, level);
      });
    } catch (err) {
      console.warn('Failed to capture message:', err);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email: string; name: string }): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
        });
      });
    } catch (err) {
      console.warn('Failed to set user context:', err);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      });
    } catch (err) {
      console.warn('Failed to clear user context:', err);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.addBreadcrumb({
          message,
          category,
          level,
          timestamp: Date.now() / 1000,
        });
      });
    } catch (err) {
      console.warn('Failed to add breadcrumb:', err);
    }
  }

  /**
   * Set context
   */
  setContext(key: string, context: any): void {
    if (!this.isEnabled) return;

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.setContext(key, context);
      });
    } catch (err) {
      console.warn('Failed to set context:', err);
    }
  }
}

export const sentry = new SentryService();

/**
 * Hook for Sentry integration
 */
export const useSentry = () => {
  const captureException = (error: Error, context?: any) => {
    sentry.captureException(error, context);
  };

  const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    sentry.captureMessage(message, level);
  };

  const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
    sentry.addBreadcrumb(message, category, level);
  };

  const setContext = (key: string, context: any) => {
    sentry.setContext(key, context);
  };

  return {
    captureException,
    captureMessage,
    addBreadcrumb,
    setContext,
  };
};
