import { getFrontendRuntimeEnv } from '../../../../config/runtimeEnv';
import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import type { ModularHomeEstimate } from './modularHomeEstimate';
import { getModularHomeDimensionSummary, getModularHomeProductForConfig } from './modularHomeProducts';

export type ModularHomeQuoteBackendFormFields = {
  budgetRange: string;
  consentGiven: boolean;
  countryCity: string;
  email: string;
  landOwned: string;
  message: string;
  name: string;
  phone: string;
  targetBuildDate: string;
};

export type ModularHomeQuoteBackendPayload = {
  attribution: {
    companySlug: 'warpala';
    salesOwner: 'modular-home-sales';
    sourceSurface: 'homeDemo';
    sponsorSlug: null;
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
    kitchenFinish: string;
    furnitureMood: string;
    interiorZoneFocus: string;
    presetId: string;
    roofEdgeColor: string;
    roofGutterStyle: string;
    windowFrameColor: string;
    windowFrameType: string;
    layoutVariant: string;
    roof: string;
    terrace: string;
    trimColor: string;
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
    landOwned: string;
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

export type ModularHomeQuoteBackendSubmitResult = {
  emailHandoffQueued: boolean;
  id: string | null;
  success: true;
};

export const MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT =
  'I agree that Warpala/30sek24 may store this Modular Home quote request and contact me for manual follow-up. Estimate is not a final quote.';
export const MODULAR_HOME_QUOTE_CONSENT_VERSION = 'modular-home-quote-consent-v1';
export const MODULAR_HOME_QUOTE_PRIVACY_VERSION = 'privacy-v1';

const BACKEND_SUBMIT_TIMEOUT_MS = 6000;

function getSourcePath() {
  if (typeof window === 'undefined') {
    return '/modular-homes/studio?homeStudio=1&view=exterior&homeQuoteBackend=1';
  }

  return `${window.location.pathname}${window.location.search}`;
}

function getShareUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.href;
}

function getReferrer() {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.referrer || null;
}

function getUserAgent() {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator.userAgent || null;
}

function normalizeSubmitError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Quote backend request timed out. Try again or disable backend mode for local preview only.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Quote backend request failed.';
}

async function readBackendError(response: Response) {
  try {
    const body = await response.json() as { error?: string; message?: string };
    return body.message || body.error || `QUOTE_BACKEND_HTTP_${response.status}`;
  } catch {
    return `QUOTE_BACKEND_HTTP_${response.status}`;
  }
}

export function buildModularHomeQuoteBackendPayload(
  fields: ModularHomeQuoteBackendFormFields,
  config: ModularHomeConfiguratorState,
  estimate: ModularHomeEstimate,
): ModularHomeQuoteBackendPayload {
  const product = getModularHomeProductForConfig(config);
  const dimensions = getModularHomeDimensionSummary(config);

  return {
    attribution: {
      companySlug: 'warpala',
      salesOwner: 'modular-home-sales',
      sourceSurface: 'homeDemo',
      sponsorSlug: null,
    },
    config: {
      doorPlacement: config.doorPlacement,
      facade: config.facade,
      facadeBoardOrientation: config.facadeBoardOrientation,
      facadeBoardProfile: config.facadeBoardProfile,
      facadeBoardSpacing: config.facadeBoardSpacing,
      facadeBoardWidth: config.facadeBoardWidth,
      finishLevel: config.finishLevel,
      floorFinish: config.floorFinish,
      furniturePackage: config.furniturePackage,
      sofa: config.sofa,
      table: config.table,
      bed: config.bed,
      kitchenLine: config.kitchenLine,
      wardrobePlaceholder: config.wardrobePlaceholder,
      interiorFloorStyle: config.interiorFloorStyle,
      interiorWallFinish: config.interiorWallFinish,
      kitchenFinish: config.kitchenFinish,
      furnitureMood: config.furnitureMood,
      interiorZoneFocus: config.interiorZoneFocus,
      presetId: config.dimensionPreset,
      roofEdgeColor: config.roofEdgeColor,
      roofGutterStyle: config.roofGutterStyle,
      windowFrameColor: config.windowFrameColor,
      windowFrameType: config.windowFrameType,
      layoutVariant: config.layoutVariant,
      roof: config.roof,
      terrace: config.terrace,
      trimColor: config.trimColor,
      windowPlacement: config.windowPlacement,
      wallPanelStyle: config.wallPanelStyle,
    },
    consent: {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      consentText: MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
      consentVersion: MODULAR_HOME_QUOTE_CONSENT_VERSION,
      privacyVersion: MODULAR_HOME_QUOTE_PRIVACY_VERSION,
    },
    estimate: {
      currency: 'EUR',
      estimatedTotal: estimate.estimatedTotal,
      lineItems: [
        ...estimate.lineItems,
        ...estimate.optionalServices,
        estimate.vatEstimate,
      ].map((item) => ({
        amount: item.amount,
        label: item.label,
      })),
      scopeSummary: estimate.scopeOfSupply.flatMap((section) => (
        section.items.map((item) => `${section.label}: ${item}`)
      )),
    },
    project: {
      floorAreaM2: product?.floorAreaM2 ?? dimensions.floorAreaM2,
      modelName: product?.name ?? estimate.baseModel,
      productId: product?.id ?? 'compact-timber-40',
      projectId: null,
      shareUrl: getShareUrl(),
    },
    requester: {
      budgetRange: fields.budgetRange,
      countryCity: fields.countryCity.trim(),
      email: fields.email.trim(),
      landOwned: fields.landOwned || 'unknown',
      message: fields.message.trim(),
      name: fields.name.trim(),
      phone: fields.phone.trim(),
      targetBuildDate: fields.targetBuildDate,
    },
    source: {
      path: getSourcePath(),
      referrer: getReferrer(),
      userAgent: getUserAgent(),
      vertical: 'modular-home',
    },
  };
}

export async function submitModularHomeQuoteBackend(
  fields: ModularHomeQuoteBackendFormFields,
  config: ModularHomeConfiguratorState,
  estimate: ModularHomeEstimate,
  fetchImpl: typeof fetch = fetch,
): Promise<ModularHomeQuoteBackendSubmitResult> {
  const runtimeEnv = getFrontendRuntimeEnv();
  const endpoint = `${runtimeEnv.apiBaseUrl}/api/modular-home/quote?homeQuoteBackend=1`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify(buildModularHomeQuoteBackendPayload(fields, config, estimate)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await readBackendError(response));
    }

    return await response.json() as ModularHomeQuoteBackendSubmitResult;
  } catch (error) {
    throw new Error(normalizeSubmitError(error));
  } finally {
    window.clearTimeout(timeoutId);
  }
}
