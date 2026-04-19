import { Request, Response } from 'express';
import { platformMetrics } from '../../src/backend/platform/metrics/platformMetrics.js';
import { systemMonitor } from '../../src/backend/platform/monitoring/systemMonitor.js';
import { aiOptimizer } from '../../src/backend/platform/optimization/aiOptimizer.js';

export const getPlatformMetrics = async (_req: Request, res: Response) => {
  const [agents, leads, business, expo] = await Promise.all([
    platformMetrics.getAgentStats(),
    platformMetrics.getLeadStats(),
    platformMetrics.getBusinessStats(),
    platformMetrics.getExpoStats(),
  ]);

  res.json({
    agents: agents.data,
    leads: leads.data,
    business: business.data,
    expo: expo.data,
  });
};

export const getPlatformHealth = async (_req: Request, res: Response) => {
  const [queue, agents, llm] = await Promise.all([
    systemMonitor.getQueueStatus(),
    systemMonitor.getAgentHealth(),
    systemMonitor.getLLMUsage(),
  ]);

  res.json({
    queue: queue.data,
    agents: agents.data,
    llm: llm.data,
  });
};

export const analyzeLeadConversion = async (_req: Request, res: Response) => {
  const result = await aiOptimizer.analyzeLeadConversion();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ analysis: result.data });
};

export const suggestBetterNiches = async (_req: Request, res: Response) => {
  const result = await aiOptimizer.suggestBetterNiches();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ suggestions: result.data });
};

export const optimizeAgentTasks = async (_req: Request, res: Response) => {
  const result = await aiOptimizer.optimizeAgentTasks();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json({ optimization: result.data });
};
