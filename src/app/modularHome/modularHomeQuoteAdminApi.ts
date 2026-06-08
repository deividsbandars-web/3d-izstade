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
    id?: string | null;
    internal_note?: string | null;
    status?: string | null;
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
): Promise<{
  id: string | null;
  internalNote: string;
  status: ModularHomeQuoteAdminStatus;
  updatedBy: string | null;
}> {
  if (!MODULAR_HOME_QUOTE_ADMIN_STATUSES.includes(status)) {
    throw new Error('MODULAR_HOME_QUOTE_ADMIN_STATUS_UNSUPPORTED');
  }

  const response = await serverApiPatch<ModularHomeQuoteAdminStatusResponse>(
    `/api/modular-home/quotes/${encodeURIComponent(quoteId)}/status`,
    { internalNote, status },
  );
  const normalizedStatus = String(response.quote?.status || status).toLowerCase() as ModularHomeQuoteAdminStatus;

  return {
    id: response.quote?.id ?? null,
    internalNote: response.quote?.internal_note ?? internalNote ?? '',
    status: normalizedStatus,
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

