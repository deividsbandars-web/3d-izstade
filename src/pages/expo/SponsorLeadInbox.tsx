import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';
import {
  getSponsorLeadInbox,
  updateSponsorLeadInboxOps,
  updateSponsorLeadInboxStatus,
  type SponsorLeadInboxLead,
  type SponsorLeadInboxResponse,
  type SponsorLeadStatus,
} from '../../app/expo/sponsorLeadInboxService';
import {
  buildSponsorLeadCopySummary,
  serializeSponsorLeadCsv,
} from '../../app/expo/sponsorLeadExport';
import {
  getSponsorLeadQualificationForMessage,
  getSponsorPackageLeadQualification,
} from '../../app/expo/sponsorLeadQualification';
import { parseSponsorPackageLeadMessage } from '../../app/expo/sponsorPackageLead';
import { supabaseClient } from '../../lib/supabaseClient';

const STATUS_COLORS: Record<string, string> = {
  closed: '#34d399',
  contacted: '#93c5fd',
  pending: '#fbbf24',
  rejected: '#f87171',
};

const STATUS_LABELS: Record<SponsorLeadStatus, string> = {
  closed: 'Closed',
  contacted: 'Contacted',
  pending: 'Pending',
  rejected: 'Rejected',
};

const LEAD_PRIORITY_COLORS = {
  hot: '#fb7185',
  standard: '#94a3b8',
  warm: '#fbbf24',
} as const;

type InboxAccessState =
  | 'checking-auth'
  | 'ready'
  | 'signed-out'
  | 'access-denied'
  | 'backend-unavailable'
  | 'unavailable';

type LeadFilter = 'all' | 'hot-leads' | 'needs-action' | 'package-requests';

