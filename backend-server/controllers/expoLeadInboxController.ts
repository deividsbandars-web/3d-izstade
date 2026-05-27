import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';

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

export async function getExpoSponsorLeadInbox(req: Request, res: Response) {
  try {
    const sponsorSlug = normalizeSponsorSlug(req.params.companySlug);
    const limit = normalizeLimit(req.query.limit);
    const company = await resolveCompanyBySlug(sponsorSlug);
    const companyId = typeof company?.id === 'string' ? company.id : null;
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
    const status = code.startsWith('EXPO_LEAD_INBOX_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
