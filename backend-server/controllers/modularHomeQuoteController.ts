import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';

export type ModularHomeQuoteSubmissionConfig = {
  enabled: boolean;
  emailHandoffEnabled: boolean;
  hardeningPlan: ModularHomeQuoteBackendHardeningPlan;
  productionReady: false;
  requiresExplicitRequestFlag: true;
  requiresStagingEnvironment: true;
  staging: {
    allowedHosts: string[];
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

type ModularHomeQuoteRequestBody = {
  attribution?: unknown;
  config?: unknown;
  consent?: unknown;
  estimate?: unknown;
  project?: unknown;
  requester?: unknown;
  source?: unknown;
};

export type ModularHomeQuoteFailureStage =
  | 'disabled'
  | 'flag'
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

export type ValidModularHomeQuoteRequest = {
  attribution: {
    companySlug: string;
    salesOwner: string;
    sourceSurface: string;
    sponsorSlug: string | null;
  };
  config: {
    facade: string;
    finishLevel: string;
    roof: string;
    terrace: string;
  };
  consent: {
    accepted: true;
    acceptedAt: string;
    consentText: string;
    consentVersion: string;
    privacyVersion: string;
  };
  estimate: {
    currency: 'EUR';
    estimatedTotal: number;
    lineItems: Array<{ amount: number; label: string }>;
    scopeSummary: string[];
  };
  project: {
    floorAreaM2: number;
    modelName: string;
    productId: string;
    projectId: string | null;
    shareUrl: string | null;
  };
  requester: {
    budgetRange: string;
    countryCity: string;
    email: string;
    landOwned: 'yes' | 'no' | 'unknown';
    message: string;
    name: string;
    phone: string;
    targetBuildDate: string;
  };
  source: {
    path: string | null;
    referrer: string | null;
    userAgent: string | null;
    vertical: 'modular-home';
  };
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

const ALLOWED_PRODUCTS = new Set(['compact-timber-40', 'family-timber-80', 'sauna-cabin-25']);
const ALLOWED_LAND_OWNED = new Set<ValidModularHomeQuoteRequest['requester']['landOwned']>(['yes', 'no', 'unknown']);
const ALLOWED_BUDGET_RANGES = new Set(['under-50k', '50k-100k', '100k-150k', '150k-plus', 'not-sure'] as const);
const ALLOWED_TARGET_BUILD_DATES = new Set(['0-3-months', '3-6-months', '6-12-months', '12-plus-months', 'research-phase'] as const);
export const MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT =
  'I agree that Warpala/30sek24 may store this Modular Home quote request and contact me for manual follow-up. Estimate is not a final quote.';
export const MODULAR_HOME_QUOTE_CONSENT_VERSION = 'modular-home-quote-consent-v1';
export const MODULAR_HOME_QUOTE_PRIVACY_VERSION = 'privacy-v1';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TEXT_LENGTH = 600;
const MAX_LINE_ITEMS = 24;
const MAX_SCOPE_ITEMS = 16;
const DEFAULT_STAGING_HOSTS = [
  'staging.30sek24.com',
  'localhost',
  '127.0.0.1',
] as const;

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
      currentGlobalLimit: 'Existing API middleware applies an in-memory 60 requests/minute per IP limit.',
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

function getModularHomeQuoteAllowedStagingHosts(): string[] {
  const configured = process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS;
  const hosts = configured
    ? configured.split(',').map((host) => normalizeHost(host)).filter((host): host is string => Boolean(host))
    : [...DEFAULT_STAGING_HOSTS];

  return Array.from(new Set(hosts));
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
  if (isModularHomeQuoteStagingEnvironmentName(environmentName)) {
    return true;
  }

  const allowedHosts = getModularHomeQuoteAllowedStagingHosts();
  const host = normalizeHost(readFirstHeaderValue(req, 'x-forwarded-host') ?? readFirstHeaderValue(req, 'host'));
  const originHost = normalizeHost(readFirstHeaderValue(req, 'origin'));
  const refererHost = normalizeHost(readFirstHeaderValue(req, 'referer'));

  return [host, originHost, refererHost].some((candidate) => candidate ? allowedHosts.includes(candidate) : false);
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeRequiredText(value: unknown, code: string, maxLength = MAX_TEXT_LENGTH): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(code);
  }

  return normalized.slice(0, maxLength);
}

function normalizeOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeEmail(value: unknown): string {
  const email = normalizeRequiredText(value, 'MODULAR_HOME_QUOTE_EMAIL_REQUIRED', 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('MODULAR_HOME_QUOTE_EMAIL_INVALID');
  }

  return email;
}

function normalizePositiveNumber(value: unknown, code: string, maxValue: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > maxValue) {
    throw new Error(code);
  }

  return Math.round(numeric);
}

function normalizeEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T | null, code: string): T {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (allowed.has(normalized as T)) {
    return normalized as T;
  }

  if (fallback) {
    return fallback;
  }

  throw new Error(code);
}

