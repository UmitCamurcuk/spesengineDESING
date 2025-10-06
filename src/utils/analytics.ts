import { env } from '../config/env';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageView {
  page: string;
  title: string;
  url: string;
}

class AnalyticsService {
  private isEnabled: boolean;
  private sessionId: string;

  constructor() {
    this.isEnabled = env.VITE_ENABLE_ANALYTICS;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Track custom events
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    try {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
        });
      }

      // Custom analytics endpoint
      this.sendToCustomEndpoint('event', event);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Track page views
   */
  trackPageView(pageView: PageView): void {
    if (!this.isEnabled) return;

    try {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('config', env.VITE_ANALYTICS_ID!, {
          page_title: pageView.title,
          page_location: pageView.url,
        });
      }

      // Custom analytics endpoint
      this.sendToCustomEndpoint('pageview', pageView);
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(interaction: string, element?: string): void {
    this.trackEvent({
      action: interaction,
      category: 'User Interaction',
      label: element,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent({
      action: metric,
      category: 'Performance',
      label: unit,
      value: Math.round(value),
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent({
      action: 'Error',
      category: 'Error Tracking',
      label: context || 'Unknown',
    });
  }

  /**
   * Send data to custom analytics endpoint
   */
  private async sendToCustomEndpoint(type: string, data: any): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.warn('Custom analytics endpoint failed:', error);
    }
  }
}

export const analytics = new AnalyticsService();

/**
 * Hook for tracking page views
 */
export const usePageTracking = (page: string, title: string) => {
  React.useEffect(() => {
    analytics.trackPageView({
      page,
      title,
      url: window.location.href,
    });
  }, [page, title]);
};

/**
 * Hook for tracking user interactions
 */
export const useInteractionTracking = () => {
  const trackClick = (element: string) => {
    analytics.trackUserInteraction('click', element);
  };

  const trackHover = (element: string) => {
    analytics.trackUserInteraction('hover', element);
  };

  const trackFocus = (element: string) => {
    analytics.trackUserInteraction('focus', element);
  };

  return {
    trackClick,
    trackHover,
    trackFocus,
  };
};

