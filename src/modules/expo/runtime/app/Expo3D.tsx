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

const LOCAL_BUILD_STAMP = `LOCAL-${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

function detectTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)').matches ?? false;
  const maxTouchPoints = navigator.maxTouchPoints > 0;
  const touchStart = 'ontouchstart' in window;
  const mobileUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

  return coarsePointer || noHover || maxTouchPoints || touchStart || mobileUA;
}

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
  const [mobileMoveIntent, setMobileMoveIntent] = useState({ f: false, b: false, l: false, r: false, s: false });
  const [devClickTarget, setDevClickTarget] = useState<string | null>(null);
  const [devClickStack, setDevClickStack] = useState<string[]>([]);
  const [devFocusSlug, setDevFocusSlug] = useState<string | null>('__use_url__');
  const [devCenterTarget, setDevCenterTarget] = useState<string | null>(null);
  const [devCenterStack, setDevCenterStack] = useState<string[]>([]);
  const [markedPoint, setMarkedPoint] = useState<[number, number, number] | null>(null);
  const [targetBasket, setTargetBasket] = useState<string[]>([]);
  const [devLayerStates, setDevLayerStates] = useState({
    booths: true,
    city: true,
    promenade: true,
    skyline: true,
    stadium: true,
  });
  const [devSectionStates, setDevSectionStates] = useState({
    arrival: true,
    left: true,
    middle: true,
    right: true,
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
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice());
  const inspector = useMemo(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const [playerX, , playerZ] = playerPos as [number, number, number];
    const sources = window.__WARPALA_EXPO_INSPECT_SOURCES__;
    const entries = [
      ...(sources?.city ?? []),
      ...(sources?.stadium ?? []),
      ...worldContract.boothPlacements.map((placement) => ({
        id: placement.id,
        layer: 'booth',
        position: placement.position,
      })),
    ];

    return entries
      .map((entry) => ({
        distance: Math.round(Math.hypot(entry.position[0] - playerX, entry.position[2] - playerZ)),
        id: entry.id,
        layer: entry.layer,
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3);
  }, [playerPos, worldContract.boothPlacements]);
  useEffect(() => {
    if (typeof window === 'undefined' || !import.meta.env.DEV) {
      return;
    }

    const readCenterTarget = () => {
      const value = (window as unknown as { __WARPALA_EXPO_CENTER_TARGET__?: string | null }).__WARPALA_EXPO_CENTER_TARGET__ ?? null;
      setDevCenterTarget((current) => (current === value ? current : value));
      const centerStackValue = (window as unknown as { __WARPALA_EXPO_CENTER_STACK__?: string[] }).__WARPALA_EXPO_CENTER_STACK__ ?? [];
      setDevCenterStack((current) => (
        current.length === centerStackValue.length && current.every((entry, index) => entry === centerStackValue[index])
          ? current
          : centerStackValue
      ));
      const clickValue = (window as unknown as { __WARPALA_EXPO_CLICK_TARGET__?: string | null }).__WARPALA_EXPO_CLICK_TARGET__ ?? null;
      setDevClickTarget((current) => (current === clickValue ? current : clickValue));
      const clickStackValue = (window as unknown as { __WARPALA_EXPO_CLICK_STACK__?: string[] }).__WARPALA_EXPO_CLICK_STACK__ ?? [];
      setDevClickStack((current) => (
        current.length === clickStackValue.length && current.every((value, index) => value === clickStackValue[index])
          ? current
          : clickStackValue
      ));
    };

    readCenterTarget();
    const intervalId = window.setInterval(readCenterTarget, 120);
    return () => window.clearInterval(intervalId);
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const refreshTouchDevice = () => setIsTouchDevice(detectTouchDevice());
    refreshTouchDevice();
    window.addEventListener('resize', refreshTouchDevice);

    return () => {
      window.removeEventListener('resize', refreshTouchDevice);
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
              buildStamp: LOCAL_BUILD_STAMP,
              companyCount: worldContract.boothPlacements.length,
              centerTarget: devCenterTarget,
              centerStack: devCenterStack,
              clickTarget: devClickTarget,
              clickStack: devClickStack,
              dataMode: effectiveFocusSlug === initialUrlFocus ? 'seeded-local' : 'seeded-local',
              focusedName: focusedPlacement?.company?.name ?? null,
              focusedSlug: focusedPlacement?.company?.slug ?? effectiveFocusSlug ?? null,
              focusedTier: focusedPlacement?.company?.sponsorTier ?? null,
              inspector,
              layerStates: devLayerStates,
              markedPoint,
              targetBasket,
              sectionStates: devSectionStates,
              onAddClickTarget: () => {
                if (!devClickTarget) {
                  return;
                }
                setTargetBasket((current) => (current.includes(devClickTarget) ? current : [...current, devClickTarget]));
              },
              onAddClickStack: () => {
                if (!devClickStack || devClickStack.length === 0) {
                  return;
                }
                setTargetBasket((current) => {
                  const next = [...current];
                  devClickStack.forEach((entry) => {
                    if (!next.includes(entry)) {
                      next.push(entry);
                    }
                  });
                  return next;
                });
              },
              onClearTargetBasket: () => setTargetBasket([]),
              onSetMark: () => {
                const [x, y, z] = playerPos as [number, number, number];
                setMarkedPoint([x, y, z]);
              },
              onToggleLayer: (layer) => setDevLayerStates((value) => ({ ...value, [layer]: !value[layer] })),
              onToggleSection: (section) => {
                setDevSectionStates((value) => ({ ...value, [section]: !value[section] }));
                if (section === 'stadium') {
                  setDevLayerStates((value) => ({ ...value, stadium: !value.stadium }));
                }
              },
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
            runtimeSectionToggles={import.meta.env.DEV ? devSectionStates : undefined}
            worldContract={worldContract}
            zoneSystem={zoneSystem}
          />
        </>
      )}
    </div>
  );
}
