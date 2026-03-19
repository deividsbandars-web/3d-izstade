import { Request, Response } from 'express';
import { agentRegistry } from '../../../src/backend/marketplace/agents/agentRegistry.js';
import { installService } from '../../../src/backend/marketplace/installService.js';

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
