import { Response } from 'express';
import { businessGenerator } from '../../src/backend/business/businessGenerator.js';
import { createHttpLlmMetering, requireAuthenticatedUserId, sendHttpLlmMeteringError } from '../lib/httpLlmMetering.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const generateBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const niche = typeof req.body?.niche === 'string'
      ? req.body.niche.trim()
      : typeof req.body?.industry === 'string'
        ? req.body.industry.trim()
        : '';
    const userId = requireAuthenticatedUserId(req);

    if (!niche) {
      return res.status(400).json({ error: 'niche or industry is required' });
    }

    const result = await businessGenerator.launchBusinessWorkflow(
      niche,
      userId,
      createHttpLlmMetering(req, '/api/business/generate', 'business-generate'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};
