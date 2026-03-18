import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
export const taskLimiter = {
    /**
     * Verifies that the workflow hasn't exceeded max tasks or depth.
     */
    async checkLimits(projectId) {
        try {
            // Create or get stats for the project
            const { data: stats, error: fetchError } = await supabaseClient
                .from('workflow_stats')
                .select('*')
                .eq('project_id', projectId)
                .single();
            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }
            // Initialize if not exists
            if (!stats) {
                await supabaseClient
                    .from('workflow_stats')
                    .insert([{ project_id: projectId }]);
                return { allowed: true };
            }
            const MAX_TASKS_PER_PROJECT = 500; // Configurable per plan
            const MAX_DEPTH = 20;
            if (stats.total_tasks_run >= MAX_TASKS_PER_PROJECT) {
                logger.warn('TaskLimiter', `Project ${projectId} exceeded max tasks`);
                return { allowed: false, reason: `Max tasks per project limit reached (${MAX_TASKS_PER_PROJECT})` };
            }
            if (stats.max_depth >= MAX_DEPTH) {
                logger.warn('TaskLimiter', `Project ${projectId} exceeded max depth`);
                return { allowed: false, reason: `Max workflow depth reached (${MAX_DEPTH})` };
            }
            return { allowed: true };
        }
        catch (error) {
            logger.error('TaskLimiter', 'Error checking limits', error);
            return { allowed: false, reason: 'Internal error checking task limits' };
        }
    },
    /**
     * Increments the task counters for a project.
     */
    async incrementTaskCount(projectId, depthIncrement = 0) {
        try {
            const { data: stats } = await supabaseClient
                .from('workflow_stats')
                .select('total_tasks_run, max_depth')
                .eq('project_id', projectId)
                .single();
            if (stats) {
                await supabaseClient
                    .from('workflow_stats')
                    .update({
                    total_tasks_run: stats.total_tasks_run + 1,
                    max_depth: Math.max(stats.max_depth, depthIncrement),
                    last_run_at: new Date().toISOString()
                })
                    .eq('project_id', projectId);
            }
        }
        catch (error) {
            logger.error('TaskLimiter', 'Failed to increment counters', error);
        }
    }
};
