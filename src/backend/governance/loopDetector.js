import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
export const loopDetector = {
    /**
     * Analyzes recent agent tasks to detect repetitive loops.
     */
    async detectLoop(agentId, projectId, proposedAction) {
        try {
            // Fetch the last 10 tasks for this agent in this project
            const { data: recentTasks, error } = await supabaseClient
                .from('agent_tasks')
                .select('task_data')
                .eq('agent_id', agentId)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(10);
            if (error)
                throw error;
            if (!recentTasks || recentTasks.length < 3)
                return { isLoop: false };
            // Simple heuristic: if the exact same proposedAction appears 3+ times in the last 10 tasks
            let matchCount = 0;
            for (const task of recentTasks) {
                const actionStr = typeof task.task_data === 'string' ? task.task_data : (task.task_data.action || task.task_data.brief || '');
                if (actionStr === proposedAction) {
                    matchCount++;
                }
            }
            if (matchCount >= 3) {
                logger.warn('LoopDetector', `Repetitive loop detected for agent ${agentId}. Action: ${proposedAction}`);
                return { isLoop: true, reason: 'Identical action repeated multiple times in recent history' };
            }
            return { isLoop: false };
        }
        catch (error) {
            logger.error('LoopDetector', 'Failed to detect loops', error);
            return { isLoop: false }; // Fail open, don't block randomly
        }
    }
};
