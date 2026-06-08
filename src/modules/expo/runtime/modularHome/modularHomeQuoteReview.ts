export type ModularHomeQuoteReviewSource = 'backend-staging' | 'local-preview' | 'mock-review';
export type ModularHomeQuoteReviewStatus =
  | 'preview-local-only'
  | 'mock-review'
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'won'
  | 'lost';

export type ModularHomeQuoteReviewRow = {
  budgetRange: string;
  config: {
    doorPlacement: string;
    facade: string;
    facadeBoardOrientation: string;
    facadeBoardWidth: string;
    finishLevel: string;
    floorFinish: string;
    furniturePackage: string;
    sofa: string;
    table: string;
    bed: string;
    kitchenLine: string;
    wardrobePlaceholder: string;
    interiorWallFinish: string;
    layoutVariant: string;
    roof: string;
    roofEdgeColor: string;
    terrace: string;
    windowFrameColor: string;
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
  internalNote: string;
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
      facadeBoardOrientation: 'Horizontal boards',
      facadeBoardWidth: 'Standard boards',
      finishLevel: 'Premium',
      floorFinish: 'Oak laminate floor',
      furniturePackage: 'Premium furniture',
      sofa: 'Sofa on',
      table: 'Table on',
      bed: 'Bed on',
      kitchenLine: 'Kitchen line on',
      wardrobePlaceholder: 'Wardrobe on',
      interiorWallFinish: 'Warm panel walls',
      layoutVariant: 'Two bedroom',
      roof: 'Pitched',
      roofEdgeColor: 'Graphite roof edge',
      terrace: 'Extended terrace',
      windowFrameColor: 'Graphite frames',
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
    internalNote: '',
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
      facadeBoardOrientation: 'Vertical boards',
      facadeBoardWidth: 'Narrow boards',
      finishLevel: 'Standard',
      floorFinish: 'Plywood floor',
      furniturePackage: 'Sauna package',
      sofa: 'Sofa off',
      table: 'Table on',
      bed: 'Bed off',
      kitchenLine: 'Kitchen line off',
      wardrobePlaceholder: 'Wardrobe off',
      interiorWallFinish: 'Plywood walls',
      layoutVariant: 'Sauna + rest room',
      roof: 'Flat',
      roofEdgeColor: 'Graphite roof edge',
      terrace: 'Front deck',
      windowFrameColor: 'Timber frames',
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
    internalNote: '',
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
  if (normalized === 'qualified') {
    return 'quoted';
  }

  if (normalized === 'closed') {
    return 'won';
  }

  const allowed = new Set<ModularHomeQuoteReviewStatus>([
    'contacted',
    'lost',
    'mock-review',
    'new',
    'preview-local-only',
    'quoted',
    'won',
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
      facadeBoardOrientation: normalizeText(selectedOptions.facadeBoardOrientation, normalizeText(config.facadeBoardOrientation, 'Unknown board orientation')),
      facadeBoardWidth: normalizeText(selectedOptions.facadeBoardWidth, normalizeText(config.facadeBoardWidth, 'Unknown board width')),
      finishLevel: normalizeText(selectedOptions.finishLevel, normalizeText(config.finishLevel, 'Unknown finish')),
      floorFinish: normalizeText(selectedOptions.floorFinish, normalizeText(config.floorFinish, 'Unknown floor finish')),
      furniturePackage: normalizeText(selectedOptions.furniturePackage, normalizeText(config.furniturePackage, 'Unknown furniture package')),
      sofa: normalizeText(selectedOptions.sofa, normalizeText(config.sofa, 'Unknown sofa toggle')),
      table: normalizeText(selectedOptions.table, normalizeText(config.table, 'Unknown table toggle')),
      bed: normalizeText(selectedOptions.bed, normalizeText(config.bed, 'Unknown bed toggle')),
      kitchenLine: normalizeText(selectedOptions.kitchenLine, normalizeText(config.kitchenLine, 'Unknown kitchen line toggle')),
      wardrobePlaceholder: normalizeText(selectedOptions.wardrobePlaceholder, normalizeText(config.wardrobePlaceholder, 'Unknown wardrobe toggle')),
      interiorWallFinish: normalizeText(selectedOptions.interiorWallFinish, normalizeText(config.interiorWallFinish, 'Unknown wall finish')),
      layoutVariant: normalizeText(selectedOptions.layoutVariant, normalizeText(config.layoutVariant, 'Unknown layout')),
      roof: normalizeText(selectedOptions.roof, normalizeText(config.roof, 'Unknown roof')),
      roofEdgeColor: normalizeText(selectedOptions.roofEdgeColor, normalizeText(config.roofEdgeColor, 'Unknown roof edge')),
      terrace: normalizeText(selectedOptions.terrace, normalizeText(config.terrace, 'Unknown terrace')),
      windowFrameColor: normalizeText(selectedOptions.windowFrameColor, normalizeText(config.windowFrameColor, 'Unknown window frame')),
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
    internalNote: normalizeText(record.internalNote, ''),
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
      facadeBoardOrientation: normalizeText(config.facadeBoardOrientation, 'Unknown board orientation'),
      facadeBoardWidth: normalizeText(config.facadeBoardWidth, 'Unknown board width'),
      finishLevel: normalizeText(config.finishLevel, 'Unknown finish'),
      floorFinish: normalizeText(config.floorFinish, 'Unknown floor finish'),
      furniturePackage: normalizeText(config.furniturePackage, 'Unknown furniture package'),
      sofa: normalizeText(config.sofa, 'Unknown sofa toggle'),
      table: normalizeText(config.table, 'Unknown table toggle'),
      bed: normalizeText(config.bed, 'Unknown bed toggle'),
      kitchenLine: normalizeText(config.kitchenLine, 'Unknown kitchen line toggle'),
      wardrobePlaceholder: normalizeText(config.wardrobePlaceholder, 'Unknown wardrobe toggle'),
      interiorWallFinish: normalizeText(config.interiorWallFinish, 'Unknown wall finish'),
      layoutVariant: normalizeText(config.layoutVariant, 'Unknown layout'),
      roof: normalizeText(config.roof, 'Unknown roof'),
      roofEdgeColor: normalizeText(config.roofEdgeColor, 'Unknown roof edge'),
      terrace: normalizeText(config.terrace, 'Unknown terrace'),
      windowFrameColor: normalizeText(config.windowFrameColor, 'Unknown window frame'),
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
    internalNote: normalizeText(record.internal_note, ''),
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
    'Facade Board Orientation',
    'Facade Board Width',
    'Roof',
    'Roof Edge Color',
    'Terrace',
    'Finish Level',
    'Interior Wall Finish',
    'Floor Finish',
    'Furniture Package',
    'Sofa',
    'Table',
    'Bed',
    'Kitchen Line',
    'Wardrobe Placeholder',
    'Window Placement',
    'Window Frame Color',
    'Door Placement',
    'Message',
    'Internal Note',
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
    row.config.facadeBoardOrientation,
    row.config.facadeBoardWidth,
    row.config.roof,
    row.config.roofEdgeColor,
    row.config.terrace,
    row.config.finishLevel,
    row.config.interiorWallFinish,
    row.config.floorFinish,
    row.config.furniturePackage,
    row.config.sofa,
    row.config.table,
    row.config.bed,
    row.config.kitchenLine,
    row.config.wardrobePlaceholder,
    row.config.windowPlacement,
    row.config.windowFrameColor,
    row.config.doorPlacement,
    row.message,
    row.internalNote,
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
