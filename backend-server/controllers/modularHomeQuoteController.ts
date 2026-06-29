import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { getSupabase } from '../services/supabase.js';
import {
  checkRedisBackedRateLimit,
  isRedisRateLimitConfigured,
  resetRedisRateLimitForTests,
  type RedisBackedRateLimitStore,
} from '../services/redisRateLimit.js';
import {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  MODULAR_HOME_QUOTE_CONSENT_VERSION,
  MODULAR_HOME_QUOTE_PRIVACY_VERSION,
  asRecord,
  normalizeOptionalText,
  validateModularHomeQuoteRequest,
  type ValidModularHomeQuoteRequest,
} from '../schemas/quoteValidation.js';

export {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  MODULAR_HOME_QUOTE_CONSENT_VERSION,
  MODULAR_HOME_QUOTE_PRIVACY_VERSION,
  validateModularHomeQuoteRequest,
} from '../schemas/quoteValidation.js';
export type {
  ModularHomeQuoteRequestBody,
  ValidModularHomeQuoteRequest,
} from '../schemas/quoteValidation.js';

export type ModularHomeQuoteSubmissionConfig = {
  enabled: boolean;
  emailHandoffEnabled: boolean;
  hardeningPlan: ModularHomeQuoteBackendHardeningPlan;
  production: {
    allowedHosts: string[];
    enabledByEnvironment: boolean;
    redisConfigured: boolean;
    turnstileConfigured: boolean;
    turnstileRequired: boolean;
  };
  productionReady: boolean;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  requiresExplicitRequestFlag: true;
  requiresStagingEnvironment: boolean;
  staging: {
    allowedHosts: string[];
    allowedPreviewHostPattern: string;
    environmentName: string | null;
    enabledByEnvironment: boolean;
  };
  storageTable: 'modular_home_quote_requests';
};

export type ModularHomeQuoteBackendHardeningPlan = {
  adminAccessRequirements: string[];
  auditLogRequirements: string[];
  consent: {
    required: true;
    consentVersion: typeof MODULAR_HOME_QUOTE_CONSENT_VERSION;
    privacyVersion: typeof MODULAR_HOME_QUOTE_PRIVACY_VERSION;
    text: typeof MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT;
  };
  emailCrmHandoff: {
    defaultEnabled: false;
    plan: string[];
  };
  enablementGate: {
    envFlag: 'MODULAR_HOME_QUOTE_SUBMISSION_ENABLED';
    requestFlag: 'homeQuoteBackend=1';
    defaultMode: 'disabled';
    stagingRequirement: string;
  };
  rateLimitingPlan: {
    currentGlobalLimit: string;
    productionRequirement: string[];
  };
  spamPreventionPlan: string[];
  supabasePolicyNotes: string[];
};

export type ModularHomeQuoteFailureStage =
  | 'disabled'
  | 'duplicate'
  | 'flag'
  | 'host'
  | 'rateLimit'
  | 'spam'
  | 'staging'
  | 'validation'
  | 'storage';

export type ModularHomeQuoteSafeLogEvent = {
  code: string;
  hasConsent: boolean;
  hasEstimate: boolean;
  hasProject: boolean;
  hasRequester: boolean;
  host: string | null;
  method: string | null;
  path: string | null;
  requestFlagEnabled: boolean;
  sourceVertical: string | null;
  productionRequest: boolean;
  stage: ModularHomeQuoteFailureStage;
  stagingRequest: boolean;
  status: number;
  submissionEnabled: boolean;
  timestamp: string;
};

