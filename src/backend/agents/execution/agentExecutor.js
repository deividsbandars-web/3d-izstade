import { logger } from '../../logging/logger.js';
import { seoRunner } from '../runners/seoRunner.js';
import { marketingRunner } from '../runners/marketingRunner.js';
import { leadRunner } from '../runners/leadRunner.js';
import { salesRunner } from '../runners/salesRunner.js';
import { agentScheduler } from '../../../../src/agents/system/scheduler/agentScheduler.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { agentExecutionLoop } from '../engine/agentExecutionLoop.js';
import { agentGovernor } from '../../governance/agentGovernor.js';
import { eventPublisher } from '../../events/eventPublisher.js';
import { PlatformEvent } from '../../events/eventTypes.js';
export const agentExecutor = {
    /**
     * Executes a task by determining the correct runner based on the agent's role.
     * Now upgraded to use the Agent Execution Loop for autonomous multi-step reasoning.
     */
    async executeTask(taskId, agentId, taskData) {
        try {
            logger.info('AgentExecutor', `Determining execution path for task ${taskId} (Agent: ${agentId})`);
            // 1. Fetch agent details to get the role
            const { data: agent, error } = await supabaseClient
                .from('agents')
                .select('role')
                .eq('id', agentId)
                .single();
            if (error || !agent) {
                throw new Error(`Failed to fetch agent role: ${error?.message}`);
            }
            const role = agent.role.toLowerCase();
            const description = taskData.action || taskData.brief || 'Perform autonomous operations';
            // Publish task started
            await eventPublisher.publish(PlatformEvent.AGENT_TASK_STARTED, { taskId, agentId, role, description });
            // 2. Governance Check (Safety Layer)
            const governanceStatus = await agentGovernor.evaluateAction({
                taskId,
                agentId,
                projectId: taskData.project_id,
                userId: taskData.user_id,
                proposedAction: description,
                depth: taskData.depth || 1
            });
            if (!governanceStatus.allowed) {
                logger.warn('AgentExecutor', `Execution blocked by Governance Layer: ${governanceStatus.reason}`);
                await agentScheduler.completeTask(taskId, { error: `Blocked by Governance: ${governanceStatus.reason}` }, 'failed');
                await eventPublisher.publish(PlatformEvent.AGENT_FAILED, { taskId, agentId, reason: governanceStatus.reason });
                return { status: 'failed', reason: governanceStatus.reason };
            }
            // If the task specifically asks for legacy runner or simple completion, use runners
            // Otherwise, route to the new Autonomous Engine (Phase 5)
            let result = null;
            if (taskData.use_legacy_runner) {
                // Legacy flow
                await agentScheduler.completeTask(taskId, {}, 'processing');
                switch (role) {
                    case 'seo':
                    case 'seo_agent':
                        result = await seoRunner.execute(taskId, agentId, taskData);
                        break;
                    case 'marketing':
                    case 'marketing_agent':
                        result = await marketingRunner.execute(taskId, agentId, taskData);
                        break;
                    case 'lead':
                    case 'lead_agent':
                        result = await leadRunner.execute(taskId, agentId, taskData);
                        break;
                    case 'sales':
                    case 'sales_agent':
                        result = await salesRunner.execute(taskId, agentId, taskData);
                        break;
                    default:
                        logger.warn('AgentExecutor', `No specific runner found for role '${role}'.`);
                        result = { status: 'success', note: `Fallback execution for role ${role}` };
                        await agentScheduler.completeTask(taskId, result, 'completed');
                        break;
                }
            }
            else {
                // New Autonomous AI Agent Engine Flow
                result = await agentExecutionLoop.runAgent(taskId, agentId, role, description);
            }
            // Publish task completed
            await eventPublisher.publish(PlatformEvent.AGENT_TASK_COMPLETED, { taskId, agentId, result });
            return result;
        }
        catch (err) {
            logger.error('AgentExecutor', `Execution failed for task ${taskId}`, err);
            await agentScheduler.completeTask(taskId, { error: String(err) }, 'failed');
            await eventPublisher.publish(PlatformEvent.AGENT_FAILED, { taskId, agentId, error: String(err) });
            return null;
        }
    }
};
