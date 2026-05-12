import type { ExpoBoothPlacement } from '../../layout-engine';

export type CampusPlane = {
  id: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
};

export type CampusPavilion = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  accentSide: number;
};

export type CampusTower = {
  id: string;
  position: [number, number, number];
};

export type CampusConnector = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  accent: 'wall' | 'cap' | 'rail' | 'post' | 'gate';
};

const HIDDEN_REAR_CAMPUS_FORECOURT_IDS = new Set([
  'stadium-forecourt-left-main',
  'stadium-forecourt-left-inner',
  'stadium-forecourt-right-main',
  'stadium-forecourt-right-inner',
  'stadium-forecourt-center-main',
  'stadium-forecourt-center-inner',
  'stadium-forecourt-axis',
  'stadium-forecourt-pocket-left',
  'stadium-forecourt-pocket-right',
  'stadium-forecourt-ribbon-left',
  'stadium-forecourt-ribbon-right',
  'stadium-forecourt-endcap',
  'stadium-forecourt-axis-pad-left',
  'stadium-forecourt-axis-pad-right',
  'stadium-forecourt-rear-band',
  'stadium-forecourt-gallery-left',
  'stadium-forecourt-gallery-right',
  'stadium-forecourt-terminal-left',
  'stadium-forecourt-terminal-right',
  'stadium-forecourt-center-carpet',
  'stadium-forecourt-threshold-left',
  'stadium-forecourt-threshold-right',
  'stadium-forecourt-outer-pocket-left',
  'stadium-forecourt-outer-pocket-right',
  'stadium-forecourt-front-court-left',
  'stadium-forecourt-front-court-right',
  'stadium-forecourt-front-threshold-left',
  'stadium-forecourt-front-threshold-right',
  'stadium-forecourt-city-threshold-spine',
  'stadium-forecourt-city-threshold-left-stripe',
  'stadium-forecourt-city-threshold-right-stripe',
]);

const REVEALED_REAR_CAMPUS_FORECOURT_IDS = new Set<string>();

const HIDDEN_REAR_CAMPUS_PAVILION_IDS = new Set([
  'rear-campus-side-pavilion-left-rear',
  'rear-campus-side-pavilion-right-rear',
  'rear-campus-axis-gallery-left',
  'rear-campus-axis-gallery-right',
  'rear-campus-axis-front-left',
  'rear-campus-axis-front-right',
  'rear-campus-axis-kiosk-left',
  'rear-campus-axis-kiosk-right',
  'rear-campus-terminal-left',
  'rear-campus-terminal-right',
]);

const HIDDEN_REAR_CAMPUS_TOWER_IDS = new Set([
  'rear-campus-landmark-center-left',
  'rear-campus-landmark-center-right',
]);

export const DEFAULT_REAR_CAMPUS_CENTER_Z = -2880;
const REAR_CAMPUS_FRONT_ANCHOR_MAX_OFFSET_Z = 1540;

export function resolveRearCampusAnchoredZ(campusCenterZ: number, defaultZ: number) {
  const defaultOffsetZ = defaultZ - DEFAULT_REAR_CAMPUS_CENTER_Z;
  return campusCenterZ + Math.min(defaultOffsetZ, REAR_CAMPUS_FRONT_ANCHOR_MAX_OFFSET_Z);
}

export function buildRearCampusMetrics(boothPlacements: ExpoBoothPlacement[]) {
  const footprintMinZ = boothPlacements.reduce<number>((acc, placement) => {
    const minZ = placement.layoutFootprint?.minZ;
    return typeof minZ === 'number' ? Math.min(acc, minZ) : acc;
  }, Number.POSITIVE_INFINITY);

  const placementMinZ = boothPlacements.reduce<number>((acc, placement) => (
    Array.isArray(placement.position) ? Math.min(acc, placement.position[2] ?? acc) : acc
  ), Number.POSITIVE_INFINITY);

  const minZ = Number.isFinite(footprintMinZ)
    ? footprintMinZ
    : Number.isFinite(placementMinZ)
      ? placementMinZ
      : -1400;
  const routeEndZ = minZ - 720;
  const campusCenterZ = boothPlacements.length > 0 ? minZ - 1480 : DEFAULT_REAR_CAMPUS_CENTER_Z;
  const stadiumBackWallZ = campusCenterZ - 1520;

  return {
    campusCenterZ,
    minZ,
    routeEndZ,
    stadiumBackWallZ,
  };
}