export type ModularHomeQuoteStorageClient = {
  from: (table: string) => {
    select: (columns: string) => ModularHomeQuoteSelectBuilder;
    insert: (rows: unknown[]) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { id?: string | null } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export type ModularHomeQuoteSelectBuilder = {
  eq: (column: string, value: string) => ModularHomeQuoteSelectBuilder;
  maybeSingle: () => Promise<{
    data: { id?: string | null } | null;
    error: { message?: string } | null;
  }>;
};

export type ModularHomeQuoteSubmitDependencies = {
  fetchImpl?: typeof fetch;
  rateLimitStore?: RedisBackedRateLimitStore;
  storage?: ModularHomeQuoteStorageClient;
};

const DEFAULT_STAGING_HOSTS = [
  'staging.30sek24.com',
  'localhost',
  '127.0.0.1',
] as const;
const STAGING_PREVIEW_HOST_PATTERN = /^app-staging-[a-z0-9-]+\.vercel\.app$/;
const MODULAR_HOME_QUOTE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MODULAR_HOME_QUOTE_RATE_LIMIT_MAX_REQUESTS = 5;

export function getModularHomeQuoteBackendHardeningPlan(): ModularHomeQuoteBackendHardeningPlan {
  return {
    adminAccessRequirements: [
      'Quote review must stay behind authenticated admin/sales access.',
      'Public visitors must never be able to list, export or update quote requests.',
      'Status changes require actor identity and audit log entry.',
    ],
    auditLogRequirements: [
      'Record disabled-backend attempts without storing PII payloads.',
      'Record validation failures with error code, request id and coarse source metadata only.',
      'Record successful insert id, consent version, privacy version and source surface.',
      'Record email/CRM handoff queue result separately from visitor response.',
      'Record admin status/export actions with actor id.',
    ],
    consent: {
      consentVersion: MODULAR_HOME_QUOTE_CONSENT_VERSION,
      privacyVersion: MODULAR_HOME_QUOTE_PRIVACY_VERSION,
      required: true,
      text: MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
    },
    emailCrmHandoff: {
      defaultEnabled: false,
      plan: [
        'Keep email/CRM handoff disabled unless MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED=true.',
        'Queue email/CRM handoff after Supabase insert; do not block quote response on email provider.',
        'Use idempotency by quote id before sending duplicate notifications.',
      ],
    },
    enablementGate: {
      defaultMode: 'disabled',
      envFlag: 'MODULAR_HOME_QUOTE_SUBMISSION_ENABLED',
      requestFlag: 'homeQuoteBackend=1',
      stagingRequirement: 'staging host, staging/preview environment, or explicit production host allowlist',
    },
    rateLimitingPlan: {
      currentGlobalLimit: 'Route-specific Redis-backed guard applies 5 Modular Home quote backend attempts / 10 minutes / IP before Supabase insert. Existing global API middleware also uses the Redis-backed limiter in production.',
      productionRequirement: [
        'Keep distributed Redis rate limiting via REDIS_URL configured before enabling production hosts.',
        'Keep duplicate guard by normalized email + product/config hash.',
        'Store production counters in Redis, not process memory, for multi-instance deployments.',
      ],
    },
    spamPreventionPlan: [
      'Keep strict server-side length limits and enum validation.',
      'Reject filled honeypot fields before Supabase insert.',
      'Verify Turnstile tokens when MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY is configured.',
      'Reject obvious automated submissions before Supabase insert.',
      'Never trust frontend consent or estimate fields without server validation.',
    ],
    supabasePolicyNotes: [
      'Storage table: modular_home_quote_requests.',
      'Anon/client keys must not have SELECT/UPDATE/DELETE access.',
      'Inserts should happen only from trusted backend service role while endpoint is gated.',
      'Future admin viewer needs protected API, RLS policy review and export audit logging.',
      'File uploads are out of scope; no storage bucket should be enabled for this route yet.',
    ],
  };
}

function readFirstHeaderValue(req: Request, headerName: string): string | null {
  const raw = req.headers[headerName.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return typeof raw === 'string' ? raw : null;
}

function normalizeHost(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const firstValue = value.split(',')[0]?.trim();
  if (!firstValue) {
    return null;
  }

  if (firstValue.includes('://')) {
    try {
      return new URL(firstValue).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  return firstValue
    .split('/')[0]
    .split(':')[0]
    .trim()
    .toLowerCase() || null;
}

function getModularHomeQuoteRequestHostCandidates(req: Request): string[] {
  return [
    readFirstHeaderValue(req, 'x-forwarded-host'),
    readFirstHeaderValue(req, 'host'),
    readFirstHeaderValue(req, 'origin'),
    readFirstHeaderValue(req, 'referer'),
  ]
    .map((value) => normalizeHost(value))
    .filter((value): value is string => Boolean(value));
}

function getModularHomeQuoteAllowedStagingHosts(): string[] {
  const configured = process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS;
  const hosts = configured
    ? configured.split(',').map((host) => normalizeHost(host)).filter((host): host is string => Boolean(host))
    : [...DEFAULT_STAGING_HOSTS];

  return Array.from(new Set(hosts));
}

function getModularHomeQuoteAllowedProductionHosts(): string[] {
  const configured = process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS;
  const hosts = configured
    ? configured.split(',').map((host) => normalizeHost(host)).filter((host): host is string => Boolean(host))
    : [];

  return Array.from(new Set(hosts));
}

function isModularHomeQuoteAllowedPreviewHost(host: string): boolean {
  return STAGING_PREVIEW_HOST_PATTERN.test(host);
}

function isModularHomeQuoteAllowedStagingHost(host: string, allowedHosts = getModularHomeQuoteAllowedStagingHosts()): boolean {
  return allowedHosts.includes(host) || isModularHomeQuoteAllowedPreviewHost(host);
}

function getModularHomeQuoteEnvironmentName(): string | null {
  const value = process.env.APP_ENV || process.env.VERCEL_ENV || '';
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function isModularHomeQuoteStagingEnvironmentName(environmentName: string | null): boolean {
  return environmentName === 'staging' || environmentName === 'preview';
}

function isModularHomeQuoteProductionEnvironmentName(environmentName: string | null): boolean {
  return environmentName === 'production';
}

export function isModularHomeQuoteStagingRequest(req: Request): boolean {
  const environmentName = getModularHomeQuoteEnvironmentName();
  const allowedHosts = getModularHomeQuoteAllowedStagingHosts();
  const hostCandidates = getModularHomeQuoteRequestHostCandidates(req);
  const allowedHostSeen = hostCandidates.some((candidate) => (
    isModularHomeQuoteAllowedStagingHost(candidate, allowedHosts)
  ));

  if (allowedHostSeen) {
    return true;
  }

  // Environment alone is not enough for a live submission if request headers identify production.
  return isModularHomeQuoteStagingEnvironmentName(environmentName) && hostCandidates.length === 0;
}

export function isModularHomeQuoteProductionRequest(req: Request): boolean {
  const allowedHosts = getModularHomeQuoteAllowedProductionHosts();
  if (allowedHosts.length === 0) {
    return false;
  }

  const hostCandidates = getModularHomeQuoteRequestHostCandidates(req);
  return hostCandidates.some((candidate) => allowedHosts.includes(candidate));
}

function isModularHomeQuoteAllowedSubmissionHost(req: Request): boolean {
  return isModularHomeQuoteStagingRequest(req) || isModularHomeQuoteProductionRequest(req);
}

export function createModularHomeQuoteSafeLogEvent(
  req: Request,
  code: string,
  status: number,
  stage: ModularHomeQuoteFailureStage,
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
): ModularHomeQuoteSafeLogEvent {
  const body = asRecord(req.body) ?? {};
  const source = asRecord(body.source) ?? {};

  return {
    code,
    hasConsent: Boolean(asRecord(body.consent)),
    hasEstimate: Boolean(asRecord(body.estimate)),
    hasProject: Boolean(asRecord(body.project)),
    hasRequester: Boolean(asRecord(body.requester)),
    host: normalizeHost(readFirstHeaderValue(req, 'x-forwarded-host') ?? readFirstHeaderValue(req, 'host')),
    method: typeof req.method === 'string' ? req.method : null,
    path: typeof req.path === 'string' ? req.path : null,
    requestFlagEnabled: isModularHomeQuoteBackendRequestEnabled(req.query),
    sourceVertical: normalizeOptionalText(source.vertical, 80),
    productionRequest: isModularHomeQuoteProductionRequest(req),
    stage,
    stagingRequest: isModularHomeQuoteStagingRequest(req),
    status,
    submissionEnabled: submissionConfig.enabled,
    timestamp: new Date().toISOString(),
  };
}

function logModularHomeQuoteFailure(event: ModularHomeQuoteSafeLogEvent): void {
  console.warn('[modular-home-quote]', event);
}

export function getModularHomeQuoteSubmissionConfig(): ModularHomeQuoteSubmissionConfig {
  const environmentName = getModularHomeQuoteEnvironmentName();
  const productionAllowedHosts = getModularHomeQuoteAllowedProductionHosts();
  const redisConfigured = isRedisRateLimitConfigured();
  const turnstileConfigured = Boolean(process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY?.trim());
  const turnstileRequired = process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED === 'true';

  return {
    emailHandoffEnabled: process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED === 'true',
    enabled: process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED === 'true',
    hardeningPlan: getModularHomeQuoteBackendHardeningPlan(),
    production: {
      allowedHosts: productionAllowedHosts,
      enabledByEnvironment: isModularHomeQuoteProductionEnvironmentName(environmentName),
      redisConfigured,
      turnstileConfigured,
      turnstileRequired,
    },
    productionReady: process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED === 'true'
      && productionAllowedHosts.length > 0
      && redisConfigured
      && (!turnstileRequired || turnstileConfigured),
    rateLimit: {
      maxRequests: MODULAR_HOME_QUOTE_RATE_LIMIT_MAX_REQUESTS,
      windowMs: MODULAR_HOME_QUOTE_RATE_LIMIT_WINDOW_MS,
    },
    requiresExplicitRequestFlag: true,
    requiresStagingEnvironment: productionAllowedHosts.length === 0,
    staging: {
      allowedHosts: getModularHomeQuoteAllowedStagingHosts(),
      allowedPreviewHostPattern: STAGING_PREVIEW_HOST_PATTERN.source,
      enabledByEnvironment: isModularHomeQuoteStagingEnvironmentName(environmentName),
      environmentName,
    },
    storageTable: 'modular_home_quote_requests',
  };
}

export function isModularHomeQuoteBackendRequestEnabled(query: Request['query']): boolean {
  const value = query.homeQuoteBackend;

  if (Array.isArray(value)) {
    return value.includes('1');
  }

  return value === '1';
}

export type ModularHomeQuoteRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
  store: 'redis' | 'memory' | 'unavailable';
  unavailable: boolean;
};

function getModularHomeQuoteRateLimitKey(req: Request): string {
  const forwardedFor = readFirstHeaderValue(req, 'x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = readFirstHeaderValue(req, 'x-real-ip');
  const directIp = typeof req.ip === 'string' ? req.ip : '';
  const socketIp = typeof req.socket?.remoteAddress === 'string' ? req.socket.remoteAddress : '';
  const candidate = forwardedFor || realIp || directIp || socketIp || 'unknown';

  return candidate.slice(0, 96);
}

export function resetModularHomeQuoteRateLimitForTests(): void {
  resetRedisRateLimitForTests();
}

export async function checkModularHomeQuoteRateLimit(
  req: Request,
  nowMs = Date.now(),
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
  store?: RedisBackedRateLimitStore,
): Promise<ModularHomeQuoteRateLimitResult> {
  const key = getModularHomeQuoteRateLimitKey(req);
  return checkRedisBackedRateLimit({
    key,
    limit: submissionConfig.rateLimit.maxRequests,
    namespace: 'modular-home-quote',
    nowMs,
    requireRedis: isModularHomeQuoteProductionRequest(req),
    store,
    windowMs: submissionConfig.rateLimit.windowMs,
  });
}

function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`
  )).join(',')}}`;
}

export function createModularHomeQuoteConfigHash(payload: ValidModularHomeQuoteRequest): string {
  return crypto
    .createHash('sha256')
    .update(stableJsonStringify({
      config: payload.config,
      productId: payload.project.productId,
    }))
    .digest('hex');
}

export function createModularHomeQuoteDuplicateGuardKey(payload: ValidModularHomeQuoteRequest): string {
  const normalizedEmail = payload.requester.email.trim().toLowerCase();
  const configHash = createModularHomeQuoteConfigHash(payload);
  return crypto
    .createHash('sha256')
    .update(`${normalizedEmail}:${payload.project.productId}:${configHash}`)
    .digest('hex');
}

function getHoneypotValues(body: unknown): string[] {
  const record = asRecord(body) ?? {};
  const spam = asRecord(record.spam) ?? {};
  const antiSpam = asRecord(record.antiSpam) ?? {};

  return [
    record.website,
    record.companyWebsite,
    record.homepage,
    spam.website,
    spam.companyWebsite,
    spam.homepage,
    antiSpam.website,
    antiSpam.companyWebsite,
    antiSpam.homepage,
  ]
    .map((value) => typeof value === 'string' ? value.trim() : '')
    .filter(Boolean);
}

export function hasFilledModularHomeQuoteHoneypot(body: unknown): boolean {
  return getHoneypotValues(body).length > 0;
}

function getTurnstileToken(body: unknown): string | null {
  const record = asRecord(body) ?? {};
  const spam = asRecord(record.spam) ?? {};
  const antiSpam = asRecord(record.antiSpam) ?? {};

  return normalizeOptionalText(
    record.turnstileToken ?? spam.turnstileToken ?? antiSpam.turnstileToken,
    4096,
  );
}

export async function verifyModularHomeQuoteTurnstile(
  body: unknown,
  req: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { code: string; ok: false }> {
  const secret = process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY?.trim();
  const required = process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED === 'true';
  if (!secret) {
    return { ok: true };
  }

  const token = getTurnstileToken(body);
  if (!token) {
    return required
      ? { code: 'MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED', ok: false }
      : { ok: true };
  }

  const params = new URLSearchParams({
    remoteip: getModularHomeQuoteRateLimitKey(req),
    response: token,
    secret,
  });
  const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });

  if (!response.ok) {
    return { code: 'MODULAR_HOME_QUOTE_TURNSTILE_FAILED', ok: false };
  }

  const result = await response.json() as { success?: boolean };
  return result.success === true
    ? { ok: true }
    : { code: 'MODULAR_HOME_QUOTE_TURNSTILE_FAILED', ok: false };
}

export async function findDuplicateModularHomeQuoteRequest(
  payload: ValidModularHomeQuoteRequest,
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
  storage: ModularHomeQuoteStorageClient = getSupabase() as unknown as ModularHomeQuoteStorageClient,
): Promise<string | null> {
  const duplicateGuardKey = createModularHomeQuoteDuplicateGuardKey(payload);
  const { data, error } = await storage
    .from(submissionConfig.storageTable)
    .select('id')
    .eq('attribution->>duplicateGuardKey', duplicateGuardKey)
    .maybeSingle();

  if (error) {
    throw new Error('MODULAR_HOME_QUOTE_DUPLICATE_CHECK_FAILED');
  }

  return data?.id ?? null;
}

export async function insertModularHomeQuoteRequest(
  payload: ValidModularHomeQuoteRequest,
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
  storage: ModularHomeQuoteStorageClient = getSupabase() as unknown as ModularHomeQuoteStorageClient,
): Promise<string | null> {
  const configHash = createModularHomeQuoteConfigHash(payload);
  const duplicateGuardKey = createModularHomeQuoteDuplicateGuardKey(payload);
  const { data, error } = await storage
    .from(submissionConfig.storageTable)
    .insert([{
      attribution: {
        ...payload.attribution,
        configHash,
        duplicateGuardKey,
      },
      config: payload.config,
      consent: payload.consent,
      estimate: payload.estimate,
      project: payload.project,
      requester: payload.requester,
      source: payload.source,
      status: 'new',
    }])
    .select('id')
    .single();

  if (error) {
    throw new Error('MODULAR_HOME_QUOTE_STORAGE_FAILED');
  }

  return data?.id ?? null;
}

export async function submitModularHomeQuoteWithDependencies(
  req: Request,
  res: Response,
  dependencies: ModularHomeQuoteSubmitDependencies = {},
) {
  const submissionConfig = getModularHomeQuoteSubmissionConfig();

  if (!submissionConfig.enabled) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_BACKEND_DISABLED',
      503,
      'disabled',
      submissionConfig,
    ));

    return res.status(503).json({
      error: 'MODULAR_HOME_QUOTE_BACKEND_DISABLED',
      message: 'Real Modular Home quote submission is disabled. Preview mode must remain local-only.',
      storageTable: submissionConfig.storageTable,
      success: false,
    });
  }

  if (!isModularHomeQuoteBackendRequestEnabled(req.query)) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED',
      403,
      'flag',
      submissionConfig,
    ));

    return res.status(403).json({
      error: 'MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED',
      message: 'Real Modular Home quote submission requires ?homeQuoteBackend=1.',
      success: false,
    });
  }

  if (!isModularHomeQuoteAllowedSubmissionHost(req)) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_HOST_NOT_ALLOWED',
      403,
      'host',
      submissionConfig,
    ));

    return res.status(403).json({
      error: 'MODULAR_HOME_QUOTE_HOST_NOT_ALLOWED',
      message: 'Real Modular Home quote submission is allowed only on configured staging/review or production hosts.',
      success: false,
    });
  }

  const rateLimit = await checkModularHomeQuoteRateLimit(
    req,
    Date.now(),
    submissionConfig,
    dependencies.rateLimitStore,
  );
  if (rateLimit.unavailable) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_RATE_LIMIT_UNAVAILABLE',
      503,
      'rateLimit',
      submissionConfig,
    ));

    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }

    return res.status(503).json({
      error: 'MODULAR_HOME_QUOTE_RATE_LIMIT_UNAVAILABLE',
      message: 'Quote rate limiting is unavailable. Configure REDIS_URL before accepting production quote submissions.',
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      success: false,
    });
  }

  if (!rateLimit.allowed) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_RATE_LIMITED',
      429,
      'rateLimit',
      submissionConfig,
    ));

    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }

    return res.status(429).json({
      error: 'MODULAR_HOME_QUOTE_RATE_LIMITED',
      message: 'Too many Modular Home quote attempts. Wait before retrying staging backend submission.',
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      success: false,
    });
  }

  try {
    if (hasFilledModularHomeQuoteHoneypot(req.body)) {
      throw new Error('MODULAR_HOME_QUOTE_SPAM_REJECTED');
    }

    const turnstile = await verifyModularHomeQuoteTurnstile(
      req.body,
      req,
      dependencies.fetchImpl,
    );
    if (!turnstile.ok) {
      throw new Error(turnstile.code);
    }

    const payload = validateModularHomeQuoteRequest(req.body);
    const duplicateId = await findDuplicateModularHomeQuoteRequest(
      payload,
      submissionConfig,
      dependencies.storage,
    );
    if (duplicateId) {
      throw new Error('MODULAR_HOME_QUOTE_DUPLICATE');
    }

    const id = await insertModularHomeQuoteRequest(payload, submissionConfig, dependencies.storage);

    res.status(201).json({
      emailHandoffQueued: false,
      id,
      success: true,
    });
  } catch (error: any) {
    const rawCode = String(error?.message || 'MODULAR_HOME_QUOTE_UNKNOWN');
    const code = rawCode.startsWith('MODULAR_HOME_QUOTE_') ? rawCode : 'MODULAR_HOME_QUOTE_STORAGE_FAILED';
    const failureStatus = code === 'MODULAR_HOME_QUOTE_STORAGE_FAILED'
      || code === 'MODULAR_HOME_QUOTE_DUPLICATE_CHECK_FAILED'
      ? 500
      : code === 'MODULAR_HOME_QUOTE_DUPLICATE'
        ? 409
        : code === 'MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED' || code === 'MODULAR_HOME_QUOTE_TURNSTILE_FAILED'
          ? 403
          : 400;
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      code,
      failureStatus,
      failureStatus === 500
        ? 'storage'
        : code === 'MODULAR_HOME_QUOTE_DUPLICATE'
          ? 'duplicate'
          : code === 'MODULAR_HOME_QUOTE_SPAM_REJECTED'
            || code === 'MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED'
            || code === 'MODULAR_HOME_QUOTE_TURNSTILE_FAILED'
            ? 'spam'
            : 'validation',
      submissionConfig,
    ));

    res.status(failureStatus).json({ error: code, success: false });
  }
}

export async function submitModularHomeQuote(req: Request, res: Response) {
  return submitModularHomeQuoteWithDependencies(req, res);
}
