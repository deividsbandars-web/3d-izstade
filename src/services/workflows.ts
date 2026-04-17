import { supabaseClient } from '../lib/supabaseClient';
import { serverApiGet, serverApiPost } from './serverApi';

export const WorkflowAPI = {
  executeWorkflow: async (payload: unknown) => serverApiPost('/api/workflows/execute', payload),
  validateWorkflow: async (payload: unknown) => serverApiPost('/api/workflows/validate', payload),

  async getWorkflows() {
    const { data, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getWorkflowRuns(workflowId: string) {
    const { data, error } = await supabaseClient
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false });

    return { data, error };
  },

  getWorkflowDefinition: async (workflowId: string) => serverApiGet(`/api/workflows/${workflowId}`),
};
