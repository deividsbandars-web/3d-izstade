import { supabaseClient } from '../../lib/supabaseClient';
import { clientLogger as logger } from '../../lib/clientLogger';
import { AutomationAPI } from '../../services/automation';

export const workflowControlService = {
  /**
   * Lists workflows installed by the user
   */
  async listInstalledWorkflows(userId: string) {
    try {
      logger.info('WorkflowControlService', `Listing installed workflows for ${userId}`);
      const { data, error } = await supabaseClient
        .from('user_installed_workflows')
        .select(`id, marketplace_workflow_id, installed_at`)
        .eq('user_id', userId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('WorkflowControlService', 'Failed to list workflows', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Runs a specific installed workflow immediately
   */
  async runWorkflow(projectId: string, workflowBrief: string) {
    try {
      logger.info('WorkflowControlService', `Running workflow for project ${projectId}`);
      // Leveraging the automation engine built in phase 6/8
      return await AutomationAPI.startBusinessWorkflow(projectId, workflowBrief);
    } catch (error) {
      logger.error('WorkflowControlService', 'Failed to run workflow', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Schedules a workflow for future or periodic execution
   */
  async scheduleWorkflow(userId: string, workflowId: string, scheduleConfig: any) {
    try {
      logger.info('WorkflowControlService', `Scheduling workflow ${workflowId} for ${userId}`);
      // Mocked scheduling logic for UI consumption
      return { 
        success: true, 
        data: { scheduled: true, config: scheduleConfig }, 
        error: null 
      };
    } catch (error) {
      logger.error('WorkflowControlService', 'Failed to schedule workflow', error);
      return { success: false, data: null, error: String(error) };
    }
  }
};
