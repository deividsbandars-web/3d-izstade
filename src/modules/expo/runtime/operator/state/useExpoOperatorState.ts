import { useEffect, useMemo, useState } from 'react';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView } from '../../../world-contract';
import {
  hasFinitePositiveSizeTuple,
  hasFiniteTuple3,
  resolveYawAwareScreenSurfaceBounds,
} from '../../planning/screens/screenSurfaceFootprintBounds';
import { DEFAULT_REVIEW_OPERATOR_ZONE_ID, type ReviewOperatorZone } from '../model/reviewOperatorSession';
import { buildZoneFixRoutes } from '../model/zoneFixRouting';
import { validateReviewZone } from '../model/zoneReviewValidation';
import type { WorldDiagnosticReport } from '../../world/inspection/worldDiagnosticReport';
import type { WorldObjectLayer, WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';

type LayerStates = {
  booths: boolean;
  city: boolean;
  promenade: boolean;
  skyline: boolean;
  stadium: boolean;
};

type SectionStates = {
  arrival: boolean;
  left: boolean;
  middle: boolean;
  right: boolean;
  stadium: boolean;
};

type InspectorEntry = {
  distance: number;
  id: string;
  layer: string;
};

type UseExpoOperatorStateArgs = {
  activeZoneId: string | null;
  centerStack: string[];
  centerTarget: string | null;
  clickStack: string[];
  clickTarget: string | null;
  enabled: boolean;
  inspector: InspectorEntry[];
  mode: ExpoMode;
  playerPos: number[];
  diagnosticReport: WorldDiagnosticReport;
  registryEntries: {
    booths: WorldObjectRegistryEntry[];
    city: WorldObjectRegistryEntry[];
    stadium: WorldObjectRegistryEntry[];
  };
  sceneVersion: string | null;
  setMode: (mode: ExpoMode) => void;
  dataMode: string;
  zones: ReviewOperatorZone[];
};

export type ExpoReviewOperatorSnapshot = ReturnType<typeof buildExpoReviewOperatorSnapshot>;

export type ExpoZoneReviewReport = {
  diagnosticsSummary: {
    boothFrontalityCount: number;
    screenBoundsCount: number;
    screenBoothProximityCount: number;
    screenOrientationCount: number;
    screenOverlapCount: number;
  };
  fixRoutes: ExpoReviewOperatorSnapshot['operatorZoneFixRoutes'];
  label: string;
  observations: string[];
  status: 'ok' | 'warning';
  visualDefects: ExpoZoneVisualDefect[];
  warnings: string[];
  zoneId: string;
};

export type ExpoZoneVisualDefect = {
  family: string;
  id: string;
  message: string;
  relatedIds: string[];
  severity: 'warning';
  source: 'diagnostic' | 'validation';
};

function dispatchOperatorTeleport(zone: ReviewOperatorZone) {
  dispatchOperatorTeleportStartView(zone.startView, zone.id);
}

function dispatchOperatorTeleportStartView(startView: ExpoStartView, zoneId?: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
    detail: {
      startView,
      zoneId: zoneId ?? undefined,
    },
  }));
}

function resolveOperatorZone(zones: ReviewOperatorZone[], zoneId: string) {
  return zones.find((entry) => entry.id === zoneId) ?? null;
}

function rotatePointAroundPivotY(
  point: [number, number, number],
  pivot: [number, number, number],
  radians: number,
): [number, number, number] {
  const dx = point[0] - pivot[0];
  const dz = point[2] - pivot[2];
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return [
    pivot[0] + (dx * cos) - (dz * sin),
    point[1],
    pivot[2] + (dx * sin) + (dz * cos),
  ];
}

export function buildZoneObservationsFromSnapshot(
  snapshot: ExpoReviewOperatorSnapshot,
  zoneId?: string | null,
): string[] {
  const effectiveZoneId = zoneId ?? snapshot.operatorZoneId;
  const zone = snapshot.zones.find((entry) => entry.id === effectiveZoneId);
  if (!zone) {
    return [];
  }

  return zone.validation.extraVisibleLayers.map((layer) => `Extra visible layer: ${layer}`);
}

