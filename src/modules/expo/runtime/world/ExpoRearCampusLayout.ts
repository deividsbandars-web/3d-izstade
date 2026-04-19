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
  accent: 'wall' | 'cap';
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
]);

const HIDDEN_REAR_CAMPUS_PAVILION_IDS = new Set([
  'rear-campus-side-pavilion-left-front',
  'rear-campus-side-pavilion-left-rear',
  'rear-campus-event-pavilion-left',
  'rear-campus-axis-gallery-left',
  'rear-campus-axis-front-left',
  'rear-campus-event-pavilion-right',
  'rear-campus-axis-gallery-right',
  'rear-campus-side-pavilion-right-front',
  'rear-campus-side-pavilion-right-rear',
  'rear-campus-axis-front-right',
]);

const HIDDEN_REAR_CAMPUS_TOWER_IDS = new Set([
  'rear-campus-landmark-left',
  'rear-campus-landmark-right',
  'rear-campus-landmark-center-left',
  'rear-campus-landmark-center-right',
]);

export function buildRearCampusMetrics(boothPlacements: ExpoBoothPlacement[]) {
  const footprint = boothPlacements[0]?.layoutFootprint;
  const minZ = footprint?.minZ ?? -1400;
  const routeEndZ = minZ - 720;
  const campusCenterZ = minZ - 1480;
  const stadiumBackWallZ = campusCenterZ - 1520;

  return {
    campusCenterZ,
    minZ,
    routeEndZ,
    stadiumBackWallZ,
  };
}

export function buildRearCampusPerimeterConnectors(campusCenterZ: number): CampusConnector[] {
  const campusPerimeterHalfWidth = 3060;
  const campusPerimeterFrontZ = campusCenterZ + 2140;
  const campusPerimeterRearZ = campusCenterZ - 2140;
  const campusPerimeterCenterZ = (campusPerimeterFrontZ + campusPerimeterRearZ) * 0.5;
  const campusPerimeterDepth = campusPerimeterFrontZ - campusPerimeterRearZ;

  return [
    {
      id: 'rear-campus-perimeter-rear-wall',
      position: [0, 16, campusPerimeterRearZ],
      size: [campusPerimeterHalfWidth * 2, 32, 20],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-left-wall',
      position: [-campusPerimeterHalfWidth, 15, campusPerimeterCenterZ],
      size: [18, 30, campusPerimeterDepth],
      accent: 'wall',
    },
    {
      id: 'rear-campus-perimeter-right-wall',
      position: [campusPerimeterHalfWidth, 15, campusPerimeterCenterZ],
      size: [18, 30, campusPerimeterDepth],
      accent: 'wall',
    },
    {
      id: 'rear-campus-front-left-connector',
      position: [-2390, 16, campusPerimeterFrontZ],
      size: [1340, 32, 18],
      accent: 'wall',
    },
    {
      id: 'rear-campus-front-left-connector-cap',
      position: [-2390, 33, campusPerimeterFrontZ],
      size: [1220, 2, 4],
      accent: 'cap',
    },
    {
      id: 'rear-campus-front-right-connector',
      position: [2390, 16, campusPerimeterFrontZ],
      size: [1340, 32, 18],
      accent: 'wall',
    },
    {
      id: 'rear-campus-front-right-connector-cap',
      position: [2390, 33, campusPerimeterFrontZ],
      size: [1220, 2, 4],
      accent: 'cap',
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
  ];
}

export function buildVisibleRearCampusForecourts(campusCenterZ: number): CampusPlane[] {
  return buildRearCampusForecourts(campusCenterZ).filter((plane) => !HIDDEN_REAR_CAMPUS_FORECOURT_IDS.has(plane.id));
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
