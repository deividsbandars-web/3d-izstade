import { supabaseClient } from '../../lib/supabaseClient';
import { clientLogger as logger } from '../../lib/clientLogger';
import { AgentSystemAPI } from '../../services/agents';

export const agentControlService = {
  /**
   * Lists agents installed by the user
   */
  async listInstalledAgents(userId: string) {
    try {
      logger.info('AgentControlService', `Listing installed agents for ${userId}`);
      const { data, error } = await supabaseClient
        .from('user_installed_agents')
        .select(`id, marketplace_agent_id, installed_at`)
        .eq('user_id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('AgentControlService', 'Failed to list installed agents', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Enables/activates a specific agent
   */
  async enableAgent(userId: string, agentId: string) {
    try {
      logger.info('AgentControlService', `Enabling agent ${agentId} for user ${userId}`);
      // Simulated status update - would require 'status' column in user_installed_agents
      return { success: true, data: { status: 'enabled' }, error: null };
    } catch (error) {
      logger.error('AgentControlService', 'Failed to enable agent', error);
      return { success: false, data: null, error: String(error) };
    }
  },

  /**
   * Disables a specific agent
   */
  async disableAgent(userId: string, agentId: string) {
    try {
      logger.info('AgentControlService', `Disabling agent ${agentId} for user ${userId}`);
      // Simulated status update
      return { success: true, data: { status: 'disabled' }, error: null };
    } catch (error) {
      logger.error('AgentControlService', 'Failed to disable agent', error);
      return { success: false, data: null, error: String(error) };
    }
  },

  /**
   * Manually dispatches a task to an agent
   */
  async runAgentTask(agentId: string, taskPayload: any) {
    try {
      logger.info('AgentControlService', `Running task manually for agent ${agentId}`);
      const response = await AgentSystemAPI.scheduler.dispatchTask({
        agent_id: agentId,
        status: 'pending',
        task_data: taskPayload
      });
      return response;
    } catch (error) {
      logger.error('AgentControlService', 'Failed to run agent task', error);
      return { data: null, error: String(error) };
    }
  }
};
