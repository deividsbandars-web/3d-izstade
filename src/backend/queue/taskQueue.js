import { supabaseClient } from '../../lib/supabaseClient';
import { agentsApplicationService } from '../agents/agentsApplicationService.js';
let isListening = false;
let subscription = null;
/**
 * REFACTORED TASK QUEUE:
 * Switched from 5s Polling to REALTIME WebSockets for zero-latency AI response.
 */
export const taskQueue = {
    /**
     * Starts the Realtime task listener.
     * Leverages Supabase Realtime (WebSockets) to detect new tasks instantly.
     */
    startListening() {
        if (isListening)
            return;
        console.log(`[TaskQueue] Starting Realtime task listener...`);
        isListening = true;
        // 1. Initial process of any missed tasks
        this.processNextBatch();
        // 2. Subscribe to INSERT events on agent_tasks table
        subscription = supabaseClient
            .channel('pending_tasks')
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_tasks',
            filter: 'status=eq.pending'
        }, (payload) => {
            console.log('[TaskQueue] New task detected via Realtime:', payload.new.id);
            this.processTask(payload.new);
        })
            .subscribe();
    },
    /**
     * Stops the Realtime listener.
     */
    stopListening() {
        if (subscription) {
            supabaseClient.removeChannel(subscription);
            subscription = null;
        }
        isListening = false;
        console.log('[TaskQueue] Stopped Realtime task listener.');
    },
    /**
     * Processes a single task payload.
     */
    async processTask(task) {
        try {
            const enrichedTaskData = {
                ...task.task_data,
                project_id: task.project_id
            };
            const execution = await agentsApplicationService.runAgentTask({
                taskId: task.id,
                agentId: task.agent_id,
                taskData: enrichedTaskData
            });
            if (!execution.ok) {
                throw new Error(execution.error);
            }
        }
        catch (err) {
            console.error(`[TaskQueue] Error processing task ${task.id}:`, err);
        }
    },
    /**
     * Fallback: Fetches any pending tasks that might have been missed.
     */
    async processNextBatch() {
        try {
            const { data: tasks, error } = await supabaseClient
                .from('agent_tasks')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(10);
            if (error) {
                console.error('[TaskQueue] Error fetching tasks:', error.message);
                return;
            }
            if (tasks && tasks.length > 0) {
                console.log(`[TaskQueue] Found ${tasks.length} missed tasks. Processing...`);
                await Promise.allSettled(tasks.map(task => this.processTask(task)));
            }
        }
        catch (err) {
            console.error('[TaskQueue] Unexpected error during batch processing:', err);
        }
    }
};
