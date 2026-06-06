import { serverApiGet, serverApiPatch } from '../../services/serverApi';
import {
  normalizeModularHomeQuoteAdminRow,
  type ModularHomeQuoteReviewRow,
  type ModularHomeQuoteReviewStatus,
} from '../../modules/expo/runtime/modularHome/modularHomeQuoteReview';

export type ModularHomeQuoteAdminListOptions = {
  limit?: number;
  status?: string;
};

export type ModularHomeQuoteAdminListResult = {
  rows: ModularHomeQuoteReviewRow[];
  totalCount: number;
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
    status?: string | null;
  } | null;
  success?: boolean;
  updatedBy?: string | null;
};

export const MODULAR_HOME_QUOTE_ADMIN_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'closed',
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
): Promise<{ id: string | null; status: ModularHomeQuoteAdminStatus; updatedBy: string | null }> {
  if (!MODULAR_HOME_QUOTE_ADMIN_STATUSES.includes(status)) {
    throw new Error('MODULAR_HOME_QUOTE_ADMIN_STATUS_UNSUPPORTED');
  }

  const response = await serverApiPatch<ModularHomeQuoteAdminStatusResponse>(
    `/api/modular-home/quotes/${encodeURIComponent(quoteId)}/status`,
    { status },
  );
  const normalizedStatus = String(response.quote?.status || status).toLowerCase() as ModularHomeQuoteAdminStatus;

  return {
    id: response.quote?.id ?? null,
    status: normalizedStatus,
    updatedBy: response.updatedBy ?? null,
  };
}

