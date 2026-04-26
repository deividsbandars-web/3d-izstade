import { logger } from '../../logging/logger.js';
import { creditService } from '../credits/creditService.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';

export type BillingPaymentReceivedInput = {
  prospectId: string;
  amount?: number;
  planName?: string;
};

export const billingEventService = {
  // Event-driven billing orchestration lives here, separate from caller-facing billingApplicationService.
  async applyPaymentReceivedFromRevenue(input: BillingPaymentReceivedInput) {
    const { prospectId, amount = 0, planName } = input;

    logger.info('BillingEventService', `Processing payment conversion for prospect ${prospectId}`);

    const { data: prospect } = await supabaseClient
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .upsert({
        email: prospect.email,
        full_name: prospect.company_name,
        plan: planName || 'starter',
        subscription_status: 'active',
      }, { onConflict: 'email' })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    const creditAmount = Math.floor((amount / 100) * 10);
    await creditService.addCredits(user.id, creditAmount);

    logger.info(
      'BillingEventService',
      `Successfully converted prospect ${prospectId} to user ${user.id} with ${creditAmount} credits.`,
    );
  },
};