function normalizeIsoDate(value: unknown, code: string): string {
  const raw = normalizeRequiredText(value, code, 80);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(code);
  }

  return date.toISOString();
}

function normalizeExpectedValue(value: unknown, expected: string, code: string, maxLength = MAX_TEXT_LENGTH): string {
  const normalized = normalizeRequiredText(value, code, maxLength);
  if (normalized !== expected) {
    throw new Error(code);
  }

  return normalized;
}

function normalizeLineItems(value: unknown): Array<{ amount: number; label: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const label = normalizeOptionalText(record.label, 140);
      const amount = Number(record.amount);
      if (!label || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
        return null;
      }

      return { amount: Math.round(amount), label };
    })
    .filter((item): item is { amount: number; label: string } => item !== null)
    .slice(0, MAX_LINE_ITEMS);
}

function normalizeScopeSummary(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeOptionalText(item, 180))
    .filter((item): item is string => item !== null)
    .slice(0, MAX_SCOPE_ITEMS);
}

function normalizeProductId(value: unknown): string {
  const productId = normalizeRequiredText(value, 'MODULAR_HOME_QUOTE_PRODUCT_REQUIRED', 120);
  if (!ALLOWED_PRODUCTS.has(productId)) {
    throw new Error('MODULAR_HOME_QUOTE_PRODUCT_INVALID');
  }

  return productId;
}

