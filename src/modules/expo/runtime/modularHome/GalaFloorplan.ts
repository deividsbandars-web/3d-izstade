import { GALA_HOUSE_DIMENSIONS, GALA_OPENING_SCHEDULE, GALA_ROOM_SCHEDULE } from './GalaHouseDimensions';
import type { GalaDoorId } from './GalaDoorState';

export type Rect = {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
};

export type GalaRoomId = 'livingKitchenEntry' | 'bathroom' | 'bedroom';

export type GalaFloorplanRoom = Rect & {
  areaM2: number;
  id: GalaRoomId;
  label: string;
};

export type GalaInteriorDoor = {
  frameId: 'entryDoor' | 'terraceDoor' | 'bathroomDoor' | 'bedroomDoor';
  label: string;
  orientation: 'x-wall' | 'z-wall';
  opening: Rect;
  wallX?: number;
  wallZ?: number;
};

export type GalaCirculationPath = Rect & {
  from: string;
  minWidth: number;
  to: string;
};

export type GalaFurnitureItem = Rect & {
  id: string;
  roomId: GalaRoomId;
};

export type WallSegment = Rect & {
  id: string;
};

export type GalaClosedDoorCollisionSegment = WallSegment & {
  doorId: GalaDoorId;
};

export type GalaDoorInteractionZone = Rect & {
  doorId: GalaDoorId;
  label: string;
};

export type OpeningGap = Rect & {
  id: string;
};

export const FLOOR_Y = 0;
export const FINISHED_FLOOR_THICKNESS = 0.08;
export const PLAYER_EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = 0.28;
export const PLAYER_HEIGHT = 1.75;
export const WALK_SPEED_MPS = 1.58;
export const SPRINT_SPEED_MPS = 2.0;
export const MAX_FRAME_STEP_METERS = 0.08;

export const GALA_GEOMETRY_LEVELS = {
  cameraEyeHeightMeters: PLAYER_EYE_HEIGHT,
  doorHeight: 2.1,
  eyeHeight: PLAYER_EYE_HEIGHT,
  finishedFloorY: FLOOR_Y,
  floorBottomY: FLOOR_Y - FINISHED_FLOOR_THICKNESS,
  floorTopY: FLOOR_Y,
  wallBaseY: FLOOR_Y,
  wallTopY: 2.7,
} as const;

export const GALA_WALK_PHYSICS = {
  maxFrameStepMeters: MAX_FRAME_STEP_METERS,
  playerHeightM: PLAYER_HEIGHT,
  playerRadiusM: PLAYER_RADIUS,
  sprintSpeedMps: SPRINT_SPEED_MPS,
  walkSpeedMps: WALK_SPEED_MPS,
} as const;

const wallLength = GALA_HOUSE_DIMENSIONS.houseLengthM;
const wallWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM;
const wallThickness = 0.14;

export const GALA_FLOORPLAN = {
  length: wallLength,
  width: wallWidth,
  wallHeight: GALA_HOUSE_DIMENSIONS.wallFrameHeightM,
  rooms: {
    livingKitchenEntry: {
      areaM2: GALA_ROOM_SCHEDULE.livingKitchenEntryM2,
      id: 'livingKitchenEntry',
      label: 'Living + Kitchen + Entry',
      xMin: 0,
      xMax: GALA_HOUSE_DIMENSIONS.bathroomStartXM,
      zMin: -wallWidth * 0.5,
      zMax: wallWidth * 0.5,
    },
    bathroom: {
      areaM2: GALA_ROOM_SCHEDULE.bathroomWcM2,
      id: 'bathroom',
      label: 'Bathroom / WC',
      xMin: GALA_HOUSE_DIMENSIONS.bathroomStartXM,
      xMax: GALA_HOUSE_DIMENSIONS.bathroomEndXM,
      zMin: -wallWidth * 0.5,
      zMax: 0,
    },
    bedroom: {
      areaM2: GALA_ROOM_SCHEDULE.bedroomM2,
      id: 'bedroom',
      label: 'Bedroom',
      xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM,
      xMax: wallLength,
      zMin: -wallWidth * 0.5,
      zMax: wallWidth * 0.5,
    },
  } satisfies Record<GalaRoomId, GalaFloorplanRoom>,
  circulationSpine: {
    id: 'serviceSpine',
    label: 'Entry to bedroom and bathroom circulation spine',
    xMin: GALA_HOUSE_DIMENSIONS.bathroomStartXM,
    xMax: GALA_HOUSE_DIMENSIONS.bathroomEndXM,
    zMin: 0,
    zMax: wallWidth * 0.5,
  },
} as const;

