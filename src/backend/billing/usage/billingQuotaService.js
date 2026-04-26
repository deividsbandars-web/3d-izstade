import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';
import { billingUsageService } from './billingUsageService.js';
export const billingQuotaService = {
    /**
     * Canonical billing-local quota and credit gate.
     * Keep logic aligned with the legacy governance wrapper until a later redesign phase.
     */
    async verifyBudget(userId) {
        try {
            const canProceed = await billingUsageService.checkLimits(userId);
            if (!canProceed) {
                return { allowed: false, reason: 'Daily API limit reached' };
            }
            const { data: user, error } = await supabaseClient
                .from('users')
                .select('credits, plan')
                .eq('id', userId)
                .single();
            if (error) {
                logger.error('BillingQuotaService', `Failed to fetch user credits: ${error.message}`);
                return { allowed: false, reason: 'Failed to verify billing account' };
            }
            if (user.credits <= 0 && user.plan !== 'enterprise') {
                logger.warn('BillingQuotaService', `User ${userId} ran out of credits`);
                return { allowed: false, reason: 'Insufficient credits' };
            }
            return { allowed: true };
        }
        catch (error) {
            logger.error('BillingQuotaService', 'Error verifying budget', error);
            return { allowed: false, reason: 'Internal error verifying budget' };
        }
    }
};
