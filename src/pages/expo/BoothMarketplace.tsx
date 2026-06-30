import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  getBoothSlotAvailability,
  reserveBoothSlot,
  type BoothSlotAvailabilityRecord,
  type BoothSlotBand,
  type BoothSlotKind,
  type BoothSlotLane,
} from '../../app/expo/boothSlotAvailability';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';

type SlotFilter = 'all' | BoothSlotKind;

const BAND_LABELS: Record<BoothSlotBand, string> = {
  arrival: 'Arrival',
  showcase: 'Showcase',
  media: 'Media',
  discovery: 'Discovery',
};

const LANE_LABELS: Record<BoothSlotLane, string> = {
  center: 'Center',
  left: 'Left',
  right: 'Right',
};

const KIND_LABELS: Record<BoothSlotKind, string> = {
  endcap: 'Elite endcap',
  hero: 'Hero',
  standard: 'Standard',
};

const TIER_COLORS: Record<BoothSlotAvailabilityRecord['tier'], string> = {
  common: '#38bdf8',
  elite: '#34d399',
  hero: '#f59e0b',
  premium: '#a78bfa',
};

const pageStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #030712 0%, #07111f 48%, #020617 100%)',
  color: '#f8fafc',
  minHeight: '100vh',
  padding: '28px 18px 56px',
};

const inputStyle: CSSProperties = {
  background: 'rgba(2, 6, 23, 0.82)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '10px',
  color: '#f8fafc',
  font: 'inherit',
  minHeight: '44px',
  padding: '10px 12px',
  width: '100%',
};

const panelStyle: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '8px',
};

function getStatusLabel(slot: BoothSlotAvailabilityRecord) {
  if (slot.status === 'available') {
    return 'Available';
  }
  if (slot.status === 'assigned') {
    return 'Sold';
  }
  return 'Held';
}

