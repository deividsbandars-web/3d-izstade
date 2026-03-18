import { llmService } from '../../ai/llmService.js';
import { logger } from '../../logging/logger.js';
import { agentTools } from './agentTools.js';
export const agentPlanner = {
    /**
     * Given an overarching task, the LLM creates a structured step-by-step plan.
     */
    async createPlan(taskDescription, agentRole) {
        try {
            logger.info('AgentPlanner', `Creating plan for role: ${agentRole}`);
            const availableTools = Object.keys(agentTools).map(key => `${key}: ${agentTools[key].description}`).join('\n');
            const prompt = `You are an autonomous AI agent acting as a ${agentRole}.
Your task is: "${taskDescription}"

Available Tools:
${availableTools}

Create a logical, step-by-step execution plan to accomplish this task.
Respond ONLY with a valid JSON array of objects. Each object must have:
- "id": number
- "action": string (description of what to do)
- "tool": string (the name of the tool to use, or null if no tool is needed)
- "tool_args": object (JSON object containing arguments for the tool, or null)

Example Output:
[
  { "id": 1, "action": "Search for latest AI news", "tool": "search_web", "tool_args": { "query": "latest AI news" } }
]`;
            const { text, error } = await llmService.generateText(prompt, { temperature: 0.2 });
            if (error || !text)
                throw new Error(error || 'Failed to generate plan');
            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('LLM did not return a valid JSON array');
            }
            const plan = JSON.parse(jsonMatch[0]);
            return { data: plan, error: null };
        }
        catch (error) {
            logger.error('AgentPlanner', 'Failed to create plan', error);
            return { data: null, error: String(error) };
        }
    }
};
