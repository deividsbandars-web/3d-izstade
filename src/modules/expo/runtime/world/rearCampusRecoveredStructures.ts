import { resolveRearCampusAnchoredZ } from './ExpoRearCampusLayout';

export type RecoveredRearCampusStructure = {
  authoredZ: number;
  boundsCenterOffset?: [number, number, number];
  id: string;
  positionX: number;
  size: [number, number, number];
};

export type RecoveredRearCampusPhysicsPart = {
  id: string;
  localPosition: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  walkableTop?: boolean;
};

export const RECOVERED_REAR_CAMPUS_STRUCTURES: RecoveredRearCampusStructure[] = [
  {
    authoredZ: -3018,
    id: 'rear-campus-stage-monolith-canopy',
    positionX: 47,
    size: [564, 232, 176],
  },
  {
    authoredZ: -3670,
    id: 'rear-campus-mega-civic-hall',
    positionX: -2490,
    size: [724, 352, 324],
  },
  {
    authoredZ: -4764,
    id: 'rear-campus-linked-mini-skyline',
    positionX: -2537,
    size: [744, 444, 312],
  },
  {
    authoredZ: -4577,
    id: 'rear-campus-petal-tower',
    positionX: 2340,
    size: [236, 574, 236],
  },
  {
    authoredZ: -3449,
    boundsCenterOffset: [14, 175, 3],
    id: 'rear-campus-bridge-linked-campus',
    positionX: -1343,
    size: [632, 350, 186],
  },
  {
    authoredZ: -1432,
    id: 'rear-campus-helix-spire',
    positionX: 2439,
    size: [272, 812, 264],
  },
  {
    authoredZ: -1902,
    id: 'rear-campus-grand-prism-citadel',
    positionX: -1033,
    size: [596, 456, 224],
  },
  {
    authoredZ: -2894,
    id: 'rear-campus-void-courtyard-monument',
    positionX: -1971,
    size: [612, 396, 348],
  },
  {
    authoredZ: -3242,
    id: 'rear-campus-twin-void-monolith',
    positionX: 1340,
    size: [276, 670, 168],
  },
];

