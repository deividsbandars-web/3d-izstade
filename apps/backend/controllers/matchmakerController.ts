import { Request, Response } from 'express';
import * as matchmaker from '../services/matchmaker.js';

export const requestInstance = async (req: Request, res: Response) => {
  try {
    const instanceId = await matchmaker.getAvailableInstance();
    if (!instanceId) {
      return res.status(503).json({ error: 'No instances available' });
    }
    res.status(200).json({ instanceId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const registerInstance = async (req: Request, res: Response) => {
  const { instanceId } = req.body;
  try {
    await matchmaker.registerInstance(instanceId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const heartbeat = async (req: Request, res: Response) => {
  const { instanceId } = req.body;
  try {
    await matchmaker.updateHeartbeat(instanceId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
