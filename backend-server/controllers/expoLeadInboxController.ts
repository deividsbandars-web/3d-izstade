import { Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import {
  getBoothCompanyId,
  listManagedExpoBoothsForUser,
  type ExpoBackendUserContext,
} from '../../src/backend/expo/booths/expoBoothManagementService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

type LeadInboxRecord = Record<string, unknown>;

type LeadInboxSummary = {
  closed: number;
  contacted: number;
  latestInboundAt: string | null;
  needsAction: number;
  pending: number;
  rejected: number;
  total: number;
};

const SUPPORTED_LEAD_STATUSES = ['pending', 'contacted', 'closed', 'rejected'] as const;

function normalizeSponsorSlug(value: unknown) {
  const slug = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) {
    throw new Error('EXPO_LEAD_INBOX_INVALID_SPONSOR');
  }

  return slug;
}

function normalizeLimit(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

function normalizeLeadId(value: unknown) {
  const leadId = typeof value === 'string' ? value.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId)) {
    throw new Error('EXPO_LEAD_INBOX_INVALID_LEAD');
  }

  return leadId;
}

function normalizeLeadStatus(value: unknown) {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!SUPPORTED_LEAD_STATUSES.includes(status as typeof SUPPORTED_LEAD_STATUSES[number])) {
    throw new Error('EXPO_LEAD_INBOX_INVALID_STATUS');
  }

  return status;
}

function normalizeOptionalText(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : null;
}

function normalizeFollowUpAt(value: unknown) {
  const text = normalizeOptionalText(value);
  if (!text) {
    return null;
  }

  if (Number.isNaN(Date.parse(text))) {
    throw new Error('EXPO_LEAD_INBOX_INVALID_FOLLOW_UP');
  }

  return text;
}

export function buildExpoLeadInboxSummary(leads: LeadInboxRecord[]): LeadInboxSummary {
  return leads.reduce<LeadInboxSummary>((summary, lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    const createdAt = typeof lead.created_at === 'string' ? lead.created_at : null;

    summary.total += 1;
    if (status === 'closed') {
      summary.closed += 1;
    } else if (status === 'contacted') {
      summary.contacted += 1;
      summary.needsAction += 1;
    } else if (status === 'rejected') {
      summary.rejected += 1;
    } else {
      summary.pending += 1;
      summary.needsAction += 1;
    }

    if (createdAt && (!summary.latestInboundAt || createdAt > summary.latestInboundAt)) {
      summary.latestInboundAt = createdAt;
    }

    return summary;
  }, {
    closed: 0,
    contacted: 0,
    latestInboundAt: null,
    needsAction: 0,
    pending: 0,
    rejected: 0,
    total: 0,
  });
}

function mergeLeadOps(
  leads: LeadInboxRecord[],
  opsRows: LeadInboxRecord[],
) {
  const opsByLeadId = new Map(
    opsRows.map((entry) => [String(entry.service_request_id || ''), entry]),
  );

  return leads.map((lead) => {
    const ops = opsByLeadId.get(String(lead.id || ''));
    return {
      ...lead,
      follow_up_at: ops?.follow_up_at ?? null,
      ops_notes: ops?.ops_notes ?? null,
      ops_updated_at: ops?.updated_at ?? null,
    };
  });
}

async function resolveCompanyBySlug(sponsorSlug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, slug')
    .eq('slug', sponsorSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id?: string | null; name?: string | null; slug?: string | null } | null;
}

