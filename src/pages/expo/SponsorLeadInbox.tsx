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

export default function SponsorLeadInbox() {
  const [searchParams] = useSearchParams();
  const sponsorSlug = searchParams.get('sponsor') || 'sponsor-concierge';
  const [data, setData] = useState<SponsorLeadInboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeStatusAction, setActiveStatusAction] = useState<string | null>(null);
  const [activeOpsSave, setActiveOpsSave] = useState<string | null>(null);
  const [opsDrafts, setOpsDrafts] = useState<Record<string, { followUpAt: string; opsNotes: string }>>({});

  const loadInbox = useCallback(async (cancelled: () => boolean) => {
      setLoading(true);
      setError(null);

      try {
        const response = await getSponsorLeadInbox(sponsorSlug);
        if (!cancelled()) {
          setData(response);
        }
      } catch (requestError) {
        if (!cancelled()) {
          setError(String(requestError));
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
      setMessage({ type: 'error', text: `Failed to update lead status: ${String(updateError)}` });
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
      setMessage({ type: 'error', text: `Failed to save lead ops note: ${String(updateError)}` });
    } finally {
      setActiveOpsSave(null);
    }
  }

  const summaryCards = [
    { label: 'Total leads', value: data?.summary.total ?? 0, color: '#f8fafc' },
    { label: 'Needs action', value: data?.summary.needsAction ?? 0, color: '#fbbf24' },
    { label: 'Contacted', value: data?.summary.contacted ?? 0, color: '#93c5fd' },
    { label: 'Closed', value: data?.summary.closed ?? 0, color: '#34d399' },
  ];

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

      {error && (
        <section className="glass-card" style={{ padding: '22px', borderRadius: '20px', marginBottom: '24px', border: '1px solid rgba(248,113,113,0.45)' }}>
          <h2 style={{ marginTop: 0, color: '#f87171' }}>Inbox unavailable</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.55 }}>
            The lead inbox endpoint requires the staging/backend API and an authenticated Supabase session. Current error: {error}
          </p>
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

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
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
            {loading ? 'Loading' : `${sortedLeads.length} loaded`}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>Loading sponsor leads...</div>
        ) : sortedLeads.length === 0 ? (
          <div style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>No sponsor leads found yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {sortedLeads.map((lead) => {
              const status = normalizeStatus(lead);
              const leadId = String(lead.id || '');
              const draft = opsDrafts[leadId] ?? { followUpAt: '', opsNotes: '' };
              return (
                <article key={leadId || `${lead.client_email}:${lead.created_at}`} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#f8fafc' }}>{lead.client_name || 'Unnamed lead'}</h3>
                      <div style={{ color: '#93c5fd', fontSize: '0.9rem', marginTop: '4px' }}>{lead.client_email || 'No email provided'}</div>
                    </div>
                    <span style={{ padding: '6px 10px', borderRadius: '999px', color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}66`, background: `${STATUS_COLORS[status]}1f`, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {status}
                    </span>
                  </div>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.55, margin: '14px 0 0' }}>{lead.message || 'No message provided.'}</p>
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
    </div>
  );
}
