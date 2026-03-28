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
  return (
    <>
      <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 100, display: 'flex', gap: '15px' }}>
        <button
          onClick={onToggleMic}
          style={{ background: isMicOn ? '#10b981' : 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {isMicOn ? 'MIC ON' : 'MIC OFF'}
        </button>
        <button
          onClick={onToggleDebug}
          style={{ background: debug ? '#ef4444' : 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          DEBUG: {debug ? 'ON' : 'OFF'}
        </button>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px 20px', borderRadius: '10px', color: '#10b981', fontWeight: 'bold' }}>
          ONLINE: {guests.length + 1}
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px 20px', borderRadius: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>
          {EXPO_MODE_COPY.publicModeBadge}
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.18)', padding: '12px 20px', borderRadius: '10px', color: '#bfdbfe', fontWeight: 'bold' }}>
          QUALITY: {EXPO_CITY_QUALITY_TIER.toUpperCase()}
        </div>
        <button onClick={onExit} style={{ background: 'white', padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {EXPO_MODE_COPY.exitToLobby}
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 100, width: '200px', height: '200px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '50%', border: '2px solid rgba(59, 130, 246, 0.5)', overflow: 'hidden', backdropFilter: 'blur(5px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (playerPos[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (playerPos[0] / 200) * 100, 5), 95)}%`, width: '10px', height: '10px', background: isSpeaking ? '#10b981' : '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: isSpeaking ? '0 0 15px #10b981' : 'none' }}></div>
          {guests.map((guest) => (
            <div key={guest.id} style={{ position: 'absolute', top: `${Math.min(Math.max(50 + (guest.position[2] / 1000) * 100, 5), 95)}%`, left: `${Math.min(Math.max(50 + (guest.position[0] / 200) * 100, 5), 95)}%`, width: '8px', height: '8px', background: guest.isSpeaking ? '#10b981' : (guest.color || '#3b82f6'), borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: guest.isSpeaking ? '0 0 10px #10b981' : 'none' }}></div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px' }}>
          GPS: {Math.round(playerPos[0])}, {Math.round(playerPos[2])}
        </div>
      </div>
    </>
  );
}


