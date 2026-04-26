import { Request, Response } from 'express';
import { expoService } from '../../src/backend/expo/expoService.js';
import { cityMapService } from '../../src/backend/expo/city/cityMapService.js';
import { expoSceneService } from '../../src/backend/expo/scenes/expoSceneService.js';
import { boothAnalytics } from '../../src/backend/expo/analytics/boothAnalytics.js';
import { getExpoBoothById } from '../../src/backend/expo/data/expoBoothStore.js';
import {
  boothBelongsToUser,
  listManagedExpoBoothsForUser,
  mergeOwnedBoothPayload,
} from '../../src/backend/expo/booths/expoBoothManagementService.js';
import {
  buildExpoReviewBooth,
  buildExpoReviewSnapshot,
  updateExpoReviewLeadOps as updateExpoReviewLeadOpsUseCase,
  updateExpoReviewLeadStatus as updateExpoReviewLeadStatusUseCase,
} from '../../src/backend/expo/review/expoReviewService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function getIdParam(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export const createBooth = async (req: AuthRequest, res: Response) => {
  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'booth payload is required' });
  }

  const result = await expoService.createBooth(
    mergeOwnedBoothPayload(payload as Record<string, unknown>, req.user ?? {}) as any,
  );
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(201).json(result.data);
};

export const updateBooth = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'update payload is required' });
  }

  const existingBooth = await getExpoBoothById(boothId);
  if (existingBooth.error || !existingBooth.data) {
    return res.status(404).json({ error: existingBooth.error || `Booth ${boothId} not found` });
  }

  if (req.user?.role !== 'admin' && !boothBelongsToUser(existingBooth.data, req.user ?? {})) {
    return res.status(403).json({ error: 'Booth ownership mismatch' });
  }

  const result = await expoService.updateBooth(
    boothId,
    mergeOwnedBoothPayload(payload as Record<string, unknown>, req.user ?? {}) as any,
  );
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

export const getManagedBooths = async (req: AuthRequest, res: Response) => {
  const result = await listManagedExpoBoothsForUser(req.user ?? {});
  if (result.error || !result.data) {
    return res.status(500).json({ error: String(result.error || 'Managed booths unavailable') });
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

export const getExpoReviewSnapshot = async (_req: Request, res: Response) => {
  try {
    const snapshot = await buildExpoReviewSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getExpoReviewBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await buildExpoReviewBooth(boothId);
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};

export const updateExpoReviewLeadStatus = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const nextStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (!['pending', 'contacted', 'closed', 'rejected'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Unsupported expo lead status' });
  }

  const result = await updateExpoReviewLeadStatusUseCase(boothId, leadId, nextStatus, req.user ?? {});
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};

export const updateExpoReviewLeadOps = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const opsNotes =
    typeof req.body?.opsNotes === 'string' && req.body.opsNotes.trim().length > 0
      ? req.body.opsNotes.trim()
      : null;
  const followUpAt =
    typeof req.body?.followUpAt === 'string' && req.body.followUpAt.trim().length > 0
      ? req.body.followUpAt.trim()
      : null;

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (followUpAt && Number.isNaN(Date.parse(followUpAt))) {
    return res.status(400).json({ error: 'followUpAt must be a valid datetime' });
  }

  const result = await updateExpoReviewLeadOpsUseCase(boothId, leadId, opsNotes, followUpAt, req.user ?? {});
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};
