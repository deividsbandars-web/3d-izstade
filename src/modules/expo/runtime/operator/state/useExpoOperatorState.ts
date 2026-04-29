import { useEffect, useState } from 'react';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from '../../../state/expoRuntime';
import type { ReviewOperatorZone } from '../model/reviewOperatorSession';
import type { WorldDiagnosticReport } from '../../world/inspection/worldDiagnosticReport';
import type { WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';

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
        watchItems: zone.watchItems,
      }))
      .find((zone) => zone.id === args.operatorZoneId) ?? null,
    operatorZoneId: args.operatorZoneId,
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
      centerTargetEntry: args.centerTarget ? registryById[args.centerTarget] ?? null : null,
      clickTargetEntry: args.clickTarget ? registryById[args.clickTarget] ?? null : null,
      inspectorEntries: args.inspector.map((entry) => ({
        ...entry,
        registryEntry: registryById[entry.id] ?? null,
      })),
      targetBasketEntries: args.targetBasket.map((id) => registryById[id]).filter(Boolean),
    },
    sceneVersion: args.sceneVersion,
    sectionStates: args.sectionStates,
    targetBasket: args.targetBasket,
    zones: args.zones.map((zone) => ({
      expectedKeyObjectIds: zone.expectedKeyObjectIds,
      expectedVisibleLayers: zone.expectedVisibleLayers,
      id: zone.id,
      intent: zone.intent,
      label: zone.label,
      watchItems: zone.watchItems,
    })),
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
  const [operatorZoneId, setOperatorZoneId] = useState<string | null>(() => (enabled ? 'arrival' : null));
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

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    const operator = {
      clearFocus: () => {
        setOperatorZoneId(null);
        setFocusSlug('');
      },
      focusBooth: (slugOrId: string) => {
        setOperatorZoneId(null);
        setFocusSlug(slugOrId);
      },
      focusZone: (zoneId: string) => {
        setFocusSlug('');
        setOperatorZoneId(zoneId);
      },
      getSnapshot: () => buildExpoReviewOperatorSnapshot({
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
      }),
      setLayerStates: (next: Partial<LayerStates>) => {
        setLayerStates((current) => ({ ...current, ...next }));
      },
      setMode: (nextMode: ExpoMode) => setMode(nextMode),
      setSectionStates: (next: Partial<SectionStates>) => {
        setSectionStates((current) => ({ ...current, ...next }));
      },
      setTargetBasket: (targets: string[]) => setTargetBasket(targets),
      zones: zones.map((zone) => ({ id: zone.id, intent: zone.intent, label: zone.label })),
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
    operatorZoneId,
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
