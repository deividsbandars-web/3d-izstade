import { supabaseClient, handleSupabaseError } from '../../../lib/supabaseClient';
export const agentScheduler = {
    /**
     * Creates a new task for a specific agent.
     */
    async dispatchTask(task) {
        try {
            const { data, error } = await supabaseClient
                .from('agent_tasks')
                .insert([{ ...task, status: task.status || 'pending' }])
                .select()
                .single();
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            return handleSupabaseError(error, 'agentScheduler.dispatchTask');
        }
    },
    /**
     * Retrieves pending tasks for an agent.
     */
    async getPendingTasks(agentId) {
        try {
            const { data, error } = await supabaseClient
                .from('agent_tasks')
                .select('*')
                .eq('agent_id', agentId)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            return handleSupabaseError(error, 'agentScheduler.getPendingTasks');
        }
    },
    /**
     * Updates task status and stores result.
     */
    async completeTask(taskId, result, status = 'completed') {
        try {
            const { data, error } = await supabaseClient
                .from('agent_tasks')
                .update({ status, result, updated_at: new Date().toISOString() })
                .eq('id', taskId)
                .select()
                .single();
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            return handleSupabaseError(error, 'agentScheduler.completeTask');
        }
    }
};
