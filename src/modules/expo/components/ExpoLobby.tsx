import { EXPO_MODE_COPY, type ExpoMode } from '../state/expoRuntime';
import type { PixelStreamingAvailability, PixelStreamingRuntimeStatus } from '../services/pixelStreamingConfig';

interface ExpoLobbyProps {
  onSelectMode: (mode: ExpoMode) => void;
  onBack: () => void;
  premiumAvailability: PixelStreamingAvailability;
  premiumSignalingUrl: string;
  premiumRuntimeStatus: PixelStreamingRuntimeStatus | null;
}

export function ExpoLobby({ onSelectMode, onBack, premiumAvailability, premiumSignalingUrl, premiumRuntimeStatus }: ExpoLobbyProps) {
  const premiumStatusCopy = premiumAvailability === 'available'
    ? EXPO_MODE_COPY.premiumAvailable
    : premiumAvailability === 'connecting'
      ? EXPO_MODE_COPY.premiumConnecting
      : EXPO_MODE_COPY.premiumUnavailable;

  const premiumButtonLabel = premiumAvailability === 'available'
    ? EXPO_MODE_COPY.premiumCta
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

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8) 0%, #020617 100%)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '60px 80px' }}>
        <h1 className="text-accent" style={{ fontSize: '5rem', fontWeight: 950, margin: 0 }}>{EXPO_MODE_COPY.title}</h1>
        <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '50px' }}>{EXPO_MODE_COPY.subtitle}</h2>
        <div style={{ marginBottom: '32px', display: 'grid', gap: '12px', maxWidth: '720px', textAlign: 'left' }}>
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#cbd5e1' }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.publicLabel}</strong> {EXPO_MODE_COPY.publicDescription}
          </div>
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(6, 78, 59, 0.45)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#d1fae5' }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.premiumLabel}</strong> {EXPO_MODE_COPY.premiumDescription}
            <div style={{ marginTop: '10px', fontSize: '0.95rem', color: premiumAvailability === 'unavailable' ? '#fecaca' : '#d1fae5' }}>
              <strong>{EXPO_MODE_COPY.premiumStatusLabel}</strong> {premiumStatusCopy}
            </div>
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
            <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#a7f3d0', wordBreak: 'break-all' }}>
              {EXPO_MODE_COPY.premiumServerLabel} {premiumSignalingUrl}
            </div>
          </div>
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#cbd5e1' }}>
            <strong style={{ color: '#fff' }}>{EXPO_MODE_COPY.fallbackLabel}</strong> {EXPO_MODE_COPY.fallbackDescription}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button onClick={() => onSelectMode('walk')} className="btn-primary">{EXPO_MODE_COPY.walkCta}</button>
            <button onClick={() => onSelectMode('fly')} className="btn-glass">{EXPO_MODE_COPY.flyCta}</button>
          </div>
          <button
            onClick={() => onSelectMode('unreal')}
            disabled={premiumAvailability !== 'available'}
            style={{
              padding: '15px 30px',
              background: premiumAvailability === 'available'
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #475569, #334155)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: premiumAvailability === 'available' ? 'pointer' : 'not-allowed',
              boxShadow: premiumAvailability === 'available' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
              opacity: premiumAvailability === 'available' ? 1 : 0.8,
            }}
          >
            {premiumButtonLabel}
          </button>
        </div>
        <button onClick={onBack} style={{ marginTop: '40px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {EXPO_MODE_COPY.backToDashboard}
        </button>
      </div>
    </div>
  );
}