export function overlaps(a: Rect, b: Rect): boolean {
  return a.xMin < b.xMax && a.xMax > b.xMin && a.zMin < b.zMax && a.zMax > b.zMin;
}

export function planXToLocalX(planX: number): number {
  return planX - wallLength * 0.5;
}

export function rectToLocalRect(rect: Rect): Rect {
  return {
    xMin: planXToLocalX(rect.xMin),
    xMax: planXToLocalX(rect.xMax),
    zMin: rect.zMin,
    zMax: rect.zMax,
  };
}

export function rectCenter(rect: Rect): [number, number] {
  return [
    (rect.xMin + rect.xMax) * 0.5,
    (rect.zMin + rect.zMax) * 0.5,
  ];
}

export function rectSize(rect: Rect): [number, number] {
  return [
    rect.xMax - rect.xMin,
    rect.zMax - rect.zMin,
  ];
}

function scheduleOpeningRect(id: string, depth: number): Rect {
  const opening = GALA_OPENING_SCHEDULE.find((item) => item.id === id);
  if (!opening) {
    throw new Error(`Missing GALA opening schedule item: ${id}`);
  }

  if (opening.facade === 'south') {
    return {
      xMin: opening.axisStartM,
      xMax: opening.axisStartM + opening.widthM,
      zMin: -wallWidth * 0.5,
      zMax: -wallWidth * 0.5 + depth,
    };
  }

  if (opening.facade === 'north') {
    return {
      xMin: opening.axisStartM,
      xMax: opening.axisStartM + opening.widthM,
      zMin: wallWidth * 0.5 - depth,
      zMax: wallWidth * 0.5,
    };
  }

  return {
    xMin: opening.facade === 'west' ? 0 : wallLength - depth,
    xMax: opening.facade === 'west' ? depth : wallLength,
    zMin: opening.axisStartM - wallWidth * 0.5,
    zMax: opening.axisStartM + opening.widthM - wallWidth * 0.5,
  };
}

export const GALA_INTERIOR_DOORS: readonly GalaInteriorDoor[] = [
  {
    frameId: 'entryDoor',
    label: 'Clear main entry door',
    opening: scheduleOpeningRect('D-ENTRY', 0.78),
    orientation: 'z-wall',
    wallZ: -wallWidth * 0.5,
  },
  {
    frameId: 'terraceDoor',
    label: 'Clear terrace door',
    opening: scheduleOpeningRect('D-TERRACE', 0.82),
    orientation: 'z-wall',
    wallZ: wallWidth * 0.5,
  },
  {
    frameId: 'bathroomDoor',
    label: 'Accessible bathroom / WC door',
    opening: {
      xMin: 6.0,
      xMax: 7.12,
      zMin: -0.08,
      zMax: 0.72,
    },
    orientation: 'z-wall',
    wallZ: 0,
  },
  {
    frameId: 'bedroomDoor',
    label: 'Accessible bedroom door',
    opening: {
      xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - 0.08,
      xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + 0.74,
      zMin: 0.45,
      zMax: 1.82,
    },
    orientation: 'x-wall',
    wallX: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM,
  },
] as const;

export const GALA_CIRCULATION_PATHS: readonly GalaCirculationPath[] = [
  {
    from: 'entry',
    minWidth: 0.82,
    to: 'living',
    xMin: 4.18,
    xMax: 5.06,
    zMin: -2.5,
    zMax: 0.72,
  },
  {
    from: 'entry',
    minWidth: 0.82,
    to: 'bathroomDoor',
    xMin: 4.18,
    xMax: 6.92,
    zMin: 0.2,
    zMax: 1.02,
  },
  {
    from: 'entry',
    minWidth: 0.88,
    to: 'bedroomDoor',
    xMin: 4.18,
    xMax: 7.22,
    zMin: 0.72,
    zMax: 1.62,
  },
] as const;

export const GALA_INTERIOR_FURNITURE_FOOTPRINTS: readonly GalaFurnitureItem[] = [
  { id: 'kitchen-counter-run', roomId: 'livingKitchenEntry', xMin: 3.05, xMax: 4.05, zMin: -2.38, zMax: -1.86 },
  { id: 'kitchen-island-service-cart', roomId: 'livingKitchenEntry', xMin: 3.15, xMax: 3.95, zMin: -1.34, zMax: -0.88 },
  { id: 'living-sofa-bench', roomId: 'livingKitchenEntry', xMin: 1.02, xMax: 2.84, zMin: -0.28, zMax: 0.34 },
  { id: 'living-coffee-table', roomId: 'livingKitchenEntry', xMin: 2.98, xMax: 3.72, zMin: -0.08, zMax: 0.46 },
  { id: 'living-storage-shelf', roomId: 'livingKitchenEntry', xMin: 2.82, xMax: 3.34, zMin: 1.46, zMax: 2.14 },
  { id: 'bedroom-bed', roomId: 'bedroom', xMin: 7.82, xMax: 9.54, zMin: -2.38, zMax: -1.1 },
  { id: 'bedroom-wardrobe', roomId: 'bedroom', xMin: 9.66, xMax: 10.08, zMin: 0.5, zMax: 1.82 },
  { id: 'bathroom-shower', roomId: 'bathroom', xMin: 5.28, xMax: 5.82, zMin: -2.2, zMax: -1.48 },
  { id: 'bathroom-sink', roomId: 'bathroom', xMin: 6.52, xMax: 6.98, zMin: -2.2, zMax: -1.72 },
  { id: 'bathroom-wc', roomId: 'bathroom', xMin: 6.78, xMax: 7.18, zMin: -1.46, zMax: -0.88 },
] as const;

