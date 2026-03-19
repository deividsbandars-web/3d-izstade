import { logger } from '../../../src/backend/logging/logger.js';

/**
 * Lightweight abstraction for PostHog or similar product analytics.
 * Tracks events like agent execution, lead generation, etc.
 */
export const analytics = {
  /**
   * Captures a custom event
   */
  async capture(params: { userId?: string; event: string; properties?: Record<string, any> }) {
    try {
      const { userId, event, properties } = params;
      
      logger.info('Analytics', `Event captured: ${event}`, { userId, properties });

      // In a real production setup, call PostHog API here:
      // await fetch('https://app.posthog.com/capture/', { ... })
      
      return { success: true };
    } catch (error) {
      logger.error('Analytics', 'Failed to capture event', error);
      return { success: false };
    }
  }
};

/**
 * Lightweight abstraction for Sentry or similar error monitoring.
 */
export const errorMonitor = {
  /**
   * Reports an exception to the monitoring system
   */
  captureException(error: any, context?: string) {
    logger.error(`ErrorMonitor [${context || 'Global'}]`, error?.message || error);

    // In production, integrate Sentry here:
    // Sentry.captureException(error);
  }
};
