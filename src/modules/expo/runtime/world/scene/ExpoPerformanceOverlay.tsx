import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type CSSProperties } from 'react';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoWorldLayerToggles, ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import type { ExpoPerformanceOverlayMetrics } from './expoPerformanceOverlayState';
import type { ExpoQualitySettings } from '../quality/expoQualitySettings';
import type { ExpoScreenPolicyStatus, ExpoScreenTextureQualityHint } from '../quality/expoScreenRuntimePolicy';
import type {
  ExpoGeneratedBillboardQualityConfig,
  ExpoScreenTextureRuntimeStats,
} from '../quality/expoScreenTextureRuntimeStats';
import type { ExpoZoneRuntimeState } from '../zones/expoZoneRuntimeState';
import { getExpoInstancingRuntimeStats } from '../performance/expoInstancingUtils';
import { getExpoRaycastOptimizationRuntimeStats } from '../performance/expoRaycastUtils';
import {
  getDemoArenaAnalyticsSummary,
  getDemoArenaCtaInteractionSummary,
  getDemoArenaPreviewRuntimeSummary,
} from '../../demoArena';
import { getBoothProductDebugSummary, getBoothProductPreviewSummary } from '../../boothProduct';

type WebglOverlayStatus = {
  available: boolean;
  mode: 'webgl2' | 'webgl1' | null;
  reason: string | null;
};

type ExpoPerformanceOverlayProps = {
  activeVideoScreensCount?: number | null;
  enabled: boolean;
  layerToggles: ExpoWorldLayerToggles;
  metrics: ExpoPerformanceOverlayMetrics | null;
  mode: ExpoMode;
  qualitySettings: ExpoQualitySettings;
  sceneVersion: string | null;
  screenTextureQualityConfig: ExpoGeneratedBillboardQualityConfig;
  screenTextureQualityHint: ExpoScreenTextureQualityHint;
  screenTextureStats: ExpoScreenTextureRuntimeStats;
  screenPolicyStatus: ExpoScreenPolicyStatus;
  sectionToggles: ExpoWorldSectionToggles;
  visibleBoothCount: number;
  webglAvailability: WebglOverlayStatus;
  webglLost: boolean;
  zoneRuntimeState: ExpoZoneRuntimeState;
};

type ExpoPerformanceSamplerProps = {
  enabled: boolean;
  onSample: (metrics: ExpoPerformanceOverlayMetrics) => void;
};

function finiteMetric(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatNumber(value: number | null | undefined, digits = 0, suffix = '') {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'n/a';
  }

  return `${value.toFixed(digits)}${suffix}`;
}

function formatBoolean(value: boolean) {
  return value ? 'yes' : 'no';
}

function formatCanvasDpr(value: number | [number, number]) {
  return Array.isArray(value) ? `${value[0].toFixed(2)}-${value[1].toFixed(2)}` : value.toFixed(2);
}

function formatPosition(value: [number, number, number]) {
  return value.map((entry) => entry.toFixed(0)).join(',');
}

function formatToggleList(toggles: ExpoWorldLayerToggles | ExpoWorldSectionToggles) {
  const active = Object.entries(toggles)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  return active.length > 0 ? active.join(',') : 'none';
}

function formatShortList(values: string[], limit = 4) {
  if (values.length === 0) {
    return 'none';
  }

  const visible = values.slice(0, limit).join(',');
  return values.length > limit ? `${visible},+${values.length - limit}` : visible;
}

function resolveRouteLabel() {
  if (typeof window === 'undefined') {
    return 'n/a';
  }

  return window.location.pathname || 'n/a';
}

function resolveWebglLabel(status: WebglOverlayStatus, webglLost: boolean) {
  if (webglLost) {
    return 'lost';
  }

  if (!status.available) {
    return status.reason ? `unavailable (${status.reason})` : 'unavailable';
  }

  return status.mode ?? 'available';
}