function formatDate(value?: string | null) {
  if (!value) {
    return 'No timestamp';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function normalizeStatus(lead: SponsorLeadInboxLead) {
  const status = String(lead.status || 'pending').toLowerCase();
  return STATUS_COLORS[status] ? status : 'pending';
}

function toDateTimeInputValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
}

function getTomorrowMorningFollowUpIso(now = new Date()) {
  const followUpAt = new Date(now);
  followUpAt.setDate(followUpAt.getDate() + 1);
  followUpAt.setHours(9, 0, 0, 0);
  return followUpAt.toISOString();
}

function buildSummary(leads: SponsorLeadInboxLead[]) {
  return leads.reduce<SponsorLeadInboxResponse['summary']>((summary, lead) => {
    const status = normalizeStatus(lead);
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

function updateLeadInInbox(
  current: SponsorLeadInboxResponse | null,
  leadId: string,
  patch: Partial<SponsorLeadInboxLead>,
) {
  if (!current) {
    return current;
  }

  const leads = current.leads.map((lead) =>
    String(lead.id || '') === leadId ? { ...lead, ...patch } : lead,
  );

  return {
    ...current,
    leads,
    summary: buildSummary(leads),
  };
}

function formatRequestError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('CLIPBOARD_COPY_FAILED');
  }
}

function resolveAccessStateFromError(errorText: string): Exclude<InboxAccessState, 'checking-auth' | 'ready'> {
  if (errorText.includes('SERVER_API_HTTP_401')) {
    return 'signed-out';
  }

  if (errorText.includes('SERVER_API_HTTP_403')) {
    return 'access-denied';
  }

  if (
    errorText.includes('SERVER_API_HTTP_500') ||
    errorText.includes('SERVER_API_HTTP_502') ||
    errorText.includes('SERVER_API_HTTP_503') ||
    errorText.includes('SERVER_API_HTTP_504') ||
    errorText.toLowerCase().includes('failed to fetch') ||
    errorText.toLowerCase().includes('networkerror') ||
    errorText.toLowerCase().includes('err_connection')
  ) {
    return 'backend-unavailable';
  }

  return 'unavailable';
}

function getAccessNotice(accessState: InboxAccessState, technicalError: string | null) {
  if (accessState === 'signed-out') {
    return {
      accent: '#fbbf24',
      actionHref: '/login',
      actionLabel: 'Sign in',
      body: 'Sponsor lead inbox is protected. Sign in with a sponsor or admin account, then return to this page.',
      detail: 'If you are already signed in, refresh the page so the current Supabase session can be attached to the API request.',
      title: 'Sign in required',
    };
  }

  if (accessState === 'access-denied') {
    return {
      accent: '#fb7185',
      actionHref: '/expo-3d?salesDemo=1',
      actionLabel: 'Open sales demo',
      body: 'Your session is valid, but this account is not authorized for this sponsor lead inbox.',
      detail: 'Use the correct sponsor/admin account or ask an admin to grant access for this sponsor.',
      title: 'Access denied',
    };
  }

  if (accessState === 'backend-unavailable') {
    return {
      accent: '#38bdf8',
      actionHref: '/expo-3d?salesDemo=1',
      actionLabel: 'Open sales demo',
      body: 'The Sponsor Lead Inbox UI is ready, but the backend API is not reachable right now.',
      detail: 'After staging services are restored, run: npm.cmd run check:expo-sponsor-ops -- --public --skip-frontend',
      title: 'Backend unavailable',
    };
  }

  if (accessState === 'unavailable') {
    return {
      accent: '#f87171',
      actionHref: '/expo-3d?salesDemo=1',
      actionLabel: 'Open sales demo',
      body: 'The Sponsor Lead Inbox could not load.',
      detail: technicalError ? `Technical detail: ${technicalError}` : 'Retry after checking the backend and auth session.',
      title: 'Inbox unavailable',
    };
  }

  return null;
}

export default function SponsorLeadInbox() {
  const [searchParams] = useSearchParams();
  const sponsorSlug = searchParams.get('sponsor') || 'sponsor-concierge';
  const [data, setData] = useState<SponsorLeadInboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<InboxAccessState>('checking-auth');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeStatusAction, setActiveStatusAction] = useState<string | null>(null);
  const [activeOpsSave, setActiveOpsSave] = useState<string | null>(null);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [opsDrafts, setOpsDrafts] = useState<Record<string, { followUpAt: string; opsNotes: string }>>({});

  const loadInbox = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setError(null);
    setAccessState('checking-auth');

    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const hasSession = Boolean(sessionData.session?.access_token);

      if (!hasSession) {
        if (!cancelled()) {
          setAccessState('signed-out');
          setData(null);
          setLoading(false);
        }
        return;
      }

      const response = await getSponsorLeadInbox(sponsorSlug);
      if (!cancelled()) {
        setAccessState('ready');
        setData(response);
      }
    } catch (requestError) {
      if (!cancelled()) {
        const errorText = formatRequestError(requestError);
        setError(errorText);
        setAccessState(resolveAccessStateFromError(errorText));
        setData(null);
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, [sponsorSlug]);

  useEffect(() => {
    let cancelled = false;

    void loadInbox(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [loadInbox]);

  const sortedLeads = useMemo(() => {
    return [...(data?.leads ?? [])].sort((left, right) =>
      String(right.created_at || '').localeCompare(String(left.created_at || '')),
    );
  }, [data]);

  const packageRequestCount = useMemo(() => {
    return sortedLeads.filter((lead) => parseSponsorPackageLeadMessage(lead.message)).length;
  }, [sortedLeads]);

  const hotLeadCount = useMemo(() => {
    return sortedLeads.filter((lead) => getSponsorLeadQualificationForMessage(lead.message)?.priority === 'hot').length;
  }, [sortedLeads]);

  const visibleLeads = useMemo(() => {
    if (leadFilter === 'hot-leads') {
      return sortedLeads.filter((lead) => getSponsorLeadQualificationForMessage(lead.message)?.priority === 'hot');
    }

    if (leadFilter === 'package-requests') {
      return sortedLeads.filter((lead) => parseSponsorPackageLeadMessage(lead.message));
    }

    if (leadFilter === 'needs-action') {
      return sortedLeads.filter((lead) => ['pending', 'contacted'].includes(normalizeStatus(lead)));
    }

    return sortedLeads;
  }, [leadFilter, sortedLeads]);

  useEffect(() => {
    setOpsDrafts((current) => {
      const next = { ...current };
      sortedLeads.forEach((lead) => {
        const key = String(lead.id || '');
        if (!key || next[key]) {
          return;
        }

        next[key] = {
          followUpAt: toDateTimeInputValue(lead.follow_up_at),
          opsNotes: String(lead.ops_notes || ''),
        };
      });

      return next;
    });
  }, [sortedLeads]);

  async function handleStatusChange(leadId: string, status: SponsorLeadStatus) {
    if (!leadId) {
      return;
    }

    setActiveStatusAction(`${leadId}:${status}`);
    setMessage(null);

    try {
      await updateSponsorLeadInboxStatus(sponsorSlug, leadId, status);
      setData((current) => updateLeadInInbox(current, leadId, { status }));
      setMessage({ type: 'success', text: `Lead marked ${STATUS_LABELS[status].toLowerCase()}.` });
    } catch (updateError) {
      setMessage({ type: 'error', text: `Failed to update lead status: ${formatRequestError(updateError)}` });
    } finally {
      setActiveStatusAction(null);
    }
  }

  async function handleOpsSave(leadId: string) {
    if (!leadId) {
      return;
    }

    const draft = opsDrafts[leadId] ?? { followUpAt: '', opsNotes: '' };
    setActiveOpsSave(leadId);
    setMessage(null);

    try {
      const result = await updateSponsorLeadInboxOps(sponsorSlug, leadId, {
        followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null,
        opsNotes: draft.opsNotes.trim() || null,
      });
      setData((current) =>
        updateLeadInInbox(current, leadId, {
          follow_up_at: result.follow_up_at,
          ops_notes: result.ops_notes,
          ops_updated_at: result.ops_updated_at,
        }),
      );
      setMessage({ type: 'success', text: 'Lead ops note saved.' });
    } catch (updateError) {
      setMessage({ type: 'error', text: `Failed to save lead ops note: ${formatRequestError(updateError)}` });
    } finally {
      setActiveOpsSave(null);
    }
  }

  async function handleContactedTomorrow(lead: SponsorLeadInboxLead) {
    const leadId = String(lead.id || '');
    if (!leadId) {
      return;
    }

    const draft = opsDrafts[leadId] ?? {
      followUpAt: toDateTimeInputValue(lead.follow_up_at),
      opsNotes: String(lead.ops_notes || ''),
    };
    const followUpAt = getTomorrowMorningFollowUpIso();

    setActiveQuickAction(leadId);
    setMessage(null);

    try {
      await updateSponsorLeadInboxStatus(sponsorSlug, leadId, 'contacted');
      setData((current) => updateLeadInInbox(current, leadId, { status: 'contacted' }));

      const result = await updateSponsorLeadInboxOps(sponsorSlug, leadId, {
        followUpAt,
        opsNotes: draft.opsNotes.trim() || null,
      });

      setData((current) =>
        updateLeadInInbox(current, leadId, {
          follow_up_at: result.follow_up_at,
          ops_notes: result.ops_notes,
          ops_updated_at: result.ops_updated_at,
          status: 'contacted',
        }),
      );
      setOpsDrafts((current) => ({
        ...current,
        [leadId]: {
          followUpAt: toDateTimeInputValue(result.follow_up_at),
          opsNotes: String(result.ops_notes || ''),
        },
      }));
      setMessage({ type: 'success', text: 'Lead marked contacted and follow-up set for tomorrow.' });
    } catch (quickActionError) {
      setMessage({ type: 'error', text: `Failed to schedule quick follow-up: ${formatRequestError(quickActionError)}` });
    } finally {
      setActiveQuickAction(null);
    }
  }

  const summaryCards = [
    { label: 'Total leads', value: data?.summary.total ?? 0, color: '#f8fafc' },
    { label: 'Hot leads', value: hotLeadCount, color: '#fb7185' },
    { label: 'Needs action', value: data?.summary.needsAction ?? 0, color: '#fbbf24' },
    { label: 'Package requests', value: packageRequestCount, color: '#34d399' },
    { label: 'Contacted', value: data?.summary.contacted ?? 0, color: '#93c5fd' },
    { label: 'Closed', value: data?.summary.closed ?? 0, color: '#34d399' },
  ];
  const leadFilters: Array<{ count: number; label: string; value: LeadFilter }> = [
    { count: sortedLeads.length, label: 'All leads', value: 'all' },
    { count: hotLeadCount, label: 'Hot leads', value: 'hot-leads' },
    { count: data?.summary.needsAction ?? 0, label: 'Needs action', value: 'needs-action' },
    { count: packageRequestCount, label: 'Package requests', value: 'package-requests' },
  ];
  const accessNotice = getAccessNotice(accessState, error);
  const shouldShowInboxContent = loading || accessState === 'ready' || Boolean(data);

  function handleCsvExport() {
    if (visibleLeads.length === 0) {
      setMessage({ type: 'error', text: 'No visible leads to export.' });
      return;
    }

    const csv = serializeSponsorLeadCsv(visibleLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `expo-sponsor-leads-${sponsorSlug}-${leadFilter}-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: `Exported ${visibleLeads.length} sponsor lead${visibleLeads.length === 1 ? '' : 's'} to CSV.` });
  }

  async function handleCopyLeadSummary(lead: SponsorLeadInboxLead) {
    try {
      await copyTextToClipboard(buildSponsorLeadCopySummary(lead));
      setMessage({ type: 'success', text: 'Lead summary copied.' });
    } catch (copyError) {
      setMessage({ type: 'error', text: `Could not copy lead summary: ${formatRequestError(copyError)}` });
    }
  }

  return (
    <div className="calculator-pro-wrapper" style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 20px', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', marginBottom: '34px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <WarpalaLogo size={46} />
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Expo Sponsor Ops
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.04em' }}>Sponsor Lead Inbox</h1>
          </div>
        </div>
        <a href="/expo-3d?salesDemo=1" className="btn-glass" style={{ textDecoration: 'none' }}>OPEN SALES DEMO</a>
      </header>

      <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {data?.sponsor.slug || sponsorSlug}
            </div>
            <h2 style={{ margin: '8px 0 8px', fontSize: '1.65rem' }}>{data?.sponsor.displayName || 'Sponsor Concierge'}</h2>
            <p style={{ margin: 0, color: '#cbd5e1', maxWidth: '680px', lineHeight: 1.55 }}>
              Real inbound leads captured from the Web3D Expo sponsor flow. Use this page to confirm that sponsor interest is being stored and is ready for follow-up operations.
            </p>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'right' }}>
            Latest inbound<br />
            <strong style={{ color: '#f8fafc' }}>{formatDate(data?.summary.latestInboundAt)}</strong>
          </div>
        </div>
      </section>

      {accessNotice && (
        <section className="glass-card" style={{ padding: '22px', borderRadius: '20px', marginBottom: '24px', border: `1px solid ${accessNotice.accent}73` }}>
          <h2 style={{ marginTop: 0, color: accessNotice.accent }}>{accessNotice.title}</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.55, marginBottom: '10px' }}>{accessNotice.body}</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.55, margin: '0 0 16px' }}>{accessNotice.detail}</p>
          <a href={accessNotice.actionHref} className="btn-glass" style={{ textDecoration: 'none' }}>{accessNotice.actionLabel}</a>
        </section>
      )}

      {message && (
        <section
          className="glass-card"
          style={{
            padding: '16px 18px',
            borderRadius: '18px',
            marginBottom: '24px',
            border: `1px solid ${message.type === 'success' ? 'rgba(52,211,153,0.45)' : 'rgba(248,113,113,0.45)'}`,
            color: message.type === 'success' ? '#bbf7d0' : '#fecaca',
          }}
        >
          {message.text}
        </section>
      )}

      {shouldShowInboxContent && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {summaryCards.map((entry) => (
              <div key={entry.label} className="glass-card" style={{ padding: '18px', borderRadius: '20px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{entry.label}</div>
                <div style={{ color: entry.color, fontSize: '2rem', fontWeight: 950, marginTop: '6px' }}>{loading ? '-' : entry.value}</div>
              </div>
            ))}
          </section>

          <section className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'baseline', marginBottom: '18px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Inbound Sponsor Leads</h2>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {loading ? 'Loading' : `${visibleLeads.length} shown / ${sortedLeads.length} loaded`}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
              {leadFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={leadFilter === filter.value}
                  onClick={() => setLeadFilter(filter.value)}
                  style={{
                    background: leadFilter === filter.value ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.78)',
                    border: `1px solid ${leadFilter === filter.value ? 'rgba(56, 189, 248, 0.68)' : 'rgba(148, 163, 184, 0.22)'}`,
                    borderRadius: '999px',
                    color: leadFilter === filter.value ? '#e0f2fe' : '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    padding: '9px 12px',
                    textTransform: 'uppercase',
                  }}
                >
                  {filter.label} - {filter.count}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
              <button
                type="button"
                disabled={loading || visibleLeads.length === 0}
                onClick={handleCsvExport}
                style={{
                  background: 'rgba(20, 83, 45, 0.64)',
                  border: '1px solid rgba(52, 211, 153, 0.58)',
                  borderRadius: '999px',
                  color: '#bbf7d0',
                  cursor: loading || visibleLeads.length === 0 ? 'default' : 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: 950,
                  letterSpacing: '0.06em',
                  opacity: loading || visibleLeads.length === 0 ? 0.58 : 1,
                  padding: '9px 13px',
                  textTransform: 'uppercase',
                }}
              >
                Export CSV
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>Loading sponsor leads...</div>
            ) : visibleLeads.length === 0 ? (
              <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>No sponsor leads match this filter.</div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {visibleLeads.map((lead) => {
                  const status = normalizeStatus(lead);
                  const leadId = String(lead.id || '');
                  const draft = opsDrafts[leadId] ?? { followUpAt: '', opsNotes: '' };
                  const packageDetails = parseSponsorPackageLeadMessage(lead.message);
                  const packageQualification = packageDetails ? getSponsorPackageLeadQualification(packageDetails) : null;
                  return (
                    <article key={leadId || `${lead.client_email}:${lead.created_at}`} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#f8fafc' }}>{lead.client_name || 'Unnamed lead'}</h3>
                      <div style={{ color: '#93c5fd', fontSize: '0.9rem', marginTop: '4px' }}>{lead.client_email || 'No email provided'}</div>
                    </div>
                    <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ padding: '6px 10px', borderRadius: '999px', color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}66`, background: `${STATUS_COLORS[status]}1f`, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {status}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyLeadSummary(lead)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.82)',
                          border: '1px solid rgba(148, 163, 184, 0.24)',
                          borderRadius: '999px',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          letterSpacing: '0.06em',
                          padding: '7px 10px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Copy summary
                      </button>
                    </div>
                  </div>
                  {packageDetails ? (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.44), rgba(8, 47, 73, 0.4))',
                        border: '1px solid rgba(52, 211, 153, 0.28)',
                        borderRadius: '16px',
                        marginTop: '14px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                        <div style={{ color: '#bbf7d0', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Sponsor package request
                        </div>
                        <span style={{ background: 'rgba(52, 211, 153, 0.14)', border: '1px solid rgba(52, 211, 153, 0.44)', borderRadius: '999px', color: '#bbf7d0', fontSize: '0.7rem', fontWeight: 950, padding: '6px 10px', textTransform: 'uppercase' }}>
                          {packageDetails.packageInterest}
                        </span>
                      </div>
                      {packageQualification && (
                        <div
                          style={{
                            background: 'rgba(2, 6, 23, 0.38)',
                            border: '1px solid rgba(148, 163, 184, 0.16)',
                            borderRadius: '14px',
                            marginTop: '12px',
                            padding: '12px',
                          }}
                        >
                          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <span
                              style={{
                                background: `${LEAD_PRIORITY_COLORS[packageQualification.priority]}24`,
                                border: `1px solid ${LEAD_PRIORITY_COLORS[packageQualification.priority]}66`,
                                borderRadius: '999px',
                                color: LEAD_PRIORITY_COLORS[packageQualification.priority],
                                fontSize: '0.68rem',
                                fontWeight: 950,
                                letterSpacing: '0.08em',
                                padding: '6px 10px',
                                textTransform: 'uppercase',
                              }}
                            >
                              {packageQualification.priorityLabel}
                            </span>
                            <span style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 800 }}>
                              {packageQualification.reason}
                            </span>
                          </div>
                          <div style={{ color: '#e0f2fe', fontSize: '0.86rem', fontWeight: 850, marginTop: '8px' }}>
                            Next action: {packageQualification.nextAction}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: '12px' }}>
                        {[
                          ['Company', packageDetails.company],
                          ['Website', packageDetails.website],
                          ['Budget', packageDetails.budgetSignal],
                          ['Timeline', packageDetails.timeline],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: 'rgba(2, 6, 23, 0.46)', borderRadius: '12px', padding: '10px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                            <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 850, marginTop: '4px', overflowWrap: 'anywhere' }}>{value || 'Not provided'}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ color: '#e2e8f0', lineHeight: 1.55, margin: '12px 0 0' }}>{packageDetails.message}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#cbd5e1', lineHeight: 1.55, margin: '14px 0 0' }}>{lead.message || 'No message provided.'}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '14px', color: '#64748b', fontSize: '0.76rem', flexWrap: 'wrap' }}>
                    <span>{lead.service_name || 'expo_sponsor_lead'}</span>
                    <span>{formatDate(lead.created_at)}</span>
                  </div>
                  {(lead.ops_notes || lead.follow_up_at) && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.16)', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {lead.follow_up_at && <div>Follow-up: {formatDate(lead.follow_up_at)}</div>}
                      {lead.ops_notes && <div>Ops note: {lead.ops_notes}</div>}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                    <button
                      type="button"
                      disabled={!leadId || activeQuickAction === leadId || status === 'closed' || status === 'rejected'}
                      onClick={() => void handleContactedTomorrow(lead)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '999px',
                        border: '1px solid rgba(56, 189, 248, 0.72)',
                        background: 'rgba(14, 116, 144, 0.28)',
                        color: '#bae6fd',
                        cursor: !leadId || status === 'closed' || status === 'rejected' ? 'default' : 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 950,
                        letterSpacing: '0.04em',
                        opacity: !leadId || activeQuickAction === leadId || status === 'closed' || status === 'rejected' ? 0.58 : 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {activeQuickAction === leadId ? 'Scheduling...' : 'Contacted + tomorrow'}
                    </button>
                    {(['pending', 'contacted', 'closed', 'rejected'] as SponsorLeadStatus[]).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={!leadId || activeStatusAction === `${leadId}:${nextStatus}` || status === nextStatus}
                        onClick={() => void handleStatusChange(leadId, nextStatus)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '999px',
                          border: `1px solid ${STATUS_COLORS[nextStatus]}66`,
                          background: status === nextStatus ? `${STATUS_COLORS[nextStatus]}26` : 'rgba(15, 23, 42, 0.88)',
                          color: STATUS_COLORS[nextStatus],
                          cursor: !leadId || status === nextStatus ? 'default' : 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          opacity: !leadId || activeStatusAction === `${leadId}:${nextStatus}` ? 0.58 : 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeStatusAction === `${leadId}:${nextStatus}` ? 'Saving...' : STATUS_LABELS[nextStatus]}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Follow-up ops
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.42fr) 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        Follow-up at
                        <input
                          type="datetime-local"
                          value={draft.followUpAt}
                          onChange={(event) =>
                            setOpsDrafts((current) => ({
                              ...current,
                              [leadId]: {
                                followUpAt: event.target.value,
                                opsNotes: current[leadId]?.opsNotes ?? draft.opsNotes,
                              },
                            }))
                          }
                          style={{ marginTop: '8px' }}
                        />
                      </label>
                      <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        Ops note
                        <input
                          type="text"
                          value={draft.opsNotes}
                          onChange={(event) =>
                            setOpsDrafts((current) => ({
                              ...current,
                              [leadId]: {
                                followUpAt: current[leadId]?.followUpAt ?? draft.followUpAt,
                                opsNotes: event.target.value,
                              },
                            }))
                          }
                          placeholder="Next action, objection, or sponsor follow-up context"
                          style={{ marginTop: '8px' }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!leadId || activeOpsSave === leadId}
                        onClick={() => void handleOpsSave(leadId)}
                        style={{
                          padding: '11px 14px',
                          borderRadius: '999px',
                          border: '1px solid rgba(56, 189, 248, 0.65)',
                          background: 'rgba(8, 47, 73, 0.72)',
                          color: '#e0f2fe',
                          cursor: leadId ? 'pointer' : 'default',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          letterSpacing: '0.06em',
                          opacity: !leadId || activeOpsSave === leadId ? 0.6 : 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeOpsSave === leadId ? 'Saving...' : 'Save Ops'}
                      </button>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '8px' }}>
                      Last ops update: {formatDate(lead.ops_updated_at)}
                    </div>
                  </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
