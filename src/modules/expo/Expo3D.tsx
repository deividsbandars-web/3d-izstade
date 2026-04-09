import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZoneSystem } from '../../hooks/useZoneSystem';
import { ExpoLobby } from './components/ExpoLobby';
import { ExpoWorldHud } from './components/ExpoWorldHud';
import { Expo3DLoader, ExpoWorldScene } from './components/ExpoWorldScene';
import { useExpoPresence } from './hooks/useExpoPresence';
import { useExpoSceneData } from './hooks/useExpoSceneData';
import { usePixelStreamingStatus } from './hooks/usePixelStreamingStatus';
import PixelStreamingViewer from './PixelStreamingViewer';
import { reportExpoDevError } from './lib/devErrorReporter';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from './state/expoRuntime';
import { buildExpoWorldContract } from './world-contract';

function isExpoIgnorablePointerLockError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';

  return message.includes('Pointer lock cannot be acquired immediately after the user has exited the lock')
    || message.includes('Target Element removed from DOM');
}

export default function Expo3D() {
  const [mode, setMode] = useState<ExpoMode>('menu');
  const [debug, setDebug] = useState(EXPO_DEBUG_DEFAULT);
  const [mobileMoveIntent, setMobileMoveIntent] = useState({ f: false, b: false, l: false, r: false });

  const nav = useNavigate();
  const { data, isLoading } = useExpoSceneData();
  const worldContract = useMemo(() => buildExpoWorldContract(data), [data]);
  const pixelStreamingStatus = usePixelStreamingStatus();
  const { guests, playerPos, isMicOn, isSpeaking, setIsMicOn, handlePlayerMove } = useExpoPresence(mode);
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const onError = (event: ErrorEvent) => {
      reportExpoDevError('window.error', event.error ?? event.message, {
        colno: event.colno,
        filename: event.filename,
        lineno: event.lineno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isExpoIgnorablePointerLockError(event.reason)) {
        event.preventDefault();
        return;
      }
      reportExpoDevError('window.unhandledrejection', event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

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
            isTouchDevice={isTouchDevice}
            onMoveTouch={setMobileMoveIntent}
            playerPos={playerPos}
            sectorMarkers={worldContract.sectorMarkers}
            visualProfile={worldContract.visualProfile}
            onToggleMic={() => setIsMicOn((value) => !value)}
            onToggleDebug={() => setDebug((value) => !value)}
            onExit={() => {
              document.exitPointerLock();
              setMode('menu');
            }}
          />
          <ExpoWorldScene
            activeZone={activeZone}
            debug={debug}
            guests={guests}
            mobileMoveIntent={mobileMoveIntent}
            mode={mode}
            onMove={handlePlayerMove}
            sceneVersion={data?.sceneVersion ? String(data.sceneVersion) : null}
            worldContract={worldContract}
            zoneSystem={zoneSystem}
          />
        </>
      )}
    </div>
  );
}
