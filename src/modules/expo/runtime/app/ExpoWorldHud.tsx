import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { EXPO_CITY_QUALITY_TIER, EXPO_MODE_COPY } from '../../state/expoRuntime';
import type { ExpoSectorMarker } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';

interface ExpoWorldHudProps {
  guests: any[];
  isMicOn: boolean;
  isSpeaking: boolean;
  isTouchDevice?: boolean;
  onMoveTouch?: (intent: { f: boolean; b: boolean; l: boolean; r: boolean; s: boolean }) => void;
  playerPos: number[];
  sectorMarkers: ExpoSectorMarker[];
  visualProfile: ExpoWorldVisualProfile;
  onToggleMic: () => void;
  onExit: () => void;
}

export function ExpoWorldHud({
  guests,
  isMicOn,
  isSpeaking,
  isTouchDevice = false,
  onMoveTouch,
  playerPos,
  sectorMarkers,
  visualProfile,
  onToggleMic,
  onExit,
}: ExpoWorldHudProps) {
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const radarSize = 208;
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

  const emitJoystickIntent = (offsetX: number, offsetY: number, sprint: boolean) => {
    if (!onMoveTouch || !joystickRef.current) {
      return;
    }

    const maxRadius = joystickRef.current.getBoundingClientRect().width * 0.28;
    const threshold = maxRadius * 0.35;
    onMoveTouch({
      f: offsetY < -threshold,
      b: offsetY > threshold,
      l: offsetX < -threshold,
      r: offsetX > threshold,
      s: sprint,
    });
  };

  const updateJoystickIntent = (clientX: number, clientY: number) => {
    if (!joystickRef.current || !onMoveTouch) {
      return;
    }

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const maxRadius = rect.width * 0.28;
    const distance = Math.hypot(rawX, rawY);
    const clampRatio = distance > maxRadius ? maxRadius / distance : 1;
    const offsetX = rawX * clampRatio;
    const offsetY = rawY * clampRatio;
    const threshold = maxRadius * 0.35;

    setJoystickOffset({ x: offsetX, y: offsetY });
    onMoveTouch({
      f: offsetY < -threshold,
      b: offsetY > threshold,
      l: offsetX < -threshold,
      r: offsetX > threshold,
      s: isSprintActive,
    });
  };

  const resetJoystickIntent = () => {
    setJoystickOffset({ x: 0, y: 0 });
    onMoveTouch?.({ f: false, b: false, l: false, r: false, s: isSprintActive });
  };

  const setSprintActive = (active: boolean) => {
    setIsSprintActive(active);
    emitJoystickIntent(joystickOffset.x, joystickOffset.y, active);
  };

  return (
    <>
      {isTouchDevice && (
        <>
          <button
            onClick={() => setMobileMapOpen((value) => !value)}
            style={{
              position: 'absolute',
              top: '18px',
              right: '80px',
              zIndex: 112,
              width: '52px',
              height: '52px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: mobileMapOpen ? 'rgba(15, 23, 42, 0.72)' : 'rgba(15, 23, 42, 0.38)',
              color: '#f8fafc',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 24px rgba(2, 6, 23, 0.28)',
              fontSize: '0.86rem',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            MAP
          </button>
          <button
            onClick={() => setMobileOptionsOpen((value) => !value)}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              zIndex: 112,
              width: '52px',
              height: '52px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: mobileOptionsOpen ? 'rgba(15, 23, 42, 0.72)' : 'rgba(15, 23, 42, 0.38)',
              color: '#f8fafc',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 24px rgba(2, 6, 23, 0.28)',
              fontSize: '1.1rem',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            ...
          </button>
        </>
      )}

      {(!isTouchDevice || mobileOptionsOpen) && (
        <div
          data-expo-world-hud-top="true"
          style={{ position: 'absolute', top: '26px', right: '26px', zIndex: 100, display: 'flex', gap: '14px', alignItems: 'stretch', maxWidth: 'calc(100vw - 52px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
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
            </div>
            {!isTouchDevice && (
              <div style={{ fontSize: '0.64rem', letterSpacing: '0.12em', color: '#9fb2c7', fontWeight: 800 }}>
                WASD MOVE | MOUSE LOOK | Q/E OR LEFT/RIGHT TURN
              </div>
            )}
          </div>

          <button
            onClick={onToggleMic}
            style={{ ...primaryPanelStyle, background: isMicOn ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.88))' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.9))', padding: '0 18px', minWidth: '120px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.08em' }}
          >
            {isMicOn ? 'MIC ON' : 'MIC OFF'}
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
        </div>
      )}

      {(!isTouchDevice || mobileMapOpen) && (
        <div
          data-expo-world-hud-radar="true"
          style={{ position: 'absolute', bottom: '26px', left: '26px', zIndex: 100, width: `${radarSize}px`, height: `${radarSize}px`, background: `linear-gradient(180deg, ${visualProfile.global.hudPanel}, rgba(15, 23, 42, 0.7))`, borderRadius: '50%', border: `1px solid ${visualProfile.global.hudAccent}44`, overflow: 'hidden', backdropFilter: 'blur(10px)', boxShadow: '0 18px 48px rgba(0,0,0,0.45)' }}
        >
          <div style={{ width: '100%', height: '100%', position: 'relative', background: `radial-gradient(circle at center, ${visualProfile.global.hudAccent}30 0%, rgba(15, 23, 42, 0.04) 70%)` }}>
            <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
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
            <div style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (playerPos[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (playerPos[0] / 200) * 100, 5), 95)}%`, width: '10px', height: '10px', background: isSpeaking ? '#10b981' : '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: isSpeaking ? '0 0 15px #10b981' : '0 0 14px rgba(255,255,255,0.24)' }} />
            {guests.map((guest) => (
              <div key={guest.id} style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (guest.position[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (guest.position[0] / 200) * 100, 5), 95)}%`, width: '8px', height: '8px', background: guest.isSpeaking ? '#10b981' : (guest.color || '#3b82f6'), borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: guest.isSpeaking ? '0 0 10px #10b981' : 'none' }} />
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
      )}

      {isTouchDevice && onMoveTouch && (
        <div
          style={{
            position: 'absolute',
            left: '24px',
            bottom: '24px',
            zIndex: 111,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            ref={joystickRef}
            onTouchStart={(event) => {
              event.preventDefault();
              const touch = event.touches[0];
              if (!touch) return;
              updateJoystickIntent(touch.clientX, touch.clientY);
            }}
            onTouchMove={(event) => {
              event.preventDefault();
              const touch = event.touches[0];
              if (!touch) return;
              updateJoystickIntent(touch.clientX, touch.clientY);
            }}
            onTouchEnd={(event) => {
              event.preventDefault();
              resetJoystickIntent();
            }}
            onTouchCancel={(event) => {
              event.preventDefault();
              resetJoystickIntent();
            }}
            onMouseDown={(event) => updateJoystickIntent(event.clientX, event.clientY)}
            onMouseMove={(event) => {
              if ((event.buttons & 1) !== 1) {
                return;
              }
              updateJoystickIntent(event.clientX, event.clientY);
            }}
            onMouseUp={resetJoystickIntent}
            onMouseLeave={resetJoystickIntent}
            style={{
              ...primaryPanelStyle,
              width: '172px',
              height: '172px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              touchAction: 'none',
              userSelect: 'none',
              background: 'radial-gradient(circle at center, rgba(248, 250, 252, 0.08) 0%, rgba(15, 23, 42, 0.82) 72%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                borderRadius: '999px',
                border: '1px dashed rgba(148, 163, 184, 0.38)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '68px',
                height: '68px',
                borderRadius: '999px',
                transform: `translate(calc(-50% + ${joystickOffset.x}px), calc(-50% + ${joystickOffset.y}px))`,
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(203, 213, 225, 0.92))',
                boxShadow: '0 10px 26px rgba(2, 6, 23, 0.38)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            />
          </div>
          <button
            onTouchStart={(event) => {
              event.preventDefault();
              setSprintActive(true);
            }}
            onTouchEnd={(event) => {
              event.preventDefault();
              setSprintActive(false);
            }}
            onTouchCancel={(event) => {
              event.preventDefault();
              setSprintActive(false);
            }}
            onMouseDown={() => setSprintActive(true)}
            onMouseUp={() => setSprintActive(false)}
            onMouseLeave={() => setSprintActive(false)}
            style={{
              ...primaryPanelStyle,
              padding: '8px 14px',
              minWidth: '104px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontWeight: 900,
              letterSpacing: '0.08em',
              background: isSprintActive
                ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.86), rgba(185, 28, 28, 0.82))'
                : primaryPanelStyle.background,
            }}
          >
            SPRINT
          </button>
        </div>
      )}
    </>
  );
}
