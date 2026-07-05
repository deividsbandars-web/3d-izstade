import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';

export const installService = {
  /**
   * Installs an agent for a specific user
   */
  async installAgent(userId: string, agentId: string) {
    try {
      logger.info('InstallService', `Installing agent ${agentId} for user ${userId}`);
      
      const { data, error } = await supabaseClient
        .from('user_installed_agents')
        .insert([{ user_id: userId, marketplace_agent_id: agentId }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      logger.error('InstallService', `Failed to install agent ${agentId}`, error);
      return { success: false, data: null, error: String(error) };
    }
  },

  /**
   * Installs a workflow pipeline for a specific user
   */
  async installWorkflow(userId: string, workflowId: string) {
    try {
      logger.info('InstallService', `Installing workflow ${workflowId} for user ${userId}`);
      
      const { data, error } = await supabaseClient
        .from('user_installed_workflows')
        .insert([{ user_id: userId, marketplace_workflow_id: workflowId }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      logger.error('InstallService', `Failed to install workflow ${workflowId}`, error);
      return { success: false, data: null, error: String(error) };
    }
  },

  /**
   * Installs/Unlocks a template for a user
   */
  async installTemplate(userId: string, templateId: string) {
    try {
      logger.info('InstallService', `Installing template ${templateId} for user ${userId}`);
      // In a real system, this might save to a 'user_templates' table
      // For now, simulated success.
      return { success: true, data: { template_id: templateId, user_id: userId }, error: null };
    } catch (error) {
      logger.error('InstallService', `Failed to install template ${templateId}`, error);
      return { success: false, data: null, error: String(error) };
    }
  }
};
