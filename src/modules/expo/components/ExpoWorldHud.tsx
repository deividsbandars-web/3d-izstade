import type { CSSProperties } from 'react';
import { EXPO_CITY_QUALITY_TIER, EXPO_MODE_COPY } from '../state/expoRuntime';

interface ExpoWorldHudProps {
  debug: boolean;
  guests: any[];
  isMicOn: boolean;
  isSpeaking: boolean;
  playerPos: number[];
  onToggleMic: () => void;
  onToggleDebug: () => void;
  onExit: () => void;
}

export function ExpoWorldHud({
  debug,
  guests,
  isMicOn,
  isSpeaking,
  playerPos,
  onToggleMic,
  onToggleDebug,
  onExit,
}: ExpoWorldHudProps) {
  const primaryPanelStyle: CSSProperties = {
    backdropFilter: 'blur(14px)',
    background: 'linear-gradient(180deg, rgba(5, 10, 18, 0.82), rgba(15, 23, 42, 0.72))',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '18px',
    boxShadow: '0 18px 48px rgba(2, 6, 23, 0.38)',
    color: '#f8fafc',
  };

  return (
    <>
      <div style={{ position: 'absolute', top: '26px', right: '26px', zIndex: 100, display: 'flex', gap: '14px', alignItems: 'stretch' }}>
        <div style={{ ...primaryPanelStyle, minWidth: '280px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.66rem', letterSpacing: '0.2em', fontWeight: 800, color: '#7dd3fc' }}>WARPALA EXPO CITY</div>
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
            <div style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.14)', color: '#bae6fd', fontWeight: 700, fontSize: '0.75rem' }}>
              QUALITY {EXPO_CITY_QUALITY_TIER.toUpperCase()}
            </div>
            <div style={{ padding: '7px 11px', borderRadius: '999px', background: isSpeaking ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)', color: isSpeaking ? '#86efac' : '#cbd5e1', fontWeight: 700, fontSize: '0.75rem' }}>
              {isSpeaking ? 'VOICE LIVE' : 'VOICE READY'}
            </div>
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
          style={{ ...primaryPanelStyle, background: debug ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.92), rgba(153, 27, 27, 0.9))' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.9))', padding: '0 16px', minWidth: '118px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.08em' }}
        >
          {debug ? 'DEBUG ON' : 'DEBUG OFF'}
        </button>
        <div style={{ ...primaryPanelStyle, padding: '14px 18px', minWidth: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.64rem', letterSpacing: '0.16em', color: '#94a3b8', fontWeight: 800 }}>WAYFINDING</div>
          <div style={{ marginTop: '3px', fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc' }}>Follow the main sponsor axis</div>
        </div>
        <button onClick={onExit} style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)', padding: '0 22px', borderRadius: '16px', border: 'none', fontWeight: 800, cursor: 'pointer', color: '#0f172a', boxShadow: '0 14px 32px rgba(226, 232, 240, 0.18)' }}>
          {EXPO_MODE_COPY.exitToLobby}
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '26px', left: '26px', zIndex: 100, width: '220px', height: '220px', background: 'linear-gradient(180deg, rgba(5, 10, 18, 0.82), rgba(15, 23, 42, 0.7))', borderRadius: '50%', border: '1px solid rgba(125, 211, 252, 0.28)', overflow: 'hidden', backdropFilter: 'blur(10px)', boxShadow: '0 18px 48px rgba(0,0,0,0.45)' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.22) 0%, rgba(15, 23, 42, 0.04) 70%)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (playerPos[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (playerPos[0] / 200) * 100, 5), 95)}%`, width: '10px', height: '10px', background: isSpeaking ? '#10b981' : '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: isSpeaking ? '0 0 15px #10b981' : 'none' }}></div>
          {guests.map((guest) => (
            <div key={guest.id} style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (guest.position[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (guest.position[0] / 200) * 100, 5), 95)}%`, width: '8px', height: '8px', background: guest.isSpeaking ? '#10b981' : (guest.color || '#3b82f6'), borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: guest.isSpeaking ? '0 0 10px #10b981' : 'none' }}></div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: '18px', width: '100%', textAlign: 'center', fontSize: '0.68rem', color: '#7dd3fc', fontWeight: 900, letterSpacing: '0.18em' }}>
          LIVE DISTRICT RADAR
        </div>
        <div style={{ position: 'absolute', bottom: '12px', width: '100%', textAlign: 'center', fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 800, letterSpacing: '0.08em' }}>
          POSITION {Math.round(playerPos[0])}, {Math.round(playerPos[2])}
        </div>
      </div>
    </>
  );
}


