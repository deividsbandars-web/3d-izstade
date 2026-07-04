import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buildCityScreenAdminPath,
  getCityScreenAvailabilityLabel,
  getCityScreenBuyerSteps,
  getCityScreenLocationLabel,
  getCityScreenMapPins,
  getCityScreenPlacementLabel,
  getRentableCityScreenSlots,
} from '../../app/expo/cityScreenRental';
import '../../components/calculator/styles/CalculatorPro.css';

const SCREEN_TIER_COLORS = {
  hero: '#7dd3fc',
  landmark: '#facc15',
  premium: '#5eead4',
  standard: '#38bdf8',
} as const;

export default function CityScreenMarketplace() {
  const slots = getRentableCityScreenSlots();
  const buyerSteps = getCityScreenBuyerSteps();
  const mapPins = getCityScreenMapPins();
  const [highlightedScreenId, setHighlightedScreenId] = useState(() => slots[0]?.id ?? '');
  const highlightedSlot = slots.find((slot) => slot.id === highlightedScreenId) ?? slots[0] ?? null;
  const highlightedPin = mapPins.find((pin) => pin.id === highlightedSlot?.id) ?? mapPins[0] ?? null;
  const availableCount = slots.filter((slot) => slot.status === 'available').length;
  const lowestPrice = slots.reduce((lowest, slot) => Math.min(lowest, slot.monthlyPriceHintEur), Number.POSITIVE_INFINITY);

  return (
    <main className="calculator-pro-wrapper" style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '1120px', padding: '32px 20px 64px' }}>
      <header style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '30px' }}>
        <Link className="btn-glass" style={{ textDecoration: 'none' }} to="/expo-3d">
          Back to city
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Link className="btn-glass" style={{ textDecoration: 'none' }} to="/expo/sponsor-packages">
            Sponsor packages
          </Link>
          <Link className="btn-primary" style={{ textDecoration: 'none' }} to="/expo/admin?task=city-screen">
            Start screen request
          </Link>
        </div>
      </header>

      <section style={{ display: 'grid', gap: '22px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', marginBottom: '28px' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950, textTransform: 'uppercase' }}>City advertising</div>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.45rem)', lineHeight: 1, margin: '8px 0 12px' }}>Rent a specific screen in the 3D city</h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
            Choose the public city screen you want, add the ad visitors will see, preview it, and submit it for review. This is separate from a screen inside your sponsor booth.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
            <Link className="btn-primary" style={{ textDecoration: 'none' }} to="/expo/admin?task=city-screen">
              Add city screen ad
            </Link>
            <Link className="btn-glass" style={{ textDecoration: 'none' }} to="/expo-3d?salesDemo=1">
              Walk the city first
            </Link>
          </div>
        </div>
        <aside
          style={{
            background: 'linear-gradient(145deg, rgba(8,47,73,0.58), rgba(15,23,42,0.82))',
            border: '1px solid rgba(103, 232, 249, 0.24)',
            borderRadius: '8px',
            display: 'grid',
            gap: '12px',
            padding: '16px',
          }}
        >
          {[
            ['Available screens', String(availableCount)],
            ['Monthly from', Number.isFinite(lowestPrice) ? `EUR ${lowestPrice}` : 'On request'],
            ['Media review', 'Image or short video'],
          ].map(([label, value]) => (
            <div key={label} style={{ borderBottom: label === 'Media review' ? 'none' : '1px solid rgba(148, 163, 184, 0.16)', paddingBottom: label === 'Media review' ? 0 : '10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 950, marginTop: '3px' }}>{value}</div>
            </div>
          ))}
        </aside>
      </section>

      <section
        style={{
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          marginBottom: '28px',
          padding: '18px 0',
        }}
      >
        {buyerSteps.map(({ body, number, title }) => (
          <div key={number}>
            <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950 }}>STEP {number}</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 900, marginTop: '5px' }}>{title}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45, marginTop: '5px' }}>{body}</div>
          </div>
        ))}
      </section>

      {highlightedSlot && highlightedPin && (
        <section
          aria-label="Selected city screen map"
          style={{
            background: 'rgba(8, 18, 31, 0.78)',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            borderRadius: '8px',
            display: 'grid',
            gap: '18px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            marginBottom: '28px',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.42), rgba(2, 6, 23, 0.8))',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: '8px',
              minHeight: '260px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ background: 'rgba(103, 232, 249, 0.12)', bottom: 0, left: '46%', position: 'absolute', top: 0, width: '8%' }} />
            <div style={{ background: 'rgba(148, 163, 184, 0.08)', height: '12%', left: 0, position: 'absolute', right: 0, top: '44%' }} />
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.18)', borderRadius: '999px', bottom: '10%', left: '35%', position: 'absolute', right: '18%', top: '62%' }} />
            <div style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: 950, left: 14, position: 'absolute', textTransform: 'uppercase', top: 12 }}>Arrival</div>
            <div style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: 950, bottom: 12, left: 14, position: 'absolute', textTransform: 'uppercase' }}>Booth flow</div>
            <div style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: 950, position: 'absolute', right: 14, textTransform: 'uppercase', top: 12 }}>Districts</div>
            {mapPins.map((pin) => {
              const selected = pin.id === highlightedSlot.id;
              const pinColor = SCREEN_TIER_COLORS[pin.valueTier] ?? '#38bdf8';
              return (
                <button
                  aria-label={`Show ${pin.label}`}
                  key={pin.id}
                  onClick={() => setHighlightedScreenId(pin.id)}
                  style={{
                    alignItems: 'center',
                    background: selected ? pinColor : 'rgba(2, 6, 23, 0.78)',
                    border: `2px solid ${selected ? '#f8fafc' : pinColor}`,
                    borderRadius: '999px',
                    boxShadow: selected ? `0 0 28px ${pinColor}` : 'none',
                    color: selected ? '#020617' : '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: '0.68rem',
                    fontWeight: 950,
                    height: selected ? 34 : 28,
                    justifyContent: 'center',
                    left: `${pin.mapXPercent}%`,
                    position: 'absolute',
                    top: `${pin.mapYPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    width: selected ? 34 : 28,
                  }}
                  type="button"
                >
                  {pin.visibilityRank}
                </button>
              );
            })}
          </div>
          <div style={{ alignSelf: 'center' }}>
            <div style={{ color: SCREEN_TIER_COLORS[highlightedSlot.valueTier] ?? '#38bdf8', fontSize: '0.72rem', fontWeight: 950, textTransform: 'uppercase' }}>
              Selected screen
            </div>
            <h2 style={{ fontSize: '1.55rem', lineHeight: 1.05, margin: '8px 0' }}>{highlightedSlot.label}</h2>
            <div style={{ color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 850, marginBottom: '10px' }}>
              {highlightedPin.locationLabel} / {highlightedPin.placementLabel}
            </div>
            <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: '0 0 10px' }}>{highlightedPin.routeHint}</p>
            <p style={{ color: '#bae6fd', fontWeight: 850, lineHeight: 1.45, margin: 0 }}>{highlightedPin.viewHint}</p>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginTop: '14px' }}>
              <div style={{ background: 'rgba(2, 6, 23, 0.52)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Monthly from</div>
                <div style={{ fontSize: '1rem', fontWeight: 950, marginTop: '3px' }}>EUR {highlightedSlot.monthlyPriceHintEur}</div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.52)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase' }}>Screen code</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 850, marginTop: '3px', overflowWrap: 'anywhere' }}>{highlightedSlot.id}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gap: '12px' }}>
        {slots.map((slot) => {
          const available = slot.status === 'available';
          const accent = SCREEN_TIER_COLORS[slot.valueTier] ?? '#5eead4';
          return (
            <article
              key={slot.id}
              onFocus={() => setHighlightedScreenId(slot.id)}
              onMouseEnter={() => setHighlightedScreenId(slot.id)}
              style={{
                alignItems: 'stretch',
                background: 'rgba(8, 18, 31, 0.78)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                borderRadius: '8px',
                display: 'grid',
                gap: '18px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                padding: '16px',
              }}
            >
              <div
                style={{
                  aspectRatio: '16 / 9',
                  background: 'radial-gradient(circle at 20% 10%, rgba(103,232,249,0.18), transparent 28%), linear-gradient(135deg, #07111d, #123047)',
                  border: `2px solid ${accent}`,
                  borderRadius: '5px',
                  boxShadow: 'inset 0 0 34px rgba(2, 6, 23, 0.62)',
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr auto',
                  minHeight: 178,
                  padding: '14px',
                }}
              >
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {getCityScreenLocationLabel(slot)}
                  </div>
                  <div style={{ color: accent, fontSize: '0.6rem', fontWeight: 950, textTransform: 'uppercase' }}>{slot.valueTier}</div>
                </div>
                <div style={{ alignSelf: 'center', display: 'grid', gap: '8px' }}>
                  <div style={{ color: '#e0f2fe', fontSize: '0.66rem', fontWeight: 950, textTransform: 'uppercase' }}>Your campaign</div>
                  <div style={{ fontSize: '1rem', fontWeight: 950, lineHeight: 1.12 }}>{slot.label}</div>
                  <div style={{ alignItems: 'center', display: 'flex', gap: '7px' }}>
                    <span style={{ background: accent, borderRadius: '999px', display: 'inline-block', height: 8, width: 8 }} />
                    <span style={{ color: '#cbd5e1', fontSize: '0.64rem', fontWeight: 800 }}>Logo, headline, image or short video</span>
                  </div>
                </div>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ color: '#bae6fd', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase' }}>{slot.sizeLabel}</span>
                  <span style={{ background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: '999px', color: '#f8fafc', fontSize: '0.6rem', fontWeight: 900, padding: '4px 7px' }}>Preview</span>
                </div>
              </div>

              <div>
                <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{slot.label}</h2>
                  <span style={{ color: available ? '#86efac' : '#fbbf24', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {getCityScreenAvailabilityLabel(slot)}
                  </span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginTop: '7px' }}>
                  {slot.sizeLabel} / {getCityScreenPlacementLabel(slot)}
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5, margin: '9px 0 0' }}>
                  {slot.placementNotes}
                </p>
                <div style={{ color: '#bae6fd', fontSize: '0.72rem', marginTop: '8px' }}>
                  Image included. Short reviewed video is available for suitable screen tiers.
                </div>
              </div>

              <div style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', textTransform: 'uppercase' }}>From</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 950, marginTop: '3px' }}>EUR {slot.monthlyPriceHintEur}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>per month</div>
                </div>
                <Link
                  className="btn-primary"
                  aria-disabled={!available}
                  onClick={(event) => {
                    if (!available) {
                      event.preventDefault();
                    }
                  }}
                  style={{
                    boxSizing: 'border-box',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    opacity: available ? 1 : 0.5,
                    pointerEvents: available ? 'auto' : 'none',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                  to={buildCityScreenAdminPath(slot.id)}
                >
                  Rent this screen
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