export function ExpoPerformanceSampler({ enabled, onSample }: ExpoPerformanceSamplerProps) {
  const { gl } = useThree();
  const sampleRef = useRef({
    frameCount: 0,
    frameMsTotal: 0,
    lastSampleAt: 0,
  });

  useFrame((state, delta) => {
    if (!enabled) {
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : state.clock.elapsedTime * 1000;
    const sample = sampleRef.current;
    if (sample.lastSampleAt === 0) {
      sample.lastSampleAt = now;
    }

    sample.frameCount += 1;
    sample.frameMsTotal += delta * 1000;

    const elapsedMs = now - sample.lastSampleAt;
    if (elapsedMs < 500) {
      return;
    }

    const info = gl.info;
    const fps = sample.frameCount > 0 ? (sample.frameCount * 1000) / elapsedMs : null;
    const frameMs = sample.frameCount > 0 ? sample.frameMsTotal / sample.frameCount : null;

    onSample({
      devicePixelRatio: typeof window !== 'undefined' ? finiteMetric(window.devicePixelRatio) : null,
      drawCalls: finiteMetric(info.render.calls),
      fps,
      frameMs,
      geometries: finiteMetric(info.memory.geometries),
      rendererDpr: typeof gl.getPixelRatio === 'function' ? finiteMetric(gl.getPixelRatio()) : null,
      textures: finiteMetric(info.memory.textures),
      triangles: finiteMetric(info.render.triangles),
    });

    sample.frameCount = 0;
    sample.frameMsTotal = 0;
    sample.lastSampleAt = now;
  });

  return null;
}

export function ExpoPerformanceOverlay({
  activeVideoScreensCount,
  enabled,
  layerToggles,
  metrics,
  mode,
  qualitySettings,
  sceneVersion,
  screenTextureQualityConfig,
  screenTextureQualityHint,
  screenTextureStats,
  screenPolicyStatus,
  sectionToggles,
  visibleBoothCount,
  webglAvailability,
  webglLost,
  zoneRuntimeState,
}: ExpoPerformanceOverlayProps) {
  if (!enabled) {
    return null;
  }

  const instancingStats = getExpoInstancingRuntimeStats();
  const raycastStats = getExpoRaycastOptimizationRuntimeStats();
  const demoArenaPreviewStats = getDemoArenaPreviewRuntimeSummary();
  const demoArenaCtaStats = getDemoArenaAnalyticsSummary(undefined, demoArenaPreviewStats.enabled);
  const demoArenaCtaInteractionStats = getDemoArenaCtaInteractionSummary(undefined, demoArenaPreviewStats.enabled);
  const boothProductStats = getBoothProductDebugSummary();
  const boothProductPreviewStats = getBoothProductPreviewSummary();

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  };
  const valueStyle: CSSProperties = {
    color: '#f8fafc',
    maxWidth: '210px',
    overflowWrap: 'anywhere',
    textAlign: 'right',
  };
  const rows = [
    ['route', resolveRouteLabel()],
    ['mode', mode],
    ['scene', sceneVersion ?? 'n/a'],
    ['webgl', resolveWebglLabel(webglAvailability, webglLost)],
    ['fps', formatNumber(metrics?.fps, 1)],
    ['frame', formatNumber(metrics?.frameMs, 1, 'ms')],
    ['dpr', `${formatNumber(metrics?.rendererDpr, 2)} / device ${formatNumber(metrics?.devicePixelRatio, 2)}`],
    ['draws', formatNumber(metrics?.drawCalls)],
    ['triangles', formatNumber(metrics?.triangles)],
    ['geometries', formatNumber(metrics?.geometries)],
    ['textures', formatNumber(metrics?.textures)],
    ['quality request', qualitySettings.requestedTier],
    ['quality resolved', qualitySettings.resolvedTier],
    ['quality reason', qualitySettings.reason],
    ['legacy preset', qualitySettings.legacyFeaturePreset],
    ['mobile-like', formatBoolean(qualitySettings.isMobileLike)],
    ['quality max dpr', formatNumber(qualitySettings.maxDpr, 2)],
    ['quality canvas dpr', formatCanvasDpr(qualitySettings.canvasDpr)],
    ['shadows', formatBoolean(qualitySettings.shadowsEnabled)],
    ['antialias', formatBoolean(qualitySettings.antialiasEnabled)],
    ['postprocess', formatBoolean(qualitySettings.postprocessingEnabled)],
    ['adaptive dpr', formatBoolean(qualitySettings.adaptiveDprEnabled)],
    ['adaptive events', formatBoolean(qualitySettings.adaptiveEventsEnabled)],
    ['max videos', String(qualitySettings.maxActiveVideoScreens)],
    ['active videos', typeof activeVideoScreensCount === 'number' ? String(activeVideoScreensCount) : 'n/a'],
    ['screen policy', screenPolicyStatus],
    ['screen tex q', screenTextureQualityHint],
    ['billboard max', `${screenTextureQualityConfig.maxLongSide}x${screenTextureQualityConfig.maxShortSide}`],
    ['billboard cache', `${screenTextureStats.generatedBillboardCacheSize}/${screenTextureStats.textureCacheSize}`],
    ['billboard hit/miss', `${screenTextureStats.generatedBillboardCacheHits}/${screenTextureStats.generatedBillboardCacheMisses}`],
    ['billboard evict', String(screenTextureStats.generatedBillboardCacheEvictions)],
    ['last billboard', screenTextureStats.lastGeneratedBillboardWidth && screenTextureStats.lastGeneratedBillboardHeight
      ? `${screenTextureStats.lastGeneratedBillboardWidth}x${screenTextureStats.lastGeneratedBillboardHeight} ${screenTextureStats.lastGeneratedBillboardQualityHint ?? 'n/a'}`
      : 'n/a'],
    ['instancing', `${instancingStats.instancedGroupCount} groups / ${instancingStats.replacedMeshCount} meshes`],
    ['instancing saved', `~${instancingStats.estimatedDrawCallReduction} draws`],
    ['instancing ids', formatShortList(instancingStats.optimizedTargetIds, 2)],
    ['raycast opt', `${raycastStats.optimizedTargetCount} targets / ${raycastStats.optimizedObjectCount} objects`],
    ['raycast ids', formatShortList(raycastStats.optimizedTargetIds, 2)],
    ['demo arena', demoArenaPreviewStats.enabled ? 'preview' : 'off'],
    ['demo event', demoArenaPreviewStats.enabled ? demoArenaPreviewStats.activeEventId ?? 'n/a' : 'n/a'],
    ['demo screens', `${demoArenaPreviewStats.mappedScreenCount}/${demoArenaPreviewStats.totalTargets}`],
    ['demo ctas', demoArenaPreviewStats.enabled ? `${demoArenaCtaStats.previewEnabledCtaCount}/${demoArenaCtaStats.ctaCount}` : 'off'],
    ['demo cta click', demoArenaPreviewStats.enabled ? `disabled / ${demoArenaCtaInteractionStats.ctaClickableCount} clickable` : 'off'],
    ['boothProduct', `${boothProductStats.profileCount} profiles / ${boothProductStats.previewSafeCount} preview-safe / rendered ${boothProductStats.rendered ? 'on' : 'off'}`],
    ['boothProduct preview', boothProductPreviewStats.enabled
      ? `on / ${boothProductPreviewStats.visiblePreviewCardCount} ${boothProductPreviewStats.visiblePreviewCardCount === 1 ? 'card' : 'cards'} / default off`
      : 'off / card off'],
    ['static screens', formatBoolean(qualitySettings.preferStaticScreens)],
    ['far details', formatBoolean(qualitySettings.farDetailsEnabled)],
    ['transparent fx', formatBoolean(qualitySettings.transparentEffectsEnabled)],
    ['fog', formatBoolean(qualitySettings.fogEnabled)],
    ['animation', qualitySettings.animationIntensity],
    ['render dist', formatNumber(qualitySettings.renderDistanceMultiplier, 2)],
    ['lod bias', qualitySettings.lodBias],
    ['raycast budget', String(qualitySettings.raycastBudget)],
    ['perf min', formatNumber(qualitySettings.performanceMin, 2)],
    ['operator zone', zoneRuntimeState.operatorZoneId ?? 'n/a'],
    ['active zone', zoneRuntimeState.activeZoneId],
    ['prev zone', zoneRuntimeState.previousActiveZoneId ?? 'n/a'],
    ['adjacent zones', zoneRuntimeState.adjacentZoneIds.join(',') || 'none'],
    ['zone policy', zoneRuntimeState.visibilityPolicyLabel],
    ['detail policy', zoneRuntimeState.zoneDetailPolicyLabel],
    ['zone cull', zoneRuntimeState.zoneCullRequested ? `requested/${zoneRuntimeState.zoneCullEnabled ? 'enabled' : 'blocked'}` : 'off'],
    ['cull blocked', zoneRuntimeState.zoneCullBlockedReason ?? 'none'],
    ['capture safe', formatBoolean(zoneRuntimeState.runtimeCaptureSafe)],
    ['zone groups', String(zoneRuntimeState.registeredZoneGroupCount)],
    ['zone visible', String(zoneRuntimeState.visibleZoneGroupCount)],
    ['detail full', String(zoneRuntimeState.fullGroupCount)],
    ['detail reduced', String(zoneRuntimeState.reducedGroupCount)],
    ['detail always', String(zoneRuntimeState.alwaysVisibleGroupCount)],
    ['detail candidates', String(zoneRuntimeState.hiddenCandidateGroupCount)],
    ['detail hidden', String(zoneRuntimeState.actuallyHiddenGroupCount)],
    ['zone unknown', String(zoneRuntimeState.unknownGroupCount)],
    ['hidden ids', formatShortList(zoneRuntimeState.hiddenGroupIds)],
    ['reduced ids', formatShortList(zoneRuntimeState.reducedGroupIds)],
    ['candidate ids', formatShortList(zoneRuntimeState.hiddenCandidateGroupIds)],
    ['zone reason', zoneRuntimeState.activeZoneReason],
    ['zone pos', formatPosition(zoneRuntimeState.playerPosition)],
    ['zone sample', formatNumber(zoneRuntimeState.lastUpdateAt, 0, 'ms')],
    ['sections', formatToggleList(sectionToggles)],
    ['layers', formatToggleList(layerToggles)],
    ['booths', String(visibleBoothCount)],
  ];

  return (
    <div
      data-expo-performance-overlay="true"
      style={{
        background: 'rgba(2, 6, 23, 0.74)',
        border: '1px solid rgba(148, 163, 184, 0.28)',
        borderRadius: '12px',
        boxShadow: '0 14px 40px rgba(0, 0, 0, 0.22)',
        color: '#93c5fd',
        fontFamily: 'Consolas, Menlo, Monaco, monospace',
        fontSize: '11px',
        left: '12px',
        lineHeight: 1.35,
        maxWidth: '360px',
        minWidth: '280px',
        padding: '10px 12px',
        pointerEvents: 'none',
        position: 'absolute',
        top: '12px',
        zIndex: 2300,
      }}
    >
      <div style={{ color: '#fbbf24', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '7px' }}>
        WEB3D PERF
      </div>
      {rows.map(([label, value]) => (
        <div key={label} style={rowStyle}>
          <span>{label}</span>
          <span style={valueStyle}>{value}</span>
        </div>
      ))}
    </div>
  );
}
