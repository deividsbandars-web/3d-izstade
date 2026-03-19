import { Request, Response } from 'express';
import { platformMetrics } from '../../../src/backend/platform/metrics/platformMetrics.js';
import { systemMonitor } from '../../../src/backend/platform/monitoring/systemMonitor.js';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const [agents, leads, business, expo, health] = await Promise.all([
      platformMetrics.getAgentStats(),
      platformMetrics.getLeadStats(),
      platformMetrics.getBusinessStats(),
      platformMetrics.getExpoStats(),
      systemMonitor.getQueueStatus()
    ]);

    res.json({
      metrics: {
        agents: agents.data,
        leads: leads.data,
        business: business.data,
        expo: expo.data
      },
      system: health.data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
