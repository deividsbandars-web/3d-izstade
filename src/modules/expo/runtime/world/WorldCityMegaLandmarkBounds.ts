import type { ExpoPlanningSectionId, ExpoPlanningZoneId, StadiumReserve } from '../planning/types';

type CityMegaLandmarkPlanningZone = Exclude<ExpoPlanningZoneId, 'rear-campus'>;

export type WorldCityMegaLandmarkBound = {
  id: string;
  planningSections: ExpoPlanningSectionId[];
  planningZone: CityMegaLandmarkPlanningZone;
  position: [number, number, number];
  reviewTargetPosition?: [number, number, number];
  size: [number, number, number];
};

function overlapsReserve(
  position: [number, number, number],
  reserve: StadiumReserve,
  size: [number, number, number],
) {
  const halfX = size[0] * 0.5;
  const halfZ = size[2] * 0.5;
  return (
    position[0] + halfX >= reserve.centerX - reserve.halfWidth
    && position[0] - halfX <= reserve.centerX + reserve.halfWidth
    && position[2] + halfZ >= reserve.centerZ - reserve.halfDepth
    && position[2] - halfZ <= reserve.centerZ + reserve.halfDepth
  );
}

function createMegaLandmarkBound(args: {
  id: string;
  planningSection: ExpoPlanningSectionId;
  planningZone: CityMegaLandmarkPlanningZone;
  position: [number, number, number];
  reviewTargetPosition?: [number, number, number];
  size: [number, number, number];
}): WorldCityMegaLandmarkBound {
  const { planningSection, ...bound } = args;
  return {
    ...bound,
    planningSections: [planningSection],
  };
}

export function buildWorldCityMegaLandmarkBounds({
  districtCount,
  districtStride,
}: {
  districtCount: number;
  districtStride: number;
}): WorldCityMegaLandmarkBound[] {
  const mediaBaseZ = -214 - districtStride - 136;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;

  return [
    createMegaLandmarkBound({ id: 'mega-landmark-arrival', planningSection: 'arrival', planningZone: 'arrival', position: [0, 104, 256], size: [320, 208, 72] }),
    createMegaLandmarkBound({ id: 'mega-landmark-showcase', planningSection: 'middle', planningZone: 'center-spine', position: [0, 104, -72], size: [510, 208, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-media', planningSection: 'middle', planningZone: 'center-spine', position: [0, 120, mediaBaseZ], size: [780, 240, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-media-frame-wall', planningSection: 'middle', planningZone: 'center-spine', position: [356, 122, mediaBaseZ - 148], size: [296, 244, 70] }),
    createMegaLandmarkBound({ id: 'mega-landmark-media-signal-pods', planningSection: 'middle', planningZone: 'center-spine', position: [472, 54, mediaBaseZ + 84], size: [320, 108, 70] }),
    createMegaLandmarkBound({ id: 'mega-landmark-discovery', planningSection: 'middle', planningZone: 'center-spine', position: [0, 90, discoveryBaseZ], size: [460, 180, 104] }),
    createMegaLandmarkBound({ id: 'mega-landmark-discovery-observatory-crown', planningSection: 'left', planningZone: 'left-district', position: [-368, 108, discoveryBaseZ - 32], size: [212, 216, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-discovery-garden-spine', planningSection: 'left', planningZone: 'left-district', position: [-492, 8, discoveryBaseZ + 212], size: [236, 16, 72] }),
    createMegaLandmarkBound({ id: 'mega-landmark-right-skyfold-citadel', planningSection: 'right', planningZone: 'right-district', position: [844, 146, -164], size: [300, 292, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-right-skybridge-beacon', planningSection: 'right', planningZone: 'right-district', position: [436, 134, -74], size: [360, 268, 116] }),
    createMegaLandmarkBound({ id: 'mega-landmark-right-media-halo', planningSection: 'right', planningZone: 'right-district', position: [520, 126, -278], size: [260, 180, 220] }),
    createMegaLandmarkBound({ id: 'mega-landmark-right-support-spire', planningSection: 'right', planningZone: 'right-district', position: [294, 90, -372], reviewTargetPosition: [294, 118, -372], size: [132, 180, 64] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-grand-rampart', planningSection: 'left', planningZone: 'left-district', position: [-888, 138, -156], size: [220, 276, 72] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-cantilever-forum', planningSection: 'left', planningZone: 'left-district', position: [-438, 104, -116], size: [320, 208, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-split-crown-gate', planningSection: 'left', planningZone: 'left-district', position: [-742, 146, -346], size: [340, 292, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-broken-wall-monument', planningSection: 'left', planningZone: 'left-district', position: [-262, 112, -412], reviewTargetPosition: [-318, 112, -418], size: [140, 224, 96] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-disc-habitat', planningSection: 'left', planningZone: 'left-district', position: [-918, 178, -548], size: [296, 212, 296] }),
    createMegaLandmarkBound({ id: 'mega-landmark-left-split-monolith-pair', planningSection: 'left', planningZone: 'left-district', position: [-648, 146, -724], size: [160, 292, 72] }),
  ];
}

export function filterWorldCityMegaLandmarkBounds(
  landmarks: WorldCityMegaLandmarkBound[],
  stadiumReserve: StadiumReserve,
) {
  return landmarks.filter((landmark) => !overlapsReserve(landmark.position, stadiumReserve, landmark.size));
}
