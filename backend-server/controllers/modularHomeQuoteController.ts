import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
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
  productionReady: false;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  requiresExplicitRequestFlag: true;
  requiresStagingEnvironment: true;
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
    stagingRequirement: 'staging host or staging/preview environment';
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
  | 'flag'
  | 'rateLimit'
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
  stage: ModularHomeQuoteFailureStage;
  stagingRequest: boolean;
  status: number;
  submissionEnabled: boolean;
  timestamp: string;
};

export type ModularHomeQuoteStorageClient = {
  from: (table: string) => {
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

const DEFAULT_STAGING_HOSTS = [
  'staging.30sek24.com',
  'localhost',
  '127.0.0.1',
] as const;
const STAGING_PREVIEW_HOST_PATTERN = /^app-staging-[a-z0-9-]+\.vercel\.app$/;
const MODULAR_HOME_QUOTE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MODULAR_HOME_QUOTE_RATE_LIMIT_MAX_REQUESTS = 5;

const modularHomeQuoteRateLimitBuckets = new Map<string, {
  count: number;
  resetAt: number;
}>();

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
      stagingRequirement: 'staging host or staging/preview environment',
    },
    rateLimitingPlan: {
      currentGlobalLimit: 'Route-specific staging guard applies 5 Modular Home quote backend attempts / 10 minutes / IP before Supabase insert. Existing global API middleware may also apply.',
      productionRequirement: [
        'Add route-specific distributed limit before enabling production: e.g. 5 quote submissions / 10 minutes / IP.',
        'Add duplicate guard by normalized email + product/config hash.',
        'Store counters in Redis or Supabase, not process memory, for multi-instance deployments.',
      ],
    },
    spamPreventionPlan: [
      'Keep strict server-side length limits and enum validation.',
      'Add honeypot/timing field or Turnstile before public promotion.',
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

  return {
    emailHandoffEnabled: process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED === 'true',
    enabled: process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED === 'true',
    hardeningPlan: getModularHomeQuoteBackendHardeningPlan(),
    productionReady: false,
    rateLimit: {
      maxRequests: MODULAR_HOME_QUOTE_RATE_LIMIT_MAX_REQUESTS,
      windowMs: MODULAR_HOME_QUOTE_RATE_LIMIT_WINDOW_MS,
    },
    requiresExplicitRequestFlag: true,
    requiresStagingEnvironment: true,
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
  modularHomeQuoteRateLimitBuckets.clear();
}

export function checkModularHomeQuoteRateLimit(
  req: Request,
  nowMs = Date.now(),
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
): ModularHomeQuoteRateLimitResult {
  const key = getModularHomeQuoteRateLimitKey(req);
  const current = modularHomeQuoteRateLimitBuckets.get(key);

  if (!current || current.resetAt <= nowMs) {
    const resetAt = nowMs + submissionConfig.rateLimit.windowMs;
    modularHomeQuoteRateLimitBuckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: Math.max(0, submissionConfig.rateLimit.maxRequests - 1),
      resetAt: new Date(resetAt).toISOString(),
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= submissionConfig.rateLimit.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt).toISOString(),
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - nowMs) / 1000)),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, submissionConfig.rateLimit.maxRequests - current.count),
    resetAt: new Date(current.resetAt).toISOString(),
    retryAfterSeconds: 0,
  };
}

export async function insertModularHomeQuoteRequest(
  payload: ValidModularHomeQuoteRequest,
  submissionConfig = getModularHomeQuoteSubmissionConfig(),
  storage: ModularHomeQuoteStorageClient = getSupabase() as unknown as ModularHomeQuoteStorageClient,
): Promise<string | null> {
  const { data, error } = await storage
    .from(submissionConfig.storageTable)
    .insert([{
      attribution: payload.attribution,
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

export async function submitModularHomeQuote(req: Request, res: Response) {
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

  if (!isModularHomeQuoteStagingRequest(req)) {
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      'MODULAR_HOME_QUOTE_STAGING_ONLY',
      403,
      'staging',
      submissionConfig,
    ));

    return res.status(403).json({
      error: 'MODULAR_HOME_QUOTE_STAGING_ONLY',
      message: 'Real Modular Home quote submission is currently allowed only on staging/review hosts.',
      success: false,
    });
  }

  const rateLimit = checkModularHomeQuoteRateLimit(req, Date.now(), submissionConfig);
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
    const payload = validateModularHomeQuoteRequest(req.body);
    const id = await insertModularHomeQuoteRequest(payload, submissionConfig);

    res.status(201).json({
      emailHandoffQueued: false,
      id,
      success: true,
    });
  } catch (error: any) {
    const rawCode = String(error?.message || 'MODULAR_HOME_QUOTE_UNKNOWN');
    const code = rawCode.startsWith('MODULAR_HOME_QUOTE_') ? rawCode : 'MODULAR_HOME_QUOTE_STORAGE_FAILED';
    const status = code.startsWith('MODULAR_HOME_QUOTE_') ? 400 : 500;
    const failureStatus = code === 'MODULAR_HOME_QUOTE_STORAGE_FAILED' ? 500 : status;
    logModularHomeQuoteFailure(createModularHomeQuoteSafeLogEvent(
      req,
      code,
      failureStatus,
      failureStatus === 500 ? 'storage' : 'validation',
      submissionConfig,
    ));

    res.status(failureStatus).json({ error: code, success: false });
  }
}
