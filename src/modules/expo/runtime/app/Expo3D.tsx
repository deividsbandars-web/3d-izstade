import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZoneSystem } from '../../../../hooks/useZoneSystem';
import { ExpoLobby } from '../../components/ExpoLobby';
import { ExpoWorldHud } from './ExpoWorldHud';
import { Expo3DLoader, ExpoWorldScene } from '../world';
import { useExpoPresence } from '../../hooks/useExpoPresence';
import { useExpoSceneData } from '../../hooks/useExpoSceneData';
import { usePixelStreamingStatus } from '../../hooks/usePixelStreamingStatus';
import PixelStreamingViewer from '../../PixelStreamingViewer';
import { reportExpoDevError } from '../../lib/devErrorReporter';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from '../../state/expoRuntime';
import type { ExpoStartView } from '../../world-contract';
import { buildExpoWorldContract } from '../../world-contract';

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
  const [devFocusSlug, setDevFocusSlug] = useState<string | null>('__use_url__');
  const [devLayerStates, setDevLayerStates] = useState({
    booths: true,
    city: true,
    promenade: true,
    skyline: true,
    stadium: true,
  });

  const nav = useNavigate();
  const { data, isLoading } = useExpoSceneData();
  const worldContract = useMemo(() => buildExpoWorldContract(data), [data]);
  const initialUrlFocus = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('focus');
  }, []);
  const effectiveFocusSlug = devFocusSlug === '__use_url__' ? initialUrlFocus : devFocusSlug;
  const focusStartView = useMemo<ExpoStartView | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const focus = effectiveFocusSlug;
    if (!focus) {
      return null;
    }

    const normalizedFocus = focus.trim().toLowerCase();
    const placement = worldContract.boothPlacements.find((entry) => {
      const companySlug = String(entry.company?.slug || '').toLowerCase();
      const companyId = String(entry.company?.id || '').toLowerCase();
      const boothSlug = String((entry.company?.booth as { slug?: string | null } | null)?.slug || '').toLowerCase();
      return companySlug === normalizedFocus || companyId === normalizedFocus || boothSlug === normalizedFocus;
    });

    if (!placement) {
      return null;
    }

    const yaw = placement.rotation?.[1] ?? 0;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    return {
      lookAt: [placement.position[0], 3.4, placement.position[2]],
      position: [
        placement.position[0] - (forwardX * 34),
        5,
        placement.position[2] - (forwardZ * 34),
      ],
      source: 'arrival-main',
    };
  }, [effectiveFocusSlug, worldContract.boothPlacements]);
  const verificationTargets = useMemo(() => {
    const hero = worldContract.boothPlacements.find((entry) => String(entry.company?.sponsorTier || '').toLowerCase() === 'hero');
    const elite = worldContract.boothPlacements.find((entry) => String(entry.company?.sponsorTier || '').toLowerCase() === 'platinum');
    const premium = worldContract.boothPlacements.find((entry) => {
      const tier = String(entry.company?.sponsorTier || '').toLowerCase();
      return tier === 'gold' || tier === 'premium';
    });
    return { elite, hero, premium };
  }, [worldContract.boothPlacements]);
  const focusedPlacement = useMemo(() => {
    if (!effectiveFocusSlug) {
      return null;
    }

    const normalizedFocus = effectiveFocusSlug.trim().toLowerCase();
    return worldContract.boothPlacements.find((entry) => {
      const companySlug = String(entry.company?.slug || '').toLowerCase();
      const companyId = String(entry.company?.id || '').toLowerCase();
      const boothSlug = String((entry.company?.booth as { slug?: string | null } | null)?.slug || '').toLowerCase();
      return companySlug === normalizedFocus || companyId === normalizedFocus || boothSlug === normalizedFocus;
    }) ?? null;
  }, [effectiveFocusSlug, worldContract.boothPlacements]);
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
            devVerification={import.meta.env.DEV ? {
              companyCount: worldContract.boothPlacements.length,
              dataMode: effectiveFocusSlug === initialUrlFocus ? 'seeded-local' : 'seeded-local',
              focusedName: focusedPlacement?.company?.name ?? null,
              focusedSlug: focusedPlacement?.company?.slug ?? effectiveFocusSlug ?? null,
              focusedTier: focusedPlacement?.company?.sponsorTier ?? null,
              layerStates: devLayerStates,
              onToggleLayer: (layer) => setDevLayerStates((value) => ({ ...value, [layer]: !value[layer] })),
              renderMarker: 'LOCAL-VERIFY-V2',
              sceneVersion: data?.sceneVersion ? String(data.sceneVersion) : null,
              onClearFocus: () => setDevFocusSlug(''),
              onFocusElite: verificationTargets.elite ? () => setDevFocusSlug(String(verificationTargets.elite?.company?.slug || verificationTargets.elite?.company?.id || '')) : undefined,
              onFocusHero: verificationTargets.hero ? () => setDevFocusSlug(String(verificationTargets.hero?.company?.slug || verificationTargets.hero?.company?.id || '')) : undefined,
              onFocusPremium: verificationTargets.premium ? () => setDevFocusSlug(String(verificationTargets.premium?.company?.slug || verificationTargets.premium?.company?.id || '')) : undefined,
            } : null}
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
            startViewOverride={focusStartView}
            runtimeLayerToggles={import.meta.env.DEV ? devLayerStates : undefined}
            worldContract={worldContract}
            zoneSystem={zoneSystem}
          />
        </>
      )}
    </div>
  );
}
