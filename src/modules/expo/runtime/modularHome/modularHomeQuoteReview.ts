export type ModularHomeQuoteReviewSource = 'backend-staging' | 'local-preview' | 'mock-review';
export type ModularHomeQuoteReviewStatus = 'preview-local-only' | 'mock-review' | 'new' | 'contacted' | 'qualified' | 'closed';

export type ModularHomeQuoteReviewRow = {
  budgetRange: string;
  config: {
    doorPlacement: string;
    facade: string;
    finishLevel: string;
    layoutVariant: string;
    roof: string;
    terrace: string;
    windowPlacement: string;
  };
  contact: {
    countryCity: string;
    email: string;
    name: string;
    phone: string;
  };
  createdAt: string;
  estimate: {
    label: string;
    total: number;
  };
  id: string;
  landOwned: string;
  message: string;
  model: string;
  source: ModularHomeQuoteReviewSource;
  status: ModularHomeQuoteReviewStatus;
  targetBuildDate: string;
};

export type ModularHomeQuoteReviewSummary = {
  backendCount: number;
  localCount: number;
  mockCount: number;
  totalCount: number;
  totalEstimate: number;
};

export const MODULAR_HOME_QUOTE_REVIEW_LOCAL_QUEUE_KEY = 'warpala.modularHomeQuotePreviewQueue';

const MOCK_QUOTE_ROWS = [
  {
    budgetRange: '100k-150k',
    config: {
      facade: 'Natural timber',
      finishLevel: 'Premium',
      layoutVariant: 'Two bedroom',
      roof: 'Pitched',
      terrace: 'Extended terrace',
      windowPlacement: 'Front panoramic placement',
      doorPlacement: 'Terrace-facing placement',
    },
    contact: {
      countryCity: 'Latvia / Jurmala',
      email: 'family.client@example.com',
      name: 'Family Timber Buyer',
      phone: '+371 20000001',
    },
    createdAt: '2026-06-05T09:15:00.000Z',
    estimate: {
      label: 'EUR 142,000',
      total: 142000,
    },
    id: 'mock-family-timber-80-review',
    landOwned: 'yes',
    message: 'Looking for a family house concept with extended terrace and premium interior discussion.',
    model: 'Family Timber 80',
    source: 'mock-review',
    status: 'mock-review',
    targetBuildDate: '6-12-months',
  },
  {
    budgetRange: '50k-100k',
    config: {
      facade: 'Dark thermo wood',
      finishLevel: 'Standard',
      layoutVariant: 'Sauna + rest room',
      roof: 'Flat',
      terrace: 'Front deck',
      windowPlacement: 'Side privacy placement',
      doorPlacement: 'Front entry placement',
    },
    contact: {
      countryCity: 'Estonia / Parnu',
      email: 'sauna.operator@example.com',
      name: 'Sauna Cabin Operator',
      phone: '+372 50000000',
    },
    createdAt: '2026-06-05T10:40:00.000Z',
    estimate: {
      label: 'EUR 58,500',
      total: 58500,
    },
    id: 'mock-sauna-cabin-25-review',
    landOwned: 'no',
    message: 'Need a sauna/guest cabin package for a rental property concept.',
    model: 'Sauna Cabin 25',
    source: 'mock-review',
    status: 'mock-review',
    targetBuildDate: 'research-phase',
  },
] as const satisfies readonly ModularHomeQuoteReviewRow[];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function normalizeStatus(value: unknown, fallback: ModularHomeQuoteReviewStatus): ModularHomeQuoteReviewStatus {
  const normalized = normalizeText(value).toLowerCase();
  const allowed = new Set<ModularHomeQuoteReviewStatus>([
    'closed',
    'contacted',
    'mock-review',
    'new',
    'preview-local-only',
    'qualified',
  ]);

  return allowed.has(normalized as ModularHomeQuoteReviewStatus)
    ? normalized as ModularHomeQuoteReviewStatus
    : fallback;
}

function formatFallbackEstimate(total: number) {
  if (total <= 0) {
    return 'No estimate';
  }

  return new Intl.NumberFormat('en-IE', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(total);
}

export function normalizeModularHomeQuoteReviewRow(
  value: unknown,
  source: ModularHomeQuoteReviewSource,
): ModularHomeQuoteReviewRow | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const selectedOptions = asRecord(record.selectedOptions) ?? {};
  const config = asRecord(record.config) ?? {};
  const estimatedTotal = normalizeNumber(record.estimatedTotal);
  const fallbackStatus = source === 'mock-review' ? 'mock-review' : 'preview-local-only';

  return {
    budgetRange: normalizeText(record.budgetRange, 'not-sure'),
    config: {
      facade: normalizeText(selectedOptions.facade, normalizeText(config.facade, 'Unknown facade')),
      finishLevel: normalizeText(selectedOptions.finishLevel, normalizeText(config.finishLevel, 'Unknown finish')),
      layoutVariant: normalizeText(selectedOptions.layoutVariant, normalizeText(config.layoutVariant, 'Unknown layout')),
      roof: normalizeText(selectedOptions.roof, normalizeText(config.roof, 'Unknown roof')),
      terrace: normalizeText(selectedOptions.terrace, normalizeText(config.terrace, 'Unknown terrace')),
      windowPlacement: normalizeText(selectedOptions.windowPlacement, normalizeText(config.windowPlacement, 'Unknown window placement')),
      doorPlacement: normalizeText(selectedOptions.doorPlacement, normalizeText(config.doorPlacement, 'Unknown door placement')),
    },
    contact: {
      countryCity: normalizeText(record.countryCity, 'Location not provided'),
      email: normalizeText(record.email, 'No email'),
      name: normalizeText(record.name, 'No name'),
      phone: normalizeText(record.phone, 'No phone'),
    },
    createdAt: normalizeText(record.createdAt, new Date(0).toISOString()),
    estimate: {
      label: normalizeText(record.estimatedTotalLabel, formatFallbackEstimate(estimatedTotal)),
      total: estimatedTotal,
    },
    id: normalizeText(record.id, `quote-${source}-${Date.now()}`),
    landOwned: normalizeText(record.landOwned, 'unknown'),
    message: normalizeText(record.message, 'No message provided.'),
    model: normalizeText(record.model, 'Modular Home'),
    source,
    status: normalizeStatus(record.status, fallbackStatus),
    targetBuildDate: normalizeText(record.targetBuildDate, 'not-sure'),
  };
}

