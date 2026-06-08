import type { ExpoPlanningSectionId, ExpoPlanningZoneId, StadiumReserve } from '../planning/types';

type CityMegaLandmarkPlanningZone = Exclude<ExpoPlanningZoneId, 'rear-campus'>;

export type WorldCityMegaLandmarkPhysicsPart = {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  walkableTop?: boolean;
};

type WorldCityMegaLandmarkLocalPhysicsPart = Omit<WorldCityMegaLandmarkPhysicsPart, 'position'> & {
  position: [number, number, number];
};

export type WorldCityMegaLandmarkBound = {
  id: string;
  physicsParts?: WorldCityMegaLandmarkPhysicsPart[];
  planningSections: ExpoPlanningSectionId[];
  planningZone: CityMegaLandmarkPlanningZone;
  position: [number, number, number];
  reviewTargetPosition?: [number, number, number];
  size: [number, number, number];
};

const HIDDEN_WORLD_CITY_MEGA_LANDMARK_IDS = new Set([
  'mega-landmark-media',
  'mega-landmark-showcase',
]);

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
  physicsParts?: WorldCityMegaLandmarkLocalPhysicsPart[];
  position: [number, number, number];
  reviewTargetPosition?: [number, number, number];
  size: [number, number, number];
}): WorldCityMegaLandmarkBound {
  const { physicsParts, planningSection, ...bound } = args;
  return {
    ...bound,
    ...(physicsParts ? {
      physicsParts: physicsParts.map((part) => ({
        ...part,
        // Renderer mega-landmark groups sit at y=0, so local Y is already world Y.
        position: [
          args.position[0] + part.position[0],
          part.position[1],
          args.position[2] + part.position[2],
        ],
      })),
    } : {}),
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
  const mediaBaseZ = -214 - districtStride - 260;
  const discoveryBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;

  return [
    createMegaLandmarkBound({
      id: 'mega-landmark-arrival',
      physicsParts: [
        { id: 'base', position: [0, 8, 0], size: [206, 8, 30] },
        { id: 'support-left', position: [-112, 86, 0], size: [18, 172, 20] },
        { id: 'support-right', position: [112, 86, 0], size: [18, 172, 20] },
        { id: 'plinth', position: [0, 12, 0], size: [128, 6, 18] },
        { id: 'accent-left', position: [-92, 46, 18], size: [12, 92, 12] },
        { id: 'accent-right', position: [92, 46, 12], size: [12, 92, 12] },
      ],
      planningSection: 'arrival',
      planningZone: 'arrival',
      position: [0, 130, 256],
      size: [260, 260, 96],
    }),
    createMegaLandmarkBound({ id: 'mega-landmark-showcase', planningSection: 'middle', planningZone: 'center-spine', position: [0, 104, 32], size: [510, 208, 96] }),
    createMegaLandmarkBound({
      id: 'mega-landmark-media',
      physicsParts: [
        { id: 'outer-accent-left', position: [-332, 54, 0], size: [14, 108, 14] },
      ],
      planningSection: 'middle',
      planningZone: 'center-spine',
      position: [0, 120, mediaBaseZ],
      reviewTargetPosition: [0, 198, mediaBaseZ],
      size: [780, 240, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-media-frame-wall',
      physicsParts: [
        { id: 'left', position: [-132, 122, 0], size: [26, 244, 24] },
        { id: 'right', position: [132, 122, 0], size: [26, 244, 24] },
        { id: 'top', position: [0, 236, 0], size: [296, 20, 28] },
        { id: 'base', position: [0, 8, 0], size: [214, 10, 42] },
        { id: 'core', position: [0, 82, 12], size: [18, 164, 18] },
      ],
      planningSection: 'middle',
      planningZone: 'center-spine',
      position: [860, 122, mediaBaseZ - 78],
      size: [296, 244, 70],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-media-signal-pods',
      physicsParts: [
        { id: 'pod-left', position: [-118, 42, 0], size: [84, 84, 42] },
        { id: 'pod-center', position: [0, 54, 0], size: [92, 108, 48] },
        { id: 'pod-right', position: [118, 42, 0], size: [84, 84, 42] },
        { id: 'base', position: [0, 8, 0], size: [274, 10, 58] },
      ],
      planningSection: 'middle',
      planningZone: 'center-spine',
      position: [1160, 54, mediaBaseZ + 122],
      size: [320, 108, 70],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-discovery',
      physicsParts: [
        { id: 'core', position: [0, 72, -24], size: [36, 144, 36] },
      ],
      planningSection: 'middle',
      planningZone: 'center-spine',
      position: [0, 90, discoveryBaseZ],
      size: [460, 180, 104],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-discovery-observatory-crown',
      physicsParts: [
        { id: 'plinth', position: [0, 8, 0], size: [212, 10, 54] },
        { id: 'core', position: [0, 106, 0], size: [48, 212, 48] },
        { id: 'wing-left', position: [-96, 74, 0], size: [16, 148, 18] },
        { id: 'wing-right', position: [96, 74, 0], size: [16, 148, 18] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-368, 108, discoveryBaseZ - 32],
      size: [212, 216, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-discovery-garden-spine',
      physicsParts: [
        { id: 'right-garden', position: [88, 8, 0], size: [52, 10, 44] },
        { id: 'ribbon', position: [0, 8, 0], size: [148, 6, 16] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-492, 8, discoveryBaseZ + 212],
      size: [236, 16, 72],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-right-skyfold-citadel',
      physicsParts: [
        { id: 'plinth', position: [0, 10, 0], size: [248, 12, 62] },
        { id: 'core-left', position: [-58, 146, 0], rotation: [0, 0, -0.08], size: [72, 292, 34] },
        { id: 'core-right', position: [42, 124, -12], rotation: [0, 0, 0.06], size: [68, 248, 32] },
        { id: 'fold-top', position: [0, 236, -4], rotation: [0, 0.12, 0], size: [182, 16, 24] },
        { id: 'bridge-cut', position: [0, 168, 14], size: [118, 12, 16] },
      ],
      planningSection: 'right',
      planningZone: 'right-district',
      position: [844, 146, -164],
      size: [300, 292, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-right-skybridge-beacon',
      physicsParts: [
        { id: 'plinth', position: [0, 8, 0], size: [236, 10, 56] },
        { id: 'tower-left', position: [-88, 118, 0], size: [28, 236, 28] },
        { id: 'tower-right', position: [88, 134, -12], size: [30, 268, 30] },
        { id: 'bridge', position: [0, 204, -6], size: [202, 12, 22] },
        { id: 'bridge-underlight', position: [0, 194, -6], size: [156, 4, 10] },
        { id: 'inner-support-left', position: [-34, 76, 18], size: [14, 152, 14] },
        { id: 'inner-support-right', position: [34, 84, 12], size: [14, 168, 14] },
        { id: 'beacon-core', position: [0, 64, 34], size: [28, 128, 28] },
      ],
      planningSection: 'right',
      planningZone: 'right-district',
      position: [580, 134, 30],
      size: [360, 268, 116],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-right-media-halo',
      physicsParts: [
        { id: 'base-left', position: [-72, 42, 0], size: [18, 84, 18] },
        { id: 'base-right', position: [72, 42, 0], size: [18, 84, 18] },
        { id: 'crossbeam', position: [0, 126, 0], size: [132, 10, 16] },
        { id: 'core', position: [0, 68, 0], size: [24, 136, 24] },
      ],
      planningSection: 'right',
      planningZone: 'right-district',
      position: [1136, 126, -400],
      size: [260, 180, 220],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-right-support-spire',
      physicsParts: [
        { id: 'plinth', position: [0, 7, 0], size: [132, 8, 38] },
        { id: 'core', position: [0, 74, 0], size: [20, 148, 20] },
        { id: 'wing-left', position: [-46, 52, 0], size: [12, 104, 12] },
        { id: 'wing-right', position: [46, 58, -8], size: [12, 116, 12] },
        { id: 'band', position: [0, 118, 0], size: [96, 8, 14] },
      ],
      planningSection: 'right',
      planningZone: 'right-district',
      position: [360, 90, -460],
      reviewTargetPosition: [360, 118, -460],
      size: [132, 180, 64],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-grand-rampart',
      physicsParts: [
        { id: 'wall-left', position: [-96, 56, -8], rotation: [0, 0, -0.04], size: [84, 112, 26] },
        { id: 'wall-center', position: [-6, 98, -6], size: [128, 196, 28] },
        { id: 'wall-right', position: [58, 124, 16], size: [80, 18, 22] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-870, 138, -80],
      size: [220, 276, 72],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-cantilever-forum',
      physicsParts: [
        { id: 'pylon-left', position: [-84, 78, -4], size: [56, 156, 28] },
        { id: 'pylon-right', position: [48, 66, -12], rotation: [0, 0, 0.08], size: [38, 132, 24] },
        { id: 'core', position: [-8, 42, 32], size: [34, 84, 24] },
        { id: 'fin-left', position: [-146, 52, -18], rotation: [0, 0, -0.16], size: [26, 104, 18] },
        { id: 'fin-right', position: [126, 46, 18], rotation: [0, 0, 0.16], size: [24, 92, 18] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-520, 104, -48],
      size: [320, 208, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-split-crown-gate',
      physicsParts: [
        { id: 'left', position: [-82, 146, 0], size: [34, 292, 28] },
        { id: 'right', position: [82, 138, -8], size: [34, 276, 28] },
        { id: 'inner-left', position: [-24, 112, 14], size: [18, 224, 18] },
        { id: 'inner-right', position: [24, 104, 8], size: [18, 208, 18] },
        { id: 'core', position: [0, 72, 32], size: [28, 144, 28] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-1450, 146, -415],
      size: [340, 292, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-broken-wall-monument',
      physicsParts: [
        { id: 'left', position: [-64, 86, -14], rotation: [0, 0, -0.08], size: [42, 172, 22] },
        { id: 'right', position: [48, 66, 22], rotation: [0, 0, 0.1], size: [54, 132, 20] },
        { id: 'marker', position: [-6, 142, 28], size: [96, 16, 16] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-420, 112, -480],
      reviewTargetPosition: [-420, 112, -480],
      size: [140, 224, 96],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-disc-habitat',
      physicsParts: [
        { id: 'support-a', position: [-82, 72, 16], size: [26, 144, 18] },
        { id: 'support-b', position: [82, 82, -34], rotation: [0, 0, -0.14], size: [28, 164, 30] },
        { id: 'support-c', position: [-8, 58, 54], rotation: [0, 0, 0.12], size: [34, 112, 14] },
        { id: 'body', position: [0, 178, 0], size: [296, 28, 296] },
        { id: 'core', position: [0, 178, 0], size: [112, 34, 112] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-940, 178, -600],
      size: [296, 212, 296],
    }),
    createMegaLandmarkBound({
      id: 'mega-landmark-left-split-monolith-pair',
      physicsParts: [
        { id: 'monolith-a', position: [-58, 146, 0], rotation: [0, 0, -0.04], size: [44, 292, 28] },
        { id: 'monolith-b', position: [64, 128, -10], rotation: [0, 0, 0.05], size: [38, 256, 28] },
        { id: 'gap-marker', position: [0, 172, 22], size: [92, 14, 16] },
      ],
      planningSection: 'left',
      planningZone: 'left-district',
      position: [-600, 146, -1030],
      size: [160, 292, 72],
    }),
  ].filter((landmark) => !HIDDEN_WORLD_CITY_MEGA_LANDMARK_IDS.has(landmark.id));
}

export function filterWorldCityMegaLandmarkBounds(
  landmarks: WorldCityMegaLandmarkBound[],
  stadiumReserve: StadiumReserve,
) {
  return landmarks.filter((landmark) => !overlapsReserve(landmark.position, stadiumReserve, landmark.size));
}
