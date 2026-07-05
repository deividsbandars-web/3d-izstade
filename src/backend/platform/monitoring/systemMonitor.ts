import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';

export const systemMonitor = {
  /**
   * Evaluates the health and load of the background task queue
   */
  async getQueueStatus() {
    try {
      logger.info('SystemMonitor', 'Checking queue status');
      
      const { count: pendingTasks, error } = await supabaseClient
        .from('agent_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;

      let health = 'healthy';
      if (pendingTasks && pendingTasks > 100) health = 'degraded';
      if (pendingTasks && pendingTasks > 500) health = 'critical';

      return {
        data: {
          status: health,
          pending_tasks: pendingTasks || 0,
          timestamp: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      logger.error('SystemMonitor', 'Failed to get queue status', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Checks if agents are actively processing or failing frequently
   */
  async getAgentHealth() {
    try {
      logger.info('SystemMonitor', 'Checking agent health');
      
      const { count: failedTasks, error } = await supabaseClient
        .from('agent_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      if (error) throw error;

      let status = 'optimal';
      if (failedTasks && failedTasks > 20) status = 'warning';
      if (failedTasks && failedTasks > 100) status = 'critical';

      return {
        data: {
          overall_status: status,
          recent_failures: failedTasks || 0
        },
        error: null
      };
    } catch (error) {
      logger.error('SystemMonitor', 'Failed to get agent health', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Monitors LLM token/call usage (Simulated placeholder for DB tracking)
   */
  async getLLMUsage() {
    try {
      logger.info('SystemMonitor', 'Fetching LLM usage stats');
      
      // In a production system, every llmService call would log tokens to a table.
      // Returning simulated metrics for architecture completion.
      return {
        data: {
          estimated_requests_today: 1450,
          estimated_cost_usd: 12.45,
          provider_status: 'operational'
        },
        error: null
      };
    } catch (error) {
      logger.error('SystemMonitor', 'Failed to get LLM usage', error);
      return { data: null, error: String(error) };
    }
  }
};
