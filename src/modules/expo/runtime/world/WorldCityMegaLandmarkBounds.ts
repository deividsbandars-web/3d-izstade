import type { StadiumReserve } from '../planning/types';

export type WorldCityMegaLandmarkBound = {
  id: string;
  position: [number, number, number];
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

export function buildWorldCityMegaLandmarkBounds({
  districtCount,
  districtStride,
}: {
  districtCount: number;
  districtStride: number;
}): WorldCityMegaLandmarkBound[] {
  const mediaBaseZ = -214 - districtStride - 56;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;

  return [
    { id: 'mega-landmark-arrival', position: [0, 104, 256], size: [320, 208, 72] },
    { id: 'mega-landmark-showcase', position: [0, 104, -72], size: [510, 208, 96] },
    { id: 'mega-landmark-media', position: [0, 120, mediaBaseZ], size: [780, 240, 96] },
    { id: 'mega-landmark-media-frame-wall', position: [356, 122, mediaBaseZ - 148], size: [296, 244, 70] },
    { id: 'mega-landmark-media-signal-pods', position: [472, 54, mediaBaseZ + 84], size: [320, 108, 70] },
    { id: 'mega-landmark-discovery', position: [0, 90, discoveryBaseZ], size: [460, 180, 104] },
    { id: 'mega-landmark-discovery-observatory-crown', position: [-368, 108, discoveryBaseZ - 32], size: [212, 216, 96] },
    { id: 'mega-landmark-discovery-garden-spine', position: [-492, 8, discoveryBaseZ + 212], size: [236, 16, 72] },
    { id: 'mega-landmark-right-skyfold-citadel', position: [844, 146, -164], size: [300, 292, 96] },
    { id: 'mega-landmark-right-skybridge-beacon', position: [436, 134, -96], size: [360, 268, 116] },
    { id: 'mega-landmark-right-media-halo', position: [628, 126, -248], size: [260, 180, 220] },
    { id: 'mega-landmark-right-support-spire', position: [294, 90, -372], size: [132, 180, 64] },
    { id: 'mega-landmark-left-grand-rampart', position: [-888, 138, -156], size: [220, 276, 72] },
    { id: 'mega-landmark-left-cantilever-forum', position: [-438, 104, -116], size: [320, 208, 96] },
    { id: 'mega-landmark-left-split-crown-gate', position: [-742, 146, -346], size: [340, 292, 96] },
    { id: 'mega-landmark-left-broken-wall-monument', position: [-262, 112, -412], size: [140, 224, 96] },
    { id: 'mega-landmark-left-disc-habitat', position: [-918, 178, -548], size: [296, 212, 296] },
    { id: 'mega-landmark-left-split-monolith-pair', position: [-648, 146, -724], size: [160, 292, 72] },
  ];
}

export function filterWorldCityMegaLandmarkBounds(
  landmarks: WorldCityMegaLandmarkBound[],
  stadiumReserve: StadiumReserve,
) {
  return landmarks.filter((landmark) => !overlapsReserve(landmark.position, stadiumReserve, landmark.size));
}
