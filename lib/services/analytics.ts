type EventType = 'search' | 'view_product' | 'calculate_duty' | 'error';

type EventData = {
  [key: string]: string | number | boolean | undefined;
};

class Analytics {
  private readonly endpoint: string;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
  }

  async trackEvent(type: EventType, data: EventData = {}): Promise<void> {
    try {
      const event = {
        type,
        timestamp: new Date().toISOString(),
        data: {
          ...data,
          url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        },
      };

      if (process.env.NODE_ENV === 'production') {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } else {
        console.log('Analytics Event:', event);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  trackError(error: Error, context: string): void {
    this.trackEvent('error', {
      message: error.message,
      context,
      stack: error.stack,
    });
  }
}

export const analytics = new Analytics();