import { Request, Response } from 'express';
import { platformApplicationService } from '../../src/backend/platform/platformApplicationService.js';

export const getPlatformMetrics = async (_req: Request, res: Response) => {
  const metrics = await platformApplicationService.getPlatformMetricsSnapshot();
  res.json(metrics);
};

export const getPlatformHealth = async (_req: Request, res: Response) => {
  const health = await platformApplicationService.getPlatformHealthSnapshot();
  res.json(health);
};

export const analyzeLeadConversion = async (_req: Request, res: Response) => {
  const result = await platformApplicationService.analyzeLeadConversion();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ analysis: result.data });
};

export const suggestBetterNiches = async (_req: Request, res: Response) => {
  const result = await platformApplicationService.suggestBetterNiches();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ suggestions: result.data });
};

export const optimizeAgentTasks = async (_req: Request, res: Response) => {
  const result = await platformApplicationService.optimizeAgentTasks();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ optimization: result.data });
};
