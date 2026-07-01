import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WebGLUnsupported } from '../../../../components/WebGLUnsupported';
import { useWebGLSupport } from '../../../../components/webglSupport';
import { useZoneSystem } from '../../../../hooks/useZoneSystem';
import type { ExpoStartView } from '../../../../shared/expo/worldContract';
import { ExpoWorldHud } from './ExpoWorldHud';
import { useExpoPresence } from '../../hooks/useExpoPresence';
import { useExpoSceneData } from '../../hooks/useExpoSceneData';
import { buildExpoWorldContract } from '../../world-contract';
import { useExpoOperatorLayer } from '../operator';
import { ExpoRuntimeShell } from './ExpoRuntimeShell';
import { ExpoSceneShell } from './ExpoSceneShell';
import { EXPO_REVIEW_BUILD_STAMP } from './expoBuildStamp';
import { maybeRunExpoOperatorFreshCacheReset } from './expoOperatorFreshCache';
import { useExpoRuntimeErrorBridge } from './useExpoRuntimeErrorBridge';
import { useExpoRuntimeSession } from './useExpoRuntimeSession';
import { WorldInspectionProvider } from '../world/inspection/worldInspectionState';
import { SalesDemoGuideOverlay } from '../salesDemo';
import { SponsorConciergeLeadCaptureOverlay } from '../boothProduct';
import { isHomeStudioEnabled, ModularHomeDemoOverlay, ModularHomeUploadPreviewPanel } from '../modularHome';
import { createCanonicalModularHomeStudioPath } from '../modularHome/modularHomeShareUrl';
import { GALA_PREVIEW_POSITION, GALA_PREVIEW_SCALE } from '../modularHome/GalaHouseDimensions';
import { GALA_GEOMETRY_LEVELS, planXToLocalX } from '../modularHome/GalaFloorplan';
import { MODULAR_HOME_PREVIEW_CONFIG } from '../modularHome/modularHomeConfig';

function galaPlanPointToWorld(planX: number, planY: number, planZ: number): [number, number, number] {
  const unrotatedX = GALA_PREVIEW_POSITION.x + (planXToLocalX(planX) * GALA_PREVIEW_SCALE);
  const unrotatedZ = GALA_PREVIEW_POSITION.z + (planZ * GALA_PREVIEW_SCALE);
  const cos = Math.cos(MODULAR_HOME_PREVIEW_CONFIG.rotationY);
  const sin = Math.sin(MODULAR_HOME_PREVIEW_CONFIG.rotationY);

  return [
    (unrotatedX * cos) + (unrotatedZ * sin),
    GALA_PREVIEW_POSITION.y + (planY * GALA_PREVIEW_SCALE),
    (-unrotatedX * sin) + (unrotatedZ * cos),
  ];
}

function galaPlanToWorld(planX: number, planZ: number): [number, number, number] {
  return galaPlanPointToWorld(planX, GALA_GEOMETRY_LEVELS.cameraEyeHeightMeters, planZ);
}

const HOME_STUDIO_EXTERIOR_START_VIEW: ExpoStartView = {
  // Home studio walk mode starts at human eye height; QA shot presets remain separate and unchanged.
  // Start farther back and off-axis so first load reads as a complete house, not a facade close-up.
  lookAt: galaPlanPointToWorld(5.1, 1.45, 0.05),
  position: galaPlanToWorld(2.0, -16.8),
  source: 'arrival-main',
};

const HOME_STUDIO_INTERIOR_START_VIEW: ExpoStartView = {
  lookAt: galaPlanToWorld(5.55, -0.35),
  position: galaPlanToWorld(2.1, 1.55),
  source: 'arrival-main',
};

