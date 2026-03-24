import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZoneSystem } from '../../hooks/useZoneSystem';
import { ExpoLobby } from './components/ExpoLobby';
import { ExpoWorldHud } from './components/ExpoWorldHud';
import { Expo3DLoader, ExpoWorldScene } from './components/ExpoWorldScene';
import { useExpoPresence } from './hooks/useExpoPresence';
import { useExpoSceneData } from './hooks/useExpoSceneData';
import { usePixelStreamingStatus } from './hooks/usePixelStreamingStatus';
import PixelStreamingViewer from './PixelStreamingViewer';
import type { ExpoMode } from './state/expoRuntime';

export default function Expo3D() {
  const [mode, setMode] = useState<ExpoMode>('menu');
  const [debug, setDebug] = useState(false);

  const nav = useNavigate();
  const { data, isLoading } = useExpoSceneData();
  const pixelStreamingStatus = usePixelStreamingStatus();
  const { guests, playerPos, isMicOn, isSpeaking, setIsMicOn, handlePlayerMove } = useExpoPresence(mode);
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);

  if (isLoading) return <Expo3DLoader />;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      {mode === 'menu' && (
        <ExpoLobby
          onSelectMode={(nextMode) => {
            if (nextMode === 'unreal' && !pixelStreamingStatus.isAvailable) {
              return;
            }

            setMode(nextMode);
          }}
          onBack={() => nav('/')}
          premiumAvailability={pixelStreamingStatus.availability}
          premiumSignalingUrl={pixelStreamingStatus.config.signalingUrl}
          premiumRuntimeStatus={pixelStreamingStatus.runtimeStatus}
        />
      )}

      {mode === 'unreal' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000 }}>
          <PixelStreamingViewer
            availability={pixelStreamingStatus.availability}
            config={pixelStreamingStatus.config}
            runtimeStatus={pixelStreamingStatus.runtimeStatus}
            onClose={() => setMode('menu')}
          />
        </div>
      )}

      {mode !== 'menu' && mode !== 'unreal' && (
        <>
          <ExpoWorldHud
            debug={debug}
            guests={guests}
            isMicOn={isMicOn}
            isSpeaking={isSpeaking}
            playerPos={playerPos}
            onToggleMic={() => setIsMicOn((value) => !value)}
            onToggleDebug={() => setDebug((value) => !value)}
            onExit={() => {
              document.exitPointerLock();
              setMode('menu');
            }}
          />
          <ExpoWorldScene
            activeZone={activeZone}
            data={data}
            debug={debug}
            guests={guests}
            mode={mode}
            onMove={handlePlayerMove}
            zoneSystem={zoneSystem}
          />
        </>
      )}
    </div>
  );
}
