import { useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import { matchesWorldSection, normalizeWorldLayerToggles, normalizeWorldSectionToggles } from '../debug/worldSceneDebugContract';
import { useExpoWorldAnalyticsActions, useExpoWorldAnalyticsState } from './ExpoWorldAnalyticsProvider';

export function useExpoWorldSceneRuntime({
  activeZone,
  mode,
  runtimeLayerToggles,
  runtimeSectionToggles,
  startViewOverride,
  worldContract,
  zoneSystem,
}: {
  activeZone: { id?: string | null } | null | undefined;
  mode: ExpoMode;
  runtimeLayerToggles?: {
    booths: boolean;
    city: boolean;
    promenade: boolean;
    skyline: boolean;
    stadium: boolean;
  };
  runtimeSectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
    stadium: boolean;
  };
  startViewOverride?: ExpoStartView | null;
  worldContract: ExpoWorldContract;
  zoneSystem: unknown;
}) {
  const {
    boothPlacements,
    districtPrograms,
    playBounds,
    qualityProfileInputs,
    sectorMarkers,
    startView,
    visualProfile,
    walkRegions,
  } = worldContract;
  const effectiveStartView = startViewOverride ?? startView;
  const layerToggles = normalizeWorldLayerToggles(runtimeLayerToggles);
  const sectionToggles = normalizeWorldSectionToggles(runtimeSectionToggles);
  const visibleBoothPlacements = useMemo(
    () => selectVisibleBoothPlacements(boothPlacements, districtPrograms),
    [boothPlacements, districtPrograms],
  );
  const analyticsState = useExpoWorldAnalyticsState();
  const analyticsActions = useExpoWorldAnalyticsActions();
  void activeZone;
  void mode;
  void sectorMarkers;
  void zoneSystem;

  return {
    districtPrograms,
    effectiveStartView,
    layerToggles,
    playBounds,
    playerPosition: analyticsState.playerPosition,
    qualityProfileInputs,
    sectorMarkers,
    sectionToggles,
    setPlayerPosition: analyticsActions.setPlayerPosition,
    sectionVisibleBoothPlacements: visibleBoothPlacements.filter((placement) =>
      matchesWorldSection(placement.position, sectionToggles),
    ),
    visualProfile,
    visibleBoothPlacements,
    walkRegions,
  };
}

export function selectVisibleBoothPlacements(
  boothPlacements: ExpoBoothPlacement[],
  districtPrograms: ExpoWorldContract['districtPrograms'],
) {
  const districtByKey = new Map(
    districtPrograms.map((district) => [district.sectorId ?? `cluster-${district.clusterIndex}`, district]),
  );
  const placementsByDistrict = new Map<string, ExpoBoothPlacement[]>();

  boothPlacements.forEach((placement) => {
    const key = placement.sectorId ?? `cluster-${placement.clusterIndex ?? -1}`;
    const existing = placementsByDistrict.get(key) ?? [];
    existing.push(placement);
    placementsByDistrict.set(key, existing);
  });

  return Array.from(placementsByDistrict.entries()).flatMap(([districtKey, placements]) => {
    const district = districtByKey.get(districtKey);
    const rankedPlacements = [...placements].sort((left, right) => {
      const priorityDiff = Number(right.priority ?? 0) - Number(left.priority ?? 0);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const nodeWeight = (placement: ExpoBoothPlacement) => (
        placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right'
          ? 4
          : placement.nodeType === 'endcap'
            ? 3
            : placement.nodeType === 'standard_left' || placement.nodeType === 'standard_right'
              ? 2
              : 1
      );
      const nodeDiff = nodeWeight(right) - nodeWeight(left);
      if (nodeDiff !== 0) {
        return nodeDiff;
      }

      return String(left.id).localeCompare(String(right.id));
    });

    const visibleLimit = district?.expressionMode === 'active-commercial'
      ? 4
      : district?.expressionMode === 'calm-dwell'
        ? 2
        : district?.expressionMode === 'feature-court'
          ? 3
          : district?.expressionMode === 'scenic' || district?.expressionMode === 'satellite' || district?.expressionMode === 'orientation'
            ? 2
            : 2;

    return rankedPlacements.slice(0, Math.min(visibleLimit, rankedPlacements.length));
  });
}
