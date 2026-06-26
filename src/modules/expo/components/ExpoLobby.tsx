import { useNavigate } from 'react-router-dom';
import { EXPO_MODE_COPY, type ExpoMode } from '../state/expoRuntime';
import { createCanonicalModularHomeStudioPath } from '../runtime/modularHome/modularHomeShareUrl';

interface ExpoLobbyProps {
  isTouchDevice?: boolean;
  onOpenModularHomes?: () => void;
  onSelectMode: (mode: ExpoMode) => void;
  onBack: () => void;
}

export function ExpoLobby({ isTouchDevice = false, onOpenModularHomes, onSelectMode, onBack }: ExpoLobbyProps) {
  const navigate = useNavigate();

  const cardPadding = isTouchDevice ? '12px 14px' : '14px 18px';
  const modeButtonStyle = isTouchDevice
    ? { width: '100%', minHeight: '52px', fontSize: '0.95rem' }
    : undefined;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8) 0%, #020617 100%)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isTouchDevice ? 'flex-start' : 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: isTouchDevice ? 'max(16px, env(safe-area-inset-top)) 12px max(18px, env(safe-area-inset-bottom))' : undefined,
        overflowY: isTouchDevice ? 'auto' : undefined,
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: isTouchDevice ? '20px 16px' : '60px 80px',
          width: isTouchDevice ? 'calc(100vw - 24px)' : undefined,
          maxWidth: isTouchDevice ? '440px' : undefined,
          maxHeight: isTouchDevice ? 'calc(100dvh - 34px)' : undefined,
          overflowY: isTouchDevice ? 'auto' : undefined,
        }}
      >
        <h1 className="text-accent" style={{ fontSize: isTouchDevice ? '2rem' : '5rem', fontWeight: 950, margin: 0 }}>{EXPO_MODE_COPY.title}</h1>
        <h2 style={{ fontSize: isTouchDevice ? '0.95rem' : '2rem', color: '#fff', marginBottom: isTouchDevice ? '18px' : '50px', lineHeight: 1.35 }}>{EXPO_MODE_COPY.subtitle}</h2>
        <div style={{ marginBottom: isTouchDevice ? '18px' : '32px', display: 'grid', gap: isTouchDevice ? '8px' : '12px', maxWidth: '720px', textAlign: 'left' }}>
          <div style={{ padding: cardPadding, borderRadius: '12px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#cbd5e1', fontSize: isTouchDevice ? '0.82rem' : undefined, lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.publicLabel}</strong> {EXPO_MODE_COPY.publicDescription}
            {isTouchDevice && (
              <div style={{ marginTop: '8px', color: '#bfdbfe', fontWeight: 800 }}>
                Left stick moves. Right pad turns. JUMP climbs ledges. LIFT works near pads.
              </div>
            )}
          </div>
          <div style={{ padding: cardPadding, borderRadius: '12px', background: 'rgba(6, 78, 59, 0.3)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#d1fae5', fontSize: isTouchDevice ? '0.82rem' : undefined, lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.boothLabel}</strong> {EXPO_MODE_COPY.boothDescription}
            <div style={{ marginTop: '8px', color: '#c7f9cc', fontSize: '0.9rem', fontWeight: 800 }}>
              {EXPO_MODE_COPY.cityFallbackDescription}
            </div>
          </div>
          <div style={{ padding: cardPadding, borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#cbd5e1', fontSize: isTouchDevice ? '0.82rem' : undefined, lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.fallbackLabel}</strong> {EXPO_MODE_COPY.cityFallbackDescription}
          </div>
        </div>
        <div style={{ display: 'flex', gap: isTouchDevice ? '10px' : '20px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: isTouchDevice ? '10px' : '20px', justifyContent: 'center', flexDirection: isTouchDevice ? 'column' : 'row' }}>
            <button onClick={() => onSelectMode('walk')} className="btn-primary" style={modeButtonStyle}>{EXPO_MODE_COPY.walkCta}</button>
            <button onClick={() => onSelectMode('fly')} className="btn-glass" style={modeButtonStyle}>{EXPO_MODE_COPY.flyCta}</button>
          </div>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            <button
              type="button"
              onClick={onOpenModularHomes || (() => navigate(createCanonicalModularHomeStudioPath('exterior')))}
              style={{
                padding: isTouchDevice ? '14px 16px' : '15px 20px',
                background: 'linear-gradient(90deg, #0ea5e9, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isTouchDevice ? '0.95rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: isTouchDevice ? '52px' : undefined,
              }}
            >
              {EXPO_MODE_COPY.modularHomesCta}
            </button>
            <button
              type="button"
              onClick={() => navigate('/expo/sponsor-packages')}
              style={{
                padding: isTouchDevice ? '14px 16px' : '15px 20px',
                background: 'rgba(15, 23, 42, 0.72)',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.24)',
                borderRadius: '8px',
                fontSize: isTouchDevice ? '0.95rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: isTouchDevice ? '52px' : undefined,
              }}
            >
              View sponsor packages
            </button>
          </div>
        </div>
        <button onClick={onBack} style={{ marginTop: isTouchDevice ? '18px' : '40px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {EXPO_MODE_COPY.backToDashboard}
        </button>
      </div>
    </div>
  );
}