export const RECOVERED_REAR_CAMPUS_PHYSICS_PARTS_BY_ID: Readonly<Record<string, RecoveredRearCampusPhysicsPart[]>> = {
  'rear-campus-stage-monolith-canopy': [
    { id: 'base', localPosition: [0, 10, 0], size: [564, 20, 176], walkableTop: false },
    { id: 'left-monolith', localPosition: [-164, 110, -12], size: [112, 200, 118] },
    { id: 'right-monolith', localPosition: [164, 110, -12], size: [112, 200, 118] },
    { id: 'center-core', localPosition: [0, 96, 10], size: [216, 156, 96] },
    { id: 'roof-canopy', localPosition: [0, 220, -4], size: [472, 24, 168] },
    { id: 'rear-rail', localPosition: [0, 192, -76], size: [308, 28, 18], walkableTop: false },
    { id: 'front-ledge', localPosition: [0, 54, 66], size: [248, 18, 38], walkableTop: false },
  ],
  'rear-campus-mega-civic-hall': [
    { id: 'base', localPosition: [0, 18, 0], size: [724, 28, 324], walkableTop: false },
    { id: 'main-hall', localPosition: [0, 136, 0], size: [428, 236, 196] },
    { id: 'left-wing', localPosition: [-214, 94, 0], size: [152, 152, 142] },
    { id: 'right-wing', localPosition: [214, 94, 0], size: [152, 152, 142] },
    { id: 'roof-deck', localPosition: [0, 264, 0], size: [488, 18, 216] },
    { id: 'upper-crown', localPosition: [0, 312, -12], size: [292, 56, 118] },
    { id: 'rear-beacon', localPosition: [0, 346, -88], size: [196, 12, 18], walkableTop: false },
  ],
  'rear-campus-linked-mini-skyline': [
    { id: 'base', localPosition: [0, 12, 0], size: [744, 18, 312], walkableTop: false },
    { id: 'tower-left-low', localPosition: [-286, 102, -38], size: [88, 204, 92] },
    { id: 'tower-left-high', localPosition: [-134, 156, 42], size: [102, 312, 96] },
    { id: 'tower-center', localPosition: [28, 222, -8], size: [112, 444, 102] },
    { id: 'tower-right-high', localPosition: [188, 176, 36], size: [94, 352, 94] },
    { id: 'tower-right-low', localPosition: [336, 124, -22], size: [82, 248, 88] },
    { id: 'left-bridge', localPosition: [-206, 214, 2], size: [138, 16, 34], walkableTop: false },
    { id: 'center-bridge', localPosition: [106, 286, 10], size: [168, 16, 36], walkableTop: false },
    { id: 'right-bridge', localPosition: [260, 186, 6], size: [120, 14, 32], walkableTop: false },
    { id: 'front-podium-left', localPosition: [-56, 54, 0], size: [96, 18, 72], walkableTop: false },
    { id: 'front-podium-right', localPosition: [154, 54, -12], size: [82, 16, 58], walkableTop: false },
  ],
  'rear-campus-petal-tower': [
    { id: 'base', localPosition: [0, 12, 0], size: [236, 20, 236], walkableTop: false },
    { id: 'main-stem', localPosition: [0, 262, 0], size: [92, 524, 92] },
    { id: 'top-stem', localPosition: [0, 472, 0], size: [44, 96, 44], walkableTop: false },
    { id: 'signal-orb', localPosition: [0, 548, 0], size: [52, 52, 52], walkableTop: false },
  ],
  'rear-campus-bridge-linked-campus': [
    { id: 'left-block', localPosition: [-214, 116, -24], size: [176, 228, 132] },
    { id: 'center-block', localPosition: [0, 176, 0], size: [224, 348, 154] },
    { id: 'right-block', localPosition: [236, 134, 28], size: [188, 264, 136] },
    { id: 'left-link', localPosition: [-108, 228, -8], size: [192, 18, 54], walkableTop: false },
    { id: 'right-link', localPosition: [118, 264, 8], size: [208, 18, 54], walkableTop: false },
    { id: 'low-link', localPosition: [0, 72, 0], size: [128, 18, 42], walkableTop: false },
  ],
  'rear-campus-helix-spire': [
    { id: 'base', localPosition: [0, 12, 0], size: [264, 20, 264], walkableTop: false },
    { id: 'core', localPosition: [0, 312, 0], size: [84, 624, 84] },
    { id: 'helix-1', localPosition: [0, 112, 0], rotation: [0.08, 0, 0.42], size: [228, 14, 22], walkableTop: false },
    { id: 'helix-2', localPosition: [0, 212, 0], rotation: [0.08, 0, 1.08], size: [252, 14, 22], walkableTop: false },
    { id: 'helix-3', localPosition: [0, 318, 0], rotation: [0.08, 0, 1.82], size: [272, 14, 22], walkableTop: false },
    { id: 'helix-4', localPosition: [0, 426, 0], rotation: [0.08, 0, 2.46], size: [246, 14, 22], walkableTop: false },
    { id: 'helix-5', localPosition: [0, 536, 0], rotation: [0.08, 0, 3.1], size: [214, 12, 20], walkableTop: false },
    { id: 'antenna', localPosition: [0, 676, 0], size: [32, 172, 32], walkableTop: false },
    { id: 'top-beacon', localPosition: [0, 784, 0], size: [56, 56, 56], walkableTop: false },
  ],
  'rear-campus-grand-prism-citadel': [
    { id: 'base', localPosition: [0, 14, 0], size: [596, 20, 224], walkableTop: false },
    { id: 'left-prism', localPosition: [-118, 176, -16], rotation: [0, 0, -0.12], size: [114, 352, 72] },
    { id: 'center-prism', localPosition: [34, 228, 18], rotation: [0, 0, 0.08], size: [126, 456, 84] },
    { id: 'right-prism', localPosition: [172, 142, 6], rotation: [0, 0, 0.2], size: [68, 284, 52] },
  ],
  'rear-campus-void-courtyard-monument': [
    { id: 'base', localPosition: [0, 16, 0], size: [612, 22, 348], walkableTop: false },
    { id: 'left-wall', localPosition: [-188, 188, 0], size: [144, 376, 132] },
    { id: 'right-wall', localPosition: [188, 188, 0], size: [144, 376, 132] },
    { id: 'rear-wall', localPosition: [0, 188, -108], size: [236, 376, 116] },
    { id: 'front-wall', localPosition: [0, 188, 108], size: [236, 376, 116] },
    { id: 'roof-ring', localPosition: [0, 386, 0], size: [236, 20, 236] },
    { id: 'center-plinth', localPosition: [0, 92, 0], size: [118, 18, 118], walkableTop: false },
  ],
  'rear-campus-twin-void-monolith': [
    { id: 'base', localPosition: [0, 12, 0], size: [276, 18, 168], walkableTop: false },
    { id: 'left-monolith', localPosition: [-82, 244, 0], size: [72, 488, 44] },
    { id: 'right-monolith', localPosition: [82, 232, 0], size: [64, 464, 44] },
    { id: 'low-bridge', localPosition: [0, 92, 0], size: [92, 18, 30], walkableTop: false },
    { id: 'top-bridge', localPosition: [0, 494, 0], size: [118, 14, 24], walkableTop: false },
    { id: 'signal-stem', localPosition: [0, 586, 0], size: [22, 168, 22], walkableTop: false },
  ],
};

const RECOVERED_REAR_CAMPUS_STRUCTURE_ID_SET = new Set(
  RECOVERED_REAR_CAMPUS_STRUCTURES.map((structure) => structure.id),
);

export function isRecoveredRearCampusStructureId(id: string): boolean {
  return RECOVERED_REAR_CAMPUS_STRUCTURE_ID_SET.has(id);
}

export function resolveRecoveredRearCampusGroupPosition(
  structure: RecoveredRearCampusStructure,
  campusCenterZ: number,
): [number, number, number] {
  return [
    structure.positionX,
    0,
    resolveRearCampusAnchoredZ(campusCenterZ, structure.authoredZ),
  ];
}

export function resolveRecoveredRearCampusRegistryPosition(
  structure: RecoveredRearCampusStructure,
  campusCenterZ: number,
): [number, number, number] {
  const offset = structure.boundsCenterOffset ?? [0, structure.size[1] * 0.5, 0];
  return [
    structure.positionX + offset[0],
    offset[1],
    resolveRearCampusAnchoredZ(campusCenterZ, structure.authoredZ) + offset[2],
  ];
}
