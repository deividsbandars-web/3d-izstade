import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getSupabase } from '../services/supabase.js';

export type ModularHomeQuoteAdminStatus = 'contacted' | 'lost' | 'new' | 'quoted' | 'won';

export type ModularHomeQuoteAdminAccessPlan = {
  adminRoutes: Array<{
    method: 'GET' | 'PATCH';
    path: string;
    purpose: string;
  }>;
  authGuard: 'authMiddleware';
  exportRules: string[];
  publicExposure: false;
  roleCheck: 'adminOnly';
  statusWorkflow: ModularHomeQuoteAdminStatus[];
  storageTable: typeof MODULAR_HOME_QUOTE_ADMIN_TABLE;
};

type SupabaseQuoteRow = {
  attribution?: unknown;
  config?: unknown;
  consent?: unknown;
  created_at?: string;
  estimate?: unknown;
  id?: string;
  internal_note?: string;
  project?: unknown;
  requester?: unknown;
  source?: unknown;
  status?: string;
};

const MODULAR_HOME_QUOTE_ADMIN_TABLE = 'modular_home_quote_requests';
const MODULAR_HOME_QUOTE_ADMIN_SELECT = [
  'id',
  'created_at',
  'status',
  'internal_note',
  'requester',
  'project',
  'config',
  'estimate',
  'consent',
  'attribution',
  'source',
].join(', ');

const ADMIN_STATUSES = new Set<ModularHomeQuoteAdminStatus>(['contacted', 'lost', 'new', 'quoted', 'won']);
const DEFAULT_ADMIN_LIST_LIMIT = 50;
const MAX_ADMIN_LIST_LIMIT = 200;
const MAX_INTERNAL_NOTE_LENGTH = 2000;

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getNestedText(value: unknown, key: string, fallback = ''): string {
  const record = asRecord(value);
  return normalizeText(record[key], fallback);
}

function getNestedNumber(value: unknown, key: string): number {
  const record = asRecord(value);
  const numeric = Number(record[key]);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function quoteAdminError(res: Response, status: number, error: string, message: string) {
  return res.status(status).json({ error, message, success: false });
}

function normalizeInternalNote(value: unknown): string | null | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized.slice(0, MAX_INTERNAL_NOTE_LENGTH) : null;
}

export function buildModularHomeQuoteAdminStatusUpdatePayload(
  status: ModularHomeQuoteAdminStatus,
  internalNote: unknown,
) {
  const payload: {
    internal_note?: string | null;
    status: ModularHomeQuoteAdminStatus;
  } = { status };
  const normalizedNote = normalizeInternalNote(internalNote);

  if (normalizedNote !== undefined) {
    payload.internal_note = normalizedNote;
  }

  return payload;
}

export function getModularHomeQuoteAdminAccessPlan(): ModularHomeQuoteAdminAccessPlan {
  return {
    adminRoutes: [
      {
        method: 'GET',
        path: '/api/modular-home/quotes',
        purpose: 'List Modular Home quote requests for authenticated admins.',
      },
      {
        method: 'GET',
        path: '/api/modular-home/quotes/:quoteId',
        purpose: 'View one Modular Home quote request detail for authenticated admins.',
      },
      {
        method: 'PATCH',
        path: '/api/modular-home/quotes/:quoteId/status',
        purpose: 'Update sales review status and optional internal note for one quote request.',
      },
      {
        method: 'GET',
        path: '/api/modular-home/quotes/export?format=json|csv',
        purpose: 'Export filtered quote requests for authenticated admins.',
      },
    ],
    authGuard: 'authMiddleware',
    exportRules: [
      'Exports require admin JWT role.',
      'Export endpoint is mounted under protectedRouter only.',
      'Internal notes are admin-only fields and must never be shown in public Modular Home demo views.',
      'Future production export must write an audit log row with actor id and row count.',
    ],
    publicExposure: false,
    roleCheck: 'adminOnly',
    statusWorkflow: ['new', 'contacted', 'quoted', 'won', 'lost'],
    storageTable: MODULAR_HOME_QUOTE_ADMIN_TABLE,
  };
}

