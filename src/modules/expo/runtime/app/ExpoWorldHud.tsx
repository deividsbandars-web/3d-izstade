import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { EXPO_CITY_QUALITY_TIER, EXPO_MODE_COPY, type ExpoMode } from '../../state/expoRuntime';
import type { ExpoSectorMarker } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';
import { EXPO_MOBILE_MOVE_IDLE, type ExpoMobileMoveIntent } from './useExpoRuntimeSession';

interface ExpoWorldHudProps {
  guests: any[];
  isMicOn: boolean;
  isSpeaking: boolean;
  isTouchDevice?: boolean;
  mode: ExpoMode;
  nearbyBooth?: {
    distance: number;
    id: string;
    label: string;
    sectorName?: string | null;
  } | null;
  onMoveTouch?: (intent: ExpoMobileMoveIntent) => void;
  onOpenNearbyBooth?: (boothId: string) => void;
  operatorBuildStamp?: string | null;
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
  mode,
  nearbyBooth = null,
  onMoveTouch,
  onOpenNearbyBooth,
  operatorBuildStamp = null,
  playerPos,
  sectorMarkers,
  visualProfile,
  onToggleMic,
  onExit,
}: ExpoWorldHudProps) {
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });
  const [isAutoWalkActive, setIsAutoWalkActive] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [mobileGuideDismissed, setMobileGuideDismissed] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const lookPadRef = useRef<HTMLDivElement | null>(null);
  const lookAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const mobileIntentRef = useRef<ExpoMobileMoveIntent>(EXPO_MOBILE_MOVE_IDLE);
  const isWalkMode = mode === 'walk';
  const radarSize = isTouchDevice ? 156 : 208;
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

  useEffect(() => {
    if (!isWalkMode && isAutoWalkActive) {
      setIsAutoWalkActive(false);
    }
  }, [isAutoWalkActive, isWalkMode]);

  const emitMobileIntent = (partial: Partial<ExpoMobileMoveIntent>) => {
    if (!onMoveTouch) {
      return;
    }

    mobileIntentRef.current = {
      ...mobileIntentRef.current,
      ...partial,
    };
    onMoveTouch(mobileIntentRef.current);
  };

  const emitJoystickIntent = (offsetX: number, offsetY: number, sprint: boolean) => {
    if (!onMoveTouch || !joystickRef.current) {
      return;
    }

    const maxRadius = joystickRef.current.getBoundingClientRect().width * 0.28;
    const threshold = maxRadius * 0.35;
    emitMobileIntent({
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

    if (isAutoWalkActive) {
      setIsAutoWalkActive(false);
    }
    setJoystickOffset({ x: offsetX, y: offsetY });
    setMobileGuideDismissed(true);
    emitMobileIntent({
      f: offsetY < -threshold,
      b: offsetY > threshold,
      l: offsetX < -threshold,
      r: offsetX > threshold,
      s: isSprintActive,
    });
  };

  const resetJoystickIntent = () => {
    setJoystickOffset({ x: 0, y: 0 });
    emitMobileIntent({ f: isAutoWalkActive, b: false, l: false, r: false, s: isSprintActive });
  };

  const setSprintActive = (active: boolean) => {
    setIsSprintActive(active);
    if (isAutoWalkActive) {
      emitMobileIntent({ f: true, b: false, l: false, r: false, s: active });
      return;
    }

    emitJoystickIntent(joystickOffset.x, joystickOffset.y, active);
  };

  const setAutoWalkActive = (active: boolean) => {
    setIsAutoWalkActive(active);
    setMobileGuideDismissed(true);
    setJoystickOffset({ x: 0, y: active ? -30 : 0 });
    emitMobileIntent({ f: active, b: false, l: false, r: false, s: isSprintActive });
  };

  const updateLookIntent = (clientX: number, clientY: number, options?: { start?: boolean }) => {
    if (!lookPadRef.current || !onMoveTouch) {
      return;
    }

    const rect = lookPadRef.current.getBoundingClientRect();
    if (options?.start || !lookAnchorRef.current) {
      lookAnchorRef.current = { x: clientX, y: clientY };
    }

    const anchor = lookAnchorRef.current;
    const rawX = clientX - anchor.x;
    const maxX = Math.max(44, Math.min(96, rect.width * 0.22));
    const offsetX = Math.max(-maxX, Math.min(maxX, rawX));
    const lookX = Math.abs(offsetX) < maxX * 0.1 ? 0 : offsetX / maxX;

    setMobileGuideDismissed(true);
    emitMobileIntent({
      lookX,
      turnL: lookX < -0.08,
      turnR: lookX > 0.08,
    });
  };

  const resetLookIntent = () => {
    lookAnchorRef.current = null;
    emitMobileIntent({ lookX: 0, turnL: false, turnR: false });
  };

  const pulseMobileAction = (key: 'jump' | 'lift', active: boolean) => {
    setMobileGuideDismissed(true);
    emitMobileIntent({ [key]: active } as Partial<ExpoMobileMoveIntent>);
  };

  return (
    <>
      {operatorBuildStamp && (
        <div
          data-expo-operator-build-stamp="true"
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            zIndex: 3000,
            padding: '8px 11px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.46)',
            background: 'rgba(2, 6, 23, 0.82)',
            boxShadow: '0 10px 26px rgba(2, 6, 23, 0.36)',
            color: '#bae6fd',
            fontSize: '0.62rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            pointerEvents: 'none',
            textTransform: 'uppercase',
          }}
        >
          BUILD {operatorBuildStamp}
        </div>
      )}

      {isTouchDevice && (
        <>
          <button
            onClick={() => setMobileMapOpen((value) => !value)}
            style={{
              position: 'absolute',
              top: 'max(14px, env(safe-area-inset-top))',
              right: '76px',
              zIndex: 112,
              width: '50px',
              height: '50px',
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
              top: 'max(14px, env(safe-area-inset-top))',
              right: '14px',
              zIndex: 112,
              width: '50px',
              height: '50px',
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
          {!mobileGuideDismissed && !mobileOptionsOpen && !mobileMapOpen && (
            <button
              type="button"
              onClick={() => setMobileGuideDismissed(true)}
              style={{
                ...primaryPanelStyle,
                position: 'absolute',
                top: 'max(72px, calc(env(safe-area-inset-top) + 68px))',
                left: '14px',
                right: '14px',
                zIndex: 109,
                padding: '9px 12px',
                borderRadius: '16px',
                color: '#e2f3ff',
                fontSize: '0.72rem',
                fontWeight: 850,
                letterSpacing: '0.04em',
                lineHeight: 1.35,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {isWalkMode
                ? 'LEFT STICK MOVE | SWIPE RIGHT SIDE TO LOOK | AUTO WALK | JUMP/LIFT'
                : 'DRAG TO ORBIT | PINCH TO ZOOM | MAP shows nearest zones'}
            </button>
          )}
        </>
      )}

      {(!isTouchDevice || mobileOptionsOpen) && (
        <div
          data-expo-world-hud-top="true"
          style={isTouchDevice
            ? {
              position: 'absolute',
              top: 'max(74px, calc(env(safe-area-inset-top) + 70px))',
              left: '12px',
              right: '12px',
              zIndex: 111,
              display: 'grid',
              gap: '8px',
              maxHeight: '42vh',
              overflowY: 'auto',
            }
            : { position: 'absolute', top: '26px', right: '26px', zIndex: 100, display: 'flex', gap: '14px', alignItems: 'stretch', maxWidth: 'calc(100vw - 52px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <div style={{ ...primaryPanelStyle, minWidth: isTouchDevice ? 0 : '280px', padding: isTouchDevice ? '11px 12px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: isTouchDevice ? '7px' : '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: isTouchDevice ? '0.56rem' : '0.66rem', letterSpacing: '0.2em', fontWeight: 800, color: visualProfile.global.hudAccent }}>WARPALA EXPO CITY</div>
                <div style={{ fontSize: isTouchDevice ? '0.92rem' : '1.02rem', fontWeight: 800, color: '#f8fafc' }}>Sponsor Boulevard Live</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.14)', color: '#86efac', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                ONLINE {guests.length + 1}
              </div>
            </div>
            <div style={{ display: 'flex', gap: isTouchDevice ? '6px' : '10px', flexWrap: 'wrap' }}>
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
                WASD MOVE | MOUSE LOOK | Q/E OR LEFT/RIGHT TURN | F LIFT | SPACE JUMP/MANTLE
              </div>
            )}
          </div>

          <button
            onClick={onToggleMic}
            style={{ ...primaryPanelStyle, background: isMicOn ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.88))' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.9))', padding: isTouchDevice ? '13px 14px' : '0 18px', minWidth: isTouchDevice ? 0 : '120px', minHeight: isTouchDevice ? '48px' : undefined, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.08em' }}
          >
            {isMicOn ? 'MIC ON' : 'MIC OFF'}
          </button>

          <div style={{ ...primaryPanelStyle, padding: isTouchDevice ? '11px 12px' : '14px 18px', minWidth: isTouchDevice ? 0 : '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

          <button onClick={onExit} style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)', padding: isTouchDevice ? '13px 14px' : '0 22px', minHeight: isTouchDevice ? '48px' : undefined, borderRadius: '16px', border: 'none', fontWeight: 800, cursor: 'pointer', color: '#0f172a', boxShadow: '0 14px 32px rgba(226, 232, 240, 0.18)' }}>
            {EXPO_MODE_COPY.exitToLobby}
          </button>
        </div>
      )}

      {!isTouchDevice && (
        <div
          data-expo-world-hud-radar="true"
          style={{
            position: 'absolute',
            bottom: isTouchDevice ? 'auto' : '26px',
            left: isTouchDevice ? '14px' : '26px',
            top: isTouchDevice ? 'max(74px, calc(env(safe-area-inset-top) + 70px))' : 'auto',
            zIndex: isTouchDevice ? 111 : 100,
            width: `${radarSize}px`,
            height: `${radarSize}px`,
            background: `linear-gradient(180deg, ${visualProfile.global.hudPanel}, rgba(15, 23, 42, 0.7))`,
            borderRadius: '50%',
            border: `1px solid ${visualProfile.global.hudAccent}44`,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
          }}
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

      {isTouchDevice && mobileMapOpen && (
        <div
          data-expo-mobile-map-sheet="true"
          style={{
            ...primaryPanelStyle,
            position: 'absolute',
            left: '10px',
            right: '10px',
            bottom: 'max(10px, env(safe-area-inset-bottom))',
            zIndex: 114,
            maxHeight: '46dvh',
            overflowY: 'auto',
            padding: '14px',
            borderRadius: '22px 22px 16px 16px',
            background: `linear-gradient(180deg, ${visualProfile.global.hudPanel}, rgba(2, 6, 23, 0.88))`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ color: visualProfile.global.hudAccent, fontSize: '0.62rem', fontWeight: 950, letterSpacing: '0.16em' }}>MOBILE MAP</div>
              <div style={{ marginTop: '4px', color: '#f8fafc', fontSize: '1rem', fontWeight: 900 }}>Nearest zones</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMapOpen(false)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(15, 23, 42, 0.72)',
                color: '#f8fafc',
                fontWeight: 950,
              }}
            >
              X
            </button>
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
            {orderedMarkers.slice(0, 5).map((marker) => {
              const distance = Math.round(Math.hypot(marker.position[0] - playerPos[0], marker.position[2] - playerPos[2]));
              return (
                <div
                  key={marker.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: 'rgba(15, 23, 42, 0.62)',
                    border: `1px solid ${marker.color}44`,
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: marker.color, boxShadow: `0 0 12px ${marker.color}` }} />
                  <span style={{ minWidth: 0, color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {marker.label}
                  </span>
                  <span style={{ color: marker.color, fontSize: '0.76rem', fontWeight: 950 }}>{distance}u</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isTouchDevice && onMoveTouch && isWalkMode && (
        <>
        <div
          ref={lookPadRef}
          onTouchStart={(event) => {
            event.preventDefault();
            const touch = event.touches[0];
            if (!touch) return;
            updateLookIntent(touch.clientX, touch.clientY, { start: true });
          }}
          onTouchMove={(event) => {
            event.preventDefault();
            const touch = event.touches[0];
            if (!touch) return;
            updateLookIntent(touch.clientX, touch.clientY);
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            resetLookIntent();
          }}
          onTouchCancel={(event) => {
            event.preventDefault();
            resetLookIntent();
          }}
          style={{
            position: 'absolute',
            top: 'max(82px, calc(env(safe-area-inset-top) + 78px))',
            right: 0,
            bottom: 'max(116px, calc(env(safe-area-inset-bottom) + 112px))',
            width: '58vw',
            zIndex: 108,
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '16px',
              bottom: '12px',
              padding: '7px 10px',
              borderRadius: '999px',
              background: 'rgba(2, 6, 23, 0.36)',
              border: '1px solid rgba(186, 230, 253, 0.18)',
              color: '#bae6fd',
              fontSize: '0.58rem',
              fontWeight: 950,
              letterSpacing: '0.12em',
              opacity: mobileGuideDismissed ? 0.32 : 0.78,
              pointerEvents: 'none',
            }}
          >
            SWIPE LOOK
          </div>
        </div>
        {nearbyBooth && onOpenNearbyBooth && !mobileMapOpen && !mobileOptionsOpen && (
          <button
            type="button"
            onClick={() => onOpenNearbyBooth(nearbyBooth.id)}
            style={{
              ...primaryPanelStyle,
              position: 'absolute',
              left: '50%',
              bottom: 'max(178px, calc(env(safe-area-inset-bottom) + 174px))',
              zIndex: 113,
              width: 'min(330px, calc(100vw - 32px))',
              transform: 'translateX(-50%)',
              padding: '11px 14px',
              borderRadius: '18px',
              border: `1px solid ${visualProfile.global.hudAccent}66`,
              background: `linear-gradient(180deg, ${visualProfile.global.hudAccent}2e, rgba(2, 6, 23, 0.78))`,
              color: '#f8fafc',
              textAlign: 'left',
            }}
          >
            <div style={{ color: visualProfile.global.hudAccent, fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em' }}>NEARBY BOOTH</div>
            <div style={{ marginTop: '3px', display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem', fontWeight: 950 }}>
                OPEN {nearbyBooth.label}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 850 }}>{nearbyBooth.distance}u</span>
            </div>
          </button>
        )}
        <div
          style={{
            position: 'absolute',
            left: 'max(14px, env(safe-area-inset-left))',
            bottom: 'max(14px, env(safe-area-inset-bottom))',
            zIndex: 111,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
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
              width: '148px',
              height: '148px',
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
                width: '58px',
                height: '58px',
                borderRadius: '999px',
                transform: `translate(calc(-50% + ${joystickOffset.x}px), calc(-50% + ${joystickOffset.y}px))`,
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(203, 213, 225, 0.92))',
                boxShadow: '0 10px 26px rgba(2, 6, 23, 0.38)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
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
                padding: '8px 12px',
                minWidth: '86px',
                minHeight: '52px',
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
            <button
              type="button"
              onClick={() => setAutoWalkActive(!isAutoWalkActive)}
              style={{
                ...primaryPanelStyle,
                padding: '8px 12px',
                minWidth: '86px',
                minHeight: '52px',
                borderRadius: '999px',
                border: isAutoWalkActive ? '1px solid rgba(45, 212, 191, 0.48)' : '1px solid rgba(255,255,255,0.08)',
                fontWeight: 950,
                letterSpacing: '0.08em',
                background: isAutoWalkActive
                  ? 'linear-gradient(180deg, rgba(20, 184, 166, 0.9), rgba(13, 148, 136, 0.84))'
                  : primaryPanelStyle.background,
              }}
            >
              AUTO
            </button>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 'max(14px, env(safe-area-inset-right))',
            bottom: 'max(14px, env(safe-area-inset-bottom))',
            zIndex: 111,
            display: 'grid',
            gap: '10px',
            justifyItems: 'end',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onTouchStart={(event) => { event.preventDefault(); pulseMobileAction('jump', true); }}
              onTouchEnd={(event) => { event.preventDefault(); pulseMobileAction('jump', false); }}
              onTouchCancel={(event) => { event.preventDefault(); pulseMobileAction('jump', false); }}
              onMouseDown={() => pulseMobileAction('jump', true)}
              onMouseUp={() => pulseMobileAction('jump', false)}
              onMouseLeave={() => pulseMobileAction('jump', false)}
              style={{
                ...primaryPanelStyle,
                width: '78px',
                height: '62px',
                borderRadius: '20px',
                border: '1px solid rgba(125, 211, 252, 0.24)',
                background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.86), rgba(2, 132, 199, 0.86))',
                color: '#effaff',
                fontSize: '0.78rem',
                fontWeight: 950,
                letterSpacing: '0.08em',
              }}
            >
              JUMP
            </button>
            <button
              type="button"
              onTouchStart={(event) => { event.preventDefault(); pulseMobileAction('lift', true); }}
              onTouchEnd={(event) => { event.preventDefault(); pulseMobileAction('lift', false); }}
              onTouchCancel={(event) => { event.preventDefault(); pulseMobileAction('lift', false); }}
              onMouseDown={() => pulseMobileAction('lift', true)}
              onMouseUp={() => pulseMobileAction('lift', false)}
              onMouseLeave={() => pulseMobileAction('lift', false)}
              style={{
                ...primaryPanelStyle,
                width: '70px',
                height: '62px',
                borderRadius: '20px',
                border: '1px solid rgba(251, 191, 36, 0.26)',
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.86), rgba(180, 83, 9, 0.84))',
                color: '#fff7ed',
                fontSize: '0.78rem',
                fontWeight: 950,
                letterSpacing: '0.08em',
              }}
            >
              LIFT
            </button>
          </div>
        </div>
        </>
      )}
    </>
  );
}
