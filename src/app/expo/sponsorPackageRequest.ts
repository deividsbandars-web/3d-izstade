import { ExpoDataAPI } from '../../services/expo';

export type SponsorPackageInterest = 'arena' | 'landmark' | 'premium' | 'standard' | 'unsure';

export type SponsorPackageRequestPersistence = 'backend' | 'local-preview';

export type SponsorPackageRequestSyncStatus = 'backend-pending' | 'backend-synced';

export type SponsorPackageRequestForm = {
  budgetRange: string;
  company: string;
  email: string;
  message: string;
  name: string;
  packageInterest: SponsorPackageInterest;
  timeline: string;
  website: string;
};

export type SponsorPackageRequestRecord = SponsorPackageRequestForm & {
  capturedAt: string;
  id: string;
  persistence: SponsorPackageRequestPersistence;
  sourcePath: string;
  syncStatus: SponsorPackageRequestSyncStatus;
};

export type SponsorPackageLeadPayload = {
  clientEmail: string;
  clientName: string;
  companyId: string;
  companySlug: string;
  message: string;
  sourcePath: string;
};

export const SPONSOR_PACKAGE_REQUEST_STORAGE_KEY = 'warpala.expo.sponsorPackageRequests';

// Current seeded Sponsor Concierge company id in the Expo scene; the live lead API expects a UUID companyId.
const SPONSOR_PACKAGE_LEAD_COMPANY_ID = '1a14ad1c-1536-4c27-9c0c-00c4f3224819';
const SPONSOR_PACKAGE_LEAD_COMPANY_SLUG = 'sponsor-concierge';

export const INITIAL_SPONSOR_PACKAGE_REQUEST_FORM: SponsorPackageRequestForm = {
  budgetRange: '',
  company: '',
  email: '',
  message: '',
  name: '',
  packageInterest: 'premium',
  timeline: '',
  website: '',
};

export function normalizeSponsorPackageRequestForm(
  form: SponsorPackageRequestForm,
): SponsorPackageRequestForm {
  return {
    budgetRange: form.budgetRange.trim(),
    company: form.company.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
    name: form.name.trim(),
    packageInterest: form.packageInterest,
    timeline: form.timeline.trim(),
    website: form.website.trim(),
  };
}

export function validateSponsorPackageRequestForm(form: SponsorPackageRequestForm) {
  const normalized = normalizeSponsorPackageRequestForm(form);

  if (!normalized.name) {
    return 'Enter a contact name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    return 'Enter a valid work email.';
  }

  if (!normalized.company) {
    return 'Enter a company name.';
  }

  if (!normalized.message) {
    return 'Add what you want to sponsor or discuss.';
  }

  return null;
}

export function getSponsorPackageInterestLabel(packageInterest: SponsorPackageInterest) {
  switch (packageInterest) {
    case 'arena':
      return 'Demo Arena Sponsor';
    case 'landmark':
      return 'Landmark Zone Sponsor';
    case 'premium':
      return 'Premium Booth';
    case 'standard':
      return 'Standard Booth';
    case 'unsure':
      return 'Not sure yet';
    default:
      return 'Not sure yet';
  }
}

export function getSponsorPackageRequestSourcePath() {
  if (typeof window === 'undefined') {
    return '/expo/sponsor-packages';
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function readSponsorPackageRequestQueue(): SponsorPackageRequestRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SPONSOR_PACKAGE_REQUEST_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.slice(-49) as SponsorPackageRequestRecord[] : [];
  } catch {
    return [];
  }
}

export function buildSponsorPackageLeadPayload(
  form: SponsorPackageRequestForm,
  sourcePath = getSponsorPackageRequestSourcePath(),
): SponsorPackageLeadPayload {
  const normalized = normalizeSponsorPackageRequestForm(form);
  const details = [
    `Sponsor package interest: ${getSponsorPackageInterestLabel(normalized.packageInterest)}`,
    `Sponsor company: ${normalized.company}`,
    normalized.website ? `Website: ${normalized.website}` : null,
    normalized.budgetRange ? `Budget signal: ${normalized.budgetRange}` : null,
    normalized.timeline ? `Timeline: ${normalized.timeline}` : null,
    '',
    normalized.message,
  ].filter((line): line is string => line !== null);

  return {
    clientEmail: normalized.email,
    clientName: normalized.name,
    companyId: SPONSOR_PACKAGE_LEAD_COMPANY_ID,
    companySlug: SPONSOR_PACKAGE_LEAD_COMPANY_SLUG,
    message: details.join('\n'),
    sourcePath,
  };
}

export async function submitSponsorPackageRequestToBackend(form: SponsorPackageRequestForm) {
  return await ExpoDataAPI.createExpoLead(buildSponsorPackageLeadPayload(form));
}

export function saveSponsorPackageRequest(
  form: SponsorPackageRequestForm,
  options: {
    persistence?: SponsorPackageRequestPersistence;
    syncStatus?: SponsorPackageRequestSyncStatus;
  } = {},
) {
  const normalized = normalizeSponsorPackageRequestForm(form);
  const capturedAt = new Date().toISOString();
  const record: SponsorPackageRequestRecord = {
    ...normalized,
    capturedAt,
    id: `sponsor-package-${capturedAt}`,
    persistence: options.persistence ?? 'local-preview',
    sourcePath: getSponsorPackageRequestSourcePath(),
    syncStatus: options.syncStatus ?? 'backend-pending',
  };
  const nextQueue = [...readSponsorPackageRequestQueue(), record].slice(-50);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SPONSOR_PACKAGE_REQUEST_STORAGE_KEY, JSON.stringify(nextQueue));
  }

  return {
    queueCount: nextQueue.length,
    record,
  };
}
