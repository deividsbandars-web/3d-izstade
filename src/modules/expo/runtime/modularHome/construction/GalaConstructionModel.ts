import {
  GALA_HOUSE_DIMENSIONS,
  GALA_OPENING_SCHEDULE,
  GALA_ROOM_SCHEDULE,
  type GalaFacade,
  type GalaOpeningScheduleItem,
} from '../GalaHouseDimensions';
import { GALA_INTERIOR_DOORS, planXToLocalX, type GalaFloorplanRoom } from '../GalaFloorplan';
import type { GalaDoorId } from '../GalaDoorState';
import { GALA_WALL_SKIN_DIMENSIONS } from './GalaWallSkinModel';

export type GalaConstructionWallKind = 'exterior' | 'partition';
export type GalaConstructionWallAxis = 'x' | 'z';
export type GalaConstructionOpeningKind = 'window' | 'door';

export type GalaConstructionOpening = {
  axisStartM: number;
  doorId?: GalaDoorId;
  heightM: number;
  id: string;
  kind: GalaConstructionOpeningKind;
  sillM: number;
  source: 'opening-schedule' | 'floorplan-interior-door';
  widthM: number;
};

export type GalaConstructionWallSegment = {
  axis: GalaConstructionWallAxis;
  axisEndM: number;
  axisStartM: number;
  facade?: GalaFacade;
  id: string;
  kind: GalaConstructionWallKind;
  normal: [number, number];
  openings: readonly GalaConstructionOpening[];
  roomSide?: 'interior' | 'both';
  xM?: number;
  zM?: number;
};

export type GalaFurnitureAnchorZone = {
  anchor: 'againstWall' | 'underWindow' | 'centeredOnRug' | 'besideBed' | 'bathroomWall' | 'oppositeBed';
  id: string;
  roomId: keyof typeof GALA_CONSTRUCTION_ROOMS;
  xM: number;
  zM: number;
};

export type GalaFurniturePlacement = {
  anchorId?: string;
  position: [number, number, number];
  size: [number, number, number];
};

export const GALA_CONSTRUCTION_LEVELS = {
  baseboardDepthM: 0.035,
  baseboardHeightM: 0.105,
  ceilingHeightM: GALA_HOUSE_DIMENSIONS.clearCeilingHeightM,
  crownDepthM: 0.038,
  crownHeightM: 0.08,
  exteriorWallThicknessM: 0.14,
  finishedFloorThicknessM: 0.08,
  finishedFloorTopY: 0,
  openingClearanceM: 0.095,
  revealDepthM: 0.19,
  thresholdHeightM: 0.035,
  wallHeightM: GALA_HOUSE_DIMENSIONS.wallFrameHeightM,
} as const;

export const GALA_CONSTRUCTION_ROOMS = {
  livingKitchenEntry: {
    areaM2: GALA_ROOM_SCHEDULE.livingKitchenEntryM2,
    id: 'livingKitchenEntry',
    label: 'Living + Kitchen + Entry',
    xMin: planXToLocalX(0),
    xMax: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomStartXM),
    zMin: -GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5,
    zMax: GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5,
  },
  bathroom: {
    areaM2: GALA_ROOM_SCHEDULE.bathroomWcM2,
    id: 'bathroom',
    label: 'Bathroom / WC',
    xMin: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomStartXM),
    xMax: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomEndXM),
    zMin: -GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5,
    zMax: 0,
  },
  bedroom: {
    areaM2: GALA_ROOM_SCHEDULE.bedroomM2,
    id: 'bedroom',
    label: 'Bedroom',
    xMin: planXToLocalX(GALA_HOUSE_DIMENSIONS.bedroomPartitionXM),
    xMax: planXToLocalX(GALA_HOUSE_DIMENSIONS.houseLengthM),
    zMin: -GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5,
    zMax: GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5,
  },
} as const satisfies Record<string, GalaFloorplanRoom>;

const halfLength = GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
const halfWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5;