async function listSponsorLeadRows(sponsorSlug: string, companyId: string | null, limit: number) {
  const supabase = getSupabase();
  const buckets: LeadInboxRecord[][] = [];

  if (companyId) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    buckets.push((data ?? []) as LeadInboxRecord[]);
  }

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('service_name', `expo_sponsor_lead:${sponsorSlug}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  buckets.push((data ?? []) as LeadInboxRecord[]);

  const deduped = new Map<string, LeadInboxRecord>();
  buckets.flat().forEach((entry) => {
    deduped.set(String(entry.id || `${entry.client_email || 'lead'}:${entry.created_at || ''}`), entry);
  });

  return Array.from(deduped.values())
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))
    .slice(0, limit);
}

async function listLeadOpsRows(leadIds: string[]) {
  if (leadIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('expo_lead_ops')
    .select('*')
    .in('service_request_id', leadIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as LeadInboxRecord[];
}

function leadBelongsToSponsor(lead: LeadInboxRecord, sponsorSlug: string, companyId: string | null) {
  const leadCompanyId = String(lead.company_id || '').trim();
  const serviceName = String(lead.service_name || '').trim();

  if (companyId && leadCompanyId && leadCompanyId === companyId) {
    return true;
  }

  return serviceName === `expo_sponsor_lead:${sponsorSlug}`;
}

async function resolveLeadForSponsor(leadId: string, sponsorSlug: string, companyId: string | null) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !data) {
    throw new Error('EXPO_LEAD_INBOX_LEAD_NOT_FOUND');
  }

  const lead = data as LeadInboxRecord;
  if (!leadBelongsToSponsor(lead, sponsorSlug, companyId)) {
    throw new Error('EXPO_LEAD_INBOX_LEAD_NOT_FOUND');
  }

  return lead;
}

async function resolveSponsorContext(companySlug: unknown) {
  const sponsorSlug = normalizeSponsorSlug(companySlug);
  const company = await resolveCompanyBySlug(sponsorSlug);
  const companyId = typeof company?.id === 'string' ? company.id : null;

  return { company, companyId, sponsorSlug };
}

function getBoothSponsorSlugs(booth: Record<string, unknown>) {
  const contactInfo = booth.contact_info && typeof booth.contact_info === 'object'
    ? booth.contact_info as Record<string, unknown>
    : {};
  const assets = booth.assets_3d && typeof booth.assets_3d === 'object'
    ? booth.assets_3d as Record<string, unknown>
    : {};

  return [
    booth.company_slug,
    booth.companySlug,
    booth.slug,
    contactInfo.company_slug,
    contactInfo.companySlug,
    contactInfo.sponsor_slug,
    contactInfo.sponsorSlug,
    assets.company_slug,
    assets.companySlug,
    assets.sponsor_slug,
    assets.sponsorSlug,
  ]
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
}

function boothMatchesSponsor(
  booth: Record<string, unknown>,
  companyId: string | null,
  sponsorSlug: string,
) {
  const boothCompanyId = getBoothCompanyId(booth as Parameters<typeof getBoothCompanyId>[0]);
  if (companyId && boothCompanyId && boothCompanyId === companyId) {
    return true;
  }

  return getBoothSponsorSlugs(booth).includes(sponsorSlug);
}

async function assertSponsorLeadInboxAccess(
  user: ExpoBackendUserContext,
  companyId: string | null,
  sponsorSlug: string,
) {
  if (user.role === 'admin') {
    return;
  }

  const managedBooths = await listManagedExpoBoothsForUser(user);
  if (managedBooths.error || !managedBooths.data) {
    throw new Error('EXPO_LEAD_INBOX_ACCESS_CHECK_FAILED');
  }

  const hasMatchingBooth = managedBooths.data.some((booth) => boothMatchesSponsor(
    booth as unknown as Record<string, unknown>,
    companyId,
    sponsorSlug,
  ));

  if (!hasMatchingBooth) {
    throw new Error('EXPO_LEAD_INBOX_FORBIDDEN');
  }
}

export async function getExpoSponsorLeadInbox(req: AuthRequest, res: Response) {
  try {
    const { company, companyId, sponsorSlug } = await resolveSponsorContext(req.params.companySlug);
    await assertSponsorLeadInboxAccess(req.user ?? {}, companyId, sponsorSlug);
    const limit = normalizeLimit(req.query.limit);
    const rawLeads = await listSponsorLeadRows(sponsorSlug, companyId, limit);
    const opsRows = await listLeadOpsRows(rawLeads.map((lead) => String(lead.id || '')).filter(Boolean));
    const leads = mergeLeadOps(rawLeads, opsRows);

    res.json({
      leads,
      sponsor: {
        companyId,
        displayName: company?.name ?? sponsorSlug,
        slug: sponsorSlug,
      },
      summary: buildExpoLeadInboxSummary(leads),
    });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_LEAD_INBOX_UNKNOWN');
    const status = code === 'EXPO_LEAD_INBOX_FORBIDDEN'
      ? 403
      : code.startsWith('EXPO_LEAD_INBOX_')
        ? 400
        : 500;
    res.status(status).json({ error: code });
  }
}

export async function updateExpoSponsorLeadStatus(req: AuthRequest, res: Response) {
  try {
    const { companyId, sponsorSlug } = await resolveSponsorContext(req.params.companySlug);
    await assertSponsorLeadInboxAccess(req.user ?? {}, companyId, sponsorSlug);
    const leadId = normalizeLeadId(req.params.leadId);
    const status = normalizeLeadStatus(req.body?.status);
    await resolveLeadForSponsor(leadId, sponsorSlug, companyId);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', leadId)
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('EXPO_LEAD_INBOX_UPDATE_FAILED');
    }

    res.json({ lead: data, status });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_LEAD_INBOX_UNKNOWN');
    const status = code === 'EXPO_LEAD_INBOX_FORBIDDEN'
      ? 403
      : code === 'EXPO_LEAD_INBOX_LEAD_NOT_FOUND'
        ? 404
        : code.startsWith('EXPO_LEAD_INBOX_')
          ? 400
          : 500;
    res.status(status).json({ error: code });
  }
}

export async function updateExpoSponsorLeadOps(req: AuthRequest, res: Response) {
  try {
    const { companyId, sponsorSlug } = await resolveSponsorContext(req.params.companySlug);
    await assertSponsorLeadInboxAccess(req.user ?? {}, companyId, sponsorSlug);
    const leadId = normalizeLeadId(req.params.leadId);
    const opsNotes = normalizeOptionalText(req.body?.opsNotes);
    const followUpAt = normalizeFollowUpAt(req.body?.followUpAt);
    await resolveLeadForSponsor(leadId, sponsorSlug, companyId);

    const user = (req as { user?: { id?: string | null } }).user;
    const payload = {
      follow_up_at: followUpAt,
      ops_notes: opsNotes,
      service_request_id: leadId,
      updated_at: new Date().toISOString(),
      updated_by_user_id: user?.id ?? null,
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expo_lead_ops')
      .upsert(payload, { onConflict: 'service_request_id' })
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('EXPO_LEAD_INBOX_OPS_UPDATE_FAILED');
    }

    res.json({
      follow_up_at: data.follow_up_at ?? null,
      ops_notes: data.ops_notes ?? null,
      ops_updated_at: data.updated_at ?? null,
    });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_LEAD_INBOX_UNKNOWN');
    const status = code === 'EXPO_LEAD_INBOX_FORBIDDEN'
      ? 403
      : code === 'EXPO_LEAD_INBOX_LEAD_NOT_FOUND'
        ? 404
        : code.startsWith('EXPO_LEAD_INBOX_')
          ? 400
          : 500;
    res.status(status).json({ error: code });
  }
}
