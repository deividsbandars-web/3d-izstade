import { logger } from '../../logging/logger.js';
import { billingEventService } from './billingEventService.js';

type PaymentReceivedPayload = {
  prospectId?: string;
  amount?: number;
  planName?: string;
};

export const billingEventHandlers = {
  // Event adapter only: validate/map payload, then delegate orchestration to billingEventService.
  async handlePaymentReceivedFromRevenue(payload: PaymentReceivedPayload) {
    const { prospectId, amount = 0, planName } = payload;

    if (!prospectId) {
      return;
    }

    try {
      logger.info('BillingEventHandlers', `Delegating payment conversion for prospect ${prospectId}`);
      await billingEventService.applyPaymentReceivedFromRevenue({
        prospectId,
        amount,
        planName,
      });
    } catch (error) {
      logger.error('BillingEventHandlers', 'Failed to handle payment conversion', error);
    }
  },
};
