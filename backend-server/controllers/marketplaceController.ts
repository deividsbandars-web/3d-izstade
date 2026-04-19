import { Request, Response } from 'express';
import { agentRegistry } from '../../src/backend/marketplace/agents/agentRegistry.js';
import { installService } from '../../src/backend/marketplace/installService.js';
import { workflowMarketplace } from '../../src/backend/marketplace/workflows/workflowMarketplace.js';
import { templateService } from '../../src/backend/marketplace/templates/templateService.js';

export const getMarketplaceAgents = async (req: Request, res: Response) => {
  try {
    const agents = await agentRegistry.getAvailableAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const installAgent = async (req: Request, res: Response) => {
  const { userId, agentId } = req.body;

  if (!userId || !agentId) {
    return res.status(400).json({ error: 'userId and agentId are required' });
  }

  try {
    const result = await installService.installAgent(userId, agentId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMarketplaceWorkflows = async (_req: Request, res: Response) => {
  try {
    const result = await workflowMarketplace.getAvailableWorkflows();
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMarketplaceTemplates = async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;
    const result = await templateService.getAvailableTemplates(category);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const installWorkflow = async (req: Request, res: Response) => {
  const { userId, workflowId } = req.body;

  if (!userId || !workflowId) {
    return res.status(400).json({ error: 'userId and workflowId are required' });
  }

  try {
    const result = await installService.installWorkflow(userId, workflowId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const installTemplate = async (req: Request, res: Response) => {
  const { userId, templateId } = req.body;

  if (!userId || !templateId) {
    return res.status(400).json({ error: 'userId and templateId are required' });
  }

  try {
    const result = await installService.installTemplate(userId, templateId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
