import { useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../world-contract';
import type { ExpoPlanningSectionId } from '../planning/types';
import { buildCanonicalWorldPlan, EXPO_CANONICAL_DISTRICT_STRIDE } from '../planning';
import { useWorldInspectionRegistry } from './inspection/worldInspectionState';
import { buildCityWorldObjectRegistry } from './inspection/worldObjectRegistry';
import { WorldCityMasses } from './WorldCityMasses';
import { WorldCityMegaLandmarks } from './WorldCityMegaLandmarks';
import { WorldCityPlanes } from './WorldCityPlanes';
import { WorldCityScreenAssignments } from './WorldCityScreenAssignments';
import { WorldCityScreenSockets } from './WorldCityScreenSockets';
import { WorldCityScreenSurfaces } from './WorldCityScreenSurfaces';
import { WorldCityTowers } from './WorldCityTowers';
import { WorldCityWaterCourt } from './WorldCityWaterCourt';

export function WorldCitySkeleton({
  boothPlacements,
  districtPrograms,
  playerPosition = [0, 0, 0],
  sectionToggles = { arrival: true, left: true, middle: true, right: true },
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  playerPosition?: [number, number, number];
  sectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
  };
  visualProfile: ExpoWorldVisualProfile;
}) {
  const districtStride = EXPO_CANONICAL_DISTRICT_STRIDE;
  const canonicalWorldPlan = useMemo(
    () => buildCanonicalWorldPlan({ boothPlacements, districtPrograms, districtStride, visualProfile }),
    [boothPlacements, districtPrograms, districtStride, visualProfile]
  );
  const stadiumReserve = canonicalWorldPlan.stadiumReserve;

  const isVisibleBySections = (sections?: ExpoPlanningSectionId[]) => {
    if (!sections || sections.length === 0) {
      return true;
    }

    return sections.some((section) => sectionToggles[section]);
  };
  const filteredCityPlanes = useMemo(
    () => canonicalWorldPlan.filteredCityPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.filteredCityPlanes, sectionToggles]
  );
  const filteredPromenadeAxisPlanes = useMemo(
    () => canonicalWorldPlan.promenadeAxisPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.promenadeAxisPlanes, sectionToggles]
  );
  const filteredShowcasePlazas = useMemo(
    () => canonicalWorldPlan.showcasePlazas.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.showcasePlazas, sectionToggles]
  );
  const filteredBoothForecourtPlanes = useMemo(
    () => canonicalWorldPlan.boothForecourtPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.boothForecourtPlanes, sectionToggles]
  );
  const filteredMasses = useMemo(
    () => canonicalWorldPlan.filteredMasses.filter((mass) => isVisibleBySections(mass.sections)),
    [canonicalWorldPlan.filteredMasses, sectionToggles]
  );
  const filteredArrivalPlanes = useMemo(
    () => canonicalWorldPlan.arrivalPlanes.filter((plane) => isVisibleBySections(plane.sections)),
    [canonicalWorldPlan.arrivalPlanes, sectionToggles]
  );
  const filteredTowerLandmarks = useMemo(
    () => canonicalWorldPlan.filteredTowerLandmarks.filter((tower) => isVisibleBySections(tower.sections)),
    [canonicalWorldPlan.filteredTowerLandmarks, sectionToggles]
  );
  const filteredScreenSurfaces = useMemo(
    () => canonicalWorldPlan.filteredScreenSurfaces.filter((surface) => isVisibleBySections(surface.sections)),
    [canonicalWorldPlan.filteredScreenSurfaces, sectionToggles]
  );
  const screenSockets = useMemo(
    () => canonicalWorldPlan.screenSockets.filter((socket) => isVisibleBySections(socket.sections)),
    [canonicalWorldPlan.screenSockets, sectionToggles]
  );
  const screenAssignments = useMemo(
    () => canonicalWorldPlan.screenAssignments.filter((assignment) => isVisibleBySections(assignment.sections)),
    [canonicalWorldPlan.screenAssignments, sectionToggles]
  );

  const cityInspectionEntries = useMemo(() => buildCityWorldObjectRegistry({
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
    },
  }), [
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
    screenAssignments,
    screenSockets,
  ]);
  useWorldInspectionRegistry('city', cityInspectionEntries);

  return (
    <group name="clean-expo-city-skeleton">
      <WorldCityPlanes
        planes={filteredCityPlanes}
        stadiumReserve={stadiumReserve}
        visualProfile={visualProfile}
      />
      <WorldCityWaterCourt planes={[]} />
      <WorldCityMasses
        masses={filteredMasses}
        stadiumReserve={stadiumReserve}
        visualProfile={visualProfile}
      />
      <WorldCityScreenSurfaces
        playerPosition={playerPosition}
        stadiumReserve={stadiumReserve}
        surfaces={filteredScreenSurfaces}
      />
      <WorldCityScreenSockets
        playerPosition={playerPosition}
        sockets={screenSockets}
        stadiumReserve={stadiumReserve}
      />
      <WorldCityScreenAssignments
        assignments={screenAssignments}
        playerPosition={playerPosition}
        sockets={screenSockets}
      />
      <WorldCityMegaLandmarks districtCount={districtPrograms.length} districtStride={districtStride} sectionToggles={sectionToggles} />
      <WorldCityTowers towers={filteredTowerLandmarks} stadiumReserve={stadiumReserve} visualProfile={visualProfile} />
    </group>
  );
}
