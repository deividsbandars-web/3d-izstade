import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
import { billingApplicationService } from '../billing/billingApplicationService.js';
import { taskLimiter } from './taskLimiter.js';
import { loopDetector } from './loopDetector.js';
export const agentGovernor = {
    /**
     * Evaluates an intended action against all governance rules before allowing execution.
     */
    async evaluateAction(params) {
        const { taskId, agentId, projectId, userId, proposedAction, depth } = params;
        try {
            logger.info('AgentGovernor', `Evaluating safety for task ${taskId}`);
            // 1. Budget and Cost Validation
            if (userId) {
                const budgetCheck = await billingApplicationService.enforceQuota(userId, {
                    provider: 'governance-agent',
                    metadata: {
                        taskId,
                        agentId,
                        projectId,
                        proposedAction,
                        depth,
                    },
                });
                if (!budgetCheck.allowed) {
                    await this._logAlert(userId, agentId, projectId, 'budget_exceeded', 'blocked', budgetCheck.reason || 'Unknown budget issue');
                    return budgetCheck;
                }
            }
            // 2. Velocity and Volume Limits Validation
            if (projectId) {
                const limitCheck = await taskLimiter.checkLimits(projectId);
                if (!limitCheck.allowed) {
                    await this._logAlert(userId, agentId, projectId, 'velocity_limit', 'blocked', limitCheck.reason || 'Unknown limit issue');
                    return limitCheck;
                }
            }
            // 3. Loop Detection
            if (projectId) {
                const loopCheck = await loopDetector.detectLoop(agentId, projectId, proposedAction);
                if (loopCheck.isLoop) {
                    await this._logAlert(userId, agentId, projectId, 'loop_detected', 'critical', loopCheck.reason || 'Agent stuck in a loop');
                    return { allowed: false, reason: loopCheck.reason };
                }
            }
            // If all checks pass, record the attempt and allow
            if (projectId) {
                await taskLimiter.incrementTaskCount(projectId, depth || 1);
            }
            return { allowed: true };
        }
        catch (error) {
            logger.error('AgentGovernor', 'Evaluation failed due to internal error', error);
            return { allowed: false, reason: 'Internal governance error' };
        }
    },
    /**
     * Internal helper to log alerts to the database for observability.
     */
    async _logAlert(userId, agentId, projectId, alertType, severity, description) {
        try {
            await supabaseClient.from('governance_alerts').insert([{
                    user_id: userId || null,
                    agent_id: agentId || null,
                    project_id: projectId || null,
                    alert_type: alertType || 'unknown',
                    severity: severity || 'warning',
                    description: description || 'No description provided'
                }]);
        }
        catch (e) {
            logger.error('AgentGovernor', 'Failed to log alert', e);
        }
    }
};
