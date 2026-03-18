import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
export const usageService = {
    /**
     * Logs an API call and its cost
     */
    async logUsage(params) {
        try {
            const { userId, provider, model, promptTokens, completionTokens, costUsd, metadata } = params;
            const totalTokens = (promptTokens || 0) + (completionTokens || 0);
            const { error } = await supabaseClient
                .from('api_usage_logs')
                .insert([{
                    user_id: userId || null,
                    provider,
                    model,
                    prompt_tokens: promptTokens || 0,
                    completion_tokens: completionTokens || 0,
                    total_tokens: totalTokens,
                    estimated_cost_usd: costUsd || 0,
                    metadata: metadata || {}
                }]);
            if (error)
                throw error;
            // Update daily counters
            if (userId) {
                await this._incrementDailyCounter(userId, 1);
            }
        }
        catch (error) {
            logger.error('UsageService', 'Failed to log usage', error);
        }
    },
    /**
     * Increments the daily request counter for a user
     */
    async _incrementDailyCounter(userId, credits) {
        const today = new Date().toISOString().split('T')[0];
        try {
            const { error } = await supabaseClient.rpc('increment_daily_usage', {
                target_user_id: userId,
                usage_date: today,
                credit_amount: credits
            });
            // If RPC fails, try manual update (UPSERT)
            if (error) {
                await supabaseClient
                    .from('user_daily_limits')
                    .upsert({
                    user_id: userId,
                    usage_date: today,
                    total_requests: 1,
                    total_credits_consumed: credits
                }, { onConflict: 'user_id, usage_date' });
            }
        }
        catch (error) {
            logger.error('UsageService', 'Failed to increment daily counter', error);
        }
    },
    /**
     * Checks if a user has exceeded their daily limits
     */
    async checkLimits(userId, maxDailyRequests = 50) {
        const today = new Date().toISOString().split('T')[0];
        try {
            const { data, error } = await supabaseClient
                .from('user_daily_limits')
                .select('total_requests')
                .eq('user_id', userId)
                .eq('usage_date', today)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error; // PGRST116 is 'not found'
            if (data && data.total_requests >= maxDailyRequests) {
                logger.warn('UsageService', `User ${userId} reached daily limit of ${maxDailyRequests}`);
                return false;
            }
            return true;
        }
        catch (error) {
            logger.error('UsageService', 'Failed to check limits', error);
            return true; // Safe fallback
        }
    }
};