export function buildZoneWarningsFromSnapshot(
  snapshot: ExpoReviewOperatorSnapshot,
  zoneId?: string | null,
): string[] {
  const effectiveZoneId = zoneId ?? snapshot.operatorZoneId;
  const zone = snapshot.zones.find((entry) => entry.id === effectiveZoneId);
  if (!zone) {
    return effectiveZoneId ? [`Unknown review zone: ${effectiveZoneId}`] : ['No active review zone'];
  }

  const warnings: string[] = [];
  if (zone.validation.locationStatus === 'mismatch') {
    warnings.push(`Review camera is not settled for zone ${zone.id} (distance ${Math.round(zone.validation.locationDistance)})`);
  }
  for (const objectId of zone.validation.missingExpectedObjectIds) {
    warnings.push(`Missing expected object: ${objectId}`);
  }
  for (const layer of zone.validation.missingExpectedLayers) {
    warnings.push(`Missing expected layer: ${layer}`);
  }
  for (const objectId of zone.validation.unknownExpectedObjectIds) {
    warnings.push(`Unknown expected object: ${objectId}`);
  }
  for (const objectId of zone.validation.forbiddenObjectIdsPresent) {
    warnings.push(`Forbidden object present: ${objectId}`);
  }
  for (const layer of zone.validation.forbiddenExpectedLayersPresent) {
    warnings.push(`Forbidden layer present: ${layer}`);
  }

  return warnings;
}

function resolveDiagnosticRelatedIds(entry: ExpoReviewOperatorSnapshot['diagnostics']['summary']['warnings'][number]) {
  if (entry.family === 'screen-overlap' || entry.family === 'screen-booth-proximity') {
    return entry.id.split(':').filter(Boolean);
  }

  return entry.id ? [entry.id] : [];
}

function resolveScreenHostBinding(screenId: string) {
  if (screenId === 'rear-campus-bowl-feed-surface') {
    return { hostId: 'stadium-bowl', maxDistanceXZ: 520 };
  }

  if (screenId.endsWith('-host-surface')) {
    return {
      hostId: screenId.slice(0, -'-host-surface'.length),
      maxDistanceXZ: 260,
    };
  }

  if (screenId.endsWith('-rear-campus-feed-surface')) {
    return {
      hostId: screenId.slice(0, -'-rear-campus-feed-surface'.length),
      maxDistanceXZ: 220,
    };
  }

  if (screenId.endsWith('-tower-ribbon')) {
    return {
      hostId: screenId.slice(0, -'-tower-ribbon'.length),
      maxDistanceXZ: 140,
    };
  }

  if (screenId.endsWith('-crown-beacon')) {
    return {
      hostId: screenId.slice(0, -'-crown-beacon'.length),
      maxDistanceXZ: 120,
    };
  }

  return null;
}

function buildScreenHostFitDefects(args: {
  registryById: Record<string, WorldObjectRegistryEntry>;
  zone: {
    expectedKeyObjectIds: string[];
  };
  validation: {
    actualKeyObjectIds: string[];
  };
}): ExpoZoneVisualDefect[] {
  const defects: ExpoZoneVisualDefect[] = [];
  const candidateIds = new Set([
    ...args.zone.expectedKeyObjectIds,
    ...args.validation.actualKeyObjectIds,
  ]);

  for (const candidateId of candidateIds) {
    const binding = resolveScreenHostBinding(candidateId);
    if (!binding) {
      continue;
    }

    const screenEntry = args.registryById[candidateId];
    if (!screenEntry) {
      continue;
    }

    const hostEntry = args.registryById[binding.hostId];
    if (!hostEntry) {
      defects.push({
        family: 'screen-missing-host',
        id: candidateId,
        message: `Screen ${candidateId} expects host ${binding.hostId}, but that host is missing from the world registry.`,
        relatedIds: [candidateId, binding.hostId],
        severity: 'warning',
        source: 'validation',
      });
      continue;
    }

    const distanceXZ = Math.hypot(
      screenEntry.position[0] - hostEntry.position[0],
      screenEntry.position[2] - hostEntry.position[2],
    );

    if (distanceXZ > binding.maxDistanceXZ) {
      defects.push({
        family: 'screen-host-gap',
        id: candidateId,
        message: `Screen ${candidateId} sits ${Math.round(distanceXZ)} units away from host ${binding.hostId}, which exceeds the expected host gap.`,
        relatedIds: [candidateId, binding.hostId],
        severity: 'warning',
        source: 'validation',
      });
    }
  }

  return defects;
}

