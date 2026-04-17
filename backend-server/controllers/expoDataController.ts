import { Request, Response } from 'express';
import { expoService } from '../../src/backend/expo/expoService.js';
import { cityMapService } from '../../src/backend/expo/city/cityMapService.js';
import { expoSceneService } from '../../src/backend/expo/scenes/expoSceneService.js';
import { boothAnalytics } from '../../src/backend/expo/analytics/boothAnalytics.js';

function getIdParam(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export const createBooth = async (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'booth payload is required' });
  }

  const result = await expoService.createBooth(payload as any);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(201).json(result.data);
};

export const updateBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'update payload is required' });
  }

  const result = await expoService.updateBooth(boothId, payload as any);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoService.getBoothById(boothId);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBooths = async (_req: Request, res: Response) => {
  const result = await expoService.getBooths();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBoothAnalytics = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await boothAnalytics.getBoothStats(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getExpoCity = async (_req: Request, res: Response) => {
  const result = await cityMapService.getCityMap();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getDistricts = async (_req: Request, res: Response) => {
  const result = await cityMapService.getDistricts();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const assignBoothToDistrict = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const districtName =
    typeof req.body?.districtName === 'string' && req.body.districtName.trim().length > 0
      ? req.body.districtName.trim()
      : '';

  if (!boothId || !districtName) {
    return res.status(400).json({ error: 'boothId and districtName are required' });
  }

  const result = await cityMapService.assignBoothToDistrict(boothId, districtName);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBoothScene = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoSceneService.getBoothScene(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getCityScene = async (_req: Request, res: Response) => {
  const result = await expoSceneService.getCityScene();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};
