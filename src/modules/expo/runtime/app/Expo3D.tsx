import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZoneSystem } from '../../../../hooks/useZoneSystem';
import { ExpoWorldHud } from './ExpoWorldHud';
import { useExpoPresence } from '../../hooks/useExpoPresence';
import { useExpoSceneData } from '../../hooks/useExpoSceneData';
import { usePixelStreamingStatus } from '../../hooks/usePixelStreamingStatus';
import { EXPO_FEATURE_FLAGS } from '../../state/expoRuntime';
import { buildExpoWorldContract } from '../../world-contract';
import { bindBoothPresentation, openShowcaseRoom } from '../booths';
import { useExpoOperatorLayer } from '../operator';
import { ExpoRuntimeShell } from './ExpoRuntimeShell';
import { ExpoSceneShell } from './ExpoSceneShell';
import { EXPO_REVIEW_BUILD_STAMP } from './expoBuildStamp';
import { maybeRunExpoOperatorFreshCacheReset } from './expoOperatorFreshCache';
import { useExpoRuntimeErrorBridge } from './useExpoRuntimeErrorBridge';
import { useExpoRuntimeSession } from './useExpoRuntimeSession';
import { WorldInspectionProvider } from '../world/inspection/worldInspectionState';
import { SalesDemoGuideOverlay } from '../salesDemo';

export default function Expo3D() {
  const runtimeSession = useExpoRuntimeSession();
  const { data, isLoading } = useExpoSceneData();

  return (
    <WorldInspectionProvider>
      <ExpoRuntimeExperience
        data={data}
        isLoading={isLoading}
        runtimeSession={runtimeSession}
      />
    </WorldInspectionProvider>
  );
}

