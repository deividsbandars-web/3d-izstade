import { useCallback, useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../world-contract';
import type { ExpoPlanningSectionId, ExpoVerticalAccessNode } from '../planning/types';
import type { ExpoQualitySettings } from './quality/expoQualitySettings';
import { buildCanonicalWorldPlan, EXPO_CANONICAL_DISTRICT_STRIDE } from '../planning';
import { useWorldInspectionRegistry } from './inspection/worldInspectionState';
import { buildCityWorldObjectRegistry, buildGroundWorldObjectRegistry } from './inspection/worldObjectRegistry';
import { WorldCityMasses } from './WorldCityMasses';
import { WorldCityMegaLandmarks } from './WorldCityMegaLandmarks';
import { WorldCityPerimeter } from './WorldCityPerimeter';
import { WorldCityPlanes } from './WorldCityPlanes';
import { WorldCityScreenAssignments } from './WorldCityScreenAssignments';
import { WorldCityScreenSockets } from './WorldCityScreenSockets';
import { WorldCityScreenSurfaces } from './WorldCityScreenSurfaces';
import { WorldCityTowers } from './WorldCityTowers';
import { WorldVerticalAccessNodes } from './WorldVerticalAccessNodes';
import { WorldVerticalElevatorRoutes } from './WorldVerticalElevatorRoutes';
import { WorldCityWaterCourt } from './WorldCityWaterCourt';
import { ExpoZoneGroup } from './zones/ExpoZoneGroup';
import {
  resolveExpoZoneRuntimeState,
  type ExpoZoneRuntimeState,
} from './zones/expoZoneRuntimeState';

export function WorldCitySkeleton({
  boothPlacements,
  districtPrograms,
  playerPosition = [0, 0, 0],
  qualitySettings,
  sectionToggles = { arrival: true, left: true, middle: true, right: true },
  verticalAccessNodes,
  visualProfile,
  zoneRuntimeState,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  playerPosition?: [number, number, number];
  qualitySettings: ExpoQualitySettings;
  sectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  };
  verticalAccessNodes?: ExpoVerticalAccessNode[];
  visualProfile: ExpoWorldVisualProfile;
  zoneRuntimeState?: ExpoZoneRuntimeState;
}) {
  const districtStride = EXPO_CANONICAL_DISTRICT_STRIDE;
  const canonicalWorldPlan = useMemo(
    () => buildCanonicalWorldPlan({ boothPlacements, districtPrograms, districtStride, visualProfile }),
    [boothPlacements, districtPrograms, districtStride, visualProfile]
  );
  const stadiumReserve = canonicalWorldPlan.stadiumReserve;
  const renderedVerticalAccessNodes = verticalAccessNodes ?? canonicalWorldPlan.verticalSystem.accessNodes;

  const isVisibleBySections = useCallback((sections?: ExpoPlanningSectionId[]) => {
    if (!sections || sections.length === 0) {
      return true;
    }

    return sections.some((section) => sectionToggles[section]);
  }, [sectionToggles]);
  const filteredCityPlanes = useMemo(
    () => canonicalWorldPlan.filteredCityPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.filteredCityPlanes, isVisibleBySections]
  );
  const filteredPromenadeAxisPlanes = useMemo(
    () => canonicalWorldPlan.promenadeAxisPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.promenadeAxisPlanes, isVisibleBySections]
  );
  const filteredShowcasePlazas = useMemo(
    () => canonicalWorldPlan.showcasePlazas.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.showcasePlazas, isVisibleBySections]
  );
  const filteredBoothForecourtPlanes = useMemo(
    () => canonicalWorldPlan.boothForecourtPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.boothForecourtPlanes, isVisibleBySections]
  );
  const filteredMasses = useMemo(
    () => canonicalWorldPlan.filteredMasses.filter((mass) => isVisibleBySections(mass.sections)),
    [canonicalWorldPlan.filteredMasses, isVisibleBySections]
  );
  const filteredArrivalPlanes = useMemo(
    () => canonicalWorldPlan.arrivalPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.arrivalPlanes, isVisibleBySections]
  );
  const filteredTowerLandmarks = useMemo(
    () => canonicalWorldPlan.filteredTowerLandmarks.filter((tower) => isVisibleBySections(tower.sections)),
    [canonicalWorldPlan.filteredTowerLandmarks, isVisibleBySections]
  );
  const filteredScreenSurfaces = useMemo(
    () => canonicalWorldPlan.filteredScreenSurfaces.filter((surface) => isVisibleBySections(surface.sections)),
    [canonicalWorldPlan.filteredScreenSurfaces, isVisibleBySections]
  );
  const screenSockets = useMemo(
    () => canonicalWorldPlan.screenSockets.filter((socket) => isVisibleBySections(socket.sections)),
    [canonicalWorldPlan.screenSockets, isVisibleBySections]
  );
  const screenAssignments = useMemo(
    () => canonicalWorldPlan.screenAssignments.filter((assignment) => isVisibleBySections(assignment.sections)),
    [canonicalWorldPlan.screenAssignments, isVisibleBySections]
  );
  const effectiveZoneRuntimeState = useMemo(
    () => zoneRuntimeState ?? resolveExpoZoneRuntimeState({
      playerPosition,
      qualitySettings,
      runtimeCaptureSafe: false,
    }),
    [playerPosition, qualitySettings, zoneRuntimeState],
  );

  const cityInspectionEntries = useMemo(() => [
    ...buildGroundWorldObjectRegistry(),
    ...buildCityWorldObjectRegistry({
      districtCount: districtPrograms.length,
      districtStride,
      plan: {
        ...canonicalWorldPlan,
        arrivalPlanes: filteredArrivalPlanes,
        boothForecourtPlanes: filteredBoothForecourtPlanes,
        filteredMasses,
        filteredScreenSurfaces,
        filteredTowerLandmarks,
        promenadeAxisPlanes: filteredPromenadeAxisPlanes,
        screenAssignments,
        screenSockets,
        showcasePlazas: filteredShowcasePlazas,
        verticalSystem: {
          ...canonicalWorldPlan.verticalSystem,
          accessNodes: renderedVerticalAccessNodes,
        },
      },
    }),
  ], [
    canonicalWorldPlan,
    districtPrograms.length,
    districtStride,
    filteredArrivalPlanes,
    filteredBoothForecourtPlanes,
    filteredMasses,
    filteredPromenadeAxisPlanes,
    filteredScreenSurfaces,
    filteredShowcasePlazas,
    filteredTowerLandmarks,
    renderedVerticalAccessNodes,
    screenAssignments,
    screenSockets,
  ]);
  useWorldInspectionRegistry('city', cityInspectionEntries);

  return (
    <ExpoZoneGroup
      groupId="city-skeleton-root"
      name="clean-expo-city-skeleton"
      runtimeState={effectiveZoneRuntimeState}
      zoneId="center"
    >
      <ExpoZoneGroup
        groupId="city-floor-planes"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="center"
      >
        <WorldCityPlanes
          planes={filteredCityPlanes}
          stadiumReserve={stadiumReserve}
          visualProfile={visualProfile}
        />
        <WorldCityWaterCourt planes={[]} />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-masses"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="center"
      >
        <WorldCityMasses
          masses={filteredMasses}
          stadiumReserve={stadiumReserve}
          visualProfile={visualProfile}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-vertical-access"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="towerCluster"
      >
        <WorldVerticalAccessNodes
          accessNodes={renderedVerticalAccessNodes}
          playerPosition={playerPosition}
        />
        <WorldVerticalElevatorRoutes routes={canonicalWorldPlan.verticalSystem.elevatorRoutes} />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        canHideInLowQuality
        groupId="city-perimeter"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="perimeter"
      >
        <WorldCityPerimeter
          accent={visualProfile.global.hudAccent}
          stadiumReserve={stadiumReserve}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-screen-surfaces"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="sponsorBoulevard"
      >
        <WorldCityScreenSurfaces
          playerPosition={playerPosition}
          stadiumReserve={stadiumReserve}
          surfaces={filteredScreenSurfaces}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-screen-sockets"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="sponsorBoulevard"
      >
        <WorldCityScreenSockets
          playerPosition={playerPosition}
          sockets={screenSockets}
          stadiumReserve={stadiumReserve}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-screen-assignments"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="sponsorBoulevard"
      >
        <WorldCityScreenAssignments
          assignments={screenAssignments}
          playerPosition={playerPosition}
          qualitySettings={qualitySettings}
          sockets={screenSockets}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-mega-landmarks"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="skyMarket"
      >
        <WorldCityMegaLandmarks
          districtCount={districtPrograms.length}
          districtStride={districtStride}
          sectionToggles={sectionToggles}
          stadiumReserve={stadiumReserve}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="city-towers"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="towerCluster"
      >
        <WorldCityTowers towers={filteredTowerLandmarks} stadiumReserve={stadiumReserve} visualProfile={visualProfile} />
      </ExpoZoneGroup>
    </ExpoZoneGroup>
  );
}
