import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';
import {
  resolvePublicLeadAbuseConfig,
  type PublicLeadAbuseConfig,
  type PublicLeadRoute,
} from '../config/publicLeadAbuse.js';
import { getClientIp, getClientIpRateLimitKey } from '../middleware/clientIp.js';
import {
  checkRedisBackedRateLimit,
  type RedisBackedRateLimitResult,
  type RedisBackedRateLimitStore,
} from './redisRateLimit.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TURNSTILE_TOKEN_LENGTH = 4_096;

type PublicLeadAuditStage =
  | 'accepted'
  | 'duplicate'
  | 'rateLimit'
  | 'spam'
  | 'storage'
  | 'turnstile'
  | 'validation';

export type PublicLeadProvenance = {
  clientIpVersion: 4 | 6 | null;
  correlationId: string | null;
  method: string | null;
  origin: string | null;
  receivedAt: string;
  refererOrigin: string | null;
  requestPath: string | null;
  sourcePath: string | null;
  userAgentPresent: boolean;
};

export type PublicLeadAuditEvent = PublicLeadProvenance & {
  code: string;
  rateLimitStore: RedisBackedRateLimitResult['store'] | null;
  route: PublicLeadRoute;
  stage: PublicLeadAuditStage;
  status: number;
  turnstileVerified: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeOptionalText(value: unknown, maximumLength: number) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized.slice(0, maximumLength) : null;
}

function getNestedAntiSpamRecords(body: unknown) {
  const record = asRecord(body);
  return [record, asRecord(record.spam), asRecord(record.antiSpam)];
}

export function hasFilledPublicLeadHoneypot(body: unknown) {
  return getNestedAntiSpamRecords(body).some((record) => (
    ['website', 'companyWebsite', 'homepage']
      .some((key) => Boolean(normalizeOptionalText(record[key], 512)))
  ));
}

function getTurnstileToken(body: unknown) {
  for (const record of getNestedAntiSpamRecords(body)) {
    const token = normalizeOptionalText(
      record.turnstileToken ?? record['cf-turnstile-response'],
      MAX_TURNSTILE_TOKEN_LENGTH,
    );
    if (token) {
      return token;
    }
  }

  return null;
}

export async function verifyPublicLeadTurnstile(
  body: unknown,
  req: Request,
  config: PublicLeadAbuseConfig = resolvePublicLeadAbuseConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<
  | { ok: true; verified: boolean }
  | { code: 'PUBLIC_LEAD_TURNSTILE_FAILED' | 'PUBLIC_LEAD_TURNSTILE_REQUIRED'; ok: false; verified: false }
> {
  const token = getTurnstileToken(body);
  if (!config.turnstile.secretKey) {
    return config.turnstile.required
      ? { code: 'PUBLIC_LEAD_TURNSTILE_REQUIRED', ok: false, verified: false }
      : { ok: true, verified: false };
  }
  if (!token) {
    return config.turnstile.required
      ? { code: 'PUBLIC_LEAD_TURNSTILE_REQUIRED', ok: false, verified: false }
      : { ok: true, verified: false };
  }

  const params = new URLSearchParams({
    response: token,
    secret: config.turnstile.secretKey,
  });
  const clientIp = getClientIp(req);
  if (clientIp !== 'unknown') {
    params.set('remoteip', clientIp);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.turnstile.timeoutMs);
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      signal: controller.signal,
    });
    if (!response.ok) {
      return { code: 'PUBLIC_LEAD_TURNSTILE_FAILED', ok: false, verified: false };
    }

    const result = await response.json() as { success?: boolean };
    return result.success === true
      ? { ok: true, verified: true }
      : { code: 'PUBLIC_LEAD_TURNSTILE_FAILED', ok: false, verified: false };
  } catch {
    return { code: 'PUBLIC_LEAD_TURNSTILE_FAILED', ok: false, verified: false };
  } finally {
    clearTimeout(timeout);
  }
}