function scheduledOpeningToConstruction(opening: GalaOpeningScheduleItem): GalaConstructionOpening {
  const doorId = opening.id === 'D-ENTRY'
    ? 'D-ENTRY'
    : opening.id === 'D-TERRACE'
      ? 'D-TERRACE'
      : undefined;

  return {
    axisStartM: opening.axisStartM - (
      opening.facade === 'south' || opening.facade === 'north'
        ? halfLength
        : halfWidth
    ),
    doorId,
    heightM: opening.heightM,
    id: opening.id,
    kind: opening.type === 'window' ? 'window' : 'door',
    sillM: opening.sillM,
    source: 'opening-schedule',
    widthM: opening.widthM,
  };
}

function facadeOpenings(facade: GalaFacade): GalaConstructionOpening[] {
  return GALA_OPENING_SCHEDULE
    .filter((opening) => opening.facade === facade)
    .map(scheduledOpeningToConstruction);
}

const bedroomDoor = GALA_INTERIOR_DOORS.find((door) => door.frameId === 'bedroomDoor');
const bathroomDoor = GALA_INTERIOR_DOORS.find((door) => door.frameId === 'bathroomDoor');

const interiorBedroomDoorOpening: GalaConstructionOpening = {
  axisStartM: bedroomDoor?.opening.zMin ?? 0.45,
  doorId: 'D-BEDROOM',
  heightM: 2.1,
  id: 'D-BEDROOM',
  kind: 'door',
  sillM: 0,
  source: 'floorplan-interior-door',
  widthM: (bedroomDoor?.opening.zMax ?? 1.82) - (bedroomDoor?.opening.zMin ?? 0.45),
};

const interiorBathroomDoorOpening: GalaConstructionOpening = {
  axisStartM: planXToLocalX(bathroomDoor?.opening.xMin ?? 6.0),
  doorId: 'D-BATHROOM',
  heightM: 2.1,
  id: 'D-BATHROOM',
  kind: 'door',
  sillM: 0,
  source: 'floorplan-interior-door',
  widthM: (bathroomDoor?.opening.xMax ?? 7.12) - (bathroomDoor?.opening.xMin ?? 6.0),
};

export const GALA_CONSTRUCTION_WALLS: readonly GalaConstructionWallSegment[] = [
  {
    axis: 'x',
    axisEndM: halfLength,
    axisStartM: -halfLength,
    facade: 'south',
    id: 'south-exterior-wall',
    kind: 'exterior',
    normal: [0, -1],
    openings: facadeOpenings('south'),
    roomSide: 'interior',
    zM: -halfWidth,
  },
  {
    axis: 'x',
    axisEndM: halfLength,
    axisStartM: -halfLength,
    facade: 'north',
    id: 'north-exterior-wall',
    kind: 'exterior',
    normal: [0, 1],
    openings: facadeOpenings('north'),
    roomSide: 'interior',
    zM: halfWidth,
  },
  {
    axis: 'z',
    axisEndM: halfWidth,
    axisStartM: -halfWidth,
    facade: 'west',
    id: 'west-exterior-wall',
    kind: 'exterior',
    normal: [-1, 0],
    openings: facadeOpenings('west'),
    roomSide: 'interior',
    xM: -halfLength,
  },
  {
    axis: 'z',
    axisEndM: halfWidth,
    axisStartM: -halfWidth,
    facade: 'east',
    id: 'east-exterior-wall',
    kind: 'exterior',
    normal: [1, 0],
    openings: [],
    roomSide: 'interior',
    xM: halfLength,
  },
  {
    axis: 'z',
    axisEndM: 0,
    axisStartM: -halfWidth,
    id: 'bathroom-west-partition-wall',
    kind: 'partition',
    normal: [-1, 0],
    openings: [],
    roomSide: 'both',
    xM: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomStartXM),
  },
  {
    axis: 'z',
    axisEndM: halfWidth,
    axisStartM: -halfWidth,
    id: 'bedroom-bathroom-shared-partition-wall',
    kind: 'partition',
    normal: [-1, 0],
    openings: [interiorBedroomDoorOpening],
    roomSide: 'both',
    xM: planXToLocalX(GALA_HOUSE_DIMENSIONS.bedroomPartitionXM),
  },
  {
    axis: 'x',
    axisEndM: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomEndXM),
    axisStartM: planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomStartXM),
    id: 'bathroom-north-partition-wall',
    kind: 'partition',
    normal: [0, 1],
    openings: [interiorBathroomDoorOpening],
    roomSide: 'both',
    zM: 0,
  },
] as const;

