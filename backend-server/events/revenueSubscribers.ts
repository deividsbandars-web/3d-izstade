import { eventSubscriber } from '../../src/backend/events/eventSubscriber.js';
import { PlatformEvent } from '../../src/backend/events/eventTypes.js';
import { logger } from '../../src/backend/logging/logger.js';
import { billingEventHandlers } from '../../src/backend/billing/events/billingEventHandlers.js';

/**
 * Handles revenue-specific events like payments and conversions.
 */
export const registerRevenueSubscribers = () => {
  logger.info('RevenueSubscribers', 'Registering revenue event subscribers...');

  eventSubscriber.subscribe(PlatformEvent.PAYMENT_RECEIVED, async (payload) => {
    await billingEventHandlers.handlePaymentReceivedFromRevenue(payload.data);
  });
};