export function buildRearCampusPerimeterConnectors(campusCenterZ: number): CampusConnector[] {
  const outerHalfWidth = 3060;
  const frontOuterZ = campusCenterZ + 2140;
  const rearOuterZ = campusCenterZ - 2140;
  const wallThickness = 20;
  const wallHeight = 32;
  const cornerCapFootprint = 46;
  const cornerCapHeight = 84;
  const railHeight = 10;
  const railY = wallHeight + (railHeight * 0.5);
  const railThickness = 14;
  const postFootprint = 42;
  const postHeight = 72;
  const postY = postHeight * 0.5;
  const gatePylonFootprint = 58;
  const gatePylonHeight = 96;
  const gatePylonY = gatePylonHeight * 0.5;
  const innerHalfWidth = outerHalfWidth - wallThickness;
  const wallCenterX = outerHalfWidth - (wallThickness * 0.5);
  const rearWallCenterZ = rearOuterZ + (wallThickness * 0.5);
  const frontWallCenterZ = frontOuterZ - (wallThickness * 0.5);
  const sideWallStartZ = rearOuterZ + wallThickness;
  const sideWallEndZ = frontOuterZ - wallThickness;
  const sideWallDepth = sideWallEndZ - sideWallStartZ;
  const sideWallCenterZ = (sideWallStartZ + sideWallEndZ) * 0.5;
  const frontConnectorInnerX = 1720;
  const frontConnectorOuterX = wallCenterX - (cornerCapFootprint * 0.5);
  const frontConnectorWidth = frontConnectorOuterX - frontConnectorInnerX;
  const frontConnectorCenterX = frontConnectorInnerX + (frontConnectorWidth * 0.5);
  const rearPostZ = rearWallCenterZ;
  const frontPostZ = frontWallCenterZ;
  const sidePostAbsX = wallCenterX;
  const rearPostXs = [-2280, -1520, -760, 0, 760, 1520, 2280];
  const sidePostZs = [
    rearOuterZ + 760,
    rearOuterZ + 1520,
    campusCenterZ,
    frontOuterZ - 1520,
    frontOuterZ - 760,
  ];
  const gatePylonAbsX = frontConnectorInnerX + (gatePylonFootprint * 0.5) + 46;

  return [
    {
      id: 'rear-campus-perimeter-rear-wall',
      position: [0, wallHeight * 0.5, rearWallCenterZ],
      size: [innerHalfWidth * 2, wallHeight, wallThickness],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-left-rear-corner',
      position: [-wallCenterX, cornerCapHeight * 0.5, rearWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
      accent: 'cap',
    },
    {
      id: 'rear-campus-perimeter-right-rear-corner',
      position: [wallCenterX, cornerCapHeight * 0.5, rearWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
      accent: 'cap',
    },
    {
      id: 'rear-campus-perimeter-left-wall',
      position: [-wallCenterX, wallHeight * 0.5, sideWallCenterZ],
      size: [wallThickness, wallHeight, sideWallDepth],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-right-wall',
      position: [wallCenterX, wallHeight * 0.5, sideWallCenterZ],
      size: [wallThickness, wallHeight, sideWallDepth],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-left-front-corner',
      position: [-wallCenterX, cornerCapHeight * 0.5, frontWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
      accent: 'cap',
    },
    {
      id: 'rear-campus-perimeter-right-front-corner',
      position: [wallCenterX, cornerCapHeight * 0.5, frontWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
      accent: 'cap',
    },
    {
      id: 'rear-campus-front-left-connector',
      position: [-frontConnectorCenterX, wallHeight * 0.5, frontWallCenterZ],
      size: [frontConnectorWidth, wallHeight, wallThickness],
      accent: 'wall',
    },
    {
      id: 'rear-campus-front-right-connector',
      position: [frontConnectorCenterX, wallHeight * 0.5, frontWallCenterZ],
      size: [frontConnectorWidth, wallHeight, wallThickness],
      accent: 'wall',
    },
    {
      id: 'rear-campus-approach-guide-left',
      position: [-286, 9, campusCenterZ + 1376],
      size: [24, 18, 520],
      accent: 'wall',
    },
    {
      id: 'rear-campus-approach-guide-right',
      position: [286, 9, campusCenterZ + 1376],
      size: [24, 18, 520],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-rear-wall-rail',
      position: [0, railY, rearWallCenterZ],
      size: [innerHalfWidth * 2, railHeight, railThickness],
      accent: 'rail',
    },
    {
      id: 'rear-campus-perimeter-left-wall-rail',
      position: [-wallCenterX, railY, sideWallCenterZ],
      size: [railThickness, railHeight, sideWallDepth],
      accent: 'rail',
    },
    {
      id: 'rear-campus-perimeter-right-wall-rail',
      position: [wallCenterX, railY, sideWallCenterZ],
      size: [railThickness, railHeight, sideWallDepth],
      accent: 'rail',
    },
    {
      id: 'rear-campus-front-left-connector-rail',
      position: [-frontConnectorCenterX, railY, frontWallCenterZ],
      size: [frontConnectorWidth, railHeight, railThickness],
      accent: 'rail',
    },
    {
      id: 'rear-campus-front-right-connector-rail',
      position: [frontConnectorCenterX, railY, frontWallCenterZ],
      size: [frontConnectorWidth, railHeight, railThickness],
      accent: 'rail',
    },
    ...rearPostXs.map((x, index): CampusConnector => ({
      id: `rear-campus-perimeter-rear-post-${index}`,
      position: [x, postY, rearPostZ],
      size: [postFootprint, postHeight, postFootprint],
      accent: 'post',
    })),
    ...sidePostZs.flatMap((z, index): CampusConnector[] => ([
      {
        id: `rear-campus-perimeter-left-post-${index}`,
        position: [-sidePostAbsX, postY, z],
        size: [postFootprint, postHeight, postFootprint],
        accent: 'post',
      },
      {
        id: `rear-campus-perimeter-right-post-${index}`,
        position: [sidePostAbsX, postY, z],
        size: [postFootprint, postHeight, postFootprint],
        accent: 'post',
      },
    ])),
    {
      id: 'rear-campus-front-left-gate-pylon',
      position: [-gatePylonAbsX, gatePylonY, frontPostZ],
      size: [gatePylonFootprint, gatePylonHeight, gatePylonFootprint],
      accent: 'gate',
    },
    {
      id: 'rear-campus-front-right-gate-pylon',
      position: [gatePylonAbsX, gatePylonY, frontPostZ],
      size: [gatePylonFootprint, gatePylonHeight, gatePylonFootprint],
      accent: 'gate',
    },
  ];
}

export function buildRearCampusForecourts(campusCenterZ: number): CampusPlane[] {
  return [
    { id: 'stadium-forecourt-left-main', position: [-940, 5.98, campusCenterZ + 520], size: [720, 1040], color: '#eef4f8' },
    { id: 'stadium-forecourt-left-inner', position: [-560, 6.02, campusCenterZ + 140], size: [280, 440], color: '#dfe8ee' },
    { id: 'stadium-forecourt-right-main', position: [940, 5.98, campusCenterZ + 520], size: [720, 1040], color: '#eef4f8' },
    { id: 'stadium-forecourt-right-inner', position: [560, 6.02, campusCenterZ + 120], size: [280, 440], color: '#dfe8ee' },
    { id: 'stadium-forecourt-center-main', position: [0, 6.02, campusCenterZ + 760], size: [1080, 840], color: '#f5fafc' },
    { id: 'stadium-forecourt-center-inner', position: [0, 6.06, campusCenterZ + 948], size: [456, 248], color: '#e1ebf1' },
    { id: 'stadium-forecourt-axis', position: [0, 6.08, campusCenterZ + 1188], size: [256, 304], color: '#edf4f8' },
    { id: 'stadium-forecourt-pocket-left', position: [-404, 6.04, campusCenterZ + 916], size: [132, 132], color: '#dce7ee' },
    { id: 'stadium-forecourt-pocket-right', position: [404, 6.04, campusCenterZ + 908], size: [132, 132], color: '#dce7ee' },
    { id: 'stadium-forecourt-ribbon-left', position: [-224, 6.1, campusCenterZ + 1120], size: [48, 280], color: '#e8eff4' },
    { id: 'stadium-forecourt-ribbon-right', position: [224, 6.1, campusCenterZ + 1110], size: [48, 280], color: '#e8eff4' },
    { id: 'stadium-forecourt-endcap', position: [0, 6.12, campusCenterZ + 1440], size: [184, 88], color: '#eef4f8' },
    { id: 'stadium-forecourt-axis-pad-left', position: [-286, 6.06, campusCenterZ + 1204], size: [92, 64], color: '#e3ebf1' },
    { id: 'stadium-forecourt-axis-pad-right', position: [286, 6.06, campusCenterZ + 1196], size: [92, 64], color: '#e3ebf1' },
    { id: 'stadium-forecourt-rear-band', position: [0, 6.08, campusCenterZ + 600], size: [868, 96], color: '#ebf2f6' },
    { id: 'stadium-forecourt-gallery-left', position: [-486, 6.04, campusCenterZ + 1010], size: [168, 92], color: '#e6edf2' },
    { id: 'stadium-forecourt-gallery-right', position: [486, 6.04, campusCenterZ + 1000], size: [168, 92], color: '#e6edf2' },
    { id: 'stadium-forecourt-terminal-left', position: [-184, 6.08, campusCenterZ + 1530], size: [88, 64], color: '#e7eef3' },
    { id: 'stadium-forecourt-terminal-right', position: [184, 6.08, campusCenterZ + 1520], size: [88, 64], color: '#e7eef3' },
    { id: 'stadium-forecourt-center-carpet', position: [0, 6.1, campusCenterZ + 1326], size: [126, 32], color: '#f4f8fb' },
    { id: 'stadium-forecourt-threshold-left', position: [-142, 6.08, campusCenterZ + 1134], size: [32, 16], color: '#edf4f8' },
    { id: 'stadium-forecourt-threshold-right', position: [142, 6.08, campusCenterZ + 1126], size: [32, 16], color: '#edf4f8' },
    { id: 'stadium-forecourt-outer-pocket-left', position: [-642, 6.02, campusCenterZ + 1216], size: [136, 116], color: '#e4ecf1' },
    { id: 'stadium-forecourt-outer-pocket-right', position: [642, 6.02, campusCenterZ + 1208], size: [136, 116], color: '#e4ecf1' },
    { id: 'stadium-forecourt-front-court-left', position: [-348, 6.06, campusCenterZ + 1288], size: [56, 34], color: '#edf4f8' },
    { id: 'stadium-forecourt-front-court-right', position: [348, 6.06, campusCenterZ + 1278], size: [56, 34], color: '#edf4f8' },
    { id: 'stadium-forecourt-front-threshold-left', position: [-132, 6.08, campusCenterZ + 1292], size: [20, 12], color: '#f1f6f9' },
    { id: 'stadium-forecourt-front-threshold-right', position: [132, 6.08, campusCenterZ + 1284], size: [20, 12], color: '#f1f6f9' },
    { id: 'stadium-forecourt-city-threshold-main', position: [0, 6.16, campusCenterZ + 2058], size: [1180, 108], color: '#d8e2e8' },
    { id: 'stadium-forecourt-city-threshold-spine', position: [0, 6.2, campusCenterZ + 2058], size: [220, 132], color: '#f2f7fa' },
    { id: 'stadium-forecourt-city-threshold-left-stripe', position: [-372, 6.22, campusCenterZ + 2058], size: [76, 124], color: '#b8c7d1' },
    { id: 'stadium-forecourt-city-threshold-right-stripe', position: [372, 6.22, campusCenterZ + 2058], size: [76, 124], color: '#b8c7d1' },
  ];
}

export function buildVisibleRearCampusForecourts(campusCenterZ: number): CampusPlane[] {
  return buildRearCampusForecourts(campusCenterZ).filter((plane) => (
    REVEALED_REAR_CAMPUS_FORECOURT_IDS.has(plane.id)
    || !HIDDEN_REAR_CAMPUS_FORECOURT_IDS.has(plane.id)
  ));
}

export function buildRearCampusSidePavilions(campusCenterZ: number): CampusPavilion[] {
  return [
    { id: 'rear-campus-side-pavilion-left-front', position: [-1420, 0, campusCenterZ + 1040], size: [176, 132, 148], accentSide: 1 },
    { id: 'rear-campus-side-pavilion-left-rear', position: [-1220, 0, campusCenterZ - 1100], size: [232, 164, 188], accentSide: 1 },
    { id: 'rear-campus-side-pavilion-right-front', position: [1420, 0, campusCenterZ + 1040], size: [176, 132, 148], accentSide: -1 },
    { id: 'rear-campus-side-pavilion-right-rear', position: [1220, 0, campusCenterZ - 1100], size: [232, 164, 188], accentSide: -1 },
    { id: 'rear-campus-event-pavilion-left', position: [-720, 0, campusCenterZ + 1220], size: [188, 102, 132], accentSide: 1 },
    { id: 'rear-campus-event-pavilion-right', position: [720, 0, campusCenterZ + 1220], size: [188, 102, 132], accentSide: -1 },
    { id: 'rear-campus-axis-kiosk-left', position: [-318, 0, campusCenterZ + 1390], size: [92, 54, 62], accentSide: 1 },
    { id: 'rear-campus-axis-kiosk-right', position: [318, 0, campusCenterZ + 1390], size: [92, 54, 62], accentSide: -1 },
    { id: 'rear-campus-axis-gallery-left', position: [-412, 0, campusCenterZ + 1080], size: [124, 74, 86], accentSide: 1 },
    { id: 'rear-campus-axis-gallery-right', position: [412, 0, campusCenterZ + 1080], size: [124, 74, 86], accentSide: -1 },
    { id: 'rear-campus-terminal-left', position: [-276, 0, campusCenterZ + 1540], size: [94, 58, 66], accentSide: 1 },
    { id: 'rear-campus-terminal-right', position: [276, 0, campusCenterZ + 1532], size: [94, 58, 66], accentSide: -1 },
    { id: 'rear-campus-axis-front-left', position: [-182, 0, campusCenterZ + 1262], size: [72, 46, 48], accentSide: 1 },
    { id: 'rear-campus-axis-front-right', position: [182, 0, campusCenterZ + 1254], size: [72, 46, 48], accentSide: -1 },
  ];
}

export function buildVisibleRearCampusSidePavilions(campusCenterZ: number): CampusPavilion[] {
  return buildRearCampusSidePavilions(campusCenterZ).filter((pavilion) => !HIDDEN_REAR_CAMPUS_PAVILION_IDS.has(pavilion.id));
}

export function buildRearCampusLandmarkTowers(campusCenterZ: number): CampusTower[] {
  return [
    { id: 'rear-campus-landmark-left', position: [-920, 0, campusCenterZ + 260] },
    { id: 'rear-campus-landmark-right', position: [920, 0, campusCenterZ + 260] },
    { id: 'rear-campus-landmark-center-left', position: [-420, 0, campusCenterZ + 520] },
    { id: 'rear-campus-landmark-center-right', position: [420, 0, campusCenterZ + 500] },
  ];
}

export function buildVisibleRearCampusLandmarkTowers(campusCenterZ: number): CampusTower[] {
  return buildRearCampusLandmarkTowers(campusCenterZ).filter((tower) => !HIDDEN_REAR_CAMPUS_TOWER_IDS.has(tower.id));
}
