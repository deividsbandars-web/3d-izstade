import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';

export const PLANS = {
  free: {
    name: 'Free',
    max_agents: 1,
    max_leads_per_month: 10,
    max_booths: 1,
    api_requests: 100,
    monthly_price: 0
  },
  starter: {
    name: 'Starter',
    max_agents: 3,
    max_leads_per_month: 100,
    max_booths: 3,
    api_requests: 1000,
    monthly_price: 49
  },
  pro: {
    name: 'Pro',
    max_agents: 10,
    max_leads_per_month: 500,
    max_booths: 10,
    api_requests: 5000,
    monthly_price: 199
  },
  enterprise: {
    name: 'Enterprise',
    max_agents: 999, // Unlimited
    max_leads_per_month: 10000,
    max_booths: 50,
    api_requests: 100000,
    monthly_price: 999
  }
};

export const planService = {
  /**
   * Returns the limits for a specific plan
   */
  getPlanLimits(planName: string) {
    const safePlanName = planName.toLowerCase() as keyof typeof PLANS;
    return PLANS[safePlanName] || PLANS.free;
  },

  /**
   * Retrieves user's active plan from database
   */
  async getUserPlan(userId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('plan, subscription_status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      const planLimits = this.getPlanLimits(data?.plan || 'free');
      
      return { 
        data: {
          current_plan: data?.plan || 'free',
          status: data?.subscription_status || 'active',
          limits: planLimits
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('PlanService', `Failed to fetch plan for user ${userId}`, error);
      return { data: null, error: String(error) };
    }
  }
};
