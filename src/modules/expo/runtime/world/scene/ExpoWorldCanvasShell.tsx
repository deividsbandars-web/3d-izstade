import type * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { EXPO_CITY_QUALITY_TIER, type ExpoMode } from '../../../state/expoRuntime';
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
import { reportExpoDevError } from '../../../lib/devErrorReporter';

type WebglAvailability = {
  available: boolean;
  mode: 'webgl2' | 'webgl1' | null;
  reason: string | null;
};

function detectWebglAvailability(): WebglAvailability {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { available: false, mode: null, reason: 'Browser environment unavailable.' };
  }

  const canvas = document.createElement('canvas');
  const webgl2 = canvas.getContext('webgl2');
  if (webgl2) {
    return { available: true, mode: 'webgl2', reason: null };
  }

  const webgl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (webgl1) {
    return { available: true, mode: 'webgl1', reason: null };
  }

  return {
    available: false,
    mode: null,
    reason: 'WebGL is disabled or unavailable in this browser/device.',
  };
}

export function ExpoWorldCanvasShell({
  activeZoneId,
  debug,
  districtPrograms,
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
  effectiveStartView: ExpoStartView;
  hardIsolateNonTargets: boolean;
  highlightedTargets: string[];
  inspectionEnabled: boolean;
  isTouchDevice: boolean;
  isolateNonTargets: boolean;
  layerToggles: ExpoWorldLayerToggles;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean; turnL?: boolean; turnR?: boolean; jump?: boolean; lift?: boolean; lookX?: number };
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
  const [webglAvailability] = useState<WebglAvailability>(() => detectWebglAvailability());
  const canvasDpr: number | [number, number] = runtimeCaptureSafe
    ? 1
    : isTouchDevice
      ? [0.58, 0.85]
      : (EXPO_CITY_QUALITY_TIER === 'quality' ? [0.85, 1.2] : [0.55, 0.8]);
  const canvasShadows = !isTouchDevice && EXPO_CITY_QUALITY_TIER === 'quality';
  const canvasPerformanceMin = isTouchDevice
    ? 0.9
    : (EXPO_CITY_QUALITY_TIER === 'quality' ? 0.5 : 0.85);

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

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {!webglAvailability.available && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1800, display: 'grid', placeItems: 'center', padding: '28px', background: 'rgba(0,0,0,0.88)', color: '#e2e8f0' }}>
          <div style={{ maxWidth: '760px', width: '100%', borderRadius: '18px', border: '1px solid rgba(251, 191, 36, 0.35)', background: 'rgba(15, 23, 42, 0.8)', padding: '18px 20px' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', fontWeight: 900, color: '#fcd34d' }}>
              WEBGL REQUIRED
            </div>
            <div style={{ marginTop: '10px', fontWeight: 800, fontSize: '1.05rem' }}>
              3D world cannot start on this device/browser.
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', lineHeight: 1.5, color: '#cbd5e1' }}>
              {webglAvailability.reason || 'WebGL context could not be created.'}
              {' '}Enable hardware acceleration/WebGL in browser settings, update GPU drivers, or switch browser/device.
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.82rem', lineHeight: 1.5, color: '#94a3b8' }}>
              Hint: test WebGL on `get.webgl.org`. If only WebGL1 works, keep browser in WebGL1-compatible mode and reload.
            </div>
          </div>
        </div>
      )}
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
      {webglAvailability.available && (
      <Canvas
        key={`expo-webgl-${webglStatusKey}`}
      shadows={canvasShadows}
      dpr={canvasDpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      performance={{ min: canvasPerformanceMin }}
      camera={{ position: [0, 2, 10], fov: isTouchDevice ? 66 : 60, far: 10000 }}
      onCreated={onCreated as never}
    >
      <WorldSceneBridge
        sceneKey="expo-world-scene"
        setSceneUserData={setSceneUserData}
        startView={effectiveStartView}
        startViewKey={EXPO_START_VIEW_KEY}
      />
      <CenterScreenInspector inspectionEnabled={inspectionEnabled} />
      <ClickInspector clickInspectionEnabled={inspectionEnabled} />

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
        layerToggles={layerToggles}
        mode={mode}
        playerPosition={playerPosition}
        planningBoothPlacements={planningBoothPlacements}
        qualityProfileInputs={qualityProfileInputs}
        runtimeCaptureSafe={runtimeCaptureSafe}
        sceneVersion={sceneVersion}
        sectorMarkers={sectorMarkers}
        sectionToggles={sectionToggles}
        sectionVisibleBoothPlacements={sectionVisibleBoothPlacements}
        verticalAccessNodes={verticalAccessNodes}
        visualProfile={visualProfile}
        walkRegions={walkRegions}
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
