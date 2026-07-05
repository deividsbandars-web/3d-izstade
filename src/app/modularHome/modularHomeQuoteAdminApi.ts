import { serverApiGet, serverApiGetText, serverApiPatch } from '../../services/serverApi';
import {
  normalizeModularHomeQuoteAdminRow,
  type ModularHomeQuoteReviewRow,
  type ModularHomeQuoteReviewStatus,
} from '../../modules/expo/runtime/modularHome/modularHomeQuoteReview';

export type ModularHomeQuoteAdminListOptions = {
  format?: string;
  limit?: number;
  status?: string;
};

export type ModularHomeQuoteAdminListResult = {
  rows: ModularHomeQuoteReviewRow[];
  totalCount: number;
};

export type ModularHomeQuoteAdminExportFormat = 'csv' | 'json';

export type ModularHomeQuoteAdminExportResult = {
  content: string;
  contentType: string;
  filename: string;
  format: ModularHomeQuoteAdminExportFormat;
};

type ModularHomeQuoteAdminListResponse = {
  rows?: unknown[];
  success?: boolean;
  totalCount?: number;
};

type ModularHomeQuoteAdminDetailResponse = {
  quote?: unknown;
  success?: boolean;
};

type ModularHomeQuoteAdminStatusResponse = {
  quote?: {
    consultant_assignment?: string | null;
    follow_up_required?: boolean | null;
    id?: string | null;
    internal_note?: string | null;
    status?: string | null;
    status_history?: unknown;
  } | null;
  success?: boolean;
  updatedBy?: string | null;
};

export const MODULAR_HOME_QUOTE_ADMIN_STATUSES = [
  'new',
  'contacted',
  'quoted',
  'won',
  'lost',
] as const satisfies readonly ModularHomeQuoteReviewStatus[];

export type ModularHomeQuoteAdminStatus = typeof MODULAR_HOME_QUOTE_ADMIN_STATUSES[number];

function buildQuoteAdminQuery(options: ModularHomeQuoteAdminListOptions = {}) {
  const params = new URLSearchParams();

  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  if (options.status && options.status !== 'all') {
    params.set('status', options.status);
  }

  if (options.format) {
    params.set('format', options.format);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function normalizeRows(rows: unknown[]): ModularHomeQuoteReviewRow[] {
  return rows
    .map((row) => normalizeModularHomeQuoteAdminRow(row))
    .filter((row): row is ModularHomeQuoteReviewRow => row !== null);
}

export async function getModularHomeQuoteAdminRows(
  options: ModularHomeQuoteAdminListOptions = {},
): Promise<ModularHomeQuoteAdminListResult> {
  const response = await serverApiGet<ModularHomeQuoteAdminListResponse>(
    `/api/modular-home/quotes${buildQuoteAdminQuery(options)}`,
  );
  const rows = normalizeRows(Array.isArray(response.rows) ? response.rows : []);

  return {
    rows,
    totalCount: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  };
}

export async function getModularHomeQuoteAdminDetail(quoteId: string): Promise<ModularHomeQuoteReviewRow | null> {
  const response = await serverApiGet<ModularHomeQuoteAdminDetailResponse>(
    `/api/modular-home/quotes/${encodeURIComponent(quoteId)}`,
  );

  return response.quote ? normalizeModularHomeQuoteAdminRow(response.quote) : null;
}

export async function updateModularHomeQuoteAdminStatus(
  quoteId: string,
  status: ModularHomeQuoteAdminStatus,
  internalNote?: string,
  consultantAssignment?: string,
  followUpRequired?: boolean,
): Promise<{
  consultantAssignment: string;
  followUpRequired: boolean;
  id: string | null;
  internalNote: string;
  statusHistory: unknown[];
  status: ModularHomeQuoteAdminStatus;
  updatedBy: string | null;
}> {
  if (!MODULAR_HOME_QUOTE_ADMIN_STATUSES.includes(status)) {
    throw new Error('MODULAR_HOME_QUOTE_ADMIN_STATUS_UNSUPPORTED');
  }

  const response = await serverApiPatch<ModularHomeQuoteAdminStatusResponse>(
    `/api/modular-home/quotes/${encodeURIComponent(quoteId)}/status`,
    { consultantAssignment, followUpRequired, internalNote, status },
  );
  const normalizedStatus = String(response.quote?.status || status).toLowerCase() as ModularHomeQuoteAdminStatus;

  return {
    consultantAssignment: response.quote?.consultant_assignment ?? consultantAssignment ?? '',
    followUpRequired: Boolean(response.quote?.follow_up_required ?? followUpRequired ?? false),
    id: response.quote?.id ?? null,
    internalNote: response.quote?.internal_note ?? internalNote ?? '',
    statusHistory: Array.isArray(response.quote?.status_history) ? response.quote.status_history : [],
    status: normalizedStatus,
    updatedBy: response.updatedBy ?? null,
  };
}

export async function updateModularHomeQuoteAdminOps(
  quoteId: string,
  input: {
    consultantAssignment?: string;
    followUpRequired?: boolean;
    internalNote?: string;
  },
): Promise<{
  consultantAssignment: string;
  followUpRequired: boolean;
  id: string | null;
  internalNote: string;
  status: ModularHomeQuoteAdminStatus;
  statusHistory: unknown[];
  updatedBy: string | null;
}> {
  const response = await serverApiPatch<ModularHomeQuoteAdminStatusResponse>(
    `/api/modular-home/quotes/${encodeURIComponent(quoteId)}/ops`,
    input,
  );
  const normalizedStatus = String(response.quote?.status || 'new').toLowerCase() as ModularHomeQuoteAdminStatus;

  return {
    consultantAssignment: response.quote?.consultant_assignment ?? input.consultantAssignment ?? '',
    followUpRequired: Boolean(response.quote?.follow_up_required ?? input.followUpRequired ?? false),
    id: response.quote?.id ?? null,
    internalNote: response.quote?.internal_note ?? input.internalNote ?? '',
    status: normalizedStatus,
    statusHistory: Array.isArray(response.quote?.status_history) ? response.quote.status_history : [],
    updatedBy: response.updatedBy ?? null,
  };
}

export async function exportModularHomeQuoteAdminRows(
  format: ModularHomeQuoteAdminExportFormat,
  options: ModularHomeQuoteAdminListOptions = {},
): Promise<ModularHomeQuoteAdminExportResult> {
  const response = await serverApiGetText(
    `/api/modular-home/quotes/export${buildQuoteAdminQuery({ ...options, format })}`,
  );
  const today = new Date().toISOString().slice(0, 10);

  return {
    content: response.content,
    contentType: response.contentType,
    filename: `modular-home-quotes-${today}.${format}`,
    format,
  };
}

