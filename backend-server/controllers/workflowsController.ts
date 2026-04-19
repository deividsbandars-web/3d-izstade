import { Request, Response } from 'express';
import { workflowRunner } from '../../src/backend/workflows/workflowRunner.js';
import { workflowValidator } from '../../src/backend/workflows/workflowValidator.js';
import { supabaseClient } from '../../src/lib/supabaseClient.js';

export const executeWorkflow = async (req: Request, res: Response) => {
  const workflowId = typeof req.body?.workflowId === 'string' ? req.body.workflowId.trim() : '';
  const runContext = req.body?.runContext && typeof req.body.runContext === 'object' ? req.body.runContext : {};

  if (!workflowId) {
    return res.status(400).json({ error: 'workflowId is required' });
  }

  const result = await workflowRunner.execute(workflowId, runContext as Record<string, unknown>);
  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
};

export const validateWorkflow = async (req: Request, res: Response) => {
  const workflow = req.body?.workflow;
  if (!workflow || typeof workflow !== 'object') {
    return res.status(400).json({ error: 'workflow is required' });
  }

  const result = workflowValidator.validate(workflow);
  res.json(result);
};

export const getWorkflowDefinition = async (req: Request, res: Response) => {
  const workflowId = typeof req.params.workflowId === 'string' ? req.params.workflowId.trim() : '';
  if (!workflowId) {
    return res.status(400).json({ error: 'workflowId is required' });
  }

  const { data, error } = await supabaseClient
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error) {
    return res.status(404).json({ error: error.message });
  }

  res.json(data);
};
