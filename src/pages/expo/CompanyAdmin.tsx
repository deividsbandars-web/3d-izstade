import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Text, useVideoTexture } from '@react-three/drei';
import { expoDashboardService } from '../../app/expo/expoDashboardService';
import { EXPO_CANONICAL_DISTRICT_CATALOG } from '../../services/expoService';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';

function SafeVideoPreview({ url }: { url: string | null }) {
  try {
    const texture = useVideoTexture(
      url || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
      { crossOrigin: 'Anonymous', loop: true, muted: true },
    );
    return <meshBasicMaterial map={texture} toneMapped={false} />;
  } catch {
    return <meshStandardMaterial color="#111111" />;
  }
}

function BoothPreview({ company, color }: { company: { booth?: { video_url?: string }; name?: string }; color: string }) {
  return (
    <group position={[0, -5, 0]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[22, 0.2, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 8, -7.5]} castShadow>
        <boxGeometry args={[22, 16, 1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 16.5, -7]} castShadow>
        <boxGeometry args={[22, 3, 1.2]} />
        <meshStandardMaterial color={color || '#3b82f6'} />
      </mesh>
      <Text position={[0, 16.5, -6.3]} fontSize={1.5} color="#ffffff">
        {(company.name || 'COMPANY').toUpperCase()}
      </Text>
      <mesh position={[0, 8, -6.9]}>
        <planeGeometry args={[18, 10]} />
        <Suspense fallback={<meshStandardMaterial color="#000000" />}>
          <SafeVideoPreview url={company.booth?.video_url || null} />
        </Suspense>
      </mesh>
    </group>
  );
}

type AdminCompanyState = {
  booth: {
    video_url: string;
  };
  description: string;
  district: string;
  id: string;
  logo_url: string;
  name: string;
};

type ManagedAnalytics = {
  interactions?: number;
  leads_generated?: number;
  visits?: number;
} | null;

type ManagedLead = {
  client_email?: string;
  client_name?: string;
  created_at?: string;
  follow_up_at?: string | null;
  id?: string;
  message?: string | null;
  ops_notes?: string | null;
  ops_updated_at?: string | null;
  service_name?: string | null;
  status?: string | null;
};

type ManagedLeadOpsDraft = {
  followUpAt: string;
  opsNotes: string;
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  closed: 'Closed',
  contacted: 'Contacted',
  pending: 'Pending',
  rejected: 'Rejected',
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  closed: '#34d399',
  contacted: '#93c5fd',
  pending: '#fbbf24',
  rejected: '#f87171',
};

const DEFAULT_COMPANY: AdminCompanyState = {
  booth: { video_url: '' },
  description: '',
  district: EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id ?? '',
  id: '',
  logo_url: '',
  name: 'Warpala',
};

