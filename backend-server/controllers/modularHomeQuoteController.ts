import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';

export type ModularHomeQuoteSubmissionConfig = {
  enabled: boolean;
  emailHandoffEnabled: boolean;
  requiresExplicitRequestFlag: true;
  storageTable: 'modular_home_quote_requests';
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

const ALLOWED_PRODUCTS = new Set(['compact-timber-40', 'family-timber-80', 'sauna-cabin-25']);
const ALLOWED_LAND_OWNED = new Set<ValidModularHomeQuoteRequest['requester']['landOwned']>(['yes', 'no', 'unknown']);
const ALLOWED_BUDGET_RANGES = new Set(['under-50k', '50k-100k', '100k-150k', '150k-plus', 'not-sure'] as const);
const ALLOWED_TARGET_BUILD_DATES = new Set(['0-3-months', '3-6-months', '6-12-months', '12-plus-months', 'research-phase'] as const);
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TEXT_LENGTH = 600;
const MAX_LINE_ITEMS = 24;
const MAX_SCOPE_ITEMS = 16;

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
  return {
    emailHandoffEnabled: process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED === 'true',
    enabled: process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED === 'true',
    requiresExplicitRequestFlag: true,
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
      consentText: normalizeRequiredText(consent.consentText, 'MODULAR_HOME_QUOTE_CONSENT_TEXT_REQUIRED', 1000),
      consentVersion: normalizeRequiredText(consent.consentVersion, 'MODULAR_HOME_QUOTE_CONSENT_VERSION_REQUIRED', 80),
      privacyVersion: normalizeRequiredText(consent.privacyVersion, 'MODULAR_HOME_QUOTE_PRIVACY_VERSION_REQUIRED', 80),
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

export async function submitModularHomeQuote(req: Request, res: Response) {
  const submissionConfig = getModularHomeQuoteSubmissionConfig();

  if (!submissionConfig.enabled) {
    return res.status(503).json({
      error: 'MODULAR_HOME_QUOTE_BACKEND_DISABLED',
      message: 'Real Modular Home quote submission is disabled. Preview mode must remain local-only.',
      storageTable: submissionConfig.storageTable,
      success: false,
    });
  }

  if (!isModularHomeQuoteBackendRequestEnabled(req.query)) {
    return res.status(403).json({
      error: 'MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED',
      message: 'Real Modular Home quote submission requires ?homeQuoteBackend=1.',
      success: false,
    });
  }

  try {
    const payload = validateModularHomeQuoteRequest(req.body);
    const supabase = getSupabase();
    const { data, error } = await supabase
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
      throw error;
    }

    res.status(201).json({
      emailHandoffQueued: false,
      id: data?.id ?? null,
      success: true,
    });
  } catch (error: any) {
    const code = String(error?.message || 'MODULAR_HOME_QUOTE_UNKNOWN');
    const status = code.startsWith('MODULAR_HOME_QUOTE_') ? 400 : 500;
    res.status(status).json({ error: code, success: false });
  }
}
