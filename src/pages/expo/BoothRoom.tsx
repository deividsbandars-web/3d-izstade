import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFrontendRuntimeEnv } from '../../config/runtimeEnv';
import {
  trackExpoBookingClicked,
  trackExpoBoothViewed,
  trackExpoDemoRoomEntered,
  trackExpoWebsiteOpened,
} from '../../modules/expo/lib/expoAnalytics';
import { loadExpoSceneForRelease } from '../../modules/expo/lib/sceneDataSource';
import { buildSponsorRoomActions, resolveSponsorRoomRecord, type SponsorRoomRecord } from '../../modules/expo/lib/sponsorRoom';
import type { ExpoSceneData } from '../../modules/expo/types/scene';

type RoomState =
  | { status: 'loading' }
  | { status: 'ready'; record: SponsorRoomRecord; scene: ExpoSceneData }
  | { status: 'missing' };

type LeadFormState = {
  clientEmail: string;
  clientName: string;
  message: string;
};

function roomShellStyle(color: string) {
  return {
    '--room-accent': color,
    '--room-accent-soft': `${color}22`,
  } as CSSProperties;
}

function normalizeLeadForm(data: LeadFormState) {
  return {
    clientEmail: data.clientEmail.trim(),
    clientName: data.clientName.trim(),
    message: data.message.trim(),
  };
}

async function submitSponsorLead(record: SponsorRoomRecord, formData: LeadFormState) {
  const runtimeEnv = getFrontendRuntimeEnv();
  const payload = {
    clientEmail: formData.clientEmail,
    clientName: formData.clientName,
    companyId: record.company.id,
    companySlug: record.company.slug,
    message: formData.message,
    sourcePath: `/expo/booth/${record.slugOrId}`,
  };

  const response = await fetch(`${runtimeEnv.apiBaseUrl}/api/expo/lead`, {
    body: JSON.stringify(payload),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`EXPO_LEAD_HTTP_${response.status}`);
  }
}

