import { Request, Response } from 'express';
import { agentExecutor } from '../../../src/backend/agents/execution/agentExecutor.js';
import { analytics, errorMonitor } from '../observability/monitor.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const runAgentTask = async (req: AuthRequest, res: Response) => {
  const { taskId, agentId, taskData } = req.body;
  const userId = req.user?.id;

  if (!taskId || !agentId) {
    return res.status(400).json({ error: 'taskId and agentId are required' });
  }

  try {
    // 1. Track agent start
    analytics.capture({
      userId,
      event: 'agent_task_started',
      properties: { agentId, taskId, taskAction: taskData.action }
    });

    const result = await agentExecutor.executeTask(taskId, agentId, taskData);

    // 2. Track agent success
    analytics.capture({
      userId,
      event: 'agent_task_completed',
      properties: { agentId, taskId, status: 'success' }
    });

    res.json(result);
  } catch (error: any) {
    errorMonitor.captureException(error, 'runAgentTask');
    res.status(500).json({ error: error.message });
  }
};
