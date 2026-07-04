import { Request, Response } from 'express';
import { platformApplicationService } from '../../src/backend/platform/platformApplicationService.js';
import { createHttpLlmMetering, sendHttpLlmMeteringError } from '../lib/httpLlmMetering.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const getPlatformMetrics = async (_req: Request, res: Response) => {
  const metrics = await platformApplicationService.getPlatformMetricsSnapshot();
  res.json(metrics);
};

export const getPlatformHealth = async (_req: Request, res: Response) => {
  const health = await platformApplicationService.getPlatformHealthSnapshot();
  res.json(health);
};

export const analyzeLeadConversion = async (req: AuthRequest, res: Response) => {
  try {
    const result = await platformApplicationService.analyzeLeadConversion(
      createHttpLlmMetering(req, '/api/platform/optimization/lead-conversion', 'platform-lead-conversion-analysis'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ analysis: result.data });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const suggestBetterNiches = async (req: AuthRequest, res: Response) => {
  try {
    const result = await platformApplicationService.suggestBetterNiches(
      createHttpLlmMetering(req, '/api/platform/optimization/niches', 'platform-niche-suggestions'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ suggestions: result.data });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const optimizeAgentTasks = async (req: AuthRequest, res: Response) => {
  try {
    const result = await platformApplicationService.optimizeAgentTasks(
      createHttpLlmMetering(req, '/api/platform/optimization/agent-tasks', 'platform-agent-task-optimization'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ optimization: result.data });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};