export const GALA_FURNITURE_ANCHORS: readonly GalaFurnitureAnchorZone[] = [
  { anchor: 'againstWall', id: 'bed-headboard-south-wall', roomId: 'bedroom', xM: planXToLocalX(8.66), zM: -2.2 },
  { anchor: 'besideBed', id: 'bedside-cabinet-headboard-side', roomId: 'bedroom', xM: planXToLocalX(7.78), zM: -1.88 },
  { anchor: 'againstWall', id: 'wardrobe-east-wall', roomId: 'bedroom', xM: planXToLocalX(9.8), zM: 1.14 },
  { anchor: 'oppositeBed', id: 'bedroom-tv-north-wall', roomId: 'bedroom', xM: planXToLocalX(8.72), zM: 2.36 },
  { anchor: 'bathroomWall', id: 'wc-east-wall', roomId: 'bathroom', xM: planXToLocalX(6.78), zM: -1.18 },
  { anchor: 'bathroomWall', id: 'vanity-south-wall', roomId: 'bathroom', xM: planXToLocalX(6.55), zM: -2.18 },
  { anchor: 'bathroomWall', id: 'shower-south-west-wall', roomId: 'bathroom', xM: planXToLocalX(5.58), zM: -2.33 },
] as const;

export const GALA_FURNITURE_LAYOUT = {
  livingRug: { anchorId: 'living-rug', position: [-2.75, 0.018, 0.22], size: [1.82, 0.018, 1.04] },
  livingSofaSeat: { anchorId: 'living-sofa-south-zone', position: [-3.35, 0.42, 0.22], size: [1.48, 0.28, 0.64] },
  livingSofaBack: { anchorId: 'living-sofa-south-zone', position: [-3.35, 0.78, 0.57], size: [1.54, 0.74, 0.16] },
  livingSofaLeftArm: { anchorId: 'living-sofa-south-zone', position: [-4.16, 0.62, 0.22], size: [0.16, 0.5, 0.7] },
  livingSofaRightArm: { anchorId: 'living-sofa-south-zone', position: [-2.54, 0.62, 0.22], size: [0.16, 0.5, 0.7] },
  livingSofaLeftThrowPillow: { anchorId: 'living-sofa-south-zone', position: [-3.74, 0.72, 0.46], size: [0.34, 0.22, 0.11] },
  livingSofaRightThrowPillow: { anchorId: 'living-sofa-south-zone', position: [-3.0, 0.72, 0.46], size: [0.34, 0.22, 0.11] },
  livingCoffeeTableTop: { anchorId: 'living-coffee-table', position: [-2.05, 0.43, 0.08], size: [0.78, 0.08, 0.48] },

  kitchenBaseCabinets: { anchorId: 'kitchen-south-wall', position: [-1.55, 0.46, -2.18], size: [1.55, 0.82, 0.36] },
  kitchenCountertop: { anchorId: 'kitchen-south-wall', position: [-1.55, 0.91, -2.18], size: [1.62, 0.08, 0.4] },
  kitchenSinkCue: { anchorId: 'kitchen-south-wall', position: [-1.94, 0.975, -2.08], size: [0.34, 0.035, 0.18] },
  kitchenCooktopCue: { anchorId: 'kitchen-south-wall', position: [-1.18, 0.975, -2.08], size: [0.3, 0.025, 0.18] },
  kitchenBacksplash: { anchorId: 'kitchen-south-wall', position: [-1.55, 1.25, -2.405], size: [1.62, 0.46, 0.03] },
  kitchenUpperCabinet: { anchorId: 'kitchen-south-wall', position: [-1.55, 1.78, -2.18], size: [1.34, 0.38, 0.18] },
  kitchenUpperCabinetHandle: { anchorId: 'kitchen-south-wall', position: [-1.55, 1.64, -2.075], size: [1.1, 0.026, 0.026] },

  bedroomBedFrame: { anchorId: 'bed-headboard-south-wall', position: [3.55, 0.16, -1.78], size: [1.72, 0.22, 1.18] },
  bedroomMattress: { anchorId: 'bed-headboard-south-wall', position: [3.55, 0.39, -1.78], size: [1.62, 0.22, 1.08] },
  bedroomBlanket: { anchorId: 'bed-headboard-south-wall', position: [3.55, 0.57, -1.46], size: [1.18, 0.09, 0.52] },
  bedroomLeftPillow: { anchorId: 'bed-headboard-south-wall', position: [3.25, 0.69, -2.1], size: [0.42, 0.16, 0.22] },
  bedroomRightPillow: { anchorId: 'bed-headboard-south-wall', position: [3.85, 0.69, -2.1], size: [0.42, 0.16, 0.22] },
  bedroomHeadboard: { anchorId: 'bed-headboard-south-wall', position: [3.55, 0.67, -2.385], size: [1.82, 0.72, 0.07] },
  bedroomBedsideCabinet: { anchorId: 'bedside-cabinet-headboard-side', position: [2.72, 0.34, -1.88], size: [0.44, 0.42, 0.3] },
  bedroomWardrobe: { anchorId: 'wardrobe-east-wall', position: [4.73, 0.98, 1.16], size: [0.32, 1.72, 1.22] },
  bedroomWardrobeDoorSplit: { anchorId: 'wardrobe-east-wall', position: [4.552, 1.02, 1.16], size: [0.026, 1.36, 0.018] },
  bedroomWardrobeHandleLower: { anchorId: 'wardrobe-east-wall', position: [4.534, 1.02, 0.96], size: [0.026, 0.54, 0.035] },
  bedroomWardrobeHandleUpper: { anchorId: 'wardrobe-east-wall', position: [4.534, 1.02, 1.36], size: [0.026, 0.54, 0.035] },
  bedroomTv: { anchorId: 'bedroom-tv-north-wall', position: [3.58, 1.26, 2.395], size: [1.02, 0.58, 0.035] },

  bathroomShowerBackPanel: { anchorId: 'shower-south-west-wall', position: [0.46, 0.92, -2.405], size: [0.78, 1.72, 0.03] },
  bathroomShowerSidePanel: { anchorId: 'shower-south-west-wall', position: [0.82, 0.82, -1.58], size: [0.045, 1.42, 0.72] },
  bathroomShowerRiser: { anchorId: 'shower-south-west-wall', position: [0.18, 1.26, -2.34], size: [0.028, 1.02, 0.028] },
  bathroomShowerHead: { anchorId: 'shower-south-west-wall', position: [0.28, 1.78, -2.32], size: [0.15, 0.05, 0.15] },
  bathroomVanity: { anchorId: 'vanity-south-wall', position: [1.48, 0.46, -2.18], size: [0.54, 0.72, 0.34] },
  bathroomSink: { anchorId: 'vanity-south-wall', position: [1.48, 0.86, -2.08], size: [0.42, 0.09, 0.26] },
  bathroomVanityDrawerFront: { anchorId: 'vanity-south-wall', position: [1.48, 0.5, -2.0], size: [0.42, 0.28, 0.026] },
  bathroomVanityDrawerHandle: { anchorId: 'vanity-south-wall', position: [1.48, 0.54, -1.98], size: [0.18, 0.024, 0.02] },
  bathroomSinkFaucet: { anchorId: 'vanity-south-wall', position: [1.48, 1.01, -2.16], size: [0.06, 0.18, 0.052] },
  bathroomMirror: { anchorId: 'vanity-south-wall', position: [1.48, 1.42, -2.405], size: [0.48, 0.58, 0.026] },
  bathroomWcBowl: { anchorId: 'wc-east-wall', position: [1.78, 0.33, -1.18], size: [0.34, 0.24, 0.4] },
  bathroomWcRoundedBowl: { anchorId: 'wc-east-wall', position: [1.78, 0.47, -1.18], size: [0.4, 0.16, 0.5] },
  bathroomWcDarkBowlInset: { anchorId: 'wc-east-wall', position: [1.78, 0.562, -1.18], size: [0.22, 0.024, 0.28] },
  bathroomWcSeat: { anchorId: 'wc-east-wall', position: [1.78, 0.46, -1.18], size: [0.25, 0.035, 0.25] },
  bathroomWcCistern: { anchorId: 'wc-east-wall', position: [1.955, 0.76, -1.18], size: [0.09, 0.5, 0.48] },
  bathroomWcFlushButton: { anchorId: 'wc-east-wall', position: [1.9, 0.92, -1.18], size: [0.026, 0.028, 0.12] },
} satisfies Record<string, GalaFurniturePlacement>;

