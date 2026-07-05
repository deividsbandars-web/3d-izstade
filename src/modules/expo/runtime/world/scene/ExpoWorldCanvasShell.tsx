import type * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { WebGLUnsupported } from '../../../../../components/WebGLUnsupported';
import { detectWebGLSupport, type WebGLSupportResult } from '../../../../../components/webglSupport';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import type { ExpoVerticalAccessNode } from '../../planning/types';
import type { WorldPhysicsAccessAudit } from '../physics/worldPhysicsAccessAudit';
import type { WorldPhysicsSurfaceRegistry } from '../physics/worldPhysicsSurfaceRegistry';
import type { WorldPhysicsTraversalGraph } from '../physics/worldPhysicsTraversalGraph';
import type { ExpoWorldLayerToggles, ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import { ExpoWorldDebugLayer } from '../debug/ExpoWorldDebugLayer';
import { CenterScreenInspector, ClickInspector, WorldSceneBridge } from '../inspection/worldInspectionContract';
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary } from '../../../world-contract';
import { EXPO_START_VIEW_KEY } from '../WorldSceneSupport';
import { ExpoWorldPlayerLayer } from './ExpoWorldPlayerLayer';
import { ExpoWorldSceneLayers } from './ExpoWorldSceneLayers';
import {
  ExpoPerformanceOverlay,
  ExpoPerformanceSampler,
} from './ExpoPerformanceOverlay';
import {
  shouldEnableExpoPerformanceOverlay,
  type ExpoPerformanceOverlayMetrics,
} from './expoPerformanceOverlayState';
import { useExpoActiveVideoScreensCount } from '../quality/expoActiveVideoScreenRegistry';
import { resolveExpoScreenRuntimePolicy } from '../quality/expoScreenRuntimePolicy';
import { useExpoQualitySettings } from '../quality/expoQualitySettings';
import {
  resolveExpoGeneratedBillboardQualityConfig,
  useExpoScreenTextureRuntimeStats,
} from '../quality/expoScreenTextureRuntimeStats';
import { useExpoZoneRuntimeState } from '../zones/expoZoneRuntimeState';
import { reportExpoDevError } from '../../../lib/devErrorReporter';
import { isExpo3dQaEnabled, isGalaConstructionAuditEnabled } from '../../app/expo3dQa';
import { isHomeStudioEnabled } from '../../modularHome/homeDemoFlags';
import type { ExpoPresenceGuest } from '../../community/expoPresencePolicy';
import { WorldSprayPlacementPicker } from '../../community';

const EXPO_CAMERA_FOV = {
  desktop: 50,
  touch: 56,
} as const;

const HOME_STUDIO_CAMERA_FOV = {
  desktop: 50,
  touch: 56,
} as const;