function groupSlots(slots: BoothSlotAvailabilityRecord[]) {
  const groups = new Map<string, BoothSlotAvailabilityRecord[]>();
  slots.forEach((slot) => {
    const key = `${slot.band}:${slot.lane}`;
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  });

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export default function BoothMarketplace() {
  const [slots, setSlots] = useState<BoothSlotAvailabilityRecord[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bandFilter, setBandFilter] = useState<'all' | BoothSlotBand>('all');
  const [kindFilter, setKindFilter] = useState<SlotFilter>('all');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<{ tone: 'error' | 'idle' | 'loading' | 'success'; text: string }>({
    text: 'Choose a slot, add company details, and continue to Stripe Checkout.',
    tone: 'idle',
  });
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus({ text: 'Loading booth slot availability...', tone: 'loading' });

    getBoothSlotAvailability()
      .then((response) => {
        if (!active) {
          return;
        }
        setSlots(response.slots);
        setSelectedSlotId((current) => current ?? response.slots.find((slot) => slot.status === 'available')?.slotId ?? response.slots[0]?.slotId ?? null);
        setStatus({ text: 'Availability loaded. Prices are server-authored and checkout-ready.', tone: 'success' });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setStatus({ text: `Could not load slot availability: ${error instanceof Error ? error.message : String(error)}`, tone: 'error' });
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleSlots = useMemo(() => slots.filter((slot) => {
    if (bandFilter !== 'all' && slot.band !== bandFilter) {
      return false;
    }
    if (kindFilter !== 'all' && slot.kind !== kindFilter) {
      return false;
    }
    return true;
  }), [bandFilter, kindFilter, slots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.slotId === selectedSlotId) ?? null,
    [selectedSlotId, slots],
  );
  const groupedSlots = useMemo(() => groupSlots(visibleSlots), [visibleSlots]);

  async function handleReserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) {
      setStatus({ text: 'Select a booth slot first.', tone: 'error' });
      return;
    }
    if (selectedSlot.status !== 'available') {
      setStatus({ text: 'This slot is no longer available. Pick another slot.', tone: 'error' });
      return;
    }
    if (!companyName.trim()) {
      setStatus({ text: 'Company name is required before checkout.', tone: 'error' });
      return;
    }

    setIsReserving(true);
    setStatus({ text: 'Creating a 15 minute hold and Stripe checkout session...', tone: 'loading' });

    try {
      const response = await reserveBoothSlot(selectedSlot.slotId, {
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        metadata: {
          sourcePath: typeof window !== 'undefined' ? window.location.pathname : '/expo/booth-marketplace',
        },
        website: website.trim() || undefined,
      });

      if (response.checkout.url) {
        window.location.assign(response.checkout.url);
        return;
      }

      setStatus({ text: 'Reservation created, but checkout URL was missing. Contact the sponsor team.', tone: 'error' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({
        text: message.includes('401') ? 'Sign in before reserving a booth slot.' : `Reservation failed: ${message}`,
        tone: 'error',
      });
    } finally {
      setIsReserving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ margin: '0 auto', maxWidth: '1220px' }}>
        <header style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
            <WarpalaLogo size={44} />
            <div>
              <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Web3D Expo Slot Marketplace
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.9rem)', letterSpacing: '-0.025em', lineHeight: 1, margin: '4px 0 0' }}>
                Pick a sponsor booth slot.
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link className="btn-glass" style={{ minHeight: 44, textDecoration: 'none' }} to="/expo-3d?salesDemo=1">
              Open 3D demo
            </Link>
            <Link className="btn-glass" style={{ minHeight: 44, textDecoration: 'none' }} to="/expo/sponsor-packages">
              Compare packages
            </Link>
          </div>
        </header>

        <section style={{ ...panelStyle, marginBottom: '16px', padding: '14px' }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
            <p style={{ color: status.tone === 'error' ? '#fecaca' : status.tone === 'success' ? '#bbf7d0' : '#cbd5e1', fontWeight: 760, margin: 0 }}>
              {status.text}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(['all', 'arrival', 'showcase', 'media', 'discovery'] as const).map((band) => (
                <button
                  key={band}
                  onClick={() => setBandFilter(band)}
                  style={{
                    background: bandFilter === band ? '#38bdf8' : 'rgba(15, 23, 42, 0.86)',
                    border: '1px solid rgba(148, 163, 184, 0.26)',
                    borderRadius: '8px',
                    color: bandFilter === band ? '#020617' : '#e2e8f0',
                    cursor: 'pointer',
                    fontWeight: 850,
                    minHeight: 44,
                    padding: '9px 12px',
                  }}
                  type="button"
                >
                  {band === 'all' ? 'All zones' : BAND_LABELS[band]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
          <section style={{ ...panelStyle, overflow: 'hidden' }}>
            <div style={{ alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.16)', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', padding: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.08rem', margin: 0 }}>Available booth map</h2>
                <p style={{ color: '#94a3b8', margin: '5px 0 0' }}>{visibleSlots.length} slots in current filter</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['all', 'standard', 'endcap', 'hero'] as const).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setKindFilter(kind)}
                    style={{
                      background: kindFilter === kind ? '#f8fafc' : 'rgba(2, 6, 23, 0.72)',
                      border: '1px solid rgba(148, 163, 184, 0.24)',
                      borderRadius: '8px',
                      color: kindFilter === kind ? '#020617' : '#cbd5e1',
                      cursor: 'pointer',
                      fontWeight: 850,
                      minHeight: 44,
                      padding: '9px 12px',
                    }}
                    type="button"
                  >
                    {kind === 'all' ? 'All types' : KIND_LABELS[kind]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', padding: '16px' }}>
              {groupedSlots.map(([groupKey, groupSlotsForLane]) => {
                const [band, lane] = groupKey.split(':') as [BoothSlotBand, BoothSlotLane];
                return (
                  <div key={groupKey}>
                    <div style={{ color: '#bfdbfe', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>
                      {BAND_LABELS[band]} / {LANE_LABELS[lane]}
                    </div>
                    <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      {groupSlotsForLane.map((slot) => {
                        const accent = TIER_COLORS[slot.tier];
                        const selected = slot.slotId === selectedSlotId;
                        return (
                          <button
                            aria-pressed={selected}
                            disabled={slot.status !== 'available' && !selected}
                            key={slot.slotId}
                            onClick={() => setSelectedSlotId(slot.slotId)}
                            style={{
                              background: selected ? `${accent}26` : 'rgba(2, 6, 23, 0.58)',
                              border: `1px solid ${selected ? accent : 'rgba(148, 163, 184, 0.18)'}`,
                              borderRadius: '8px',
                              color: '#f8fafc',
                              cursor: slot.status === 'available' || selected ? 'pointer' : 'not-allowed',
                              display: 'grid',
                              gap: '7px',
                              minHeight: 116,
                              opacity: slot.status === 'assigned' ? 0.45 : 1,
                              padding: '12px',
                              textAlign: 'left',
                            }}
                            type="button"
                          >
                            <span style={{ color: accent, fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              {KIND_LABELS[slot.kind]}
                            </span>
                            <span style={{ fontSize: '0.93rem', fontWeight: 850 }}>{slot.priceLabel}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>{slot.screenClass}</span>
                            <span style={{ color: slot.status === 'available' ? '#bbf7d0' : '#fecaca', fontSize: '0.76rem', fontWeight: 800 }}>
                              {getStatusLabel(slot)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside style={{ ...panelStyle, alignSelf: 'start', padding: '18px' }}>
            {selectedSlot ? (
              <>
                <div style={{ color: TIER_COLORS[selectedSlot.tier], fontSize: '0.76rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {BAND_LABELS[selectedSlot.band]} / {LANE_LABELS[selectedSlot.lane]}
                </div>
                <h2 style={{ fontSize: '1.55rem', margin: '8px 0 6px' }}>{KIND_LABELS[selectedSlot.kind]}</h2>
                <div style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 950, marginBottom: '4px' }}>{selectedSlot.priceLabel}</div>
                <p style={{ color: '#94a3b8', lineHeight: 1.48, margin: '0 0 14px' }}>
                  Includes a {selectedSlot.screenClass} screen class and {selectedSlot.boothType} sponsor presence. Payment creates the public scene assignment.
                </p>

                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 850 }}>Slot</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 850, overflowWrap: 'anywhere' }}>{selectedSlot.slotId}</div>
                  </div>
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 850 }}>Status</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 850 }}>{getStatusLabel(selectedSlot)}</div>
                  </div>
                </div>

                <form onSubmit={handleReserve} style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.82rem', fontWeight: 850, gap: '7px' }}>
                    Company name
                    <input
                      onChange={(event) => setCompanyName(event.target.value)}
                      required
                      style={inputStyle}
                      value={companyName}
                    />
                  </label>
                  <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.82rem', fontWeight: 850, gap: '7px' }}>
                    Contact email
                    <input
                      onChange={(event) => setContactEmail(event.target.value)}
                      style={inputStyle}
                      type="email"
                      value={contactEmail}
                    />
                  </label>
                  <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.82rem', fontWeight: 850, gap: '7px' }}>
                    Website
                    <input
                      onChange={(event) => setWebsite(event.target.value)}
                      style={inputStyle}
                      type="text"
                      value={website}
                    />
                  </label>
                  <button
                    disabled={isReserving || selectedSlot.status !== 'available'}
                    style={{
                      background: selectedSlot.status === 'available' ? 'linear-gradient(135deg, #38bdf8, #f8fafc)' : '#334155',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#020617',
                      cursor: selectedSlot.status === 'available' && !isReserving ? 'pointer' : 'not-allowed',
                      fontSize: '0.9rem',
                      fontWeight: 950,
                      minHeight: 48,
                      padding: '12px 14px',
                    }}
                    type="submit"
                  >
                    {isReserving ? 'Creating checkout...' : 'Reserve and pay'}
                  </button>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.45, margin: 0 }}>
                    Hold lasts 15 minutes. Stripe confirms payment before the booth is assigned into the public 3D scene.
                  </p>
                  <Link style={{ color: '#bfdbfe', fontSize: '0.84rem', fontWeight: 850 }} to="/login?next=/expo/booth-marketplace">
                    Need to sign in first?
                  </Link>
                </form>
              </>
            ) : (
              <p style={{ color: '#cbd5e1', margin: 0 }}>Loading selected slot...</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