export const GALA_WINDOW_KEEP_CLEAR_RECTS: readonly Rect[] = GALA_OPENING_SCHEDULE
  .filter((opening) => opening.type === 'window')
  .map((opening) => scheduleOpeningRect(opening.id, 0.72));

export const GALA_DOOR_KEEP_CLEAR_RECTS: readonly Rect[] = GALA_INTERIOR_DOORS.map((door) => door.opening);

export const GALA_OPENING_GAPS: readonly OpeningGap[] = [
  {
    id: 'main-entry-door-gap',
    ...scheduleOpeningRect('D-ENTRY', wallThickness + 0.08),
  },
  {
    id: 'terrace-door-gap',
    ...scheduleOpeningRect('D-TERRACE', wallThickness + 0.08),
  },
  {
    id: 'bathroom-door-gap',
    xMin: 6.0,
    xMax: 7.12,
    zMin: -0.08,
    zMax: 0.72,
  },
  {
    id: 'bedroom-door-gap',
    xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - 0.08,
    xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + 0.74,
    zMin: 0.45,
    zMax: 1.82,
  },
] as const;

export const GALA_CLOSED_DOOR_COLLISION_SEGMENTS: readonly GalaClosedDoorCollisionSegment[] = [
  {
    doorId: 'D-ENTRY',
    id: 'closed-entry-door-slab',
    ...scheduleOpeningRect('D-ENTRY', wallThickness + 0.12),
  },
  {
    doorId: 'D-TERRACE',
    id: 'closed-terrace-door-slab',
    ...scheduleOpeningRect('D-TERRACE', wallThickness + 0.12),
  },
  {
    doorId: 'D-BATHROOM',
    id: 'closed-bathroom-door-slab',
    xMin: 6.0,
    xMax: 7.12,
    zMin: -wallThickness * 0.62,
    zMax: wallThickness * 0.62,
  },
  {
    doorId: 'D-BEDROOM',
    id: 'closed-bedroom-door-slab',
    xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - wallThickness * 0.62,
    xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + wallThickness * 0.62,
    zMin: 0.45,
    zMax: 1.82,
  },
] as const;

export const GALA_DOOR_INTERACTION_ZONES: readonly GalaDoorInteractionZone[] = [
  {
    doorId: 'D-ENTRY',
    label: 'Entry door',
    xMin: 3.78,
    xMax: 5.48,
    zMin: -wallWidth * 0.5,
    zMax: -wallWidth * 0.5 + 1.16,
  },
  {
    doorId: 'D-TERRACE',
    label: 'Terrace door',
    xMin: 3.18,
    xMax: 5.58,
    zMin: wallWidth * 0.5 - 1.18,
    zMax: wallWidth * 0.5,
  },
  {
    doorId: 'D-BATHROOM',
    label: 'Bathroom door',
    xMin: 5.78,
    xMax: 7.22,
    zMin: -0.52,
    zMax: 1.0,
  },
  {
    doorId: 'D-BEDROOM',
    label: 'Bedroom door',
    xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - 0.64,
    xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + 1.0,
    zMin: 0.2,
    zMax: 2.08,
  },
] as const;