export default function CompanyAdmin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<string[]>([...EXPO_CANONICAL_DISTRICT_CATALOG.map((district) => district.id)]);
  const [managedBooths, setManagedBooths] = useState<Array<{ company_name?: string | null; district?: string | null; id?: string }>>([]);
  const [analytics, setAnalytics] = useState<ManagedAnalytics>(null);
  const [leads, setLeads] = useState<ManagedLead[]>([]);
  const [activeLeadAction, setActiveLeadAction] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<'all' | 'needs_action' | 'pending' | 'contacted' | 'closed' | 'rejected'>('needs_action');
  const [leadOpsDrafts, setLeadOpsDrafts] = useState<Record<string, ManagedLeadOpsDraft>>({});
  const [activeLeadOpsSave, setActiveLeadOpsSave] = useState<string | null>(null);
  const [roomRouteId, setRoomRouteId] = useState('');
  const [company, setCompany] = useState<AdminCompanyState>(DEFAULT_COMPANY);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [districtResult, boothsResult] = await Promise.all([
          expoDashboardService.getDistricts(),
          expoDashboardService.getManagedBooths(),
        ]);

        if (Array.isArray(districtResult.data) && districtResult.data.length > 0) {
          setDistricts(districtResult.data.map((entry) => String(entry)));
        }

        if (boothsResult.data && boothsResult.data.length > 0) {
          setManagedBooths(boothsResult.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
          const first = boothsResult.data[0] as {
            assets_3d?: { video_url?: string };
            company_name?: string;
            contact_info?: { description?: string };
            district?: string;
            id?: string;
            logo_url?: string;
          };
          setCompany({
            booth: {
              video_url: String(first.assets_3d?.video_url || ''),
            },
            description: String(first.contact_info?.description || ''),
            district: String(first.district || EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id || ''),
            id: String(first.id || ''),
            logo_url: String(first.logo_url || ''),
            name: String(first.company_name || 'Warpala'),
          });
          if (first.id) {
            const [analyticsResult, reviewResult] = await Promise.all([
              expoDashboardService.getBoothAnalytics(String(first.id)),
              expoDashboardService.getManagedBoothReview(String(first.id)),
            ]);
            setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
            setLeads((((reviewResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
            setRoomRouteId(String((reviewResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || first.id || ''));
          }
        }
      } catch {
        console.warn('EXPO_ADMIN_INIT_FALLBACK');
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, []);

  useEffect(() => {
    setLeadOpsDrafts((current) => {
      const next = { ...current };
      leads.forEach((lead) => {
        const key = String(lead.id || '');
        if (!key || next[key]) {
          return;
        }

        next[key] = {
          followUpAt: typeof lead.follow_up_at === 'string' && lead.follow_up_at
            ? new Date(lead.follow_up_at).toISOString().slice(0, 16)
            : '',
          opsNotes: String(lead.ops_notes || ''),
        };
      });
      return next;
    });
  }, [leads]);

  async function handleManagedBoothSelect(boothId: string) {
    setLoading(true);
    try {
      const [boothResult, analyticsResult] = await Promise.all([
        expoDashboardService.getManagedBoothReview(boothId),
        expoDashboardService.getBoothAnalytics(boothId),
      ]);

      const booth = (boothResult.data as {
        booth?: {
          assets_3d?: { video_url?: string };
          company_name?: string;
          contact_info?: { description?: string };
          district?: string;
          id?: string;
          logo_url?: string;
        };
      } | null)?.booth;

      if (booth) {
        setCompany({
          booth: {
            video_url: String(booth.assets_3d?.video_url || ''),
          },
          description: String(booth.contact_info?.description || ''),
          district: String(booth.district || EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id || ''),
          id: String(booth.id || boothId),
          logo_url: String(booth.logo_url || ''),
          name: String(booth.company_name || 'Warpala'),
        });
      }

      setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
      setLeads((((boothResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
      setRoomRouteId(String((boothResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || boothId));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!company.name || !company.district) {
      setMessage({ type: 'error', text: 'Please provide a company name and district.' });
      return;
    }

    setLoading(true);
    try {
      const result = await expoDashboardService.saveManagedBooth({
        boothId: company.id || undefined,
        companyName: company.name,
        description: company.description,
        district: company.district,
        videoUrl: company.booth.video_url,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const savedId = String((result.data as { id?: string } | null)?.id || company.id || '');
      setCompany((current) => ({
        ...current,
        id: savedId,
      }));
      if (savedId) {
        const [analyticsResult, reviewResult] = await Promise.all([
          expoDashboardService.getBoothAnalytics(savedId),
          expoDashboardService.getManagedBoothReview(savedId),
        ]);
        setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
        setLeads((((reviewResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
        setRoomRouteId(String((reviewResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || savedId));
        const refreshedBooths = await expoDashboardService.getManagedBooths();
        if (refreshedBooths.data) {
          setManagedBooths(refreshedBooths.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
        }
      }
      setMessage({ type: 'success', text: 'Booth configuration saved through Expo API.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save booth configuration.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleLeadStatusChange(leadId: string, nextStatus: 'pending' | 'contacted' | 'closed' | 'rejected') {
    if (!company.id || !leadId) {
      return;
    }

    setActiveLeadAction(`${leadId}:${nextStatus}`);
    setMessage(null);

    try {
      const result = await expoDashboardService.updateManagedLeadStatus(company.id, leadId, nextStatus);
      if (result.error) {
        throw new Error(result.error);
      }

      setLeads((current) =>
        current.map((entry) => (String(entry.id || '') === leadId ? { ...entry, status: nextStatus } : entry)),
      );
      setMessage({ type: 'success', text: `Lead moved to ${LEAD_STATUS_LABELS[nextStatus].toLowerCase()}.` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update lead status.' });
    } finally {
      setActiveLeadAction(null);
    }
  }

  async function handleLeadOpsSave(leadId: string) {
    if (!company.id || !leadId) {
      return;
    }

    const draft = leadOpsDrafts[leadId] ?? { followUpAt: '', opsNotes: '' };
    setActiveLeadOpsSave(leadId);
    setMessage(null);

    try {
      const result = await expoDashboardService.updateManagedLeadOps(company.id, leadId, {
        followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null,
        opsNotes: draft.opsNotes.trim() || null,
      });
      if (result.error) {
        throw new Error(result.error);
      }

      const saved = result.data as { follow_up_at?: string | null; ops_notes?: string | null; updated_at?: string | null } | null;
      setLeads((current) =>
        current.map((entry) =>
          String(entry.id || '') === leadId
            ? {
                ...entry,
                follow_up_at: saved?.follow_up_at ?? null,
                ops_notes: saved?.ops_notes ?? null,
                ops_updated_at: saved?.updated_at ?? null,
              }
            : entry,
        ),
      );
      setMessage({ type: 'success', text: 'Lead ops note saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save lead ops note.' });
    } finally {
      setActiveLeadOpsSave(null);
    }
  }

  const selectedDistrictColor =
    EXPO_CANONICAL_DISTRICT_CATALOG.find((district) => district.id === company.district)?.color || '#3b82f6';
  const leadStatusCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const sortedLeads = [...leads].sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')));
  const leadsNeedingAction = sortedLeads.filter((lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    return status === 'pending' || status === 'contacted';
  });
  const visibleLeads = sortedLeads.filter((lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    if (leadFilter === 'all') {
      return true;
    }

    if (leadFilter === 'needs_action') {
      return status === 'pending' || status === 'contacted';
    }

    return status === leadFilter;
  });
  const latestLeadTimestamp = sortedLeads[0]?.created_at
    ? new Date(String(sortedLeads[0].created_at)).toLocaleString()
    : 'No inbound activity yet';

  return (
    <div className="calculator-pro-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
        <WarpalaLogo size={50} />
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => nav('/expo/sponsor-leads?sponsor=sponsor-concierge')} className="btn-glass">SPONSOR LEADS</button>
          <button onClick={() => nav('/expo-3d?operator=1')} className="btn-glass">OPEN 3D OPERATOR</button>
          <button onClick={() => nav('/dashboard')} className="btn-glass">DASHBOARD</button>
        </div>
      </div>

      <div className="calc-header">
        <h1 className="text-accent" style={{ fontSize: '3rem' }}>EXPO ADMIN</h1>
        <p>Manage booth identity, district placement, and preview the presentation surface through the unified Expo API.</p>
      </div>

      {message && (
        <div
          className="glass-card"
          style={{
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '30px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="calc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="calc-form-column">
          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Managed Booths</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {managedBooths.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>No managed booths loaded for this user yet.</div>
              ) : managedBooths.map((booth) => (
                <button
                  key={String(booth.id)}
                  type="button"
                  onClick={() => void handleManagedBoothSelect(String(booth.id || ''))}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${company.id === String(booth.id || '') ? selectedDistrictColor : '#334155'}`,
                    background: company.id === String(booth.id || '') ? 'rgba(15, 23, 42, 0.86)' : 'rgba(2, 6, 23, 0.72)',
                    color: '#f8fafc',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{booth.company_name || 'Managed Booth'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{String(booth.district || 'unassigned').toUpperCase()}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="calc-section">
            <h2>Company Booth Profile</h2>
            <div className="input-group">
              <label>
                Company name
                <input
                  type="text"
                  placeholder="Warpala"
                  value={company.name}
                  onChange={(event) => setCompany({ ...company, name: event.target.value })}
                />
              </label>

              <label style={{ marginTop: '20px' }}>
                District
                <select
                  value={company.district}
                  onChange={(event) => setCompany({ ...company, district: event.target.value })}
                >
                  <option value="">-- Select district --</option>
                  {districts.map((districtId) => {
                    const district = EXPO_CANONICAL_DISTRICT_CATALOG.find((entry) => entry.id === districtId);
                    return (
                      <option key={districtId} value={districtId}>
                        {district?.name || districtId}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Description
                <textarea
                  placeholder="Short company message for the admin-managed booth."
                  value={company.description}
                  onChange={(event) => setCompany({ ...company, description: event.target.value })}
                  style={{ height: '120px' }}
                />
              </label>
            </div>
          </section>

          <section className="calc-section" style={{ marginTop: '25px' }}>
            <h2>Presentation Media</h2>
            <div className="input-group">
              <label>
                Video URL
                <input
                  type="text"
                  placeholder="https://example.com/presentation.mp4"
                  value={company.booth.video_url}
                  onChange={(event) =>
                    setCompany({
                      ...company,
                      booth: { ...company.booth, video_url: event.target.value },
                    })}
                />
              </label>
            </div>

            <div style={{ marginTop: '30px' }}>
              <button onClick={() => void handleSave()} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
                {loading ? 'SAVING...' : 'SAVE THROUGH EXPO API'}
              </button>
            </div>
          </section>
        </div>

        <div className="calc-results-column">
          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Operational Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {[
                { label: 'Visits', value: analytics?.visits ?? 0, color: '#f8fafc' },
                { label: 'Interactions', value: analytics?.interactions ?? 0, color: '#93c5fd' },
                { label: 'Leads', value: analytics?.leads_generated ?? 0, color: '#34d399' },
              ].map((entry) => (
                <div key={entry.label} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: entry.color }}>{entry.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button type="button" onClick={() => roomRouteId && nav(`/expo/booth/${roomRouteId}`)} className="btn-glass" disabled={!roomRouteId}>
                OPEN BOOTH ROOM
              </button>
              <button type="button" onClick={() => company.id && nav(`/expo-3d?operator=1&focus=${encodeURIComponent(company.id)}`)} className="btn-glass" disabled={!company.id}>
                FOCUS IN 3D
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
              {([
                { id: 'pending', label: 'Pending', color: LEAD_STATUS_COLORS.pending },
                { id: 'contacted', label: 'Contacted', color: LEAD_STATUS_COLORS.contacted },
                { id: 'closed', label: 'Closed', color: LEAD_STATUS_COLORS.closed },
                { id: 'rejected', label: 'Rejected', color: LEAD_STATUS_COLORS.rejected },
              ] as const).map((entry) => (
                <div key={entry.id} style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: entry.color }}>{leadStatusCounts[entry.id] ?? 0}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '18px', padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lead Ops Queue</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, color: '#f8fafc' }}>{leadsNeedingAction.length} leads need action</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latest inbound: {latestLeadTimestamp}</div>
              </div>
            </div>
          </section>

          <section className="calc-section" style={{ padding: 0, overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ padding: '25px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>3D Booth Preview</h2>
            <div style={{ flex: 1, background: '#000', position: 'relative' }}>
              <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="city" />
                <BoothPreview company={company} color={selectedDistrictColor} />
                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} />
              </Canvas>
              <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                Drag to inspect the managed booth composition.
              </div>
            </div>
          </section>

          <section className="calc-section" style={{ marginTop: '25px' }}>
            <h2>Incoming Leads</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {([
                { id: 'needs_action', label: 'Needs Action' },
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'closed', label: 'Closed' },
                { id: 'rejected', label: 'Rejected' },
              ] as const).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setLeadFilter(entry.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    border: `1px solid ${leadFilter === entry.id ? selectedDistrictColor : '#334155'}`,
                    background: leadFilter === entry.id ? `${selectedDistrictColor}22` : 'rgba(15, 23, 42, 0.92)',
                    color: leadFilter === entry.id ? '#f8fafc' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {visibleLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>INBOX</div>
                  <p>{leads.length === 0 ? 'No managed sponsor leads found for this booth yet.' : 'No leads match the current lead ops filter.'}</p>
                </div>
              ) : visibleLeads.map((lead) => {
                const leadKey = String(lead.id || `${lead.client_email}:${lead.created_at}`);
                const draft = leadOpsDrafts[leadKey] ?? { followUpAt: '', opsNotes: '' };
                return (
                <div key={leadKey} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc' }}>{lead.client_name || 'Unnamed lead'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lead.created_at ? new Date(lead.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      marginTop: '10px',
                      borderRadius: '999px',
                      background: `${LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24'}1a`,
                      border: `1px solid ${LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24'}55`,
                      color: LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {LEAD_STATUS_LABELS[String(lead.status || 'pending').toLowerCase()] || 'Pending'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#93c5fd', marginTop: '4px' }}>{lead.client_email || 'No email provided'}</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '10px', lineHeight: 1.5 }}>{lead.message || 'No message provided.'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {String(lead.service_name || 'expo_sponsor_lead')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                    {(['pending', 'contacted', 'closed', 'rejected'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={!lead.id || activeLeadAction === `${String(lead.id)}:${status}` || String(lead.status || 'pending').toLowerCase() === status}
                        onClick={() => lead.id && void handleLeadStatusChange(String(lead.id), status)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '999px',
                          border: `1px solid ${LEAD_STATUS_COLORS[status]}55`,
                          background: String(lead.status || 'pending').toLowerCase() === status ? `${LEAD_STATUS_COLORS[status]}22` : 'rgba(15, 23, 42, 0.92)',
                          color: LEAD_STATUS_COLORS[status],
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          opacity: !lead.id || activeLeadAction === `${String(lead.id)}:${status}` ? 0.6 : 1,
                        }}
                      >
                        {activeLeadAction === `${String(lead.id)}:${status}` ? 'Saving...' : LEAD_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                      Lead Ops Note
                    </div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8' }}>
                      Follow-up at
                      <input
                        type="datetime-local"
                        value={draft.followUpAt}
                        onChange={(event) =>
                          setLeadOpsDrafts((current) => ({
                            ...current,
                            [leadKey]: {
                              followUpAt: event.target.value,
                              opsNotes: current[leadKey]?.opsNotes ?? draft.opsNotes,
                            },
                          }))
                        }
                        style={{ marginTop: '8px' }}
                      />
                    </label>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginTop: '12px' }}>
                      Ops note
                      <textarea
                        value={draft.opsNotes}
                        onChange={(event) =>
                          setLeadOpsDrafts((current) => ({
                            ...current,
                            [leadKey]: {
                              followUpAt: current[leadKey]?.followUpAt ?? draft.followUpAt,
                              opsNotes: event.target.value,
                            },
                          }))
                        }
                        style={{ height: '90px', marginTop: '8px' }}
                        placeholder="Next step, outreach summary, objections, or follow-up context."
                      />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Last ops update: {lead.ops_updated_at ? new Date(lead.ops_updated_at).toLocaleString() : 'none'}
                      </div>
                      <button
                        type="button"
                        onClick={() => lead.id && void handleLeadOpsSave(String(lead.id))}
                        disabled={!lead.id || activeLeadOpsSave === String(lead.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '999px',
                          border: `1px solid ${selectedDistrictColor}`,
                          background: `${selectedDistrictColor}22`,
                          color: '#f8fafc',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          opacity: !lead.id || activeLeadOpsSave === String(lead.id) ? 0.6 : 1,
                        }}
                      >
                        {activeLeadOpsSave === String(lead.id) ? 'Saving...' : 'Save Ops'}
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
