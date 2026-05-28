export type SponsorPackageInterest = 'arena' | 'landmark' | 'premium' | 'standard' | 'unsure';

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
  persistence: 'local-preview';
  sourcePath: string;
  syncStatus: 'backend-pending';
};

export const SPONSOR_PACKAGE_REQUEST_STORAGE_KEY = 'warpala.expo.sponsorPackageRequests';

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

export function saveSponsorPackageRequest(form: SponsorPackageRequestForm) {
  const normalized = normalizeSponsorPackageRequestForm(form);
  const capturedAt = new Date().toISOString();
  const record: SponsorPackageRequestRecord = {
    ...normalized,
    capturedAt,
    id: `sponsor-package-${capturedAt}`,
    persistence: 'local-preview',
    sourcePath: getSponsorPackageRequestSourcePath(),
    syncStatus: 'backend-pending',
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
