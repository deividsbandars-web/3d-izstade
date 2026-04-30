import { useEffect, useMemo, useState } from 'react';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from '../../../state/expoRuntime';
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
  warnings: string[];
  zoneId: string;
};

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
  for (const objectId of zone.validation.missingExpectedObjectIds) {
    warnings.push(`Missing expected object: ${objectId}`);
  }
  for (const layer of zone.validation.missingExpectedLayers) {
    warnings.push(`Missing expected layer: ${layer}`);
  }
  for (const objectId of zone.validation.unknownExpectedObjectIds) {
    warnings.push(`Unknown expected object: ${objectId}`);
  }

  return warnings;
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
  if (!snapshot || snapshot.operatorZoneId !== zone.id) {
    return false;
  }

  const [playerX, , playerZ] = snapshot.playerPos;
  const [zoneX, , zoneZ] = zone.startView.position;
  return Math.hypot(playerX - zoneX, playerZ - zoneZ) <= 120;
}

function buildCurrentOperatorZoneState(args: {
  centerTarget: string | null;
  clickTarget: string | null;
  inspector: InspectorEntry[];
  operatorZoneId: string | null;
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
    registryById,
  });
  const operatorZoneFixRoutes = buildZoneFixRoutes({
    registryById,
    validation: operatorZoneValidation,
    zone: operatorZone,
  });

  return {
    centerTargetEntry,
    clickTargetEntry,
    operatorZone,
    operatorZoneFixRoutes,
    operatorZoneValidation,
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
    id: zone.id,
    intent: zone.intent,
    label: zone.label,
    startView: zone.startView,
    validation: validateReviewZone(zone, {
      centerTargetEntry,
      clickTargetEntry,
      inspectorEntries: resolvedInspectorEntries,
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
    inspector,
    operatorZoneId,
    registryEntries,
    zones,
  }), [
    centerTarget,
    clickTarget,
    inspector,
    operatorZoneId,
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

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    const reviewZoneAsync = async (zoneId: string) => {
      const zone = zones.find((entry) => entry.id === zoneId);
      if (!zone || typeof window === 'undefined') {
        return null;
      }

      setFocusSlug('');
      setOperatorZoneId(zone.id);

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
        const zone = zones.find((entry) => entry.id === zoneId);
        if (!zone) {
          return false;
        }
        setFocusSlug('');
        setOperatorZoneId(zone.id);
        return true;
      },
      goToZone: (zoneId: string) => {
        const zone = zones.find((entry) => entry.id === zoneId);
        if (!zone) {
          return false;
        }
        setFocusSlug('');
        setOperatorZoneId(zone.id);
        return true;
      },
      getSnapshot: () => buildSnapshot(),
      listZoneObservations: (zoneId?: string | null) => buildZoneObservationsFromSnapshot(buildSnapshot(), zoneId),
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
      setLayerStates: (next: Partial<LayerStates>) => {
        setLayerStates((current) => ({ ...current, ...next }));
      },
      setMode: (nextMode: ExpoMode) => setMode(nextMode),
      setSectionStates: (next: Partial<SectionStates>) => {
        setSectionStates((current) => ({ ...current, ...next }));
      },
      setTargetBasket: (targets: string[]) => setTargetBasket(targets),
      zones: zones.map((zone) => ({
        expectedKeyObjectIds: zone.expectedKeyObjectIds,
        expectedVisibleLayers: zone.expectedVisibleLayers,
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
    inspector,
    layerStates,
    markedPoint,
    operatorZone: currentOperatorZoneState.operatorZone,
    operatorZoneFixRoutes: currentOperatorZoneState.operatorZoneFixRoutes,
    operatorZoneId,
    operatorZoneValidation: currentOperatorZoneState.operatorZoneValidation,
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
