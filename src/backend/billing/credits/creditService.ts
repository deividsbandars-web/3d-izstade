import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';

export const creditService = {
  /**
   * Gets current credit balance for a user
   */
  async getCreditBalance(userId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data.credits || 0, error: null };
    } catch (error) {
      logger.error('CreditService', `Failed to get balance for user ${userId}`, error);
      return { data: 0, error: String(error) };
    }
  },

  /**
   * Adds credits to user account (e.g., after purchase or monthly renewal)
   */
  async addCredits(userId: string, amount: number) {
    try {
      logger.info('CreditService', `Adding ${amount} credits to user ${userId}`);
      
      // Get current balance
      const balance = await this.getCreditBalance(userId);
      if (balance.error) throw new Error(balance.error);

      const newBalance = balance.data + amount;

      // Update balance
      const { data, error } = await supabaseClient
        .from('users')
        .update({ credits: newBalance })
        .eq('id', userId)
        .select('credits')
        .single();

      if (error) throw error;
      return { data: data.credits, error: null };
    } catch (error) {
      logger.error('CreditService', `Failed to add credits for user ${userId}`, error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Consumes credits. Used when AI agents run or content is generated.
   */
  async consumeCredits(userId: string, cost: number, actionDescription: string) {
    try {
      logger.info('CreditService', `Consuming ${cost} credits for user ${userId} [Action: ${actionDescription}]`);
      
      const balance = await this.getCreditBalance(userId);
      if (balance.error) throw new Error(balance.error);

      if (balance.data < cost) {
        throw new Error('Insufficient credits');
      }

      const newBalance = balance.data - cost;

      const { data, error } = await supabaseClient
        .from('users')
        .update({ credits: newBalance })
        .eq('id', userId)
        .select('credits')
        .single();

      if (error) throw error;
      return { success: true, remaining: data.credits, error: null };
    } catch (error) {
      logger.warn('CreditService', `Failed to consume credits for user ${userId}: ${error}`);
      return { success: false, remaining: null, error: String(error) };
    }
  }
};