export default function Expo3D() {
  const webglSupport = useWebGLSupport();
  const runtimeSession = useExpoRuntimeSession();
  const { data, isLoading } = useExpoSceneData();

  if (!webglSupport.available) {
    return (
      <WebGLUnsupported
        reason={webglSupport.reason}
        routeLabel="Web3D Expo"
        variant="expo"
      />
    );
  }

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
  const location = useLocation();
  const homeStudioEnabled = useMemo(() => isHomeStudioEnabled(), []);
  const homeStudioViewMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') === 'interior' ? 'interior' : 'exterior';
  }, [location.search]);
  const worldContract = useMemo(() => buildExpoWorldContract(data), [data]);
  const inspectionEnabled = import.meta.env.DEV || runtimeSession.operatorSession.enabled;
  const { guests, playerPos, isMicOn, isSpeaking, setIsMicOn, handlePlayerMove } = useExpoPresence(
    runtimeSession.mode,
    { enabled: !homeStudioEnabled && !runtimeSession.salesDemoEnabled && !runtimeSession.boothProductPreviewEnabled && !runtimeSession.homeDemoEnabled && !runtimeSession.homeUploadPreviewRequested },
  );
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);
  const operatorSceneLayer = useExpoOperatorLayer({
    activeZoneId: activeZone?.id ? String(activeZone.id) : null,
    initialUrlFocus: runtimeSession.initialUrlFocus,
    mode: runtimeSession.mode,
    playerPos,
    sceneVersion: data?.sceneVersion ? String(data.sceneVersion) : null,
    setMode: runtimeSession.setMode,
    worldContract,
  });
  const sceneStartViewOverride = homeStudioEnabled
    ? (homeStudioViewMode === 'interior' ? HOME_STUDIO_INTERIOR_START_VIEW : HOME_STUDIO_EXTERIOR_START_VIEW)
    : operatorSceneLayer.effectiveStartViewOverride;
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
    const startView = sceneStartViewOverride;
    if (!operatorSceneLayer.session.enabled || !startView) {
      return;
    }

    const signature = `${startView.position.join(',')}|${startView.lookAt.join(',')}|${startView.source}`;
    if (lastOperatorStartViewSignature.current === signature) {
      return;
    }

    lastOperatorStartViewSignature.current = signature;
    handlePlayerMove(startView.position);
  }, [handlePlayerMove, operatorSceneLayer.session.enabled, sceneStartViewOverride]);

  // Web3D failures in production should not silently degrade into a black canvas.
  useExpoRuntimeErrorBridge(true);

  return (
    <ExpoRuntimeShell
      hudLayer={(
        <>
          {!homeStudioEnabled ? (
            <ExpoWorldHud
              guests={guests}
              isMicOn={isMicOn}
              isSpeaking={isSpeaking}
              isTouchDevice={runtimeSession.isTouchDevice}
              mode={runtimeSession.mode}
              onOpenModularHomes={() => nav(createCanonicalModularHomeStudioPath('exterior'))}
              onMoveTouch={runtimeSession.setMobileMoveIntent}
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
          ) : null}
          {!homeStudioEnabled ? (
            <SalesDemoGuideOverlay
              isTouchDevice={runtimeSession.isTouchDevice}
              mode={runtimeSession.mode}
              onSetMode={runtimeSession.setMode}
            />
          ) : null}
          <ModularHomeDemoOverlay isTouchDevice={runtimeSession.isTouchDevice} />
          {!homeStudioEnabled ? <ModularHomeUploadPreviewPanel isTouchDevice={runtimeSession.isTouchDevice} /> : null}
          {!homeStudioEnabled ? <SponsorConciergeLeadCaptureOverlay isTouchDevice={runtimeSession.isTouchDevice} /> : null}
        </>
      )}
      isTouchDevice={runtimeSession.isTouchDevice}
      isLoading={isLoading}
      mode={runtimeSession.mode}
      onBack={() => nav('/')}
      onOpenModularHomes={() => nav(createCanonicalModularHomeStudioPath('exterior'))}
      onSetMode={runtimeSession.setMode}
      operatorLayer={operatorSceneLayer.layer}
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
          startViewOverride={sceneStartViewOverride}
          worldContract={worldContract}
          zoneSystem={zoneSystem}
        />
      )}
    />
  );
}
