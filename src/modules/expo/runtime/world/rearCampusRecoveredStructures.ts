import { resolveRearCampusAnchoredZ } from './ExpoRearCampusLayout';

export type RecoveredRearCampusStructure = {
  authoredZ: number;
  boundsCenterOffset?: [number, number, number];
  id: string;
  positionX: number;
  size: [number, number, number];
};

export const RECOVERED_REAR_CAMPUS_STRUCTURES: RecoveredRearCampusStructure[] = [
  {
    authoredZ: -3670,
    id: 'rear-campus-mega-civic-hall',
    positionX: -2490,
    size: [724, 352, 324],
  },
  {
    authoredZ: -4977,
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
