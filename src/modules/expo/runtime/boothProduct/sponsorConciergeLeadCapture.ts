import { getFrontendRuntimeEnv } from '../../../../config/runtimeEnv';

export type SponsorConciergeLeadFormState = {
  company: string;
  email: string;
  interest: string;
  name: string;
};

export type SponsorConciergeLeadPersistence =
  | 'backend'
  | 'backend-fallback'
  | 'local-preview';

export type SponsorConciergePreviewLeadRecord = SponsorConciergeLeadFormState & {
  boothId: 'sponsor-concierge';
  capturedAt: string;
  packageTier: 'premium';
  persistence: SponsorConciergeLeadPersistence;
  sourcePath: string;
};

export type SponsorConciergeLeadRequestPayload = {
  clientEmail: string;
  clientName: string;
  companyId: 'sponsor-concierge';
  companySlug: 'sponsor-concierge';
  message: string;
  sourcePath: string;
};

export type SponsorConciergeLeadSubmitResult =
  | {
    endpoint: string;
    persistence: 'backend';
    status: number;
  }
  | {
    endpoint: string | null;
    localQueueCount: number;
    persistence: 'backend-fallback';
    reason: string;
  };

export const SPONSOR_CONCIERGE_LEAD_STORAGE_KEY = 'warpala.expo.sponsorConcierge.previewLeads';

export const INITIAL_SPONSOR_CONCIERGE_LEAD_FORM: SponsorConciergeLeadFormState = {
  company: '',
  email: '',
  interest: '',
  name: '',
};

const BACKEND_SUBMIT_TIMEOUT_MS = 4500;

function isSponsorConciergeLeadBackendHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === 'staging.30sek24.com'
    || hostname.endsWith('.vercel.app')
    || hostname.endsWith('.vercel.dev');
}

export function normalizeSponsorConciergeLeadForm(
  form: SponsorConciergeLeadFormState,
): SponsorConciergeLeadFormState {
  return {
    company: form.company.trim(),
    email: form.email.trim(),
    interest: form.interest.trim(),
    name: form.name.trim(),
  };
}

export function validateSponsorConciergeLeadForm(form: SponsorConciergeLeadFormState) {
  const normalized = normalizeSponsorConciergeLeadForm(form);

  if (!normalized.name) {
    return 'Enter a contact name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    return 'Enter a valid work email.';
  }

  if (!normalized.company) {
    return 'Enter a company name.';
  }

  if (!normalized.interest) {
    return 'Add what the sponsor wants to discuss.';
  }

  return null;
}

export function getSponsorConciergeLeadSourcePath() {
  if (typeof window === 'undefined') {
    return '/expo-3d';
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function buildSponsorConciergeLeadPayload(
  form: SponsorConciergeLeadFormState,
  sourcePath = getSponsorConciergeLeadSourcePath(),
): SponsorConciergeLeadRequestPayload {
  const normalized = normalizeSponsorConciergeLeadForm(form);
  return {
    clientEmail: normalized.email,
    clientName: normalized.name,
    companyId: 'sponsor-concierge',
    companySlug: 'sponsor-concierge',
    message: [
      `Company: ${normalized.company}`,
      `Interest: ${normalized.interest}`,
      'Package: Sponsor Concierge Premium Booth',
      'Source: Web3D BoothProduct lead capture',
    ].join('\n'),
    sourcePath,
  };
}

export function readSponsorConciergePreviewLeadQueue(): SponsorConciergePreviewLeadRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SPONSOR_CONCIERGE_LEAD_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.slice(-24) as SponsorConciergePreviewLeadRecord[] : [];
  } catch {
    return [];
  }
}

export function saveSponsorConciergePreviewLead(
  form: SponsorConciergeLeadFormState,
  persistence: SponsorConciergeLeadPersistence,
) {
  const normalized = normalizeSponsorConciergeLeadForm(form);
  const record: SponsorConciergePreviewLeadRecord = {
    ...normalized,
    boothId: 'sponsor-concierge',
    capturedAt: new Date().toISOString(),
    packageTier: 'premium',
    persistence,
    sourcePath: getSponsorConciergeLeadSourcePath(),
  };
  const nextQueue = [...readSponsorConciergePreviewLeadQueue(), record].slice(-25);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SPONSOR_CONCIERGE_LEAD_STORAGE_KEY, JSON.stringify(nextQueue));
  }

  return nextQueue.length;
}

function normalizeSubmitError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'LEAD_API_TIMEOUT';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'LEAD_API_UNAVAILABLE';
}

export async function submitSponsorConciergeLead(
  form: SponsorConciergeLeadFormState,
  fetchImpl: typeof fetch = fetch,
): Promise<SponsorConciergeLeadSubmitResult> {
  const validationError = validateSponsorConciergeLeadForm(form);
  if (validationError) {
    throw new Error(validationError);
  }

  let endpoint: string | null = null;

  try {
    if (!isSponsorConciergeLeadBackendHost()) {
      throw new Error('LEAD_API_REVIEW_HOST_REQUIRED');
    }

    const runtimeEnv = getFrontendRuntimeEnv();
    endpoint = `${runtimeEnv.apiBaseUrl}/api/expo/lead`;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), BACKEND_SUBMIT_TIMEOUT_MS);

    try {
      const response = await fetchImpl(endpoint, {
        body: JSON.stringify(buildSponsorConciergeLeadPayload(form)),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LEAD_API_HTTP_${response.status}`);
      }

      return {
        endpoint,
        persistence: 'backend',
        status: response.status,
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  } catch (error) {
    const localQueueCount = saveSponsorConciergePreviewLead(form, 'backend-fallback');
    return {
      endpoint,
      localQueueCount,
      persistence: 'backend-fallback',
      reason: normalizeSubmitError(error),
    };
  }
}
