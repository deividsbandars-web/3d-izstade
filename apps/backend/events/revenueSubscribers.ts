import { eventSubscriber } from '../../../src/backend/events/eventSubscriber.js';
import { PlatformEvent } from '../../../src/backend/events/eventTypes.js';
import { logger } from '../../../src/backend/logging/logger.js';
import { paymentService } from '../../../src/backend/billing/payments/paymentService.js';
import { creditService } from '../../../src/backend/billing/credits/creditService.js';
import { supabaseClient } from '../../../src/lib/supabaseClient.js';

/**
 * Handles revenue-specific events like payments and conversions.
 */
export const registerRevenueSubscribers = () => {
  logger.info('RevenueSubscribers', 'Registering revenue event subscribers...');

  // Handle successful purchase from a prospect
  eventSubscriber.subscribe(PlatformEvent.PAYMENT_RECEIVED, async (payload) => {
    const { prospectId, amount, planName } = payload.data;

    if (!prospectId) return;

    try {
      logger.info('RevenueSubscribers', `Processing conversion for prospect ${prospectId}`);

      // 1. Get prospect details
      const { data: prospect } = await supabaseClient
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (!prospect) throw new Error('Prospect not found');

      // 2. Create actual user account (or link to existing)
      // This is a simplified logic: in reality, Stripe checkout would handle email verification
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .upsert({
          email: prospect.email,
          full_name: prospect.company_name,
          plan: planName || 'starter',
          subscription_status: 'active'
        }, { onConflict: 'email' })
        .select()
        .single();

      if (userError) throw userError;

      // 3. Assign credits based on the purchase amount
      // Logic: 1 USD = 10 Credits (example)
      const creditAmount = Math.floor((amount / 100) * 10);
      await creditService.addCredits(user.id, creditAmount);

      logger.info('RevenueSubscribers', `Successfully converted prospect ${prospectId} to user ${user.id} with ${creditAmount} credits.`);

    } catch (error) {
      logger.error('RevenueSubscribers', 'Failed to handle payment conversion', error);
    }
  });
};
