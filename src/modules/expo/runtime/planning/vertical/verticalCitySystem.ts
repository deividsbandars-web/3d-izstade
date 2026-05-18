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

export type ExpoVerticalElevatorRoute = {
  accentColor: string;
  cabinSize: [number, number, number];
  cycleSeconds: number;
  id: string;
  label: string;
  phase: number;
  railSpacing: number;
  rideable?: {
    floorPlayerOffsetY: number;
    footprintSize: [number, number];
    pickupToleranceY: number;
  };
  stationDwellSeconds?: number;
  stationSize: [number, number, number];
  waypoints: [number, number, number][];
  zoneId: string;
};

export type ExpoVerticalCitySystemPlan = {
  accessNodes: ExpoVerticalAccessNode[];
  defaultFloorHeight: number;
  elevatorRoutes: ExpoVerticalElevatorRoute[];
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
      floorCount: 36,
      floorHeight: 54,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-east-needle',
      level: 'ground',
      position: [-360, 0, -1340],
      size: [96, 1944, 96],
    },
    {
      baseY: 0,
      color: '#8799a6',
      floorCount: 32,
      floorHeight: 54,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-rear-needle',
      level: 'ground',
      position: [-550, 0, -1500],
      size: [100, 1728, 100],
    },
  ],
  core: {
    baseY: 0,
    floorCount: 32,
    floorHeight: 48,
    heightBand: 'tower',
    id: 'tower-cluster-mega-highrise-core',
    level: 'ground',
    position: [-450, 0, -1250],
    size: [240, 1536, 180],
  },
  decks: [
    {
      baseY: 520,
      color: '#9fb0bc',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-skybridge-deck',
      level: 'tower',
      playerY: 552,
      position: [-570, 0, -1245],
      size: [260, 30, 74],
      walkableSize: [260, 74],
    },
    {
      baseY: 840,
      color: '#a9bac6',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-east-needle-landing',
      level: 'tower',
      playerY: 868,
      position: [-360, 0, -1292],
      size: [132, 22, 72],
      walkableSize: [132, 72],
    },
    {
      baseY: 650,
      color: '#9eb0bd',
      floorCount: 1,
      floorHeight: 48,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-rear-needle-landing',
      level: 'tower',
      playerY: 676,
      position: [-550, 0, -1474],
      size: [148, 20, 66],
      walkableSize: [148, 66],
    },
    {
      baseY: 1536,
      color: '#b8c8d2',
      floorCount: 1,
      floorHeight: 96,
      heightBand: 'tower',
      id: 'tower-cluster-mega-highrise-crown-skydeck',
      level: 'skydeck',
      playerY: 1572,
      position: [-450, 0, -1250],
      size: [300, 32, 180],
      walkableSize: [300, 180],
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

const TOWER_CLUSTER_TELEVISION_TOWER = {
  broadcastEastPosition: [447, 3246, -1240] as [number, number, number],
  broadcastFrontPosition: [360, 3246, -1153] as [number, number, number],
  broadcastPlayerY: 3246,
  elevatorShaftZ: -1012,
  groundLiftPosition: [360, 0.25, -1030] as [number, number, number],
  observationEastPosition: [496, 1932, -1240] as [number, number, number],
  observationFrontPosition: [360, 1932, -1104] as [number, number, number],
  observationPlayerY: 1932,
  topBeaconPosition: [360, 5252, -1240] as [number, number, number],
  topPlayerY: 5252,
} as const;

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
      autoActivate: false,
      id: 'tower-cluster-mega-highrise-lift-ground-to-skybridge',
      label: 'Mega Highrise Skybridge Lift',
      level: 'ground',
      mode: 'lift',
      position: [-570, 0.25, -1185],
      radius: 36,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [-570, 552, -1245],
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-mega-highrise-lift-skybridge-to-ground',
      label: 'Mega Highrise Ground Return',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY - 4, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [1060, 238, -780],
      radius: 28,
      targetLevel: 'ground',
      targetPosition: [-570, 5, -1185],
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-mega-highrise-lift-skybridge-to-skydeck',
      label: 'Mega Highrise Crown Skydeck Lift',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0] + 74, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY - 4, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [-496, 548, -1245],
      radius: 30,
      targetLevel: 'skydeck',
      targetPosition: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [-450, 1572, -1250],
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-mega-highrise-lift-skydeck-to-skybridge',
      label: 'Mega Highrise Skybridge Return',
      level: 'skydeck',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY - 4, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [-450, 1568, -1250],
      radius: 30,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK
        ? [TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[0], TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.playerY, TOWER_CLUSTER_MEGA_SKYBRIDGE_DECK.position[2]]
        : [-570, 552, -1245],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-jump-ground-to-landing',
      label: 'East Needle Landing Jump',
      level: 'ground',
      mode: 'jump-pad',
      position: [-360, 0.25, -1245],
      radius: 28,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [-360, 868, -1292],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-jump-landing-to-ground',
      label: 'East Needle Ground Return',
      level: 'tower',
      mode: 'jump-pad',
      position: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [-360, 864, -1292],
      radius: 24,
      targetLevel: 'ground',
      targetPosition: [-360, 5, -1245],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-lift-landing-to-skydeck',
      label: 'East Needle Skydeck Lift',
      level: 'tower',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0] - 34, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [-394, 864, -1292],
      radius: 24,
      targetLevel: 'skydeck',
      targetPosition: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0], TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [-450, 1572, -1250],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-east-needle-lift-skydeck-to-landing',
      label: 'East Needle Landing Return',
      level: 'skydeck',
      mode: 'lift',
      position: TOWER_CLUSTER_MEGA_CROWN_SKYDECK
        ? [TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[0] - 42, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.playerY - 4, TOWER_CLUSTER_MEGA_CROWN_SKYDECK.position[2]]
        : [-492, 1568, -1250],
      radius: 24,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_EAST_NEEDLE_LANDING.position[2]]
        : [-360, 868, -1292],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-rear-needle-jump-ground-to-landing',
      label: 'Rear Needle Landing Jump',
      level: 'ground',
      mode: 'jump-pad',
      position: [-605, 0.25, -1418],
      radius: 28,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.playerY, TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[2]]
        : [-550, 676, -1474],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-rear-needle-jump-landing-to-ground',
      label: 'Rear Needle Ground Return',
      level: 'tower',
      mode: 'jump-pad',
      position: TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING
        ? [TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[0], TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.playerY - 4, TOWER_CLUSTER_MEGA_REAR_NEEDLE_LANDING.position[2]]
        : [-550, 672, -1474],
      radius: 24,
      targetLevel: 'ground',
      targetPosition: [-605, 5, -1418],
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-ground-to-observation',
      label: 'Television Tower Observation Lift',
      level: 'ground',
      mode: 'lift',
      position: TOWER_CLUSTER_TELEVISION_TOWER.groundLiftPosition,
      radius: 34,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_TELEVISION_TOWER.observationFrontPosition,
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-observation-to-ground',
      label: 'Television Tower Ground Return',
      level: 'tower',
      mode: 'lift',
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY - 4, -1104],
      radius: 28,
      targetLevel: 'ground',
      targetPosition: [360, 5, -1030],
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-observation-to-broadcast',
      label: 'Television Tower Broadcast Lift',
      level: 'tower',
      mode: 'lift',
      position: [496, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY - 4, -1240],
      radius: 28,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_TELEVISION_TOWER.broadcastEastPosition,
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-broadcast-to-observation',
      label: 'Television Tower Observation Return',
      level: 'tower',
      mode: 'lift',
      position: [447, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY - 4, -1240],
      radius: 26,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_TELEVISION_TOWER.observationEastPosition,
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-broadcast-to-top',
      label: 'Television Tower Top Lift',
      level: 'tower',
      mode: 'lift',
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY - 4, -1153],
      radius: 24,
      targetLevel: 'skydeck',
      targetPosition: TOWER_CLUSTER_TELEVISION_TOWER.topBeaconPosition,
      zoneId: 'tower-cluster',
    },
    {
      autoActivate: false,
      id: 'tower-cluster-television-tower-lift-top-to-broadcast',
      label: 'Television Tower Broadcast Return',
      level: 'skydeck',
      mode: 'lift',
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.topPlayerY - 4, -1240],
      radius: 22,
      targetLevel: 'tower',
      targetPosition: TOWER_CLUSTER_TELEVISION_TOWER.broadcastFrontPosition,
      zoneId: 'tower-cluster',
    },
  ],
  defaultFloorHeight: 36,
  elevatorRoutes: [
    {
      accentColor: '#fbbf24',
      cabinSize: [82, 96, 60],
      cycleSeconds: 38,
      id: 'tower-cluster-mega-highrise-animated-panoramic-lift',
      label: 'Mega Highrise Panoramic Lift',
      phase: 0.32,
      railSpacing: 62,
      rideable: {
        floorPlayerOffsetY: -36,
        footprintSize: [98, 68],
        pickupToleranceY: 18,
      },
      stationDwellSeconds: 3.2,
      stationSize: [154, 14, 78],
      waypoints: [
        [-570, 42, -1185],
        [-570, 588, -1245],
        [-450, 1608, -1250],
      ],
      zoneId: 'tower-cluster',
    },
    {
      accentColor: '#22d3ee',
      cabinSize: [72, 106, 58],
      cycleSeconds: 86,
      id: 'tower-cluster-television-tower-animated-city-lift',
      label: 'Television Tower Moving Lift',
      phase: 0,
      railSpacing: 56,
      rideable: {
        floorPlayerOffsetY: -41,
        footprintSize: [88, 68],
        pickupToleranceY: 18,
      },
      stationDwellSeconds: 4,
      stationSize: [148, 14, 76],
      waypoints: [
        [360, 48, -1030],
        [360, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY + 41, -1030],
        [360, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY + 41, -1030],
        [360, TOWER_CLUSTER_TELEVISION_TOWER.topPlayerY + 41, -1030],
      ],
      zoneId: 'tower-cluster',
    },
  ],
  levels: [
    { baseY: 0, floorHeight: 36, id: 'ground', label: 'Ground' },
    { baseY: 48, floorHeight: 36, id: 'level-1', label: 'Level 1' },
    { baseY: 96, floorHeight: 36, id: 'level-2', label: 'Level 2' },
    { baseY: 144, floorHeight: 36, id: 'roof', label: 'Roof' },
    { baseY: 216, floorHeight: 72, id: 'tower', label: 'Tower' },
    { baseY: 1536, floorHeight: 96, id: 'skydeck', label: 'Skydeck' },
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
    {
      id: 'tower-cluster-television-tower-observation-lift-landing-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY,
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY, -978],
      size: [88, 82],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-observation-ring-west-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY,
      position: [224, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY, -1240],
      size: [170, 440],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-observation-ring-east-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY,
      position: [496, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY, -1240],
      size: [170, 440],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-observation-ring-front-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY,
      position: TOWER_CLUSTER_TELEVISION_TOWER.observationFrontPosition,
      size: [70, 170],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-observation-ring-rear-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY,
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.observationPlayerY, -1376],
      size: [70, 170],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-broadcast-lift-landing-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY,
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY, -1060],
      size: [88, 86],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-broadcast-collar-west-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY,
      position: [273, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY, -1240],
      size: [100, 280],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-broadcast-collar-east-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY,
      position: TOWER_CLUSTER_TELEVISION_TOWER.broadcastEastPosition,
      size: [100, 280],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-broadcast-collar-front-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY,
      position: TOWER_CLUSTER_TELEVISION_TOWER.broadcastFrontPosition,
      size: [70, 100],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-broadcast-collar-rear-walkable',
      level: 'tower',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY,
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.broadcastPlayerY, -1327],
      size: [70, 100],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-top-lift-bridge-walkable',
      level: 'skydeck',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.topPlayerY,
      position: [360, TOWER_CLUSTER_TELEVISION_TOWER.topPlayerY, -1106],
      size: [88, 168],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-television-tower-top-beacon-walkable',
      level: 'skydeck',
      playerY: TOWER_CLUSTER_TELEVISION_TOWER.topPlayerY,
      position: TOWER_CLUSTER_TELEVISION_TOWER.topBeaconPosition,
      size: [96, 96],
      zoneId: 'tower-cluster',
    },
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
