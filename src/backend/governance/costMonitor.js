import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import { usageService } from '../platform/usageService.js';
export const costMonitor = {
    /**
     * Checks if the user has enough credits or hasn't exceeded the token budget.
     */
    async verifyBudget(userId) {
        try {
            // 1. Check daily limits via usageService
            const canProceed = await usageService.checkLimits(userId);
            if (!canProceed) {
                return { allowed: false, reason: 'Daily API limit reached' };
            }
            // 2. Check actual credit balance
            const { data: user, error } = await supabaseClient
                .from('users')
                .select('credits, plan')
                .eq('id', userId)
                .single();
            if (error) {
                logger.error('CostMonitor', `Failed to fetch user credits: ${error.message}`);
                return { allowed: false, reason: 'Failed to verify billing account' };
            }
            if (user.credits <= 0 && user.plan !== 'enterprise') {
                logger.warn('CostMonitor', `User ${userId} ran out of credits`);
                return { allowed: false, reason: 'Insufficient credits' };
            }
            return { allowed: true };
        }
        catch (error) {
            logger.error('CostMonitor', 'Error verifying budget', error);
            // Fail safe: block execution if budget cannot be verified
            return { allowed: false, reason: 'Internal error verifying budget' };
        }
    }
};
