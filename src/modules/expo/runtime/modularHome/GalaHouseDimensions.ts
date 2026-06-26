export const mm = (value: number): number => value / 1000;

export const GALA_HOUSE_DIMENSIONS = {
  assembledWallEnvelopeWidthM: mm(5000),
  bathroomEndXM: mm(7200),
  bathroomStartXM: mm(5150),
  bedroomPartitionXM: mm(7200),
  clearCeilingHeightM: mm(2627.5),
  eaveOverhangM: mm(250),
  facadeWidthM: mm(4920),
  gableOverhangM: mm(250),
  houseLengthM: mm(10200),
  moduleSplitWidthM: mm(2500),
  roofLengthM: mm(10700),
  roofPitchDeg: 30,
  roofRiseM: mm(1443.3756729740644),
  roofWidthM: mm(5500),
  terraceDepthM: mm(2100),
  terraceLengthM: mm(2400),
  wallFrameHeightM: mm(2700),
} as const;

export const GALA_ROOM_SCHEDULE = {
  bathroomWcM2: 3.89,
  bedroomM2: 10.37,
  livingKitchenEntryM2: 23.73,
  totalUsefulM2: 38.44,
} as const;

export type GalaFacade = 'south' | 'north' | 'west' | 'east';
export type GalaOpeningType = 'door' | 'terraceDoor' | 'window';

export type GalaOpeningScheduleItem = {
  axisStartM: number;
  facade: GalaFacade;
  heightM: number;
  id: string;
  sillM: number;
  type: GalaOpeningType;
  widthM: number;
};

export const GALA_OPENING_SCHEDULE: readonly GalaOpeningScheduleItem[] = [
  {
    axisStartM: mm(1185),
    facade: 'south',
    heightM: mm(1000),
    id: 'W-KITCHEN',
    sillM: mm(1085),
    type: 'window',
    widthM: mm(1800),
  },
  {
    axisStartM: mm(4185),
    facade: 'south',
    heightM: mm(2100),
    id: 'D-ENTRY',
    sillM: 0,
    type: 'door',
    widthM: mm(900),
  },
  {
    axisStartM: mm(5885),
    facade: 'south',
    heightM: mm(600),
    id: 'W-BATH',
    sillM: mm(1485),
    type: 'window',
    widthM: mm(600),
  },
  {
    axisStartM: mm(3585),
    facade: 'north',
    heightM: mm(2100),
    id: 'D-TERRACE',
    sillM: 0,
    type: 'terraceDoor',
    widthM: mm(1600),
  },
  {
    axisStartM: mm(7885),
    facade: 'north',
    heightM: mm(1200),
    id: 'W-BED',
    sillM: mm(885),
    type: 'window',
    widthM: mm(1400),
  },
  {
    axisStartM: mm(735),
    facade: 'west',
    heightM: mm(1500),
    id: 'W-WEST-A',
    sillM: mm(735),
    type: 'window',
    widthM: mm(1000),
  },
  {
    axisStartM: mm(3265),
    facade: 'west',
    heightM: mm(1500),
    id: 'W-WEST-B',
    sillM: mm(735),
    type: 'window',
    widthM: mm(1000),
  },
] as const;

export const GALA_PREVIEW_SCALE = 5.4;
export const GALA_PREVIEW_POSITION = {
  x: -0.38,
  y: 0,
  z: 8.93,
} as const;
