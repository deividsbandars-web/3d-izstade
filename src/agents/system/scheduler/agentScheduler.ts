import { supabaseClient, handleSupabaseError } from '../../../lib/supabaseClient.js';

export interface AgentTask {
  id?: string;
  agent_id: string;
  project_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  task_data: Record<string, any>;
  result?: Record<string, any>;
  scheduled_for?: string;
  created_at?: string;
  updated_at?: string;
}

export const agentScheduler = {
  /**
   * Creates a new task for a specific agent.
   */
  async dispatchTask(task: Omit<AgentTask, 'id'>) {
    try {
      const { data, error } = await supabaseClient
        .from('agent_tasks')
        .insert([{ ...task, status: task.status || 'pending' }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'agentScheduler.dispatchTask');
    }
  },

  /**
   * Retrieves pending tasks for an agent.
   */
  async getPendingTasks(agentId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'agentScheduler.getPendingTasks');
    }
  },

  /**
   * Updates task status and stores result.
   */
  async completeTask(taskId: string, result: Record<string, any>, status: AgentTask['status'] = 'completed') {
    try {
      const { data, error } = await supabaseClient
        .from('agent_tasks')
        .update({ status, result, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'agentScheduler.completeTask');
    }
  }
};
