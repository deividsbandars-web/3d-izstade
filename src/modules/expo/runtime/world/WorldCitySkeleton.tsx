import { useMemo } from 'react';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../world-contract';
import type { ExpoPlanningSectionId } from '../planning/types';
import { buildCanonicalWorldPlan } from '../planning';
import { useWorldInspectionRegistry } from './inspection/worldInspectionState';
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
  const districtStride = 548;
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

  const cityInspectionEntries = useMemo(() => [
    ...filteredArrivalPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
    ...filteredPromenadeAxisPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
    ...filteredShowcasePlazas.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
    ...filteredBoothForecourtPlanes.map((plane) => ({ id: plane.id, layer: 'city-plane', position: plane.position })),
    ...filteredMasses.map((mass) => ({ id: mass.id, layer: 'city-mass', position: mass.position })),
    ...filteredTowerLandmarks.map((tower) => ({ id: tower.id, layer: 'city-tower', position: tower.position })),
    ...filteredScreenSurfaces.map((surface) => ({ id: surface.id, layer: 'city-screen-surface', position: surface.position })),
    ...screenSockets.map((socket) => ({ id: socket.id, layer: 'city-screen-socket', position: socket.position })),
    { id: 'mega-landmark-arrival', layer: 'mega-landmark', position: [0, 0, 256] as [number, number, number] },
    { id: 'mega-landmark-showcase', layer: 'mega-landmark', position: [0, 0, -72] as [number, number, number] },
    { id: 'mega-landmark-media', layer: 'mega-landmark', position: [0, 0, -214 - districtStride - 56] as [number, number, number] },
    { id: 'mega-landmark-media-frame-wall', layer: 'mega-landmark', position: [356, 0, -214 - districtStride - 56 - 148] as [number, number, number] },
    { id: 'mega-landmark-media-signal-pods', layer: 'mega-landmark', position: [472, 0, -214 - districtStride - 56 + 84] as [number, number, number] },
    { id: 'mega-landmark-discovery', layer: 'mega-landmark', position: [0, 0, -196 - ((Math.max(1, districtPrograms.length) - 1) * districtStride) - 1080] as [number, number, number] },
    { id: 'mega-landmark-discovery-observatory-crown', layer: 'mega-landmark', position: [-368, 0, -196 - ((Math.max(1, districtPrograms.length) - 1) * districtStride) - 1080 - 32] as [number, number, number] },
    { id: 'mega-landmark-discovery-garden-spine', layer: 'mega-landmark', position: [-492, 0, -196 - ((Math.max(1, districtPrograms.length) - 1) * districtStride) - 1080 + 212] as [number, number, number] },
    { id: 'mega-landmark-right-skyfold-citadel', layer: 'mega-landmark', position: [844, 0, -164] as [number, number, number] },
    { id: 'mega-landmark-right-skybridge-beacon', layer: 'mega-landmark', position: [436, 0, -96] as [number, number, number] },
    { id: 'mega-landmark-right-media-halo', layer: 'mega-landmark', position: [628, 0, -248] as [number, number, number] },
    { id: 'mega-landmark-right-support-spire', layer: 'mega-landmark', position: [294, 0, -372] as [number, number, number] },
    { id: 'mega-landmark-left-grand-rampart', layer: 'mega-landmark', position: [-888, 0, -156] as [number, number, number] },
    { id: 'mega-landmark-left-cantilever-forum', layer: 'mega-landmark', position: [-438, 0, -116] as [number, number, number] },
    { id: 'mega-landmark-left-split-crown-gate', layer: 'mega-landmark', position: [-654, 0, -286] as [number, number, number] },
    { id: 'mega-landmark-left-broken-wall-monument', layer: 'mega-landmark', position: [-262, 0, -412] as [number, number, number] },
    { id: 'mega-landmark-left-disc-habitat', layer: 'mega-landmark', position: [-918, 0, -548] as [number, number, number] },
    { id: 'mega-landmark-left-split-monolith-pair', layer: 'mega-landmark', position: [-648, 0, -724] as [number, number, number] },
  ], [
    filteredArrivalPlanes,
    filteredTowerLandmarks,
    filteredScreenSurfaces,
    districtPrograms.length,
    districtStride,
    filteredBoothForecourtPlanes,
    filteredMasses,
    filteredPromenadeAxisPlanes,
    filteredShowcasePlazas,
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