function resolveRegistryEntryBounds(entry: WorldObjectRegistryEntry) {
  if (
    !hasFiniteTuple3(entry.position)
    || !entry.size
    || !hasFinitePositiveSizeTuple(entry.size)
  ) {
    return null;
  }

  const rotation = entry.rotation && hasFiniteTuple3(entry.rotation)
    ? entry.rotation
    : [0, 0, 0] as [number, number, number];
  const xzBounds = resolveYawAwareScreenSurfaceBounds({
    position: entry.position,
    rotation,
    size: entry.size,
  });
  const halfHeight = entry.size[1] * 0.5;

  return {
    ...xzBounds,
    maxY: entry.position[1] + halfHeight,
    minY: entry.position[1] - halfHeight,
  };
}

function measurePositiveAxisOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin);
}

function buildScreenPenetrationDefects(args: {
  registryById: Record<string, WorldObjectRegistryEntry>;
  zone: {
    expectedKeyObjectIds: string[];
  };
  validation: {
    actualKeyObjectIds: string[];
  };
}): ExpoZoneVisualDefect[] {
  const defects: ExpoZoneVisualDefect[] = [];
  const candidateIds = new Set([
    ...args.zone.expectedKeyObjectIds,
    ...args.validation.actualKeyObjectIds,
  ]);

  for (const candidateId of candidateIds) {
    const screenEntry = args.registryById[candidateId];
    if (
      !screenEntry
      || (screenEntry.layer !== 'city-screen-surface' && screenEntry.layer !== 'stadium-screen-surface')
    ) {
      continue;
    }

    const binding = resolveScreenHostBinding(candidateId);
    if (!binding) {
      continue;
    }

    const hostEntry = args.registryById[binding.hostId];
    if (!hostEntry) {
      continue;
    }

    const screenBounds = resolveRegistryEntryBounds(screenEntry);
    const hostBounds = resolveRegistryEntryBounds(hostEntry);
    if (!screenBounds || !hostBounds) {
      continue;
    }

    const overlapX = measurePositiveAxisOverlap(screenBounds.minX, screenBounds.maxX, hostBounds.minX, hostBounds.maxX);
    const overlapY = measurePositiveAxisOverlap(screenBounds.minY, screenBounds.maxY, hostBounds.minY, hostBounds.maxY);
    const overlapZ = measurePositiveAxisOverlap(screenBounds.minZ, screenBounds.maxZ, hostBounds.minZ, hostBounds.maxZ);

    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) {
      continue;
    }

    const screenDepth = screenEntry.size?.[2] ?? 0;
    const penetratingTooDeep = overlapZ > Math.max(8, screenDepth * 2.4);
    if (!penetratingTooDeep) {
      continue;
    }

    defects.push({
      family: 'screen-penetrating-host',
      id: candidateId,
      message: `Screen ${candidateId} overlaps host ${binding.hostId} too deeply, which suggests it is embedded in structure instead of mounted on it.`,
      relatedIds: [candidateId, binding.hostId],
      severity: 'warning',
      source: 'validation',
    });
  }

  return defects;
}

function buildLayerMixDefects(args: {
  validation: {
    actualVisibleLayers: WorldObjectLayer[];
  };
  zone: {
    id: string;
  };
}): ExpoZoneVisualDefect[] {
  const defects: ExpoZoneVisualDefect[] = [];
  const visibleLayers = new Set(args.validation.actualVisibleLayers);

  if (
    visibleLayers.has('stadium-screen-feed')
    && (
      visibleLayers.has('stadium-screen-surface')
      || visibleLayers.has('stadium-screen-assignment')
      || visibleLayers.has('stadium-screen-socket')
    )
  ) {
    defects.push({
      family: 'screen-feed-conflict',
      id: args.zone.id,
      message: `Zone ${args.zone.id} is showing both legacy stadium feed layers and planner-driven stadium screen layers at the same time.`,
      relatedIds: [],
      severity: 'warning',
      source: 'validation',
    });
  }

  if (
    visibleLayers.has('city-plane')
    && visibleLayers.has('stadium-plane')
  ) {
    defects.push({
      family: 'mixed-ground-plane',
      id: args.zone.id,
      message: `Zone ${args.zone.id} is showing both city and stadium ground planes, which suggests a seam or overlap candidate.`,
      relatedIds: [],
      severity: 'warning',
      source: 'validation',
    });
  }

  return defects;
}