export function getModularHomeQuoteSubmissionConfig(): ModularHomeQuoteSubmissionConfig {
  const environmentName = getModularHomeQuoteEnvironmentName();

  return {
    emailHandoffEnabled: process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED === 'true',
    enabled: process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED === 'true',
    hardeningPlan: getModularHomeQuoteBackendHardeningPlan(),
    productionReady: false,
    requiresExplicitRequestFlag: true,
    requiresStagingEnvironment: true,
    staging: {
      allowedHosts: getModularHomeQuoteAllowedStagingHosts(),
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

export function validateModularHomeQuoteRequest(body: ModularHomeQuoteRequestBody): ValidModularHomeQuoteRequest {
  const requester = asRecord(body.requester);
  const project = asRecord(body.project);
  const config = asRecord(body.config);
  const estimate = asRecord(body.estimate);
  const consent = asRecord(body.consent);
  const attribution = asRecord(body.attribution) ?? {};
  const source = asRecord(body.source) ?? {};

  if (!requester) {
    throw new Error('MODULAR_HOME_QUOTE_REQUESTER_REQUIRED');
  }
  if (!project) {
    throw new Error('MODULAR_HOME_QUOTE_PROJECT_REQUIRED');
  }
  if (!config) {
    throw new Error('MODULAR_HOME_QUOTE_CONFIG_REQUIRED');
  }
  if (!estimate) {
    throw new Error('MODULAR_HOME_QUOTE_ESTIMATE_REQUIRED');
  }
  if (!consent) {
    throw new Error('MODULAR_HOME_QUOTE_CONSENT_REQUIRED');
  }
  if (consent.accepted !== true) {
    throw new Error('MODULAR_HOME_QUOTE_CONSENT_REQUIRED');
  }

  const currency = normalizeRequiredText(estimate.currency, 'MODULAR_HOME_QUOTE_CURRENCY_REQUIRED', 12);
  if (currency !== 'EUR') {
    throw new Error('MODULAR_HOME_QUOTE_CURRENCY_INVALID');
  }

  return {
    attribution: {
      companySlug: normalizeOptionalText(attribution.companySlug, 120) ?? 'warpala',
      salesOwner: normalizeOptionalText(attribution.salesOwner, 120) ?? 'modular-home-sales',
      sourceSurface: normalizeOptionalText(attribution.sourceSurface, 120) ?? 'homeDemo',
      sponsorSlug: normalizeOptionalText(attribution.sponsorSlug, 120),
    },
    config: {
      facade: normalizeRequiredText(config.facade, 'MODULAR_HOME_QUOTE_FACADE_REQUIRED', 80),
      finishLevel: normalizeRequiredText(config.finishLevel, 'MODULAR_HOME_QUOTE_FINISH_REQUIRED', 80),
      roof: normalizeRequiredText(config.roof, 'MODULAR_HOME_QUOTE_ROOF_REQUIRED', 80),
      terrace: normalizeRequiredText(config.terrace, 'MODULAR_HOME_QUOTE_TERRACE_REQUIRED', 80),
    },
    consent: {
      accepted: true,
      acceptedAt: normalizeIsoDate(consent.acceptedAt, 'MODULAR_HOME_QUOTE_CONSENT_DATE_INVALID'),
      consentText: normalizeExpectedValue(
        consent.consentText,
        MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
        'MODULAR_HOME_QUOTE_CONSENT_TEXT_INVALID',
        1000,
      ),
      consentVersion: normalizeExpectedValue(
        consent.consentVersion,
        MODULAR_HOME_QUOTE_CONSENT_VERSION,
        'MODULAR_HOME_QUOTE_CONSENT_VERSION_INVALID',
        80,
      ),
      privacyVersion: normalizeExpectedValue(
        consent.privacyVersion,
        MODULAR_HOME_QUOTE_PRIVACY_VERSION,
        'MODULAR_HOME_QUOTE_PRIVACY_VERSION_INVALID',
        80,
      ),
    },
    estimate: {
      currency: 'EUR',
      estimatedTotal: normalizePositiveNumber(estimate.estimatedTotal, 'MODULAR_HOME_QUOTE_ESTIMATE_TOTAL_INVALID', 1_000_000),
      lineItems: normalizeLineItems(estimate.lineItems),
      scopeSummary: normalizeScopeSummary(estimate.scopeSummary),
    },
    project: {
      floorAreaM2: normalizePositiveNumber(project.floorAreaM2, 'MODULAR_HOME_QUOTE_AREA_INVALID', 500),
      modelName: normalizeRequiredText(project.modelName, 'MODULAR_HOME_QUOTE_MODEL_REQUIRED', 180),
      productId: normalizeProductId(project.productId),
      projectId: normalizeOptionalText(project.projectId, 160),
      shareUrl: normalizeOptionalText(project.shareUrl, 1200),
    },
    requester: {
      budgetRange: normalizeEnum(requester.budgetRange, ALLOWED_BUDGET_RANGES, null, 'MODULAR_HOME_QUOTE_BUDGET_INVALID'),
      countryCity: normalizeRequiredText(requester.countryCity, 'MODULAR_HOME_QUOTE_LOCATION_REQUIRED', 180),
      email: normalizeEmail(requester.email),
      landOwned: normalizeEnum(requester.landOwned, ALLOWED_LAND_OWNED, 'unknown', 'MODULAR_HOME_QUOTE_LAND_INVALID'),
      message: normalizeRequiredText(requester.message, 'MODULAR_HOME_QUOTE_MESSAGE_REQUIRED', MAX_MESSAGE_LENGTH),
      name: normalizeRequiredText(requester.name, 'MODULAR_HOME_QUOTE_NAME_REQUIRED', 180),
      phone: normalizeRequiredText(requester.phone, 'MODULAR_HOME_QUOTE_PHONE_REQUIRED', 80),
      targetBuildDate: normalizeEnum(requester.targetBuildDate, ALLOWED_TARGET_BUILD_DATES, null, 'MODULAR_HOME_QUOTE_TARGET_DATE_INVALID'),
    },
    source: {
      path: normalizeOptionalText(source.path, 600),
      referrer: normalizeOptionalText(source.referrer, 1200),
      userAgent: normalizeOptionalText(source.userAgent, 600),
      vertical: 'modular-home',
    },
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