export function normalizeModularHomeQuoteAdminRow(value: unknown): ModularHomeQuoteReviewRow | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const requester = asRecord(record.requester) ?? {};
  const project = asRecord(record.project) ?? {};
  const config = asRecord(record.config) ?? {};
  const estimate = asRecord(record.estimate) ?? {};
  const estimatedTotal = normalizeNumber(estimate.estimatedTotal);

  return {
    budgetRange: normalizeText(requester.budgetRange, 'not-sure'),
    config: {
      facade: normalizeText(config.facade, 'Unknown facade'),
      finishLevel: normalizeText(config.finishLevel, 'Unknown finish'),
      layoutVariant: normalizeText(config.layoutVariant, 'Unknown layout'),
      roof: normalizeText(config.roof, 'Unknown roof'),
      terrace: normalizeText(config.terrace, 'Unknown terrace'),
      windowPlacement: normalizeText(config.windowPlacement, 'Unknown window placement'),
      doorPlacement: normalizeText(config.doorPlacement, 'Unknown door placement'),
    },
    contact: {
      countryCity: normalizeText(requester.countryCity, 'Location not provided'),
      email: normalizeText(requester.email, 'No email'),
      name: normalizeText(requester.name, 'No name'),
      phone: normalizeText(requester.phone, 'No phone'),
    },
    createdAt: normalizeText(record.created_at, new Date(0).toISOString()),
    estimate: {
      label: formatFallbackEstimate(estimatedTotal),
      total: estimatedTotal,
    },
    id: normalizeText(record.id, `quote-backend-${Date.now()}`),
    landOwned: normalizeText(requester.landOwned, 'unknown'),
    message: normalizeText(requester.message, 'No message provided.'),
    model: normalizeText(project.modelName, 'Modular Home'),
    source: 'backend-staging',
    status: normalizeStatus(record.status, 'new'),
    targetBuildDate: normalizeText(requester.targetBuildDate, 'not-sure'),
  };
}

export function getMockModularHomeQuoteReviewRows(): ModularHomeQuoteReviewRow[] {
  return [...MOCK_QUOTE_ROWS];
}

export function readLocalModularHomeQuoteReviewRows(storage?: Storage): ModularHomeQuoteReviewRow[] {
  const activeStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!activeStorage) {
    return [];
  }

  try {
    const raw = activeStorage.getItem(MODULAR_HOME_QUOTE_REVIEW_LOCAL_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
        .map((item) => normalizeModularHomeQuoteReviewRow(item, 'local-preview'))
        .filter((item): item is ModularHomeQuoteReviewRow => item !== null)
      : [];
  } catch {
    return [];
  }
}

export function getModularHomeQuoteReviewSummary(rows: readonly ModularHomeQuoteReviewRow[]): ModularHomeQuoteReviewSummary {
  return {
    backendCount: rows.filter((row) => row.source === 'backend-staging').length,
    localCount: rows.filter((row) => row.source === 'local-preview').length,
    mockCount: rows.filter((row) => row.source === 'mock-review').length,
    totalCount: rows.length,
    totalEstimate: rows.reduce((total, row) => total + row.estimate.total, 0),
  };
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${text.replace(/"/g, '""')}"`;
}

export function serializeModularHomeQuoteReviewCsv(rows: readonly ModularHomeQuoteReviewRow[]): string {
  const header = [
    'Created',
    'Source',
    'Status',
    'Model',
    'Estimate',
    'Name',
    'Email',
    'Phone',
    'Country/City',
    'Land Owned',
    'Target Build Date',
    'Budget Range',
    'Facade',
    'Roof',
    'Terrace',
    'Finish Level',
    'Window Placement',
    'Door Placement',
    'Message',
  ];
  const body = rows.map((row) => [
    row.createdAt,
    row.source,
    row.status,
    row.model,
    row.estimate.total,
    row.contact.name,
    row.contact.email,
    row.contact.phone,
    row.contact.countryCity,
    row.landOwned,
    row.targetBuildDate,
    row.budgetRange,
    row.config.facade,
    row.config.roof,
    row.config.terrace,
    row.config.finishLevel,
    row.config.windowPlacement,
    row.config.doorPlacement,
    row.message,
  ]);

  return [header, ...body].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function serializeModularHomeQuoteReviewJson(rows: readonly ModularHomeQuoteReviewRow[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    rows,
    summary: getModularHomeQuoteReviewSummary(rows),
  }, null, 2);
}