export function normalizeModularHomeQuoteAdminStatus(value: unknown): ModularHomeQuoteAdminStatus {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'qualified') {
    return 'quoted';
  }

  if (normalized === 'closed') {
    return 'won';
  }

  if (!ADMIN_STATUSES.has(normalized as ModularHomeQuoteAdminStatus)) {
    throw new Error('MODULAR_HOME_QUOTE_ADMIN_STATUS_INVALID');
  }

  return normalized as ModularHomeQuoteAdminStatus;
}

export function normalizeModularHomeQuoteAdminLimit(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_ADMIN_LIST_LIMIT;
  }

  return Math.min(Math.round(numeric), MAX_ADMIN_LIST_LIMIT);
}

export function serializeModularHomeQuoteAdminCsv(rows: readonly SupabaseQuoteRow[]): string {
  const header = [
    'id',
    'created_at',
    'status',
    'internal_note',
    'model',
    'estimated_total',
    'name',
    'email',
    'phone',
    'country_city',
    'land_owned',
    'target_build_date',
    'budget_range',
    'facade',
    'facade_board_orientation',
    'facade_board_width',
    'roof',
    'roof_edge_color',
    'terrace',
    'finish_level',
    'interior_wall_finish',
    'floor_finish',
    'furniture_package',
    'sofa',
    'table',
    'bed',
    'kitchen_line',
    'wardrobe_placeholder',
    'window_placement',
    'window_frame_color',
    'door_placement',
    'message',
    'source_path',
  ];
  const body = rows.map((row) => [
    row.id ?? '',
    row.created_at ?? '',
    row.status ?? '',
    row.internal_note ?? '',
    getNestedText(row.project, 'modelName'),
    getNestedNumber(row.estimate, 'estimatedTotal'),
    getNestedText(row.requester, 'name'),
    getNestedText(row.requester, 'email'),
    getNestedText(row.requester, 'phone'),
    getNestedText(row.requester, 'countryCity'),
    getNestedText(row.requester, 'landOwned'),
    getNestedText(row.requester, 'targetBuildDate'),
    getNestedText(row.requester, 'budgetRange'),
    getNestedText(row.config, 'facade'),
    getNestedText(row.config, 'facadeBoardOrientation'),
    getNestedText(row.config, 'facadeBoardWidth'),
    getNestedText(row.config, 'roof'),
    getNestedText(row.config, 'roofEdgeColor'),
    getNestedText(row.config, 'terrace'),
    getNestedText(row.config, 'finishLevel'),
    getNestedText(row.config, 'interiorWallFinish'),
    getNestedText(row.config, 'floorFinish'),
    getNestedText(row.config, 'furniturePackage'),
    getNestedText(row.config, 'sofa'),
    getNestedText(row.config, 'table'),
    getNestedText(row.config, 'bed'),
    getNestedText(row.config, 'kitchenLine'),
    getNestedText(row.config, 'wardrobePlaceholder'),
    getNestedText(row.config, 'windowPlacement'),
    getNestedText(row.config, 'windowFrameColor'),
    getNestedText(row.config, 'doorPlacement'),
    getNestedText(row.requester, 'message'),
    getNestedText(row.source, 'path'),
  ]);

  return [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function normalizeQuoteId(value: unknown): string {
  const quoteId = normalizeText(value, '').slice(0, 160);
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_-]{5,159}$/.test(quoteId)) {
    throw new Error('MODULAR_HOME_QUOTE_ADMIN_ID_INVALID');
  }

  return quoteId;
}

