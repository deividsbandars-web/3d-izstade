export type ModularHomeQuoteRequestBody = {
  antiSpam?: unknown;
  attribution?: unknown;
  config?: unknown;
  consent?: unknown;
  estimate?: unknown;
  project?: unknown;
  requester?: unknown;
  spam?: unknown;
  source?: unknown;
  turnstileToken?: unknown;
  website?: unknown;
};

export type ValidModularHomeQuoteRequest = {
  attribution: {
    companySlug: string;
    salesOwner: string;
    sourceSurface: string;
    sponsorSlug: string | null;
  };
  config: {
    doorPlacement: string;
    facade: string;
    facadeBoardOrientation: string;
    facadeBoardProfile: string;
    facadeBoardSpacing: string;
    facadeBoardWidth: string;
    finishLevel: string;
    floorFinish: string;
    furniturePackage: string;
    sofa: string;
    table: string;
    bed: string;
    kitchenLine: string;
    wardrobePlaceholder: string;
    interiorFloorStyle: string;
    interiorWallFinish: string;
    layoutVariant: string;
    presetId?: string;
    roof: string;
    roofEdgeColor: string;
    roofGutterStyle: string;
    terrace: string;
    trimColor: string;
    windowFrameColor: string;
    windowFrameType: string;
    windowPlacement: string;
    wallPanelStyle: string;
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
export const MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT =
  'I agree that Warpala/30sek24 may store this Modular Home quote request and contact me for manual follow-up. Estimate is not a final quote.';
export const MODULAR_HOME_QUOTE_CONSENT_VERSION = 'modular-home-quote-consent-v1';
export const MODULAR_HOME_QUOTE_PRIVACY_VERSION = 'privacy-v1';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TEXT_LENGTH = 600;
const MAX_LINE_ITEMS = 24;
const MAX_SCOPE_ITEMS = 16;

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeRequiredText(value: unknown, code: string, maxLength = MAX_TEXT_LENGTH): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(code);
  }

  return normalized.slice(0, maxLength);
}

export function normalizeOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
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
      doorPlacement: normalizeOptionalText(config.doorPlacement, 80) ?? 'Door placement not provided',
      facade: normalizeRequiredText(config.facade, 'MODULAR_HOME_QUOTE_FACADE_REQUIRED', 80),
      facadeBoardOrientation: normalizeOptionalText(config.facadeBoardOrientation, 80) ?? 'Facade board orientation not provided',
      facadeBoardProfile: normalizeOptionalText(config.facadeBoardProfile, 80) ?? 'Facade board profile not provided',
      facadeBoardSpacing: normalizeOptionalText(config.facadeBoardSpacing, 80) ?? 'Facade board spacing not provided',
      facadeBoardWidth: normalizeOptionalText(config.facadeBoardWidth, 80) ?? 'Facade board width not provided',
      finishLevel: normalizeRequiredText(config.finishLevel, 'MODULAR_HOME_QUOTE_FINISH_REQUIRED', 80),
      floorFinish: normalizeOptionalText(config.floorFinish, 80) ?? 'Floor finish not provided',
      furniturePackage: normalizeOptionalText(config.furniturePackage, 80) ?? 'Furniture package not provided',
      sofa: normalizeOptionalText(config.sofa, 40) ?? 'Sofa toggle not provided',
      table: normalizeOptionalText(config.table, 40) ?? 'Table toggle not provided',
      bed: normalizeOptionalText(config.bed, 40) ?? 'Bed toggle not provided',
      kitchenLine: normalizeOptionalText(config.kitchenLine, 40) ?? 'Kitchen line toggle not provided',
      wardrobePlaceholder: normalizeOptionalText(config.wardrobePlaceholder, 40) ?? 'Wardrobe toggle not provided',
      interiorFloorStyle: normalizeOptionalText(config.interiorFloorStyle, 80) ?? 'Interior floor style not provided',
      interiorWallFinish: normalizeOptionalText(config.interiorWallFinish, 80) ?? 'Interior wall finish not provided',
      layoutVariant: normalizeOptionalText(config.layoutVariant, 80) ?? 'Layout not provided',
      presetId: normalizeOptionalText(config.presetId, 80) ?? normalizeOptionalText(config.layoutVariant, 80) ?? 'Preset not provided',
      roof: normalizeRequiredText(config.roof, 'MODULAR_HOME_QUOTE_ROOF_REQUIRED', 80),
      roofEdgeColor: normalizeOptionalText(config.roofEdgeColor, 80) ?? 'Roof edge color not provided',
      roofGutterStyle: normalizeOptionalText(config.roofGutterStyle, 80) ?? 'Roof gutter style not provided',
      terrace: normalizeRequiredText(config.terrace, 'MODULAR_HOME_QUOTE_TERRACE_REQUIRED', 80),
      trimColor: normalizeOptionalText(config.trimColor, 80) ?? 'Trim color not provided',
      windowFrameColor: normalizeOptionalText(config.windowFrameColor, 80) ?? 'Window frame color not provided',
      windowFrameType: normalizeOptionalText(config.windowFrameType, 80) ?? 'Window frame type not provided',
      windowPlacement: normalizeOptionalText(config.windowPlacement, 80) ?? 'Window placement not provided',
      wallPanelStyle: normalizeOptionalText(config.wallPanelStyle, 80) ?? 'Wall panel style not provided',
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
      budgetRange: normalizeEnum(requester.budgetRange, ALLOWED_BUDGET_RANGES, 'not-sure', 'MODULAR_HOME_QUOTE_BUDGET_INVALID'),
      countryCity: normalizeOptionalText(requester.countryCity, 180) ?? 'Location not provided',
      email: normalizeEmail(requester.email),
      landOwned: normalizeEnum(requester.landOwned, ALLOWED_LAND_OWNED, 'unknown', 'MODULAR_HOME_QUOTE_LAND_INVALID'),
      message: normalizeOptionalText(requester.message, MAX_MESSAGE_LENGTH) ?? 'No message provided.',
      name: normalizeOptionalText(requester.name, 180) ?? 'Name not provided',
      phone: normalizeRequiredText(requester.phone, 'MODULAR_HOME_QUOTE_PHONE_REQUIRED', 80),
      targetBuildDate: normalizeEnum(requester.targetBuildDate, ALLOWED_TARGET_BUILD_DATES, 'research-phase', 'MODULAR_HOME_QUOTE_TARGET_DATE_INVALID'),
    },
    source: {
      path: normalizeOptionalText(source.path, 600),
      referrer: normalizeOptionalText(source.referrer, 1200),
      userAgent: normalizeOptionalText(source.userAgent, 600),
      vertical: 'modular-home',
    },
  };
}
