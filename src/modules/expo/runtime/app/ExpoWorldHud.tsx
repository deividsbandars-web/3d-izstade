import type { CSSProperties } from 'react';
import { EXPO_CITY_QUALITY_TIER, EXPO_MODE_COPY } from '../../state/expoRuntime';
import type { ExpoSectorMarker } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';

interface ExpoWorldHudProps {
  debug: boolean;
  devVerification?: {
    companyCount?: number;
    dataMode?: string | null;
    layerStates?: Record<string, boolean>;
    onToggleLayer?: (layer: 'promenade' | 'city' | 'stadium' | 'booths' | 'skyline') => void;
    renderMarker: string;
    focusedSlug: string | null;
    focusedName: string | null;
    focusedTier: string | null;
    sceneVersion: string | null;
    onFocusHero?: () => void;
    onFocusPremium?: () => void;
    onFocusElite?: () => void;
    onClearFocus?: () => void;
  } | null;
  guests: any[];
  isMicOn: boolean;
  isSpeaking: boolean;
  isTouchDevice?: boolean;
  onMoveTouch?: (intent: { f: boolean; b: boolean; l: boolean; r: boolean }) => void;
  playerPos: number[];
  sectorMarkers: ExpoSectorMarker[];
  visualProfile: ExpoWorldVisualProfile;
  onToggleMic: () => void;
  onToggleDebug: () => void;
  onExit: () => void;
}

