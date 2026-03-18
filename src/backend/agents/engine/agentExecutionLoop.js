import { logger } from '../../logging/logger.js';
import { agentTools } from './agentTools.js';
import { agentPlanner } from './agentPlanner.js';
import { memoryService } from '../memoryService.js';
import { agentScheduler } from '../../../../src/agents/system/scheduler/agentScheduler.js';
export const agentExecutionLoop = {
    /**
     * The core execution engine that powers true autonomous agents.
     * Prevents infinite loops by setting a maxIteration limit.
     */
    async runAgent(taskId, agentId, role, taskDescription, maxIterations = 5) {
        try {
            logger.info('AgentExecutionLoop', `Starting autonomous execution for task ${taskId}`);
            // Mark task as processing
            await agentScheduler.completeTask(taskId, {}, 'processing');
            // 1. Retrieve relevant memory context
            const memoryContext = await memoryService.getMemory(agentId, 3);
            const recentMemory = memoryContext.data?.map(m => m.context).join(' | ') || 'No previous memory.';
            // 2. Planning Phase
            const fullTaskDescription = `${taskDescription}. Previous memory: ${recentMemory}`;
            const planResponse = await agentPlanner.createPlan(fullTaskDescription, role);
            if (planResponse.error || !planResponse.data) {
                throw new Error(`Planning failed: ${planResponse.error}`);
            }
            const plan = planResponse.data;
            const executionResults = [];
            let iterations = 0;
            // 3. Execution Phase (The Loop)
            for (const step of plan) {
                if (iterations >= maxIterations) {
                    logger.warn('AgentExecutionLoop', `Max iterations (${maxIterations}) reached. Halting to prevent infinite loop.`);
                    break;
                }
                logger.info('AgentExecutionLoop', `Executing Step ${step.id}: ${step.action}`);
                let stepResult = null;
                // Tool Execution
                if (step.tool && agentTools[step.tool]) {
                    try {
                        stepResult = await agentTools[step.tool].execute(step.tool_args || {});
                        // If the tool is 'save_to_memory', we explicitly save it
                        if (step.tool === 'save_to_memory' && step.tool_args?.context) {
                            await memoryService.saveMemory({
                                agent_id: agentId,
                                context: step.tool_args.context,
                                metadata: { task_id: taskId }
                            });
                        }
                    }
                    catch (toolError) {
                        logger.error('AgentExecutionLoop', `Tool ${step.tool} failed`, toolError);
                        stepResult = `Error executing tool: ${String(toolError)}`;
                    }
                }
                else {
                    // No tool required, simple reasoning step (could trigger another LLM call here if needed)
                    stepResult = `Step completed via internal reasoning.`;
                }
                executionResults.push({
                    step: step.action,
                    tool: step.tool || 'none',
                    result: stepResult
                });
                iterations++;
            }
            // 4. Summarize and Complete
            const finalPayload = {
                status: 'success',
                plan_executed: plan,
                results: executionResults,
                completed_at: new Date().toISOString()
            };
            await agentScheduler.completeTask(taskId, finalPayload, 'completed');
            logger.info('AgentExecutionLoop', `Task ${taskId} completed successfully in ${iterations} iterations.`);
            return finalPayload;
        }
        catch (error) {
            logger.error('AgentExecutionLoop', `Execution loop failed for task ${taskId}`, error);
            await agentScheduler.completeTask(taskId, { error: String(error) }, 'failed');
            return null;
        }
    }
};
