import { llmService } from '../../ai/llmService.js';
import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { platformMetrics } from '../metrics/platformMetrics.js';
export const platformBrain = {
    /**
     * Evaluates the overall health and conversion rates of the platform
     * and suggests macro-level improvements using AI.
     */
    async analyzeSystemPerformance() {
        try {
            logger.info('PlatformBrain', 'Running platform intelligence analysis');
            // 1. Gather comprehensive platform data
            const stats = await platformMetrics.getAgentStats();
            const leads = await platformMetrics.getLeadStats();
            const { data: failedTasks } = await supabaseClient
                .from('agent_tasks')
                .select('id, task_data, result')
                .eq('status', 'failed')
                .order('created_at', { ascending: false })
                .limit(10);
            const systemContext = {
                agentStats: stats.data,
                leadStats: leads.data,
                recentFailures: failedTasks
            };
            // 2. Ask the LLM to act as the "Platform Architect"
            const prompt = `You are the core intelligence (Platform Brain) of an AI SaaS Business OS.
Analyze the current system performance based on the following data:
${JSON.stringify(systemContext, null, 2)}

Identify:
1. Bottlenecks in lead conversion.
2. Patterns in agent task failures.
3. 3 actionable, highly specific recommendations to improve autonomous business growth.

Format your response cleanly.`;
            const { text, error } = await llmService.generateText(prompt, { temperature: 0.4 });
            if (error || !text)
                throw new Error(error || 'Analysis failed');
            // In a more advanced setup, this output could trigger self-healing scripts
            // or modify system prompts dynamically in the database.
            logger.info('PlatformBrain', 'Analysis complete');
            return { data: text, error: null };
        }
        catch (error) {
            logger.error('PlatformBrain', 'Failed to analyze system performance', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Continuously optimizing individual agent prompts based on their failure rates.
     */
    async optimizeAgentPrompts(agentId) {
        try {
            logger.info('PlatformBrain', `Optimizing prompts for agent ${agentId}`);
            const { data: agent } = await supabaseClient
                .from('agents')
                .select('role, system_prompt')
                .eq('id', agentId)
                .single();
            if (!agent)
                throw new Error('Agent not found');
            // Fetch recent failures for this specific agent to learn from mistakes
            const { data: failures } = await supabaseClient
                .from('agent_tasks')
                .select('result')
                .eq('agent_id', agentId)
                .eq('status', 'failed')
                .limit(5);
            if (!failures || failures.length === 0) {
                return { data: "Agent is performing optimally. No changes needed.", error: null };
            }
            const prompt = `You are a prompt engineer optimizing an AI agent.
Agent Role: ${agent.role}
Current Prompt: ${agent.system_prompt}

Recent Failure Logs:
${JSON.stringify(failures)}

Write a revised, highly robust system prompt that directly addresses and prevents these failures.
Respond ONLY with the new prompt text.`;
            const { text, error } = await llmService.generateText(prompt, { temperature: 0.5 });
            if (error || !text)
                throw new Error(error || 'Failed to generate new prompt');
            // Self-healing: Update the agent in the database
            await supabaseClient
                .from('agents')
                .update({ system_prompt: text })
                .eq('id', agentId);
            return { data: "Prompt successfully optimized and updated.", new_prompt: text, error: null };
        }
        catch (error) {
            logger.error('PlatformBrain', 'Failed to optimize agent', error);
            return { data: null, error: String(error) };
        }
    }
};