export function ExpoWorldHud({
  debug,
  devVerification = null,
  guests,
  isMicOn,
  isSpeaking,
  isTouchDevice = false,
  onMoveTouch,
  playerPos,
  sectorMarkers,
  visualProfile,
  onToggleMic,
  onToggleDebug,
  onExit,
}: ExpoWorldHudProps) {
  const radarSize = debug ? 220 : 208;
  const orderedMarkers = [...sectorMarkers].sort((left, right) => {
    const leftDistance = Math.hypot(left.position[0] - playerPos[0], left.position[2] - playerPos[2]);
    const rightDistance = Math.hypot(right.position[0] - playerPos[0], right.position[2] - playerPos[2]);
    return leftDistance - rightDistance;
  });
  const nearestMarker = sectorMarkers.reduce<ExpoSectorMarker | null>((nearest, marker) => {
    if (!nearest) {
      return marker;
    }
    const currentDistance = Math.hypot(marker.position[0] - playerPos[0], marker.position[2] - playerPos[2]);
    const nearestDistance = Math.hypot(nearest.position[0] - playerPos[0], nearest.position[2] - playerPos[2]);
    return currentDistance < nearestDistance ? marker : nearest;
  }, null);
  const nearestMarkerDistance = nearestMarker
    ? Math.round(Math.hypot(nearestMarker.position[0] - playerPos[0], nearestMarker.position[2] - playerPos[2]))
    : null;
  const districtLegend = orderedMarkers.slice(0, 3).map((marker) => ({
    color: marker.color,
    distance: Math.round(Math.hypot(marker.position[0] - playerPos[0], marker.position[2] - playerPos[2])),
    id: marker.id,
    label: marker.label,
  }));
  const primaryPanelStyle: CSSProperties = {
    backdropFilter: 'blur(14px)',
    background: `linear-gradient(180deg, ${visualProfile.global.hudPanel}, rgba(14, 22, 34, 0.72))`,
    border: `1px solid ${visualProfile.global.hudAccent}33`,
    borderRadius: '18px',
    boxShadow: '0 18px 48px rgba(2, 6, 23, 0.38)',
    color: '#f8fafc',
  };

  return (
    <>
      <div style={{ position: 'absolute', top: '26px', right: '26px', zIndex: 100, display: 'flex', gap: '14px', alignItems: 'stretch', maxWidth: 'calc(100vw - 52px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={{ ...primaryPanelStyle, minWidth: '280px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.66rem', letterSpacing: '0.2em', fontWeight: 800, color: visualProfile.global.hudAccent }}>WARPALA EXPO CITY</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f8fafc' }}>Sponsor Boulevard Live</div>
            </div>
            <div style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.14)', color: '#86efac', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              ONLINE {guests.length + 1}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(15, 23, 42, 0.8)', color: '#cbd5e1', fontWeight: 700, fontSize: '0.75rem' }}>
              {EXPO_MODE_COPY.publicModeBadge}
            </div>
            <div style={{ padding: '7px 11px', borderRadius: '999px', background: `${visualProfile.global.hudAccent}22`, color: visualProfile.global.hudAccent, fontWeight: 700, fontSize: '0.75rem' }}>
              QUALITY {EXPO_CITY_QUALITY_TIER.toUpperCase()}
            </div>
            <div style={{ padding: '7px 11px', borderRadius: '999px', background: isSpeaking ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)', color: isSpeaking ? '#86efac' : '#cbd5e1', fontWeight: 700, fontSize: '0.75rem' }}>
              {isSpeaking ? 'VOICE LIVE' : 'VOICE READY'}
            </div>
            {debug && (
              <div style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.16)', color: '#fecaca', fontWeight: 700, fontSize: '0.75rem' }}>
                DEBUG OVERLAY
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onToggleMic}
          style={{ ...primaryPanelStyle, background: isMicOn ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.88))' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.9))', padding: '0 18px', minWidth: '120px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.08em' }}
        >
          {isMicOn ? 'MIC ON' : 'MIC OFF'}
        </button>
        <button
          onClick={onToggleDebug}
          style={{ ...primaryPanelStyle, background: debug ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.82), rgba(153, 27, 27, 0.76))' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.68))', padding: '0 14px', minWidth: '98px', minHeight: '52px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', color: debug ? '#fff' : '#94a3b8' }}
        >
          {debug ? 'DEBUG ON' : 'TOOLS'}
        </button>
        <div style={{ ...primaryPanelStyle, padding: '14px 18px', minWidth: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.64rem', letterSpacing: '0.16em', color: '#b7c4d5', fontWeight: 800 }}>BOULEVARD</div>
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: nearestMarker?.color || '#94a3b8',
                boxShadow: nearestMarker?.color ? `0 0 12px ${nearestMarker.color}` : 'none',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{nearestMarker?.label || 'Arrival open'}</div>
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
            {nearestMarkerDistance !== null ? `${nearestMarkerDistance}u ahead` : 'Move ahead, explore left and right'}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {districtLegend.map((marker) => (
              <div
                key={marker.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '999px',
                  background: 'rgba(15, 23, 42, 0.56)',
                  border: `1px solid ${marker.color}44`,
                  color: '#dbe7f4',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: marker.color, display: 'inline-block' }} />
                <span>{marker.label.toUpperCase()}</span>
                <span style={{ color: marker.color }}>{marker.distance}u</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onExit} style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)', padding: '0 22px', borderRadius: '16px', border: 'none', fontWeight: 800, cursor: 'pointer', color: '#0f172a', boxShadow: '0 14px 32px rgba(226, 232, 240, 0.18)' }}>
          {EXPO_MODE_COPY.exitToLobby}
        </button>
        {devVerification && (
          <div style={{ ...primaryPanelStyle, minWidth: '320px', maxWidth: '360px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(248, 113, 113, 0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', fontWeight: 900, color: '#fda4af' }}>LOCAL VERIFY</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{devVerification.renderMarker}</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(248, 113, 113, 0.14)', color: '#fecdd3', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                {devVerification.sceneVersion || 'no-scene-version'}
              </div>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700, lineHeight: 1.45 }}>
              <div>FOCUS: {devVerification.focusedSlug || 'none'}</div>
              <div>NAME: {devVerification.focusedName || 'free roam'}</div>
              <div>TIER: {(devVerification.focusedTier || 'none').toUpperCase()}</div>
              <div>DATA: {(devVerification.dataMode || 'unknown').toUpperCase()} / {devVerification.companyCount ?? 0} COMPANIES</div>
              {devVerification.layerStates && (
                <div>
                  LAYERS:
                  {' '}
                  {Object.entries(devVerification.layerStates).map(([key, value]) => `${key.toUpperCase()}:${value ? 'ON' : 'OFF'}`).join('  ')}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <button onClick={devVerification.onFocusHero} style={{ ...primaryPanelStyle, padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>HERO</button>
              <button onClick={devVerification.onFocusPremium} style={{ ...primaryPanelStyle, padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>PREMIUM</button>
              <button onClick={devVerification.onFocusElite} style={{ ...primaryPanelStyle, padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>ELITE</button>
              <button onClick={devVerification.onClearFocus} style={{ ...primaryPanelStyle, padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>CLEAR</button>
            </div>
            {devVerification.onToggleLayer && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                <button onClick={() => devVerification.onToggleLayer?.('promenade')} style={{ ...primaryPanelStyle, padding: '9px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>PROM</button>
                <button onClick={() => devVerification.onToggleLayer?.('city')} style={{ ...primaryPanelStyle, padding: '9px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>CITY</button>
                <button onClick={() => devVerification.onToggleLayer?.('stadium')} style={{ ...primaryPanelStyle, padding: '9px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>STADIUM</button>
                <button onClick={() => devVerification.onToggleLayer?.('booths')} style={{ ...primaryPanelStyle, padding: '9px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)' }}>BOOTHS</button>
                <button onClick={() => devVerification.onToggleLayer?.('skyline')} style={{ ...primaryPanelStyle, padding: '9px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, border: '1px solid rgba(255,255,255,0.08)', gridColumn: 'span 2' }}>SKYLINE</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '26px', left: '26px', zIndex: 100, width: `${radarSize}px`, height: `${radarSize}px`, background: `linear-gradient(180deg, ${visualProfile.global.hudPanel}, rgba(15, 23, 42, 0.7))`, borderRadius: '50%', border: `1px solid ${visualProfile.global.hudAccent}44`, overflow: 'hidden', backdropFilter: 'blur(10px)', boxShadow: '0 18px 48px rgba(0,0,0,0.45)' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', background: `radial-gradient(circle at center, ${visualProfile.global.hudAccent}30 0%, rgba(15, 23, 42, 0.04) 70%)` }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
          {sectorMarkers.slice(0, 12).map((marker) => (
            <div
              key={marker.id}
              style={{
                position: 'absolute',
                top: `${Math.min(Math.max(50 + (marker.position[2] / 1000) * 100, 4), 96)}%`,
                left: `${Math.min(Math.max(50 + (marker.position[0] / 2000) * 100, 4), 96)}%`,
                width: marker.id === nearestMarker?.id ? '10px' : '7px',
                height: marker.id === nearestMarker?.id ? '10px' : '7px',
                background: marker.color,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: marker.id === nearestMarker?.id ? `0 0 14px ${marker.color}` : 'none',
                opacity: marker.id === nearestMarker?.id ? 1 : 0.72,
              }}
            />
          ))}
          <div style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (playerPos[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (playerPos[0] / 200) * 100, 5), 95)}%`, width: '10px', height: '10px', background: isSpeaking ? '#10b981' : '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: isSpeaking ? '0 0 15px #10b981' : '0 0 14px rgba(255,255,255,0.24)' }}></div>
          {guests.map((guest) => (
            <div key={guest.id} style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (guest.position[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (guest.position[0] / 200) * 100, 5), 95)}%`, width: '8px', height: '8px', background: guest.isSpeaking ? '#10b981' : (guest.color || '#3b82f6'), borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: guest.isSpeaking ? '0 0 10px #10b981' : 'none' }}></div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: '18px', width: '100%', textAlign: 'center', fontSize: '0.62rem', color: visualProfile.global.hudAccent, fontWeight: 900, letterSpacing: '0.16em' }}>
          DISTRICT RADAR
        </div>
        <div style={{ position: 'absolute', top: '38px', width: '100%', textAlign: 'center', fontSize: '0.54rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
          MAIN AXIS
        </div>
        <div style={{ position: 'absolute', bottom: '12px', width: '100%', textAlign: 'center', fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 800, letterSpacing: '0.08em' }}>
          POSITION {Math.round(playerPos[0])}, {Math.round(playerPos[2])}
        </div>
      </div>

      {isTouchDevice && onMoveTouch && (
        <div style={{ position: 'absolute', right: '24px', bottom: '24px', zIndex: 110, display: 'grid', gridTemplateColumns: '72px 72px 72px', gridTemplateRows: '72px 72px 72px', gap: '10px' }}>
          <div />
          <button
            onTouchStart={() => onMoveTouch({ f: true, b: false, l: false, r: false })}
            onTouchEnd={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            onMouseDown={() => onMoveTouch({ f: true, b: false, l: false, r: false })}
            onMouseUp={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            style={{ ...primaryPanelStyle, borderRadius: '18px', border: 'none', fontWeight: 900, fontSize: '1.2rem' }}
          >↑</button>
          <div />
          <button
            onTouchStart={() => onMoveTouch({ f: false, b: false, l: true, r: false })}
            onTouchEnd={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            onMouseDown={() => onMoveTouch({ f: false, b: false, l: true, r: false })}
            onMouseUp={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            style={{ ...primaryPanelStyle, borderRadius: '18px', border: 'none', fontWeight: 900, fontSize: '1.2rem' }}
          >←</button>
          <button
            onTouchStart={() => onMoveTouch({ f: false, b: true, l: false, r: false })}
            onTouchEnd={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            onMouseDown={() => onMoveTouch({ f: false, b: true, l: false, r: false })}
            onMouseUp={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            style={{ ...primaryPanelStyle, borderRadius: '18px', border: 'none', fontWeight: 900, fontSize: '1.2rem' }}
          >↓</button>
          <button
            onTouchStart={() => onMoveTouch({ f: false, b: false, l: false, r: true })}
            onTouchEnd={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            onMouseDown={() => onMoveTouch({ f: false, b: false, l: false, r: true })}
            onMouseUp={() => onMoveTouch({ f: false, b: false, l: false, r: false })}
            style={{ ...primaryPanelStyle, borderRadius: '18px', border: 'none', fontWeight: 900, fontSize: '1.2rem' }}
          >→</button>
        </div>
      )}
    </>
  );
}