export function checkPublicLeadRateLimit(
  route: PublicLeadRoute,
  req: Request,
  config: PublicLeadAbuseConfig = resolvePublicLeadAbuseConfig(),
  options: {
    nowMs?: number;
    store?: RedisBackedRateLimitStore;
  } = {},
) {
  return checkRedisBackedRateLimit({
    key: getClientIpRateLimitKey(req),
    limit: config.rateLimit.maxRequests[route],
    namespace: `public-lead-${route}`,
    nowMs: options.nowMs,
    requireRedis: config.rateLimit.requireRedis,
    store: options.store,
    windowMs: config.rateLimit.windowMs,
  });
}

export function createPublicLeadSubmissionFingerprint({
  duplicateWindowMs,
  email,
  nowMs,
  route,
  scope,
}: {
  duplicateWindowMs: number;
  email: string;
  nowMs: number;
  route: PublicLeadRoute;
  scope: string;
}) {
  const bucket = Math.floor(nowMs / duplicateWindowMs);
  return createHash('sha256')
    .update(`${route}:${email.trim().toLowerCase()}:${scope.trim().toLowerCase()}:${bucket}`)
    .digest('hex');
}

function normalizeSafeCorrelationId(value: unknown) {
  const normalized = normalizeOptionalText(value, 128);
  if (!normalized) {
    return null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
  const isTraceId = /^[0-9a-f]{16,32}$/i.test(normalized);
  return isUuid || isTraceId ? normalized : null;
}

function normalizeHttpOrigin(value: unknown) {
  const normalized = normalizeOptionalText(value, 2_048);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

function normalizeSourcePath(value: unknown) {
  const normalized = normalizeOptionalText(value, 2_048);
  if (!normalized) {
    return null;
  }

  try {
    const pathname = new URL(normalized, 'https://public-lead.invalid').pathname.slice(0, 512) || '/';
    let decodedPathname = pathname;
    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    return /[^\s/@]+@[^\s/]+/.test(decodedPathname) ? null : pathname;
  } catch {
    return null;
  }
}

function firstHeader(req: Request, name: string) {
  const value = req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function createPublicLeadProvenance(
  req: Request,
  sourcePath: unknown,
  nowMs = Date.now(),
): PublicLeadProvenance {
  const correlationId = (req as Request & { correlationId?: unknown }).correlationId;
  const ipVersion = isIP(getClientIp(req));

  return {
    clientIpVersion: ipVersion === 4 || ipVersion === 6 ? ipVersion : null,
    correlationId: normalizeSafeCorrelationId(correlationId ?? firstHeader(req, 'x-correlation-id')),
    method: normalizeOptionalText(req.method, 16)?.toUpperCase() ?? null,
    origin: normalizeHttpOrigin(firstHeader(req, 'origin')),
    receivedAt: new Date(nowMs).toISOString(),
    refererOrigin: normalizeHttpOrigin(firstHeader(req, 'referer')),
    requestPath: normalizeSourcePath(req.path),
    sourcePath: normalizeSourcePath(sourcePath),
    userAgentPresent: Boolean(normalizeOptionalText(firstHeader(req, 'user-agent'), 1)),
  };
}

export function createPublicLeadAuditEvent(
  req: Request,
  sourcePath: unknown,
  details: {
    code: string;
    nowMs?: number;
    rateLimitStore?: RedisBackedRateLimitResult['store'] | null;
    route: PublicLeadRoute;
    stage: PublicLeadAuditStage;
    status: number;
    turnstileVerified?: boolean;
  },
): PublicLeadAuditEvent {
  return {
    ...createPublicLeadProvenance(req, sourcePath, details.nowMs),
    code: details.code,
    rateLimitStore: details.rateLimitStore ?? null,
    route: details.route,
    stage: details.stage,
    status: details.status,
    turnstileVerified: details.turnstileVerified ?? false,
  };
}

export function logPublicLeadAuditEvent(event: PublicLeadAuditEvent) {
  const log = event.stage === 'accepted' ? console.info : console.warn;
  log('[public-lead]', event);
}
