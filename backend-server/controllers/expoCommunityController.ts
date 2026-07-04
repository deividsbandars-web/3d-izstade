import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  EXPO_COMMUNITY_LIMITS,
  buildExpoCommunityExpiresAt,
  normalizeExpoCommunityEntryInput,
  normalizeExpoCommunityGraffitiInput,
  normalizeExpoCommunityModerationInput,
  normalizeExpoCommunityReportInput,
  type ExpoCommunityEntry,
  type ExpoCommunityGraffiti,
} from '../../src/shared/expo/communityContent.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getExpoCommunityStore, resetExpoCommunityStoreForTests } from '../services/expoCommunityStore.js';
import { checkRedisBackedRateLimit } from '../services/redisRateLimit.js';

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production'
    || process.env.APP_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';
}

function authorLabel(req: AuthRequest) {
  const visitorId = String(req.user?.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return visitorId ? `Visitor ${visitorId}` : 'Expo visitor';
}

async function checkActionLimit(req: AuthRequest, action: 'graffiti' | 'post' | 'report' | 'voice') {
  const limits = { graffiti: EXPO_COMMUNITY_LIMITS.graffitiPerHour, post: 6, report: EXPO_COMMUNITY_LIMITS.reportPerHour, voice: 3 } as const;
  return checkRedisBackedRateLimit({
    key: String(req.user?.id || 'anonymous').slice(0, 96),
    limit: limits[action],
    namespace: `expo-community-${action}`,
    requireRedis: isProductionRuntime(),
    windowMs: 60 * 60 * 1000,
  });
}

function reportStorageError(res: Response, error: unknown) {
  console.error('[expo-community-store]', error);
  return res.status(503).json({ error: 'The city board is temporarily unavailable. Try again later.' });
}

export async function listExpoCommunity(_req: Request, res: Response) {
  try {
    const store = getExpoCommunityStore();
    const community = await store.listApproved();
    return res.json({
      ...community,
      limits: EXPO_COMMUNITY_LIMITS,
      persistence: store.persistence,
    });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function getExpoCommunityAudio(req: Request, res: Response) {
  const id = String(req.params.id || '');
  try {
    const stored = await getExpoCommunityStore().getAudio(id);
    if (!stored) return res.status(404).json({ error: 'Voice message not found' });
    res.set('Cache-Control', stored.status === 'approved' ? 'public, max-age=300' : 'private, no-store');
    res.type(stored.contentType);
    return res.send(stored.buffer);
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function createExpoCommunityEntry(req: AuthRequest, res: Response) {
  const normalized = normalizeExpoCommunityEntryInput(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.issues.join(' ') });
  const rateLimit = await checkActionLimit(req, 'post');
  if (rateLimit.unavailable) return res.status(503).json({ error: 'Posting limit is unavailable. Try again later.' });
  if (!rateLimit.allowed) return res.status(429).json({ error: 'You have reached the hourly board-post limit.', retryAfter: rateLimit.retryAfterSeconds });

  const entry: ExpoCommunityEntry = {
    authorLabel: authorLabel(req),
    body: normalized.body,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    kind: normalized.kind,
    reportCount: 0,
    status: 'pending',
    title: normalized.title,
  };
  entry.expiresAt = buildExpoCommunityExpiresAt(entry.createdAt, entry.kind);
  try {
    const stored = await getExpoCommunityStore().createEntry({ ...entry, authorUserId: req.user?.id });
    return res.status(201).json({ entry: stored, remaining: rateLimit.remaining });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function createExpoCommunityVoice(req: AuthRequest, res: Response) {
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
  const allowedTypes = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']);
  if (!buffer.length || buffer.length > EXPO_COMMUNITY_LIMITS.voiceBytes || !allowedTypes.has(contentType)) {
    return res.status(400).json({ error: 'Use a voice recording up to 800 KB in WEBM, OGG, MP4, or MP3 format.' });
  }
  const rateLimit = await checkActionLimit(req, 'voice');
  if (rateLimit.unavailable) return res.status(503).json({ error: 'Voice-message limit is unavailable. Try again later.' });
  if (!rateLimit.allowed) return res.status(429).json({ error: 'You have reached the hourly voice-message limit.', retryAfter: rateLimit.retryAfterSeconds });

  const id = randomUUID();
  const titleInput = normalizeExpoCommunityEntryInput({
    body: 'Short voice message',
    kind: 'message',
    title: req.headers['x-community-title'] || 'Voice message',
  });
  const entry: ExpoCommunityEntry = {
    audioUrl: `/api/expo/community/audio/${id}`,
    authorLabel: authorLabel(req),
    body: 'Short voice message',
    createdAt: new Date().toISOString(),
    id,
    kind: 'voice',
    reportCount: 0,
    status: 'pending',
    title: titleInput.title || 'Voice message',
  };
  entry.expiresAt = buildExpoCommunityExpiresAt(entry.createdAt, entry.kind);
  try {
    const stored = await getExpoCommunityStore().createEntry(
      { ...entry, authorUserId: req.user?.id },
      { buffer, contentType },
    );
    return res.status(201).json({ entry: stored, remaining: rateLimit.remaining });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function createExpoCommunityGraffiti(req: AuthRequest, res: Response) {
  const normalized = normalizeExpoCommunityGraffitiInput(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.issues.join(' ') });
  const rateLimit = await checkActionLimit(req, 'graffiti');
  if (rateLimit.unavailable) return res.status(503).json({ error: 'Graffiti limit is unavailable. Try again later.' });
  if (!rateLimit.allowed) return res.status(429).json({ error: 'You can add sprays up to 3 times per hour.', retryAfter: rateLimit.retryAfterSeconds });

  const item: ExpoCommunityGraffiti = {
    authorLabel: authorLabel(req),
    color: normalized.color,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    logoUrl: normalized.logoUrl || undefined,
    markText: normalized.markText,
    reportCount: 0,
    status: 'pending',
    wallSlot: 0,
    placement: normalized.placement,
  };
  item.expiresAt = buildExpoCommunityExpiresAt(item.createdAt, 'graffiti');
  try {
    const stored = await getExpoCommunityStore().createGraffiti({ ...item, authorUserId: req.user?.id });
    return res.status(201).json({ graffiti: stored, remaining: rateLimit.remaining });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function reportExpoCommunityItem(req: AuthRequest, res: Response) {
  const id = String(req.params.id || '');
  const normalized = normalizeExpoCommunityReportInput(req.body);
  const rateLimit = await checkActionLimit(req, 'report');
  if (rateLimit.unavailable) return res.status(503).json({ error: 'Report limit is unavailable. Try again later.' });
  if (!rateLimit.allowed) return res.status(429).json({ error: 'You have reached the hourly report limit.', retryAfter: rateLimit.retryAfterSeconds });
  try {
    const item = await getExpoCommunityStore().report(id, {
      detail: normalized.detail,
      reason: normalized.reason,
      reporterLabel: authorLabel(req),
      reporterUserId: req.user?.id,
    });
    if (!item) return res.status(404).json({ error: 'Community item not found' });
    return res.status(202).json({ item, remaining: rateLimit.remaining });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function listExpoCommunityModeration(_req: AuthRequest, res: Response) {
  try {
    return res.json(await getExpoCommunityStore().listModeration());
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export async function moderateExpoCommunity(req: AuthRequest, res: Response) {
  const id = String(req.params.id || '');
  const normalized = normalizeExpoCommunityModerationInput(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.issues.join(' ') });
  try {
    const item = await getExpoCommunityStore().moderate(id, normalized.status, req.user?.id, normalized.note);
    if (!item) return res.status(404).json({ error: 'Community item not found' });
    return res.json({ item });
  } catch (error) {
    return reportStorageError(res, error);
  }
}

export function resetExpoCommunityForTests() {
  resetExpoCommunityStoreForTests();
}
