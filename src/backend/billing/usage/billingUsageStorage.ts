import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';

export type BillingUsageStoragePayload = {
  userId?: string;
  provider: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  metadata?: unknown;
};

export const billingUsageStorage = {
  // Billing-local lower-level storage/helper implementation for usage accounting.
  async logUsage(params: BillingUsageStoragePayload) {
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
          metadata: metadata || {},
        }]);

      if (error) {
        throw error;
      }

      if (userId) {
        await this.incrementDailyCounter(userId, 1);
      }
    } catch (error) {
      logger.error('BillingUsageStorage', 'Failed to log usage', error);
    }
  },

  async incrementDailyCounter(userId: string, credits: number) {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabaseClient.rpc('increment_daily_usage', {
        target_user_id: userId,
        usage_date: today,
        credit_amount: credits,
      });

      if (error) {
        await supabaseClient
          .from('user_daily_limits')
          .upsert({
            user_id: userId,
            usage_date: today,
            total_requests: 1,
            total_credits_consumed: credits,
          }, { onConflict: 'user_id, usage_date' });
      }
    } catch (error) {
      logger.error('BillingUsageStorage', 'Failed to increment daily counter', error);
    }
  },

  async checkLimits(userId: string, maxDailyRequests: number = 50): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabaseClient
        .from('user_daily_limits')
        .select('total_requests')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.total_requests >= maxDailyRequests) {
        logger.warn('BillingUsageStorage', `User ${userId} reached daily limit of ${maxDailyRequests}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('BillingUsageStorage', 'Failed to check limits', error);
      return true;
    }
  },
};
