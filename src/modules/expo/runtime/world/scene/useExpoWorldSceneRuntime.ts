import { useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import { buildCanonicalWorldPlanFromWorldContract } from '../../planning';
import type { CanonicalWorldPlan, ExpoPlanningSectionId } from '../../planning/types';
import { matchesWorldSection, normalizeWorldLayerToggles, normalizeWorldSectionToggles, type ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import {
  buildBoothWorldObjectRegistry,
  buildCityWorldObjectRegistry,
  buildStadiumWorldObjectRegistry,
  type WorldObjectRegistryEntry,
} from '../inspection/worldObjectRegistry';
import { buildWorldPhysicsSurfaceRegistry } from '../physics/worldPhysicsSurfaceRegistry';
import { buildWorldPhysicsAccessAudit } from '../physics/worldPhysicsAccessAudit';
import { buildWorldPhysicsTraversalGraph } from '../physics/worldPhysicsTraversalGraph';
import { buildWorldPhysicsVerticalAccessNodes } from '../physics/worldPhysicsVerticalAccessNodes';
import { buildRenderedRearCampusRegistryPlan } from '../rearCampusRenderPolicy';
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
  const canonicalWorldPlan = useMemo(
    () => buildCanonicalWorldPlanFromWorldContract(worldContract),
    [worldContract],
  );
  const visibleBoothPlacements = useMemo(
    () => selectVisibleBoothPlacements(boothPlacements, districtPrograms),
    [boothPlacements, districtPrograms],
  );
  const sectionVisibleBoothPlacements = useMemo(
    () => selectSectionVisibleBoothPlacements(visibleBoothPlacements, sectionToggles),
    [sectionToggles, visibleBoothPlacements],
  );
  const analyticsState = useExpoWorldAnalyticsState();
  const analyticsActions = useExpoWorldAnalyticsActions();
  const physicsSurfaceRegistry = useMemo(() => {
    const entries: WorldObjectRegistryEntry[] = [];
    const sectionFilteredPlan = filterCanonicalWorldPlanForSections(canonicalWorldPlan, sectionToggles);

    if (layerToggles.city) {
      entries.push(...buildCityWorldObjectRegistry({
        districtCount: districtPrograms.length,
        districtStride: canonicalWorldPlan.districtStride,
        plan: sectionFilteredPlan,
      }));
    }

    if (layerToggles.stadium && sectionToggles.stadium) {
      const rearCampusPlan = canonicalWorldPlan.zones.find((zone) => zone.id === 'rear-campus');
      const rearCampus = rearCampusPlan?.zoneExtension?.rearCampus;
      if (rearCampusPlan && rearCampus) {
        entries.push(...buildStadiumWorldObjectRegistry({
          campusCenterZ: rearCampus.campusCenterZ,
          rearCampusPlan: buildRenderedRearCampusRegistryPlan(rearCampusPlan),
        }));
      }
    }

    if (layerToggles.booths) {
      entries.push(...buildBoothWorldObjectRegistry(sectionVisibleBoothPlacements));
    }

    return buildWorldPhysicsSurfaceRegistry(entries);
  }, [
    canonicalWorldPlan,
    districtPrograms.length,
    layerToggles.booths,
    layerToggles.city,
    layerToggles.stadium,
    sectionToggles,
    sectionVisibleBoothPlacements,
  ]);
  const physicsTraversalGraph = useMemo(
    () => buildWorldPhysicsTraversalGraph(physicsSurfaceRegistry),
    [physicsSurfaceRegistry],
  );
  const physicsAccessAudit = useMemo(
    () => buildWorldPhysicsAccessAudit({
      registry: physicsSurfaceRegistry,
      traversalGraph: physicsTraversalGraph,
    }),
    [physicsSurfaceRegistry, physicsTraversalGraph],
  );
  const physicsVerticalAccessNodes = useMemo(
    () => buildWorldPhysicsVerticalAccessNodes(physicsAccessAudit),
    [physicsAccessAudit],
  );
  const verticalAccessNodes = useMemo(
    () => [
      ...canonicalWorldPlan.verticalSystem.accessNodes,
      ...physicsVerticalAccessNodes,
    ],
    [canonicalWorldPlan.verticalSystem.accessNodes, physicsVerticalAccessNodes],
  );
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
    physicsSurfaceRegistry,
    physicsAccessAudit,
    physicsTraversalGraph,
    qualityProfileInputs,
    sectorMarkers,
    sectionToggles,
    setPlayerPosition: analyticsActions.setPlayerPosition,
    sectionVisibleBoothPlacements,
    verticalAccessNodes,
    visualProfile,
    visibleBoothPlacements,
    walkRegions,
  };
}

function filterCanonicalWorldPlanForSections(
  plan: CanonicalWorldPlan,
  sectionToggles: ExpoWorldSectionToggles,
): CanonicalWorldPlan {
  const isVisibleBySections = (sections?: ExpoPlanningSectionId[]) => {
    if (!sections || sections.length === 0) {
      return true;
    }

    return sections.some((section) => sectionToggles[section]);
  };

  return {
    ...plan,
    arrivalPlanes: plan.arrivalPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    boothForecourtPlanes: plan.boothForecourtPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    filteredCityPlanes: plan.filteredCityPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    filteredMasses: plan.filteredMasses.filter((mass) => isVisibleBySections(mass.sections)),
    filteredScreenSurfaces: plan.filteredScreenSurfaces.filter((surface) => isVisibleBySections(surface.sections)),
    filteredTowerLandmarks: plan.filteredTowerLandmarks.filter((tower) => isVisibleBySections(tower.sections)),
    promenadeAxisPlanes: plan.promenadeAxisPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    screenAssignments: plan.screenAssignments.filter((assignment) => isVisibleBySections(assignment.sections)),
    screenSockets: plan.screenSockets.filter((socket) => isVisibleBySections(socket.sections)),
    showcasePlazas: plan.showcasePlazas.filter((plane) => isVisibleBySections(plane.sections)),
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

export function selectSectionVisibleBoothPlacements(
  boothPlacements: ExpoBoothPlacement[],
  sectionToggles: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  },
) {
  return boothPlacements.filter((placement) => matchesWorldSection(placement.position, sectionToggles));
}