function ExpoRuntimeExperience({
  data,
  isLoading,
  runtimeSession,
}: {
  data: ReturnType<typeof useExpoSceneData>['data'];
  isLoading: boolean;
  runtimeSession: ReturnType<typeof useExpoRuntimeSession>;
}) {
  const nav = useNavigate();
  const worldContract = useMemo(() => buildExpoWorldContract(data), [data]);
  const inspectionEnabled = import.meta.env.DEV || runtimeSession.operatorSession.enabled;
  const pixelStreamingStatus = usePixelStreamingStatus();
  const { guests, playerPos, isMicOn, isSpeaking, setIsMicOn, handlePlayerMove } = useExpoPresence(runtimeSession.mode);
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);
  const mobileNearbyBooth = useMemo(() => {
    if (!runtimeSession.isTouchDevice || runtimeSession.mode !== 'walk') {
      return null;
    }

    const nearest = worldContract.boothPlacements
      .map((placement) => ({
        distance: Math.round(Math.hypot(placement.position[0] - playerPos[0], placement.position[2] - playerPos[2])),
        placement,
      }))
      .filter((entry) => entry.distance <= 230)
      .sort((left, right) => left.distance - right.distance)[0];

    if (!nearest) {
      return null;
    }

    return {
      distance: nearest.distance,
      id: nearest.placement.id,
      label: String(nearest.placement.company?.name || nearest.placement.sectorName || 'Sponsor Booth'),
      sectorName: nearest.placement.sectorName ?? null,
    };
  }, [playerPos, runtimeSession.isTouchDevice, runtimeSession.mode, worldContract.boothPlacements]);
  const openMobileNearbyBooth = useCallback((boothPlacementId: string) => {
    const placement = worldContract.boothPlacements.find((candidate) => candidate.id === boothPlacementId);
    if (!placement) {
      return;
    }

    const { booth, presentation } = bindBoothPresentation(placement.company, placement);
    openShowcaseRoom({
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId: String(booth?.id ?? placement.id),
      company: placement.company,
      navigate: nav,
      presentation,
      sectorName: placement.sectorName,
    });
  }, [nav, worldContract.boothPlacements]);
  const operatorSceneLayer = useExpoOperatorLayer({
    activeZoneId: activeZone?.id ? String(activeZone.id) : null,
    initialUrlFocus: runtimeSession.initialUrlFocus,
    mode: runtimeSession.mode,
    playerPos,
    sceneVersion: data?.sceneVersion ? String(data.sceneVersion) : null,
    setMode: runtimeSession.setMode,
    worldContract,
  });
  const lastOperatorStartViewSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!runtimeSession.operatorSession.enabled || typeof window === 'undefined') {
      return;
    }

    Object.assign(window, {
      __WARPALA_EXPO_BUILD__: {
        buildStamp: EXPO_REVIEW_BUILD_STAMP,
        operatorReason: runtimeSession.operatorSession.reason,
      },
    });
    maybeRunExpoOperatorFreshCacheReset(true, EXPO_REVIEW_BUILD_STAMP);
  }, [runtimeSession.operatorSession]);

  useEffect(() => {
    const startView = operatorSceneLayer.effectiveStartViewOverride;
    if (!operatorSceneLayer.session.enabled || !startView) {
      return;
    }

    const signature = `${startView.position.join(',')}|${startView.lookAt.join(',')}|${startView.source}`;
    if (lastOperatorStartViewSignature.current === signature) {
      return;
    }

    lastOperatorStartViewSignature.current = signature;
    handlePlayerMove(startView.position);
  }, [handlePlayerMove, operatorSceneLayer.effectiveStartViewOverride, operatorSceneLayer.session.enabled]);

  // Web3D failures in production should not silently degrade into a black canvas.
  useExpoRuntimeErrorBridge(true);

  return (
    <ExpoRuntimeShell
      hudLayer={(
        <>
          <ExpoWorldHud
            guests={guests}
            isMicOn={isMicOn}
            isSpeaking={isSpeaking}
            isTouchDevice={runtimeSession.isTouchDevice}
            mode={runtimeSession.mode}
            nearbyBooth={mobileNearbyBooth}
            onMoveTouch={runtimeSession.setMobileMoveIntent}
            onOpenNearbyBooth={openMobileNearbyBooth}
            playerPos={playerPos}
            sectorMarkers={worldContract.sectorMarkers}
            visualProfile={worldContract.visualProfile}
            onToggleMic={() => setIsMicOn((value) => !value)}
            operatorBuildStamp={runtimeSession.operatorSession.enabled ? EXPO_REVIEW_BUILD_STAMP : null}
            onExit={() => {
              document.exitPointerLock();
              runtimeSession.setMode('menu');
            }}
          />
          <SalesDemoGuideOverlay isTouchDevice={runtimeSession.isTouchDevice} />
        </>
      )}
      isTouchDevice={runtimeSession.isTouchDevice}
      isLoading={isLoading}
      mode={runtimeSession.mode}
      onBack={() => nav('/')}
      onSetMode={runtimeSession.setMode}
      operatorLayer={operatorSceneLayer.layer}
      pixelStreamingStatus={pixelStreamingStatus}
      sceneLayer={(
        <ExpoSceneShell
          activeZone={activeZone}
          debug={operatorSceneLayer.debug}
          guests={guests}
          mobileMoveIntent={runtimeSession.mobileMoveIntent}
          isTouchDevice={runtimeSession.isTouchDevice}
          mode={runtimeSession.mode}
          onMove={handlePlayerMove}
          inspectionEnabled={inspectionEnabled}
          runtimeFocusIsolation={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeFocusIsolation : false}
          runtimeHighlightedTargets={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeHighlightedTargets : []}
          runtimeLayerToggles={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeLayerToggles : undefined}
          runtimeSectionToggles={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeSectionToggles : undefined}
          sceneVersion={data?.sceneVersion ? String(data.sceneVersion) : null}
          startViewOverride={operatorSceneLayer.effectiveStartViewOverride}
          worldContract={worldContract}
          zoneSystem={zoneSystem}
        />
      )}
    />
  );
}