export default function BoothRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<RoomState>({ status: 'loading' });
  const [leadForm, setLeadForm] = useState<LeadFormState>({ clientEmail: '', clientName: '', message: '' });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    let isActive = true;

    async function loadRoom() {
      const scene = await loadExpoSceneForRelease();
      const record = resolveSponsorRoomRecord(scene, id);

      if (!isActive) {
        return;
      }

      if (!record) {
        setState({ status: 'missing' });
        return;
      }

      setState({ status: 'ready', record, scene });
      trackExpoBoothViewed(record.company, {
        boothId: record.boothId,
        sectorName: record.sectorName,
        source: 'sponsor_room',
      });
      trackExpoDemoRoomEntered(record.company, {
        boothId: record.boothId,
        sectorName: record.sectorName,
        source: 'sponsor_room',
      });
    }

    loadRoom().catch(() => {
      if (isActive) {
        setState({ status: 'missing' });
      }
    });

    return () => {
      isActive = false;
    };
  }, [id]);

  const actions = useMemo(() => {
    if (state.status !== 'ready') {
      return null;
    }

    return buildSponsorRoomActions(state.record);
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#08111c', color: '#f8fafc' }}>
        Loading sponsor room...
      </div>
    );
  }

  if (state.status === 'missing') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#08111c', color: '#f8fafc', padding: '32px' }}>
        <div style={{ maxWidth: '560px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.82rem' }}>Sponsor Room Unavailable</p>
          <h1 style={{ margin: '12px 0 16px', fontSize: '2.2rem' }}>This sponsor room is not available in the current release scene.</h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>Return to the sponsor boulevard and continue through the canonical release route.</p>
          <Link to="/expo-3d" style={{ display: 'inline-block', marginTop: '24px', padding: '14px 20px', background: '#2563eb', color: '#f8fafc', borderRadius: '999px', textDecoration: 'none', fontWeight: 700 }}>
            Back to Sponsor Boulevard
          </Link>
        </div>
      </div>
    );
  }

  const { record } = state;
  const accent = record.company.sponsorTier === 'hero'
    ? '#22c55e'
    : record.company.sponsorTier === 'gold'
      ? '#f59e0b'
      : '#38bdf8';
  const brochureUrl = actions?.brochureAction?.intent.target ?? null;

  async function handleExternalClick(kind: 'website' | 'booking' | 'brochure', target: string) {
    if (kind === 'website') {
      trackExpoWebsiteOpened(record.company, { boothId: record.boothId, source: 'sponsor_room', websiteUrl: target });
    } else if (kind === 'booking') {
      trackExpoBookingClicked(record.company, { boothId: record.boothId, source: 'sponsor_room', bookingUrl: target });
    } else {
      trackExpoBoothViewed(record.company, { boothId: record.boothId, source: 'sponsor_room_brochure', brochureUrl: target });
    }

    window.open(target, '_blank', 'noopener,noreferrer');
  }

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeLeadForm(leadForm);
    if (!normalized.clientName || !normalized.clientEmail) {
      setLeadStatus('error');
      return;
    }

    try {
      setLeadStatus('submitting');
      await submitSponsorLead(record, normalized);
      setLeadForm({ clientEmail: '', clientName: '', message: '' });
      setLeadStatus('success');
      trackExpoBoothViewed(record.company, {
        boothId: record.boothId,
        source: 'sponsor_room_lead_submitted',
      });
    } catch {
      setLeadStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #142131 0%, #08111c 48%, #04070b 100%)', color: '#f8fafc', ...roomShellStyle(accent) }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.78rem' }}>Canonical Sponsor Room</p>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2.1rem, 4vw, 3.4rem)', lineHeight: 1.05 }}>{record.company.name}</h1>
            <p style={{ margin: 0, color: '#cbd5e1', maxWidth: '760px', fontSize: '1rem', lineHeight: 1.7 }}>
              {record.company.tagline || 'Meet the sponsor team, review the offer, and continue through the release-ready expo path.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/expo-3d" style={{ padding: '12px 18px', borderRadius: '999px', border: '1px solid #334155', textDecoration: 'none', color: '#f8fafc', fontWeight: 700 }}>
              Back to Boulevard
            </Link>
            <button
              type="button"
              onClick={() => navigate(`/expo-3d?focus=${encodeURIComponent(record.slugOrId)}`)}
              style={{ padding: '12px 18px', borderRadius: '999px', border: 'none', background: accent, color: '#08111c', fontWeight: 800, cursor: 'pointer' }}
            >
              Return to Booth
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 0.75fr)', gap: '24px' }}>
          <section style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '18px', padding: '28px', borderRadius: '28px', background: 'linear-gradient(180deg, rgba(8,17,28,0.9), rgba(7,12,20,0.82))', border: '1px solid #1e293b', boxShadow: '0 24px 80px rgba(0,0,0,0.28)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '8px 12px', borderRadius: '999px', background: `${accent}22`, color: accent, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  {record.company.sponsorTier}
                </span>
                {record.sectorName && (
                  <span style={{ padding: '8px 12px', borderRadius: '999px', background: '#0f172a', color: '#cbd5e1', fontWeight: 700, fontSize: '0.82rem' }}>
                    {record.sectorName}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: brochureUrl ? 'minmax(0, 1.15fr) minmax(260px, 0.85fr)' : '1fr', gap: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 14px', fontSize: '1.15rem' }}>Sponsor Overview</h2>
                  <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
                    {record.company.tagline || 'This sponsor room exposes the release-ready sponsor details from the canonical expo scene contract without legacy room fallbacks.'}
                  </p>
                  <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '16px', borderRadius: '18px', background: '#0b1421', border: '1px solid #1e293b' }}>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Company Slug</div>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>{record.company.slug || record.company.id}</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '18px', background: '#0b1421', border: '1px solid #1e293b' }}>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Release Path</div>
                      <div style={{ marginTop: '8px', fontWeight: 700 }}>{record.presentation.demoRoomPath}</div>
                    </div>
                  </div>
                </div>
                {brochureUrl && (
                  <button
                    type="button"
                    onClick={() => handleExternalClick('brochure', brochureUrl)}
                    style={{ display: 'grid', placeItems: 'center', minHeight: '260px', padding: '20px', borderRadius: '24px', background: `linear-gradient(145deg, ${accent}22, rgba(15,23,42,0.82))`, border: `1px solid ${accent}66`, color: '#f8fafc', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.8rem', fontWeight: 800 }}>Brochure Asset</div>
                      <div style={{ marginTop: '10px', fontSize: '1.45rem', fontWeight: 800 }}>Open Sponsor Brochure</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '28px', borderRadius: '28px', background: 'linear-gradient(180deg, rgba(8,17,28,0.92), rgba(7,12,20,0.82))', border: '1px solid #1e293b' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1.12rem' }}>Sponsor Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {actions?.primaryActions.map(({ action, intent }) => (
                  <button
                    key={action.kind}
                    type="button"
                    onClick={() => {
                      if (intent.type === 'navigate') {
                        navigate(intent.target);
                        return;
                      }
                      void handleExternalClick(action.kind === 'booking' ? 'booking' : 'website', intent.target);
                    }}
                    style={{ padding: '18px 20px', borderRadius: '22px', border: `1px solid ${accent}44`, background: '#0b1421', color: '#f8fafc', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ color: accent, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>{action.kind.replace('_', ' ')}</div>
                    <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800 }}>{action.label}</div>
                  </button>
                ))}
                {brochureUrl && (
                  <button
                    type="button"
                    onClick={() => handleExternalClick('brochure', brochureUrl)}
                    style={{ padding: '18px 20px', borderRadius: '22px', border: `1px solid ${accent}44`, background: '#0b1421', color: '#f8fafc', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ color: accent, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>brochure</div>
                    <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800 }}>Review Sponsor Materials</div>
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside style={{ padding: '28px', borderRadius: '28px', background: 'linear-gradient(180deg, rgba(8,17,28,0.96), rgba(7,12,20,0.88))', border: '1px solid #1e293b', alignSelf: 'start', position: 'sticky', top: '24px' }}>
            <p style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.78rem' }}>Lead Capture</p>
            <h2 style={{ margin: '10px 0 12px', fontSize: '1.5rem' }}>Request sponsor follow-up</h2>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.65 }}>This form captures a clean sponsor lead through the public release backend without direct client-side table access.</p>
            <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
              <input
                type="text"
                placeholder="Your name"
                value={leadForm.clientName}
                onChange={(event) => setLeadForm((current) => ({ ...current, clientName: event.target.value }))}
                style={{ padding: '14px 16px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={leadForm.clientEmail}
                onChange={(event) => setLeadForm((current) => ({ ...current, clientEmail: event.target.value }))}
                style={{ padding: '14px 16px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc' }}
              />
              <textarea
                rows={5}
                placeholder="Project scope, meeting request, or sponsor question"
                value={leadForm.message}
                onChange={(event) => setLeadForm((current) => ({ ...current, message: event.target.value }))}
                style={{ padding: '14px 16px', borderRadius: '16px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', resize: 'vertical' }}
              />
              <button
                type="submit"
                disabled={leadStatus === 'submitting'}
                style={{ padding: '15px 18px', borderRadius: '18px', border: 'none', background: accent, color: '#08111c', fontWeight: 800, cursor: 'pointer' }}
              >
                {leadStatus === 'submitting' ? 'Sending...' : 'Send Sponsor Request'}
              </button>
            </form>
            {leadStatus === 'success' && <p style={{ marginTop: '14px', color: '#4ade80' }}>Sponsor request sent successfully.</p>}
            {leadStatus === 'error' && <p style={{ marginTop: '14px', color: '#fca5a5' }}>Please complete the required fields and try again.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
