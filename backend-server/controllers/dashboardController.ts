import { Request, Response } from 'express';
import { platformApplicationService } from '../../src/backend/platform/platformApplicationService.js';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const snapshot = await platformApplicationService.getDashboardSnapshot();
    res.json(snapshot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