export const GALA_CONSTRUCTION_MODEL_OWNERSHIP = {
  role: 'adapter',
  singleSourceRendererProven: false,
  reason: 'The construction model normalizes dimensions, wall segments, openings, rooms, and furniture placements for the construction renderer, but physics/collision, DOM overlays, and route state remain documented owners outside this model.',
} as const;

export const GALA_CONSTRUCTION_MODEL = {
  cladding: {
    boardDepthM: GALA_WALL_SKIN_DIMENSIONS.exterior.boardDepthM,
    boardGapM: GALA_WALL_SKIN_DIMENSIONS.exterior.gapWidthM,
    boardPanelWidthM: GALA_WALL_SKIN_DIMENSIONS.exterior.boardWidthM,
    boardToGapMinRatio: GALA_WALL_SKIN_DIMENSIONS.exterior.boardToGapMinRatio,
    exteriorFinish: 'vertical timber board panels with narrow recessed shadow gaps',
    gapMaxM: GALA_WALL_SKIN_DIMENSIONS.exterior.gapMaxM,
    gapTargetM: [GALA_WALL_SKIN_DIMENSIONS.exterior.gapTargetMinM, GALA_WALL_SKIN_DIMENSIONS.exterior.gapTargetMaxM],
    openingClearanceM: GALA_CONSTRUCTION_LEVELS.openingClearanceM,
  },
  dimensions: GALA_HOUSE_DIMENSIONS,
  floor: {
    finishedFloorTopY: GALA_CONSTRUCTION_LEVELS.finishedFloorTopY,
    thicknessM: GALA_CONSTRUCTION_LEVELS.finishedFloorThicknessM,
  },
  furnitureAnchors: GALA_FURNITURE_ANCHORS,
  furnitureLayout: GALA_FURNITURE_LAYOUT,
  ownership: GALA_CONSTRUCTION_MODEL_OWNERSHIP,
  openings: GALA_CONSTRUCTION_WALLS.flatMap((wall) => wall.openings.map((opening) => ({
    ...opening,
    wallId: wall.id,
  }))),
  rooms: GALA_CONSTRUCTION_ROOMS,
  trim: {
    baseboardDepthM: GALA_CONSTRUCTION_LEVELS.baseboardDepthM,
    baseboardHeightM: GALA_CONSTRUCTION_LEVELS.baseboardHeightM,
    crownDepthM: GALA_CONSTRUCTION_LEVELS.crownDepthM,
    crownHeightM: GALA_CONSTRUCTION_LEVELS.crownHeightM,
  },
  wallThicknessM: GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM,
  walls: GALA_CONSTRUCTION_WALLS,
} as const;

export function constructionAxisCenter(startM: number, widthM: number): number {
  return startM + widthM * 0.5;
}

export function constructionAxisEnd(opening: GalaConstructionOpening): number {
  return opening.axisStartM + opening.widthM;
}