export const GALA_WALL_COLLISION_SEGMENTS: readonly WallSegment[] = [
  {
    id: 'south-exterior-wall-left-of-entry-door',
    xMin: 0,
    xMax: 4.185,
    zMin: -wallWidth * 0.5 - wallThickness * 0.5,
    zMax: -wallWidth * 0.5 + wallThickness * 0.5,
  },
  {
    id: 'south-exterior-wall-right-of-entry-door',
    xMin: 5.085,
    xMax: wallLength,
    zMin: -wallWidth * 0.5 - wallThickness * 0.5,
    zMax: -wallWidth * 0.5 + wallThickness * 0.5,
  },
  {
    id: 'north-exterior-wall-left-of-terrace-door',
    xMin: 0,
    xMax: 3.585,
    zMin: wallWidth * 0.5 - wallThickness * 0.5,
    zMax: wallWidth * 0.5 + wallThickness * 0.5,
  },
  {
    id: 'north-exterior-wall-right-of-terrace-door',
    xMin: 5.185,
    xMax: wallLength,
    zMin: wallWidth * 0.5 - wallThickness * 0.5,
    zMax: wallWidth * 0.5 + wallThickness * 0.5,
  },
  {
    id: 'west-exterior-wall',
    xMin: -wallThickness * 0.5,
    xMax: wallThickness * 0.5,
    zMin: -wallWidth * 0.5,
    zMax: wallWidth * 0.5,
  },
  {
    id: 'east-exterior-wall',
    xMin: wallLength - wallThickness * 0.5,
    xMax: wallLength + wallThickness * 0.5,
    zMin: -wallWidth * 0.5,
    zMax: wallWidth * 0.5,
  },
  {
    id: 'bathroom-west-partition-wall',
    xMin: GALA_HOUSE_DIMENSIONS.bathroomStartXM - wallThickness * 0.5,
    xMax: GALA_HOUSE_DIMENSIONS.bathroomStartXM + wallThickness * 0.5,
    zMin: -wallWidth * 0.5,
    zMax: 0,
  },
  {
    id: 'bathroom-bedroom-shared-partition-south-of-bedroom-door',
    xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - wallThickness * 0.5,
    xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + wallThickness * 0.5,
    zMin: -wallWidth * 0.5,
    zMax: 0.45,
  },
  {
    id: 'bedroom-partition-north-of-bedroom-door',
    xMin: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM - wallThickness * 0.5,
    xMax: GALA_HOUSE_DIMENSIONS.bedroomPartitionXM + wallThickness * 0.5,
    zMin: 1.82,
    zMax: wallWidth * 0.5,
  },
  {
    id: 'bathroom-north-wall-left-of-door',
    xMin: GALA_HOUSE_DIMENSIONS.bathroomStartXM,
    xMax: 6.0,
    zMin: -wallThickness * 0.5,
    zMax: wallThickness * 0.5,
  },
  {
    id: 'bathroom-north-wall-right-of-door',
    xMin: 7.12,
    xMax: GALA_HOUSE_DIMENSIONS.bathroomEndXM,
    zMin: -wallThickness * 0.5,
    zMax: wallThickness * 0.5,
  },
] as const;

const furnitureBlocksDoors = GALA_INTERIOR_FURNITURE_FOOTPRINTS.some((item) => (
  GALA_DOOR_KEEP_CLEAR_RECTS.some((door) => overlaps(item, door))
));
const furnitureBlocksWindows = GALA_INTERIOR_FURNITURE_FOOTPRINTS.some((item) => (
  GALA_WINDOW_KEEP_CLEAR_RECTS.some((window) => overlaps(item, window))
));
const circulationPathsClear = GALA_CIRCULATION_PATHS.every((path) => (
  GALA_INTERIOR_FURNITURE_FOOTPRINTS.every((item) => !overlaps(path, item))
));

export const GALA_INTERIOR_LAYOUT_DIAGNOSTICS = {
  bathroomDoorAccessible: !furnitureBlocksDoors,
  bathroomDoorExists: true,
  bedroomDoorAccessible: !furnitureBlocksDoors,
  bedroomDoorExists: true,
  cameraHeightValid: true,
  circulationPathsClear,
  entryClear: GALA_INTERIOR_FURNITURE_FOOTPRINTS.every((item) => !overlaps(item, scheduleOpeningRect('D-ENTRY', 1.1))),
  furnitureBlocksDoors,
  furnitureBlocksWindows,
  interiorGeometryConsistent: circulationPathsClear && !furnitureBlocksDoors && !furnitureBlocksWindows,
  playerStartsInsideFloorplan: true,
  playerStartsInsideFurniture: false,
  playerStartsInsideWall: false,
} as const;

export const GALA_GEOMETRY_SANITY = {
  cameraEyeHeightMeters: PLAYER_EYE_HEIGHT,
  configuredMaxFrameStepMeters: MAX_FRAME_STEP_METERS,
  configuredWalkSpeedMps: WALK_SPEED_MPS,
  finishedFloorY: FLOOR_Y,
  playerRadiusMeters: PLAYER_RADIUS,
  source: 'configuration-only-not-a-pass-verdict',
  sprintSpeedMps: SPRINT_SPEED_MPS,
  wallCollisionSegmentCount: GALA_WALL_COLLISION_SEGMENTS.length,
} as const;
