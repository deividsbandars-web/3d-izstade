export type ExpoVerticalLevelId =
  | 'ground'
  | 'level-1'
  | 'level-2'
  | 'roof'
  | 'tower'
  | 'skydeck';

export type ExpoVerticalHeightBand =
  | 'ground'
  | 'low-rise'
  | 'mid-rise'
  | 'high-rise'
  | 'roof'
  | 'tower';

export type ExpoVerticalOwner =
  | 'booth'
  | 'city'
  | 'stadium'
  | 'system';

export type ExpoVerticalAccessMode =
  | 'jump-pad'
  | 'ladder'
  | 'lift'
  | 'ramp'
  | 'stair';

export type ExpoVerticalPlacement = {
  baseY: number;
  floorCount: number;
  floorHeight: number;
  heightBand: ExpoVerticalHeightBand;
  level: ExpoVerticalLevelId;
  verticalOwner: ExpoVerticalOwner;
};

export type ExpoVerticalLevelDefinition = {
  baseY: number;
  floorHeight: number;
  id: ExpoVerticalLevelId;
  label: string;
};

export type ExpoVerticalAccessNode = {
  autoActivate?: boolean;
  id: string;
  label: string;
  level: ExpoVerticalLevelId;
  mode: ExpoVerticalAccessMode;
  position: [number, number, number];
  radius: number;
  targetLevel: ExpoVerticalLevelId;
  targetPosition: [number, number, number];
  zoneId: string;
};

export type ExpoVerticalWalkableRegion = {
  id: string;
  level: ExpoVerticalLevelId;
  playerY: number;
  position: [number, number, number];
  size: [number, number];
  zoneId: string;
};

export type ExpoVerticalCitySystemPlan = {
  accessNodes: ExpoVerticalAccessNode[];
  defaultFloorHeight: number;
  levels: ExpoVerticalLevelDefinition[];
  pilotZoneId: 'tower-cluster';
  walkableRegions: ExpoVerticalWalkableRegion[];
};

export type ExpoVerticalMegaStructureDeckLayout = {
  baseY: number;
  color: string;
  floorCount: number;
  floorHeight: number;
  heightBand: ExpoVerticalHeightBand;
  id: string;
  level: ExpoVerticalLevelId;
  playerY: number;
  position: [number, number, number];
  size: [number, number, number];
  walkableSize: [number, number];
};

export type ExpoVerticalMegaStructureTowerLayout = {
  baseY: number;
  color: string;
  floorCount: number;
  floorHeight: number;
  heightBand: ExpoVerticalHeightBand;
  id: string;
  level: ExpoVerticalLevelId;
  position: [number, number, number];
  size: [number, number, number];
};

export type ExpoVerticalMegaStructureLayout = {
  companionTowers: ExpoVerticalMegaStructureTowerLayout[];
  core: {
    baseY: number;
    floorCount: number;
    floorHeight: number;
    heightBand: ExpoVerticalHeightBand;
    id: string;
    level: ExpoVerticalLevelId;
    position: [number, number, number];
    size: [number, number, number];
  };
  decks: ExpoVerticalMegaStructureDeckLayout[];
  id: string;
  zoneId: 'tower-cluster';
};

export const EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT: ExpoVerticalMegaStructureLayout = {
  companionTowers: [
    {
      baseY: 0,
      color: '#7d8f9c',
      floorCount: 28,
      floorHeight: 54,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-east-needle',
      level: 'ground',
      position: [1530, 0, -1110],
      size: [64, 1512, 64],
    },
    {
      baseY: 0,
      color: '#8799a6',
      floorCount: 24,
      floorHeight: 54,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-rear-needle',
      level: 'ground',
      position: [1120, 0, -1450],
      size: [68, 1296, 68],
    },
  ],
  core: {
    baseY: 0,
    floorCount: 24,
    floorHeight: 48,
    heightBand: 'tower',
    id: 'tower-cluster-mega-highrise-core',
    level: 'ground',
    position: [1380, 0, -1020],
    size: [116, 1152, 116],
  },
  decks: [
    {
      baseY: 420,
      color: '#9fb0bc',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-skybridge-deck',
      level: 'tower',
      playerY: 450,
      position: [1260, 0, -1015],
      size: [220, 26, 58],
      walkableSize: [220, 58],
    },
    {
      baseY: 720,
      color: '#a9bac6',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-east-needle-landing',
      level: 'tower',
      playerY: 744,
      position: [1488, 0, -1062],
      size: [104, 20, 58],
      walkableSize: [104, 58],
    },
    {
      baseY: 540,
      color: '#9eb0bd',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-rear-needle-landing',
      level: 'tower',
      playerY: 562,
      position: [1120, 0, -1424],
      size: [124, 18, 54],
      walkableSize: [124, 54],
    },
    {
      baseY: 1152,
      color: '#b8c8d2',
      floorCount: 1,
      floorHeight: 96,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-crown-skydeck',
      level: 'skydeck',
      playerY: 1182,
      position: [1380, 0, -1020],
      size: [164, 26, 96],
      walkableSize: [164, 96],
    },
  ],
  id: 'tower-cluster-mega-highrise',
  zoneId: 'tower-cluster',
};

const TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK = EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.decks.find((deck) => (
  deck.id === 'tower-cluster-mega-highrise-skybridge-deck'
));
const TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING = EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.decks.find((deck) => (
  deck.id === 'tower-cluster-mega-highrise-east-needle-landing'
));
const TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING = EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.decks.find((deck) => (
  deck.id === 'tower-cluster-mega-highrise-rear-needle-landing'
));
const TOWER_CLUSTER_MEGA_CROWN_SKYDECK = EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.decks.find((deck) => (
  deck.id === 'tower-cluster-mega-highrise-crown-skydeck'
));

export const EXPO_VERTICAL_CITY_SYSTEM: ExpoVerticalCitySystemPlan = {
  accessNodes: [
    {
      id: 'tower-cluster-vertical-pilot-lift-ground',
      label: 'Vertical Pilot Ground Lift',
      level: 'ground',
      mode: 'lift',
      position: [900, 0.25, -620],
      radius: 42,
      targetLevel: 'level-2',
      targetPosition: [900, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-ground-to-level-1',
      label: 'Vertical Pilot Level 1 Lift',
      level: 'ground',
      mode: 'lift',
      position: [820, 0.25, -620],
      radius: 28,
      targetLevel: 'level-1',
      targetPosition: [820, 70, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-1-to-ground',
      label: 'Vertical Pilot Ground Return',
      level: 'level-1',
      mode: 'lift',
      position: [820, 67, -650],
      radius: 28,
      targetLevel: 'ground',
      targetPosition: [820, 5, -620],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-1-to-level-2',
      label: 'Vertical Pilot Level 2 Transfer',
      level: 'level-1',
      mode: 'lift',
      position: [980, 67, -650],
      radius: 28,
      targetLevel: 'level-2',
      targetPosition: [980, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2',
      label: 'Vertical Pilot Level 2 Lift',
      level: 'level-2',
      mode: 'lift',
      position: [900, 121, -680],
      radius: 42,
      targetLevel: 'ground',
      targetPosition: [900, 5, -620],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2-to-level-1',
      label: 'Vertical Pilot Level 1 Return',
      level: 'level-2',
      mode: 'lift',
      position: [980, 121, -680],
      radius: 28,
      targetLevel: 'level-1',
      targetPosition: [980, 70, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2-to-roof',
      label: 'Vertical Pilot Roof Lift',
      level: 'level-2',
      mode: 'lift',
      position: [760, 121, -690],
      radius: 30,
      targetLevel: 'roof',
      targetPosition: [900, 170, -710],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-roof-to-level-2',
      label: 'Vertical Pilot Level 2 Return',
      level: 'roof',
      mode: 'lift',
      position: [760, 167, -710],
      radius: 30,
      targetLevel: 'level-2',
      targetPosition: [900, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-roof-to-tower',
      label: 'Vertical Pilot Tower Lift',
      level: 'roof',
      mode: 'lift',
      position: [900, 167, -710],
      radius: 34,
      targetLevel: 'tower',
      targetPosition: [900, 248, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-tower-to-roof',
      label: 'Vertical Pilot Roof Return',
      level: 'tower',
      mode: 'lift',
      position: [900, 245, -650],
      radius: 34,
      targetLevel: 'roof',
      targetPosition: [900, 170, -710],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-mega-highrise-lift-ground-to-skybridge',
      label: 'Mega Highrise Skybridge Lift',
      level: 'ground',
      mode: 'lift',
      position: [1260, 0.25, -955],
      radius: 36,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [1260, 450, -1015],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-mega-highrise-lift-skybridge-to-ground',
      label: 'Mega Highrise Ground Return',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY - 4, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [1060, 238, -780],
      radius: 28,
      targetLevel: 'ground',
      targetPosition: [1260, 5, -955],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-mega-highrise-lift-skybridge-to-skydeck',
      label: 'Mega Highrise Crown Skydeck Lift',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0] + 74, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY - 4, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [1334, 446, -1015],
      radius: 30,
      targetLevel: 'skydeck',
      targetPosition: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [1380, 1182, -1020],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-mega-highrise-lift-skydeck-to-skybridge',
      label: 'Mega Highrise Skybridge Return',
      level: 'skydeck',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY - 4, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [1380, 1178, -1020],
      radius: 30,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [1260, 450, -1015],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-jump-ground-to-landing',
      label: 'East Needle Landing Jump',
      level: 'ground',
      mode: 'jump-pad',
      position: [1488, 0.25, -1015],
      radius: 28,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [1488, 744, -1062],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-jump-landing-to-ground',
      label: 'East Needle Ground Return',
      level: 'tower',
      mode: 'jump-pad',
      position: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [1488, 740, -1062],
      radius: 24,
      targetLevel: 'ground',
      targetPosition: [1488, 5, -1015],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-lift-landing-to-skydeck',
      label: 'East Needle Skydeck Lift',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0] - 34, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [1454, 740, -1062],
      radius: 24,
      targetLevel: 'skydeck',
      targetPosition: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [1380, 1182, -1020],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-lift-skydeck-to-landing',
      label: 'East Needle Landing Return',
      level: 'skydeck',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0] - 42, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY - 4, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [1338, 1178, -1020],
      radius: 24,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [1488, 744, -1062],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-rear-needle-jump-ground-to-landing',
      label: 'Rear Needle Landing Jump',
      level: 'ground',
      mode: 'jump-pad',
      position: [1065, 0.25, -1368],
      radius: 28,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[2]]
        : [1120, 562, -1424],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-rear-needle-jump-landing-to-ground',
      label: 'Rear Needle Ground Return',
      level: 'tower',
      mode: 'jump-pad',
      position: TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[2]]
        : [1120, 558, -1424],
      radius: 24,
      targetLevel: 'ground',
      targetPosition: [1065, 5, -1368],
      zoneId: 'tower-cluster',
    },
  ],
  defaultFloorHeight: 36,
  levels: [
    { baseY: 0, floorHeight: 36, id: 'ground', label: 'Ground' },
    { baseY: 48, floorHeight: 36, id: 'level-1', label: 'Level 1' },
    { baseY: 96, floorHeight: 36, id: 'level-2', label: 'Level 2' },
    { baseY: 144, floorHeight: 36, id: 'roof', label: 'Roof' },
    { baseY: 216, floorHeight: 72, id: 'tower', label: 'Tower' },
    { baseY: 1152, floorHeight: 96, id: 'skydeck', label: 'Skydeck' },
  ],
  pilotZoneId: 'tower-cluster',
  walkableRegions: [
    {
      id: 'tower-cluster-vertical-pilot-level-1-walkable-deck',
      level: 'level-1',
      playerY: 70,
      position: [900, 70, -650],
      size: [228, 46],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-level-2-walkable-deck',
      level: 'level-2',
      playerY: 124,
      position: [900, 124, -680],
      size: [276, 54],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-roof-walkable-deck',
      level: 'roof',
      playerY: 170,
      position: [900, 170, -710],
      size: [340, 64],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-tower-walkable-deck',
      level: 'tower',
      playerY: 248,
      position: [900, 248, -650],
      size: [220, 54],
      zoneId: 'tower-cluster',
    },
    ...EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.decks.map((deck) => ({
      id: `${deck.id}-walkable`,
      level: deck.level,
      playerY: deck.playerY,
      position: [deck.position[0], deck.playerY, deck.position[2]] as [number, number, number],
      size: deck.walkableSize,
      zoneId: EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT.zoneId,
    })),
  ],
};

export function createVerticalPlacement(
  placement: ExpoVerticalPlacement,
): ExpoVerticalPlacement {
  return placement;
}

export function getVerticalAccessNodesForLevel(
  plan: ExpoVerticalCitySystemPlan,
  level: ExpoVerticalLevelId,
): ExpoVerticalAccessNode[] {
  return plan.accessNodes.filter((node) => node.level === level);
}

export function getVerticalWalkableRegionsForLevel(
  plan: ExpoVerticalCitySystemPlan,
  level: ExpoVerticalLevelId,
): ExpoVerticalWalkableRegion[] {
  return plan.walkableRegions.filter((region) => region.level === level);
}
