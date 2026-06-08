import { EXPO_MODE_COPY, type ExpoMode } from '../state/expoRuntime';
import type { PixelStreamingAvailability, PixelStreamingRuntimeStatus } from '../services/pixelStreamingConfig';

interface ExpoLobbyProps {
  isTouchDevice?: boolean;
  onSelectMode: (mode: ExpoMode) => void;
  onBack: () => void;
  premiumAvailability: PixelStreamingAvailability;
  premiumSignalingUrl: string | null;
  premiumRuntimeStatus: PixelStreamingRuntimeStatus | null;
}

export function ExpoLobby({ isTouchDevice = false, onSelectMode, onBack, premiumAvailability, premiumSignalingUrl, premiumRuntimeStatus }: ExpoLobbyProps) {
  const premiumStatusCopy = premiumAvailability === 'available'
    ? EXPO_MODE_COPY.premiumAvailable
    : premiumAvailability === 'degraded'
      ? EXPO_MODE_COPY.premiumDegraded
    : premiumAvailability === 'connecting'
      ? EXPO_MODE_COPY.premiumConnecting
      : EXPO_MODE_COPY.premiumUnavailable;

  const premiumButtonLabel = premiumAvailability === 'available'
    ? EXPO_MODE_COPY.premiumCta
    : premiumAvailability === 'degraded'
      ? EXPO_MODE_COPY.premiumDegradedCta
    : premiumAvailability === 'connecting'
      ? EXPO_MODE_COPY.premiumConnectingCta
      : EXPO_MODE_COPY.premiumUnavailableCta;

  const gatewayStatusCopy = premiumRuntimeStatus?.signaling === 'signaling_up'
    ? EXPO_MODE_COPY.premiumGatewayUp
    : premiumRuntimeStatus?.signaling === 'signaling_down'
      ? EXPO_MODE_COPY.premiumGatewayDown
      : EXPO_MODE_COPY.premiumConnecting;

  const streamerStatusCopy = premiumRuntimeStatus?.streamer === 'streamer_available'
    ? EXPO_MODE_COPY.premiumStreamerReady
    : premiumRuntimeStatus?.streamer === 'streamer_unavailable'
      ? EXPO_MODE_COPY.premiumStreamerWaiting
      : EXPO_MODE_COPY.premiumConnecting;

  const turnStatusCopy = premiumRuntimeStatus?.turn_ice === 'turn_configured'
    ? EXPO_MODE_COPY.premiumTurnConfigured
    : premiumRuntimeStatus?.turn_ice === 'turn_not_configured'
      ? EXPO_MODE_COPY.premiumTurnNotConfigured
      : EXPO_MODE_COPY.premiumTurnUnknown;

  const sessionStatusCopy = premiumRuntimeStatus?.readiness === 'session_ready'
    ? EXPO_MODE_COPY.premiumSessionReady
    : premiumRuntimeStatus?.readiness === 'session_not_ready'
      ? EXPO_MODE_COPY.premiumSessionNotReady
      : EXPO_MODE_COPY.premiumSessionUnknown;

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
          <div style={{ padding: cardPadding, borderRadius: '12px', background: 'rgba(6, 78, 59, 0.45)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#d1fae5', fontSize: isTouchDevice ? '0.82rem' : undefined, lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.premiumLabel}</strong> {EXPO_MODE_COPY.premiumDescription}
            <div style={{ marginTop: '10px', fontSize: '0.95rem', color: premiumAvailability === 'unavailable' ? '#fecaca' : premiumAvailability === 'degraded' ? '#fde68a' : '#d1fae5' }}>
              <strong>{EXPO_MODE_COPY.premiumStatusLabel}</strong> {premiumStatusCopy}
            </div>
            {!isTouchDevice && (
            <div style={{ marginTop: '10px', display: 'grid', gap: '4px', fontSize: '0.85rem', color: '#d1fae5' }}>
              <div><strong>{EXPO_MODE_COPY.premiumGatewayLabel}</strong> {gatewayStatusCopy}</div>
              <div><strong>{EXPO_MODE_COPY.premiumStreamerLabel}</strong> {streamerStatusCopy}</div>
              <div><strong>{EXPO_MODE_COPY.premiumTurnLabel}</strong> {turnStatusCopy}</div>
              <div><strong>{EXPO_MODE_COPY.premiumSessionLabel}</strong> {sessionStatusCopy}</div>
              {premiumRuntimeStatus?.checkedAt && (
                <div><strong>{EXPO_MODE_COPY.premiumStatusCheckedAt}</strong> {premiumRuntimeStatus.checkedAt}</div>
              )}
              {premiumRuntimeStatus?.warnings?.length ? (
                <div><strong>{EXPO_MODE_COPY.premiumStatusWarningsLabel}</strong> {premiumRuntimeStatus.warnings.join(', ')}</div>
              ) : null}
            </div>
            )}
            {!isTouchDevice && (
              <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#a7f3d0', wordBreak: 'break-all' }}>
                {EXPO_MODE_COPY.premiumServerLabel} {premiumSignalingUrl ?? 'Not configured'}
              </div>
            )}
          </div>
          <div style={{ padding: cardPadding, borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#cbd5e1', fontSize: isTouchDevice ? '0.82rem' : undefined, lineHeight: 1.45 }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.fallbackLabel}</strong> {EXPO_MODE_COPY.fallbackDescription}
          </div>
        </div>
        <div style={{ display: 'flex', gap: isTouchDevice ? '10px' : '20px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: isTouchDevice ? '10px' : '20px', justifyContent: 'center', flexDirection: isTouchDevice ? 'column' : 'row' }}>
            <button onClick={() => onSelectMode('walk')} className="btn-primary" style={modeButtonStyle}>{EXPO_MODE_COPY.walkCta}</button>
            <button onClick={() => onSelectMode('fly')} className="btn-glass" style={modeButtonStyle}>{EXPO_MODE_COPY.flyCta}</button>
          </div>
          <button
            onClick={() => onSelectMode('unreal')}
            disabled={premiumAvailability !== 'available'}
            style={{
              padding: isTouchDevice ? '14px 16px' : '15px 30px',
              background: premiumAvailability === 'available'
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : premiumAvailability === 'degraded'
                  ? 'linear-gradient(90deg, #a16207, #92400e)'
                : 'linear-gradient(90deg, #475569, #334155)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isTouchDevice ? '0.95rem' : '1.2rem',
              fontWeight: 'bold',
              cursor: premiumAvailability === 'available' ? 'pointer' : 'not-allowed',
              boxShadow: premiumAvailability === 'available' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
              opacity: premiumAvailability === 'available' ? 1 : 0.8,
              minHeight: isTouchDevice ? '52px' : undefined,
            }}
          >
            {premiumButtonLabel}
          </button>
        </div>
        <button onClick={onBack} style={{ marginTop: isTouchDevice ? '18px' : '40px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {EXPO_MODE_COPY.backToDashboard}
        </button>
      </div>
    </div>
  );
}