function ExpoCanvasSuspenseFallback({ label }: { label: string }) {
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div
        data-expo-canvas-loading-fallback="true"
        style={{
          background: 'rgba(2, 6, 23, 0.72)',
          border: '1px solid rgba(125, 211, 252, 0.28)',
          borderRadius: '999px',
          color: '#bae6fd',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 900,
          letterSpacing: '0.12em',
          padding: '8px 12px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

const LazyExpo3DQAHook = lazy(async () => {
  const module = await import('./Expo3DQAHook');
  return { default: module.Expo3DQAHook };
});

export function ExpoWorldCanvasShell({
  activeZoneId,
  debug,
  districtPrograms,
  guests,
  effectiveStartView,
  hardIsolateNonTargets,
  highlightedTargets,
  inspectionEnabled,
  isTouchDevice,
  isolateNonTargets,
  layerToggles,
  mobileMoveIntent,
  mode,
  onMove,
  physicsAccessAudit,
  physicsSurfaceRegistry,
  physicsTraversalGraph,
  playBounds,
  playerPosition,
  planningBoothPlacements,
  qualityProfileInputs,
  runtimeCaptureSafe,
  sceneVersion,
  sectorMarkers,
  sectionToggles,
  sectionVisibleBoothPlacements,
  setSceneUserData,
  verticalAccessNodes,
  visualProfile,
  walkRegions,
}: {
  activeZoneId: string | null;
  debug: boolean;
  districtPrograms: ExpoDistrictProgramSummary[];
  guests: ExpoPresenceGuest[];
  effectiveStartView: ExpoStartView;
  hardIsolateNonTargets: boolean;
  highlightedTargets: string[];
  inspectionEnabled: boolean;
  isTouchDevice: boolean;
  isolateNonTargets: boolean;
  layerToggles: ExpoWorldLayerToggles;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean; turnL?: boolean; turnR?: boolean; jump?: boolean; lift?: boolean; lookX?: number; lookY?: number };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  physicsAccessAudit: WorldPhysicsAccessAudit;
  physicsSurfaceRegistry: WorldPhysicsSurfaceRegistry;
  physicsTraversalGraph: WorldPhysicsTraversalGraph;
  playBounds: ExpoWorldContract['playBounds'];
  playerPosition: [number, number, number];
  planningBoothPlacements: ExpoBoothPlacement[];
  qualityProfileInputs: ExpoWorldContract['qualityProfileInputs'];
  runtimeCaptureSafe: boolean;
  sceneVersion: string | null;
  sectorMarkers: ExpoWorldContract['sectorMarkers'];
  sectionToggles: ExpoWorldSectionToggles;
  sectionVisibleBoothPlacements: ExpoBoothPlacement[];
  setSceneUserData: (scene: THREE.Scene, key: string, value: unknown) => void;
  verticalAccessNodes: ExpoVerticalAccessNode[];
  visualProfile: ExpoWorldContract['visualProfile'];
  walkRegions: ExpoWorldContract['walkRegions'];
}) {
  const [webglLost, setWebglLost] = useState(false);
  const [webglLostAt, setWebglLostAt] = useState<string | null>(null);
  const [webglStatusKey, setWebglStatusKey] = useState(0);
  const [webglAvailability] = useState<WebGLSupportResult>(() => detectWebGLSupport());
  const [performanceMetrics, setPerformanceMetrics] = useState<ExpoPerformanceOverlayMetrics | null>(null);
  const homeStudioEnabled = useMemo(() => isHomeStudioEnabled(), []);
  const cameraFov = homeStudioEnabled
    ? (isTouchDevice ? HOME_STUDIO_CAMERA_FOV.touch : HOME_STUDIO_CAMERA_FOV.desktop)
    : (isTouchDevice ? EXPO_CAMERA_FOV.touch : EXPO_CAMERA_FOV.desktop);
  const performanceOverlayEnabled = useMemo(() => shouldEnableExpoPerformanceOverlay(), []);
  const qaHookEnabled = useMemo(
    () => import.meta.env.DEV || isExpo3dQaEnabled() || isGalaConstructionAuditEnabled(),
    [],
  );
  const qualitySettings = useExpoQualitySettings({ isTouchDevice, runtimeCaptureSafe });
  const activeVideoScreensCount = useExpoActiveVideoScreensCount();
  const screenTextureStats = useExpoScreenTextureRuntimeStats();
  const zoneRuntimeState = useExpoZoneRuntimeState({
    externalActiveZoneId: activeZoneId,
    playerPosition,
    qualitySettings,
    runtimeCaptureSafe,
  });
  const screenRuntimePolicy = useMemo(
    () => resolveExpoScreenRuntimePolicy({
      currentActiveVideoCount: activeVideoScreensCount,
      isInActiveSection: true,
      qualitySettings,
    }),
    [activeVideoScreensCount, qualitySettings],
  );
  const generatedBillboardQualityConfig = useMemo(
    () => resolveExpoGeneratedBillboardQualityConfig(screenRuntimePolicy.textureQualityHint),
    [screenRuntimePolicy.textureQualityHint],
  );
  const handlePerformanceSample = useCallback((metrics: ExpoPerformanceOverlayMetrics) => {
    setPerformanceMetrics(metrics);
  }, []);

  useEffect(() => {
    if (!webglAvailability.available) {
      reportExpoDevError('webgl.unavailable', 'WebGL unavailable at startup', { reason: webglAvailability.reason });
    }
  }, [webglAvailability.available, webglAvailability.reason]);

  useEffect(() => {
    if (typeof window === 'undefined' || (!debug && !inspectionEnabled)) {
      return;
    }

    (window as unknown as {
      __WARPALA_EXPO_WORLD_PHYSICS__?: unknown;
    }).__WARPALA_EXPO_WORLD_PHYSICS__ = {
      accessAudit: physicsAccessAudit,
      solids: physicsSurfaceRegistry.solids,
      summary: {
        access: physicsAccessAudit.summary,
        solidCount: physicsSurfaceRegistry.solids.length,
        traversal: physicsTraversalGraph.summary,
        verticalAccessNodeCount: verticalAccessNodes.length,
        walkableSurfaceCount: physicsSurfaceRegistry.walkableSurfaces.length,
      },
      traversalGraph: physicsTraversalGraph,
      walkableSurfaces: physicsSurfaceRegistry.walkableSurfaces,
    };
  }, [debug, inspectionEnabled, physicsAccessAudit, physicsSurfaceRegistry, physicsTraversalGraph, verticalAccessNodes]);

  const onCreated = useMemo(() => ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    if (!canvas) {
      return;
    }

    const onLost = (event: Event) => {
      // Prevent default so the browser doesn't kill the context without a chance to recover.
      // We'll still surface the failure to the user.
      if ('preventDefault' in event && typeof (event as unknown as { preventDefault: () => void }).preventDefault === 'function') {
        (event as unknown as { preventDefault: () => void }).preventDefault();
      }
      const ts = new Date().toISOString();
      setWebglLost(true);
      setWebglLostAt(ts);
      reportExpoDevError('webgl.contextlost', 'WebGL context lost', { timestamp: ts });
    };

    const onRestored = () => {
      setWebglLost(false);
      setWebglLostAt(null);
      // Force a remount so R3F can rebuild internal state reliably.
      setWebglStatusKey((value) => value + 1);
      reportExpoDevError('webgl.contextrestored', 'WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
    canvas.addEventListener('webglcontextrestored', onRestored as EventListener, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      canvas.removeEventListener('webglcontextrestored', onRestored as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!webglLost) {
      return;
    }

    const timer = window.setTimeout(() => {
      reportExpoDevError('webgl.contextlost.timeout', 'WebGL context remained lost for 5s', { lostAt: webglLostAt });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [webglLost, webglLostAt]);

  if (!webglAvailability.available) {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <WebGLUnsupported
          reason={webglAvailability.reason}
          routeLabel={homeStudioEnabled ? 'Modular Home Studio' : 'Web3D Expo'}
          variant={homeStudioEnabled ? 'modular-home' : 'expo'}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {webglLost && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1800, display: 'grid', placeItems: 'center', padding: '28px', background: 'rgba(0,0,0,0.82)', color: '#e2e8f0' }}>
          <div style={{ maxWidth: '720px', width: '100%', borderRadius: '18px', border: '1px solid rgba(248, 113, 113, 0.32)', background: 'rgba(15, 23, 42, 0.72)', padding: '18px 20px' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', fontWeight: 900, color: '#fda4af' }}>
              WEBGL CONTEXT LOST
            </div>
            <div style={{ marginTop: '10px', fontWeight: 800, fontSize: '1.05rem' }}>
              3D renderer stopped.
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', lineHeight: 1.5, color: '#cbd5e1' }}>
              Reload the page. If it keeps happening, enable browser hardware acceleration or switch browser/device.
            </div>
          </div>
        </div>
      )}
      <ExpoPerformanceOverlay
        enabled={performanceOverlayEnabled}
        layerToggles={layerToggles}
        metrics={performanceMetrics}
        mode={mode}
        qualitySettings={qualitySettings}
        sceneVersion={sceneVersion}
        screenTextureQualityConfig={generatedBillboardQualityConfig}
        screenTextureStats={screenTextureStats}
        screenTextureQualityHint={screenRuntimePolicy.textureQualityHint}
        screenPolicyStatus={screenRuntimePolicy.status}
        sectionToggles={sectionToggles}
        activeVideoScreensCount={activeVideoScreensCount}
        visibleBoothCount={sectionVisibleBoothPlacements.length}
        webglAvailability={webglAvailability}
        webglLost={webglLost}
        zoneRuntimeState={zoneRuntimeState}
      />
      {webglAvailability.available && (
      <Canvas
        key={`expo-webgl-${webglStatusKey}`}
      shadows={qualitySettings.shadowsEnabled}
      dpr={qualitySettings.canvasDpr}
      gl={{ antialias: qualitySettings.antialiasEnabled, powerPreference: 'high-performance' }}
      performance={{ min: qualitySettings.performanceMin }}
      camera={{ position: [0, 2, 10], fov: cameraFov, far: 10000 }}
      onCreated={onCreated as never}
    >
      <WorldSceneBridge
        sceneKey="expo-world-scene"
        setSceneUserData={setSceneUserData}
        startView={effectiveStartView}
        startViewKey={EXPO_START_VIEW_KEY}
      />
      {qaHookEnabled ? (
        <Suspense fallback={<ExpoCanvasSuspenseFallback label="Loading QA tools" />}>
          <LazyExpo3DQAHook runtimeMode={mode} />
        </Suspense>
      ) : null}
      {performanceOverlayEnabled && (
        <ExpoPerformanceSampler enabled={performanceOverlayEnabled} onSample={handlePerformanceSample} />
      )}
      <CenterScreenInspector inspectionEnabled={inspectionEnabled} />
      <ClickInspector clickInspectionEnabled={inspectionEnabled} />
      <WorldSprayPlacementPicker />

      <ExpoWorldDebugLayer
        hardIsolateNonTargets={hardIsolateNonTargets}
        highlightedTargets={highlightedTargets}
        isolateNonTargets={isolateNonTargets}
        playBounds={playBounds}
        startView={effectiveStartView}
        walkRegions={walkRegions}
      />

      <ExpoWorldSceneLayers
        activeZoneId={activeZoneId}
        districtPrograms={districtPrograms}
        guests={guests}
        layerToggles={layerToggles}
        mode={mode}
        playerPosition={playerPosition}
        planningBoothPlacements={planningBoothPlacements}
        qualitySettings={qualitySettings}
        qualityProfileInputs={qualityProfileInputs}
        runtimeCaptureSafe={runtimeCaptureSafe}
        sceneVersion={sceneVersion}
        sectorMarkers={sectorMarkers}
        sectionToggles={sectionToggles}
        sectionVisibleBoothPlacements={sectionVisibleBoothPlacements}
        verticalAccessNodes={verticalAccessNodes}
        visualProfile={visualProfile}
        walkRegions={walkRegions}
        webglMode={webglAvailability.mode}
        zoneRuntimeState={zoneRuntimeState}
      />

      <ExpoWorldPlayerLayer
        bounds={playBounds}
        debug={debug}
        mobileMoveIntent={mobileMoveIntent}
        mode={mode}
        onMove={onMove}
        physicsSurfaceRegistry={physicsSurfaceRegistry}
        preserveReviewElevation={inspectionEnabled}
        startView={effectiveStartView}
        verticalAccessNodes={verticalAccessNodes}
      />
      </Canvas>
      )}
    </div>
  );
}