function buildZoneVisualDefects(args: {
  diagnosticReport: WorldDiagnosticReport;
  registryById?: Record<string, WorldObjectRegistryEntry>;
  validation: {
    actualKeyObjectIds: string[];
    actualVisibleLayers: WorldObjectLayer[];
    extraVisibleLayers: WorldObjectLayer[];
    forbiddenExpectedLayersPresent: WorldObjectLayer[];
    forbiddenObjectIdsPresent: string[];
    locationStatus: 'mismatch' | 'settled';
  };
  zone: {
    expectedKeyObjectIds: string[];
    id: string;
  };
}): ExpoZoneVisualDefect[] {
  const relevantIds = new Set([
    ...args.zone.expectedKeyObjectIds,
    ...args.validation.actualKeyObjectIds,
  ]);
  const defects: ExpoZoneVisualDefect[] = [];
  const seen = new Set<string>();

  const pushDefect = (defect: ExpoZoneVisualDefect) => {
    const key = `${defect.source}:${defect.family}:${defect.id}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    defects.push(defect);
  };

  for (const warning of args.diagnosticReport.summary.warnings) {
    const relatedIds = resolveDiagnosticRelatedIds(warning);
    if (!relatedIds.some((id) => relevantIds.has(id))) {
      continue;
    }

    pushDefect({
      family: warning.family,
      id: warning.id,
      message: warning.message,
      relatedIds,
      severity: 'warning',
      source: 'diagnostic',
    });
  }

  if (args.registryById) {
    for (const defect of buildScreenHostFitDefects({
      registryById: args.registryById,
      validation: args.validation,
      zone: args.zone,
    })) {
      pushDefect(defect);
    }

    for (const defect of buildScreenPenetrationDefects({
      registryById: args.registryById,
      validation: args.validation,
      zone: args.zone,
    })) {
      pushDefect(defect);
    }
  }

  for (const defect of buildLayerMixDefects({
    validation: args.validation,
    zone: args.zone,
  })) {
    pushDefect(defect);
  }

  if (args.validation.locationStatus === 'settled') {
    for (const layer of args.validation.extraVisibleLayers) {
      pushDefect({
        family: 'unexpected-layer',
        id: layer,
        message: `Unexpected visible layer in zone ${args.zone.id}: ${layer}`,
        relatedIds: [],
        severity: 'warning',
        source: 'validation',
      });
    }

    for (const objectId of args.validation.forbiddenObjectIdsPresent) {
      pushDefect({
        family: 'forbidden-object',
        id: objectId,
        message: `Forbidden object is visible in zone ${args.zone.id}: ${objectId}`,
        relatedIds: [objectId],
        severity: 'warning',
        source: 'validation',
      });
    }

    for (const layer of args.validation.forbiddenExpectedLayersPresent) {
      pushDefect({
        family: 'forbidden-layer',
        id: layer,
        message: `Forbidden layer is visible in zone ${args.zone.id}: ${layer}`,
        relatedIds: [],
        severity: 'warning',
        source: 'validation',
      });
    }
  }

  return defects;
}

export function buildZoneVisualDefectsFromSnapshot(
  snapshot: ExpoReviewOperatorSnapshot,
  zoneId?: string | null,
): ExpoZoneVisualDefect[] {
  const effectiveZoneId = zoneId ?? snapshot.operatorZoneId;
  const zone = snapshot.zones.find((entry) => entry.id === effectiveZoneId);
  if (!zone) {
    return [];
  }

  return buildZoneVisualDefects({
    diagnosticReport: snapshot.diagnostics,
    registryById: snapshot.registryById,
    validation: zone.validation,
    zone,
  });
}

export function buildZoneReviewReport(
  snapshot: ExpoReviewOperatorSnapshot,
  zoneId?: string | null,
): ExpoZoneReviewReport | null {
  const effectiveZoneId = zoneId ?? snapshot.operatorZoneId;
  const zone = snapshot.zones.find((entry) => entry.id === effectiveZoneId);
  if (!zone) {
    return null;
  }

  return {
    diagnosticsSummary: {
      boothFrontalityCount: snapshot.diagnostics.booths.frontalityCount,
      screenBoothProximityCount: snapshot.diagnostics.screens.boothProximityCount,
      screenBoundsCount: snapshot.diagnostics.screens.boundsCount,
      screenOrientationCount: snapshot.diagnostics.screens.orientationCount,
      screenOverlapCount: snapshot.diagnostics.screens.overlapCount,
    },
    fixRoutes: zone.fixRoutes,
    label: zone.label,
    observations: buildZoneObservationsFromSnapshot(snapshot, zone.id),
    status: zone.validation.status,
    visualDefects: buildZoneVisualDefectsFromSnapshot(snapshot, zone.id),
    warnings: buildZoneWarningsFromSnapshot(snapshot, zone.id),
    zoneId: zone.id,
  };
}

export function buildAllZoneReviewReports(
  snapshot: ExpoReviewOperatorSnapshot,
): ExpoZoneReviewReport[] {
  return snapshot.zones
    .map((zone) => buildZoneReviewReport(snapshot, zone.id))
    .filter(Boolean) as ExpoZoneReviewReport[];
}

function isSnapshotSettledForZone(
  snapshot: ExpoReviewOperatorSnapshot | null,
  zone: ReviewOperatorZone,
): boolean {
  if (
    !snapshot ||
    snapshot.operatorZoneId !== zone.id ||
    snapshot.operatorZoneValidation?.locationStatus !== 'settled'
  ) {
    return false;
  }

  const [playerX, , playerZ] = snapshot.playerPos;
  const [zoneX, , zoneZ] = zone.startView.position;
  return Math.hypot(playerX - zoneX, playerZ - zoneZ) <= 120;
}

function buildCurrentOperatorZoneState(args: {
  centerTarget: string | null;
  clickTarget: string | null;
  diagnosticReport: WorldDiagnosticReport;
  inspector: InspectorEntry[];
  operatorZoneId: string | null;
  playerPos: number[];
  registryEntries: {
    booths: WorldObjectRegistryEntry[];
    city: WorldObjectRegistryEntry[];
    stadium: WorldObjectRegistryEntry[];
  };
  zones: ReviewOperatorZone[];
}) {
  const operatorZone = args.zones.find((zone) => zone.id === args.operatorZoneId) ?? null;
  if (!operatorZone) {
    return {
      centerTargetEntry: null,
      clickTargetEntry: null,
      operatorZone: null,
      operatorZoneFixRoutes: [] as ReturnType<typeof buildZoneFixRoutes>,
      operatorZoneValidation: null as ReturnType<typeof validateReviewZone> | null,
      operatorZoneVisualDefects: [] as ExpoZoneVisualDefect[],
    };
  }

  const allRegistryEntries = [
    ...args.registryEntries.city,
    ...args.registryEntries.stadium,
    ...args.registryEntries.booths,
  ];
  const registryById = Object.fromEntries(
    allRegistryEntries.map((entry) => [entry.id, entry]),
  ) as Record<string, WorldObjectRegistryEntry>;
  const centerTargetEntry = args.centerTarget ? registryById[args.centerTarget] ?? null : null;
  const clickTargetEntry = args.clickTarget ? registryById[args.clickTarget] ?? null : null;
  const resolvedInspectorEntries = args.inspector.map((entry) => ({
    ...entry,
    layer: (registryById[entry.id]?.layer ?? entry.layer) as WorldObjectLayer,
    registryEntry: registryById[entry.id] ?? null,
  }));
  const operatorZoneValidation = validateReviewZone(operatorZone, {
    centerTargetEntry,
    clickTargetEntry,
    inspectorEntries: resolvedInspectorEntries,
    playerPos: args.playerPos,
    registryById,
  });
  const operatorZoneFixRoutes = buildZoneFixRoutes({
    registryById,
    validation: operatorZoneValidation,
    zone: operatorZone,
  });
  const operatorZoneVisualDefects = buildZoneVisualDefects({
    diagnosticReport: args.diagnosticReport,
    registryById,
    validation: operatorZoneValidation,
    zone: {
      expectedKeyObjectIds: operatorZone.expectedKeyObjectIds,
      id: operatorZone.id,
    },
  });

  return {
    centerTargetEntry,
    clickTargetEntry,
    operatorZone,
    operatorZoneFixRoutes,
    operatorZoneValidation,
    operatorZoneVisualDefects,
  };
}

export function buildExpoReviewOperatorSnapshot(args: {
  activeZoneId: string | null;
  centerStack: string[];
  centerTarget: string | null;
  clickStack: string[];
  clickTarget: string | null;
  dataMode: string;
  focusSlug: string | null;
  inspector: InspectorEntry[];
  layerStates: LayerStates;
  markedPoint: [number, number, number] | null;
  mode: ExpoMode;
  operatorZoneId: string | null;
  playerPos: number[];
  diagnosticReport: WorldDiagnosticReport;
  registryEntries: {
    booths: WorldObjectRegistryEntry[];
    city: WorldObjectRegistryEntry[];
    stadium: WorldObjectRegistryEntry[];
  };
  sceneVersion: string | null;
  sectionStates: SectionStates;
  targetBasket: string[];
  zones: ReviewOperatorZone[];
}) {
  const allRegistryEntries = [
    ...args.registryEntries.city,
    ...args.registryEntries.stadium,
    ...args.registryEntries.booths,
  ];
  const registryById = Object.fromEntries(
    allRegistryEntries.map((entry) => [entry.id, entry]),
  ) as Record<string, WorldObjectRegistryEntry>;
  const resolvedInspectorEntries = args.inspector.map((entry) => ({
    ...entry,
    layer: (registryById[entry.id]?.layer ?? entry.layer) as WorldObjectLayer,
    registryEntry: registryById[entry.id] ?? null,
  }));
  const centerTargetEntry = args.centerTarget ? registryById[args.centerTarget] ?? null : null;
  const clickTargetEntry = args.clickTarget ? registryById[args.clickTarget] ?? null : null;
  const zoneValidations = args.zones.map((zone) => ({
    expectedKeyObjectIds: zone.expectedKeyObjectIds,
    expectedVisibleLayers: zone.expectedVisibleLayers,
    fixRoutes: [] as ReturnType<typeof buildZoneFixRoutes>,
    forbiddenKeyObjectIds: zone.forbiddenKeyObjectIds,
    forbiddenVisibleLayers: zone.forbiddenVisibleLayers,
    id: zone.id,
    intent: zone.intent,
    label: zone.label,
    startView: zone.startView,
    validation: validateReviewZone(zone, {
      centerTargetEntry,
      clickTargetEntry,
      inspectorEntries: resolvedInspectorEntries,
      playerPos: args.playerPos,
      registryById,
    }),
    watchItems: zone.watchItems,
  })).map((zone) => ({
    ...zone,
    fixRoutes: buildZoneFixRoutes({
      registryById,
      validation: zone.validation,
      zone: {
        expectedKeyObjectIds: zone.expectedKeyObjectIds,
        expectedVisibleLayers: zone.expectedVisibleLayers,
        forbiddenKeyObjectIds: zone.forbiddenKeyObjectIds,
        forbiddenVisibleLayers: zone.forbiddenVisibleLayers,
        id: zone.id,
        intent: zone.intent,
        label: zone.label,
        startView: zone.startView,
        watchItems: zone.watchItems,
      },
    }),
  }));

  return {
    activeZoneId: args.activeZoneId,
    centerStack: args.centerStack,
    centerTarget: args.centerTarget,
    clickStack: args.clickStack,
    clickTarget: args.clickTarget,
    dataMode: args.dataMode,
    diagnostics: args.diagnosticReport,
    focusSlug: args.focusSlug,
    inspector: args.inspector,
    layerStates: args.layerStates,
    markedPoint: args.markedPoint,
    mode: args.mode,
    operatorZone: args.zones
      .map((zone) => ({
        expectedKeyObjectIds: zone.expectedKeyObjectIds,
        expectedVisibleLayers: zone.expectedVisibleLayers,
        forbiddenKeyObjectIds: zone.forbiddenKeyObjectIds,
        forbiddenVisibleLayers: zone.forbiddenVisibleLayers,
        id: zone.id,
        intent: zone.intent,
        label: zone.label,
        startView: zone.startView,
        watchItems: zone.watchItems,
      }))
      .find((zone) => zone.id === args.operatorZoneId) ?? null,
    operatorZoneFixRoutes: zoneValidations.find((zone) => zone.id === args.operatorZoneId)?.fixRoutes ?? [],
    operatorZoneId: args.operatorZoneId,
    operatorZoneValidation: zoneValidations.find((zone) => zone.id === args.operatorZoneId)?.validation ?? null,
    playerPos: args.playerPos,
    registry: {
      all: allRegistryEntries,
      booths: args.registryEntries.booths,
      city: args.registryEntries.city,
      stadium: args.registryEntries.stadium,
      totalCount: allRegistryEntries.length,
    },
    registryById,
    resolvedTargets: {
      centerTargetEntry,
      clickTargetEntry,
      inspectorEntries: resolvedInspectorEntries,
      targetBasketEntries: args.targetBasket.map((id) => registryById[id]).filter(Boolean),
    },
    sceneVersion: args.sceneVersion,
    sectionStates: args.sectionStates,
    targetBasket: args.targetBasket,
    zones: zoneValidations,
  };
}

export function useExpoOperatorState({
  activeZoneId,
  centerStack,
  centerTarget,
  clickStack,
  clickTarget,
  dataMode,
  diagnosticReport,
  enabled,
  inspector,
  mode,
  playerPos,
  registryEntries,
  sceneVersion,
  setMode,
  zones,
}: UseExpoOperatorStateArgs) {
  const [debug, setDebug] = useState(EXPO_DEBUG_DEFAULT);
  const [focusSlug, setFocusSlug] = useState<string | null>('__use_url__');
  const [markedPoint, setMarkedPoint] = useState<[number, number, number] | null>(null);
  const [targetBasket, setTargetBasket] = useState<string[]>([]);
  const [operatorZoneId, setOperatorZoneId] = useState<string | null>(() => (enabled ? DEFAULT_REVIEW_OPERATOR_ZONE_ID : null));
  const [layerStates, setLayerStates] = useState<LayerStates>({
    booths: true,
    city: true,
    promenade: true,
    skyline: true,
    stadium: true,
  });
  const [sectionStates, setSectionStates] = useState<SectionStates>({
    arrival: true,
    left: true,
    middle: true,
    right: true,
    stadium: true,
  });
  const currentOperatorZoneState = useMemo(() => buildCurrentOperatorZoneState({
    centerTarget,
    clickTarget,
    diagnosticReport,
    inspector,
    operatorZoneId,
    playerPos,
    registryEntries,
    zones,
  }), [
    centerTarget,
    clickTarget,
    diagnosticReport,
    inspector,
    operatorZoneId,
    playerPos,
    registryEntries,
    zones,
  ]);

  const buildSnapshot = () => buildExpoReviewOperatorSnapshot({
    activeZoneId,
    centerStack,
    centerTarget,
    clickStack,
    clickTarget,
    dataMode,
    diagnosticReport,
    focusSlug,
    inspector,
    layerStates,
    markedPoint,
    mode,
    operatorZoneId,
    playerPos,
    registryEntries,
    sceneVersion,
    sectionStates,
    targetBasket,
    zones,
  });

  const goToZone = (zoneId: string) => {
    const zone = resolveOperatorZone(zones, zoneId);
    if (!zone) {
      return false;
    }

    setFocusSlug('');
    setOperatorZoneId(zone.id);
    dispatchOperatorTeleport(zone);
    return true;
  };

  const setView = (startView: ExpoStartView, zoneId?: string | null) => {
    dispatchOperatorTeleportStartView(startView, zoneId);
    return true;
  };

  const orbitCurrentView = (yawDegrees: number, zoneId?: string | null) => {
    const snapshot = buildSnapshot();
    const baseZoneId = zoneId ?? snapshot.operatorZoneId;
    if (!baseZoneId) {
      return false;
    }

    const zone = resolveOperatorZone(zones, baseZoneId);
    if (!zone) {
      return false;
    }

    const radians = (yawDegrees * Math.PI) / 180;
    const nextStartView: ExpoStartView = {
      lookAt: [...zone.startView.lookAt] as [number, number, number],
      position: rotatePointAroundPivotY(
        zone.startView.position,
        zone.startView.lookAt,
        radians,
      ),
      source: zone.startView.source,
    };

    dispatchOperatorTeleportStartView(nextStartView, zone.id);
    return true;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    const reviewZoneAsync = async (zoneId: string) => {
      const zone = resolveOperatorZone(zones, zoneId);
      if (!zone || typeof window === 'undefined') {
        return null;
      }

      goToZone(zone.id);

      return await new Promise<ExpoZoneReviewReport | null>((resolve) => {
        let attempts = 0;
        let timeoutId: number | null = null;
        const schedulePoll = () => {
          timeoutId = window.setTimeout(poll, 50);
        };
        const poll = () => {
          const runtimeOperator = (window as unknown as {
            __WARPALA_EXPO_REVIEW_OPERATOR__?: {
              getSnapshot?: () => ExpoReviewOperatorSnapshot;
            };
          }).__WARPALA_EXPO_REVIEW_OPERATOR__;
          const snapshot = runtimeOperator?.getSnapshot?.() ?? null;

          if (snapshot && isSnapshotSettledForZone(snapshot, zone)) {
            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
            }
            resolve(buildZoneReviewReport(snapshot, zone.id));
            return;
          }

          if (attempts >= 180) {
            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
            }
            resolve(snapshot ? buildZoneReviewReport(snapshot, snapshot.operatorZoneId) : null);
            return;
          }

          attempts += 1;
          schedulePoll();
        };

        schedulePoll();
      });
    };

    const operator = {
      buildAllZoneReviewReports: () => buildAllZoneReviewReports(buildSnapshot()),
      buildZoneReviewReport: (zoneId?: string | null) => buildZoneReviewReport(buildSnapshot(), zoneId),
      clearFocus: () => {
        setOperatorZoneId(null);
        setFocusSlug('');
      },
      focusBooth: (slugOrId: string) => {
        setOperatorZoneId(null);
        setFocusSlug(slugOrId);
      },
      focusZone: (zoneId: string) => {
        return goToZone(zoneId);
      },
      goToZone,
      getSnapshot: () => buildSnapshot(),
      listZoneObservations: (zoneId?: string | null) => buildZoneObservationsFromSnapshot(buildSnapshot(), zoneId),
      listZoneVisualDefects: (zoneId?: string | null) => buildZoneVisualDefectsFromSnapshot(buildSnapshot(), zoneId),
      listZoneWarnings: (zoneId?: string | null) => buildZoneWarningsFromSnapshot(buildSnapshot(), zoneId),
      reviewAllZones: async () => {
        const reports: ExpoZoneReviewReport[] = [];
        for (const zone of zones) {
          const report = await reviewZoneAsync(zone.id);
          if (report) {
            reports.push(report);
          }
        }
        return reports;
      },
      reviewCurrentZone: () => buildZoneReviewReport(buildSnapshot()),
      reviewWarningZones: async () => {
        const reports: ExpoZoneReviewReport[] = [];
        for (const zone of zones) {
          const report = await reviewZoneAsync(zone.id);
          if (report?.status === 'warning') {
            reports.push(report);
          }
        }
        return reports;
      },
      reviewZone: reviewZoneAsync,
      orbitCurrentView,
      setLayerStates: (next: Partial<LayerStates>) => {
        setLayerStates((current) => ({ ...current, ...next }));
      },
      setMode: (nextMode: ExpoMode) => setMode(nextMode),
      setSectionStates: (next: Partial<SectionStates>) => {
        setSectionStates((current) => ({ ...current, ...next }));
      },
      setView,
      setTargetBasket: (targets: string[]) => setTargetBasket(targets),
      zones: zones.map((zone) => ({
        expectedKeyObjectIds: zone.expectedKeyObjectIds,
        expectedVisibleLayers: zone.expectedVisibleLayers,
        forbiddenKeyObjectIds: zone.forbiddenKeyObjectIds,
        forbiddenVisibleLayers: zone.forbiddenVisibleLayers,
        id: zone.id,
        intent: zone.intent,
        label: zone.label,
        startView: zone.startView,
        watchItems: zone.watchItems,
      })),
    };

    (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ = operator;

    return () => {
      if ((window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ === operator) {
        delete (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__;
      }
    };
  }, [
    activeZoneId,
    centerStack,
    centerTarget,
    clickStack,
    clickTarget,
    dataMode,
    diagnosticReport,
    enabled,
    focusSlug,
    inspector,
    layerStates,
    markedPoint,
    mode,
    operatorZoneId,
    playerPos,
    registryEntries,
    sceneVersion,
    sectionStates,
    setMode,
    targetBasket,
    zones,
  ]);

  return {
    centerStack,
    centerTarget,
    clickStack,
    clickTarget,
    debug,
    focusSlug,
    goToZone,
    inspector,
    layerStates,
    markedPoint,
    operatorZone: currentOperatorZoneState.operatorZone,
    operatorZoneFixRoutes: currentOperatorZoneState.operatorZoneFixRoutes,
    operatorZoneId,
    operatorZoneValidation: currentOperatorZoneState.operatorZoneValidation,
    operatorZoneVisualDefects: currentOperatorZoneState.operatorZoneVisualDefects,
    sectionStates,
    setDebug,
    setFocusSlug,
    setLayerStates,
    setMarkedPoint,
    setOperatorZoneId,
    setSectionStates,
    targetBasket,
    setTargetBasket,
  };
}
