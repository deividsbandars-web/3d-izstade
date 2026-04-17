import { Request, Response } from 'express';
import { businessGenerator } from '../../src/backend/business/businessGenerator.js';

export const generateBusiness = async (req: Request, res: Response) => {
  const niche = typeof req.body?.niche === 'string'
    ? req.body.niche.trim()
    : typeof req.body?.industry === 'string'
      ? req.body.industry.trim()
      : '';
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : undefined;

  if (!niche) {
    return res.status(400).json({ error: 'niche or industry is required' });
  }

  const result = await businessGenerator.launchBusinessWorkflow(niche, userId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};