async function readQuoteRows(req: AuthRequest): Promise<SupabaseQuoteRow[]> {
  const limit = normalizeModularHomeQuoteAdminLimit(req.query.limit);
  const statusFilter = normalizeText(req.query.status);
  let query = getSupabase()
    .from(MODULAR_HOME_QUOTE_ADMIN_TABLE)
    .select(MODULAR_HOME_QUOTE_ADMIN_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (statusFilter) {
    query = query.eq('status', normalizeModularHomeQuoteAdminStatus(statusFilter));
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data as SupabaseQuoteRow[] : [];
}

export async function listModularHomeQuoteRequests(req: AuthRequest, res: Response) {
  try {
    const rows = await readQuoteRows(req);
    return res.json({
      rows,
      success: true,
      totalCount: rows.length,
    });
  } catch (error: any) {
    const code = String(error?.message || 'MODULAR_HOME_QUOTE_ADMIN_LIST_FAILED');
    const status = code.startsWith('MODULAR_HOME_QUOTE_ADMIN_') ? 400 : 500;
    return quoteAdminError(res, status, code, 'Could not list Modular Home quote requests.');
  }
}

export async function getModularHomeQuoteRequest(req: AuthRequest, res: Response) {
  try {
    const quoteId = normalizeQuoteId(req.params.quoteId);
    const { data, error } = await getSupabase()
      .from(MODULAR_HOME_QUOTE_ADMIN_TABLE)
      .select(MODULAR_HOME_QUOTE_ADMIN_SELECT)
      .eq('id', quoteId)
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      quote: data,
      success: true,
    });
  } catch (error: any) {
    const code = String(error?.message || 'MODULAR_HOME_QUOTE_ADMIN_DETAIL_FAILED');
    const status = code.startsWith('MODULAR_HOME_QUOTE_ADMIN_') ? 400 : 500;
    return quoteAdminError(res, status, code, 'Could not load Modular Home quote detail.');
  }
}

export async function exportModularHomeQuoteRequests(req: AuthRequest, res: Response) {
  try {
    const rows = await readQuoteRows(req);
    const format = normalizeText(req.query.format, 'json').toLowerCase();
    const filenameDate = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      res.setHeader('Content-Disposition', `attachment; filename="modular-home-quotes-${filenameDate}.csv"`);
      res.type('text/csv');
      return res.send(serializeModularHomeQuoteAdminCsv(rows));
    }

    res.setHeader('Content-Disposition', `attachment; filename="modular-home-quotes-${filenameDate}.json"`);
    return res.json({
      exportedAt: new Date().toISOString(),
      rows,
      success: true,
      totalCount: rows.length,
    });
  } catch (error: any) {
    const code = String(error?.message || 'MODULAR_HOME_QUOTE_ADMIN_EXPORT_FAILED');
    const status = code.startsWith('MODULAR_HOME_QUOTE_ADMIN_') ? 400 : 500;
    return quoteAdminError(res, status, code, 'Could not export Modular Home quote requests.');
  }
}

export async function updateModularHomeQuoteStatus(req: AuthRequest, res: Response) {
  try {
    const quoteId = normalizeQuoteId(req.params.quoteId);
    const status = normalizeModularHomeQuoteAdminStatus(req.body?.status);
    const updatePayload = buildModularHomeQuoteAdminStatusUpdatePayload(
      status,
      req.body?.internalNote ?? req.body?.internal_note,
    );
    const { data, error } = await getSupabase()
      .from(MODULAR_HOME_QUOTE_ADMIN_TABLE)
      .update(updatePayload)
      .eq('id', quoteId)
      .select('id, status, internal_note')
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      quote: data,
      success: true,
      updatedBy: req.user?.id ?? null,
    });
  } catch (error: any) {
    const code = String(error?.message || 'MODULAR_HOME_QUOTE_ADMIN_STATUS_UPDATE_FAILED');
    const status = code.startsWith('MODULAR_HOME_QUOTE_ADMIN_') ? 400 : 500;
    return quoteAdminError(res, status, code, 'Could not update Modular Home quote status.');
  }
}
