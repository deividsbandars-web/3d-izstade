import { Request, Response } from 'express';
import { workflowEngine } from '../../src/backend/automation/workflowEngine.js';

export const startBusinessWorkflow = async (req: Request, res: Response) => {
  const projectId = typeof req.body?.projectId === 'string' ? req.body.projectId.trim() : '';
  const workflowBrief = typeof req.body?.workflowBrief === 'string' ? req.body.workflowBrief.trim() : '';

  if (!projectId || !workflowBrief) {
    return res.status(400).json({ error: 'projectId and workflowBrief are required' });
  }

  const result = await workflowEngine.startBusinessWorkflow(projectId, workflowBrief);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};
