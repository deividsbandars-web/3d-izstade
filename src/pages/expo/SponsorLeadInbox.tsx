import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';
import {
  getSponsorLeadInbox,
  type SponsorLeadInboxLead,
  type SponsorLeadInboxResponse,
} from '../../app/expo/sponsorLeadInboxService';

const STATUS_COLORS: Record<string, string> = {
  closed: '#34d399',
  contacted: '#93c5fd',
  pending: '#fbbf24',
  rejected: '#f87171',
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

export default function SponsorLeadInbox() {
  const [searchParams] = useSearchParams();
  const sponsorSlug = searchParams.get('sponsor') || 'sponsor-concierge';
  const [data, setData] = useState<SponsorLeadInboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInbox() {
      setLoading(true);
      setError(null);

      try {
        const response = await getSponsorLeadInbox(sponsorSlug);
        if (!cancelled) {
          setData(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(String(requestError));
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInbox();

    return () => {
      cancelled = true;
    };
  }, [sponsorSlug]);

  const sortedLeads = useMemo(() => {
    return [...(data?.leads ?? [])].sort((left, right) =>
      String(right.created_at || '').localeCompare(String(left.created_at || '')),
    );
  }, [data]);

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
              return (
                <article key={String(lead.id || `${lead.client_email}:${lead.created_at}`)} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
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
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
