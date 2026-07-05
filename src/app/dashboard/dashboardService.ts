import { supabaseClient } from '../../lib/supabaseClient';
import { clientLogger as logger } from '../../lib/clientLogger';
import { BillingAPI } from '../../services/billing';
import { PlatformAPI } from '../../services/platform';

export const dashboardService = {
  /**
   * Aggregates personal and platform data for the user's main dashboard
   */
  async getUserDashboard(userId: string) {
    try {
      logger.info('DashboardService', `Fetching dashboard data for user ${userId}`);
      
      const [installedAgents, platformMetrics, creditBalance] = await Promise.all([
        supabaseClient.from('user_installed_agents').select('marketplace_agent_id').eq('user_id', userId),
        PlatformAPI.getPlatformMetrics(),
        BillingAPI.getCreditBalance(userId)
      ]);

      // Note: In a fully developed schema, tasks, leads, and booths would be filtered by user_id
      // For this high-level phase, we gracefully aggregate available indicators
      const activeAgentsCount = installedAgents.data?.length || 0;
      
      return {
        data: {
          active_agents: activeAgentsCount,
          running_tasks: platformMetrics.agents?.tasks_completed || 0, // Mocked as platform completed tasks for UI
          generated_leads: platformMetrics.leads?.leads_generated || 0,
          credits_balance: creditBalance.data || 0,
          expo_booth_stats: platformMetrics.expo?.booth_visits || 0,
          installed_agents: installedAgents.data?.map(a => a.marketplace_agent_id) || []
        },
        error: null
      };
    } catch (error) {
      logger.error('DashboardService', 'Failed to fetch dashboard data', error);
      return { data: null, error: String(error) };
    }
  }
};
