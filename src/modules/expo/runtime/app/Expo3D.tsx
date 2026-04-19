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

type ReviewOperatorZone = {
  id: string;
  intent: string;
  startView: ExpoStartView;
};

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

function buildReviewOperatorZones(): ReviewOperatorZone[] {
  return [
    {
      id: 'arrival',
      intent: 'arrival-gateway-hierarchy',
      startView: {
        lookAt: [0, 42, 256],
        position: [0, 128, 468],
        source: 'arrival-main',
      },
    },
    {
      id: 'left',
      intent: 'left-skyline-balance',
      startView: {
        lookAt: [-654, 122, -286],
        position: [-968, 214, 86],
        source: 'arrival-main',
      },
    },
    {
      id: 'middle',
      intent: 'core-civic-reading',
      startView: {
        lookAt: [0, 112, -214],
        position: [0, 188, 152],
        source: 'arrival-main',
      },
    },
    {
      id: 'right',
      intent: 'right-signal-cluster',
      startView: {
        lookAt: [628, 128, -248],
        position: [954, 216, 74],
        source: 'arrival-main',
      },
    },
    {
      id: 'rear',
      intent: 'stadium-campus-continuity',
      startView: {
        lookAt: [0, 136, -3312],
        position: [0, 248, -2636],
        source: 'arrival-main',
      },
    },
  ];
}

export default function Expo3D() {
  const reviewOperatorEnabled = useMemo(() => {
    if (typeof window === 'undefined' || !import.meta.env.DEV) {
      return false;
    }

    return new URLSearchParams(window.location.search).get('operator') === '1';
  }, []);
  const reviewZones = useMemo(() => buildReviewOperatorZones(), []);
  const [mode, setMode] = useState<ExpoMode>(() => (reviewOperatorEnabled ? 'fly' : 'menu'));
  const [debug, setDebug] = useState(EXPO_DEBUG_DEFAULT);
  const [mobileMoveIntent, setMobileMoveIntent] = useState({ f: false, b: false, l: false, r: false, s: false });
  const [devClickTarget, setDevClickTarget] = useState<string | null>(null);
  const [devClickStack, setDevClickStack] = useState<string[]>([]);
  const [devFocusSlug, setDevFocusSlug] = useState<string | null>('__use_url__');
  const [devCenterTarget, setDevCenterTarget] = useState<string | null>(null);
  const [devCenterStack, setDevCenterStack] = useState<string[]>([]);
  const [markedPoint, setMarkedPoint] = useState<[number, number, number] | null>(null);
  const [targetBasket, setTargetBasket] = useState<string[]>([]);
  const [operatorZoneId, setOperatorZoneId] = useState<string | null>(() => (reviewOperatorEnabled ? 'arrival' : null));
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
  const operatorStartView = useMemo(() => {
    if (!reviewOperatorEnabled || !operatorZoneId) {
      return null;
    }

    return reviewZones.find((zone) => zone.id === operatorZoneId)?.startView ?? null;
  }, [operatorZoneId, reviewOperatorEnabled, reviewZones]);
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
  const effectiveStartViewOverride = operatorStartView ?? focusStartView;
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
    if (typeof window === 'undefined' || !reviewOperatorEnabled) {
      return;
    }

    const operator = {
      clearFocus: () => {
        setOperatorZoneId(null);
        setDevFocusSlug('');
      },
      focusBooth: (slugOrId: string) => {
        setOperatorZoneId(null);
        setDevFocusSlug(slugOrId);
      },
      focusZone: (zoneId: string) => {
        setDevFocusSlug('');
        setOperatorZoneId(zoneId);
      },
      getSnapshot: () => ({
        activeZoneId: activeZone?.id ? String(activeZone.id) : null,
        centerStack: devCenterStack,
        centerTarget: devCenterTarget,
        clickStack: devClickStack,
        clickTarget: devClickTarget,
        inspector,
        layerStates: devLayerStates,
        mode,
        operatorZoneId,
        playerPos,
        sceneVersion: data?.sceneVersion ? String(data.sceneVersion) : null,
        sectionStates: devSectionStates,
        targetBasket,
      }),
      setLayerStates: (next: Partial<typeof devLayerStates>) => {
        setDevLayerStates((current) => ({ ...current, ...next }));
      },
      setMode: (nextMode: ExpoMode) => setMode(nextMode),
      setSectionStates: (next: Partial<typeof devSectionStates>) => {
        setDevSectionStates((current) => ({ ...current, ...next }));
      },
      setTargetBasket: (targets: string[]) => setTargetBasket(targets),
      zones: reviewZones.map((zone) => ({ id: zone.id, intent: zone.intent })),
    };

    (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ = operator;

    return () => {
      if ((window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ === operator) {
        delete (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__;
      }
    };
  }, [
    activeZone?.id,
    data?.sceneVersion,
    devCenterStack,
    devCenterTarget,
    devClickStack,
    devClickTarget,
    devLayerStates,
    devSectionStates,
    inspector,
    mode,
    operatorZoneId,
    playerPos,
    reviewOperatorEnabled,
    reviewZones,
    targetBasket,
  ]);

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
          {reviewOperatorEnabled && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 2100, width: '320px', background: 'rgba(7, 12, 18, 0.84)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '16px', padding: '14px', backdropFilter: 'blur(12px)', color: '#e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.16em', fontWeight: 900, color: '#7dd3fc', marginBottom: '10px' }}>EXPO REVIEW OPERATOR</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {reviewZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setDevFocusSlug('');
                      setOperatorZoneId(zone.id);
                    }}
                    style={{
                      background: operatorZoneId === zone.id ? 'rgba(125, 211, 252, 0.22)' : 'rgba(15, 23, 42, 0.76)',
                      border: '1px solid rgba(125, 211, 252, 0.28)',
                      borderRadius: '999px',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '6px 10px',
                    }}
                    type="button"
                  >
                    {zone.id}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.74rem', lineHeight: 1.5, color: '#cbd5e1' }}>
                <div>mode: <strong>{mode}</strong></div>
                <div>zone: <strong>{operatorZoneId ?? 'manual'}</strong></div>
                <div>scene: <strong>{data?.sceneVersion ? String(data.sceneVersion) : 'unknown'}</strong></div>
                <div>inspect: <strong>{inspector.map((entry) => entry.id).join(', ') || 'none'}</strong></div>
              </div>
            </div>
          )}
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
            startViewOverride={effectiveStartViewOverride}
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
