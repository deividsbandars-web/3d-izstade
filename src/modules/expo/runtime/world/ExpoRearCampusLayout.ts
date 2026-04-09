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

export function buildRearCampusForecourts(campusCenterZ: number): CampusPlane[] {
  return [
    { id: 'stadium-forecourt-left-main', position: [-940, 5.98, campusCenterZ + 520], size: [720, 1040], color: '#eef4f8' },
    { id: 'stadium-forecourt-left-inner', position: [-560, 6.02, campusCenterZ + 140], size: [280, 440], color: '#dfe8ee' },
    { id: 'stadium-forecourt-right-main', position: [940, 5.98, campusCenterZ + 520], size: [720, 1040], color: '#eef4f8' },
    { id: 'stadium-forecourt-right-inner', position: [560, 6.02, campusCenterZ + 120], size: [280, 440], color: '#dfe8ee' },
    { id: 'stadium-forecourt-center-main', position: [0, 6.02, campusCenterZ + 760], size: [1080, 840], color: '#f5fafc' },
    { id: 'stadium-forecourt-center-inner', position: [0, 6.06, campusCenterZ + 980], size: [620, 340], color: '#e1ebf1' },
    { id: 'stadium-forecourt-axis', position: [0, 6.08, campusCenterZ + 1180], size: [420, 460], color: '#edf4f8' },
    { id: 'stadium-forecourt-pocket-left', position: [-320, 6.04, campusCenterZ + 930], size: [180, 180], color: '#dce7ee' },
    { id: 'stadium-forecourt-pocket-right', position: [320, 6.04, campusCenterZ + 930], size: [180, 180], color: '#dce7ee' },
    { id: 'stadium-forecourt-ribbon-left', position: [-152, 6.1, campusCenterZ + 1120], size: [72, 360], color: '#e8eff4' },
    { id: 'stadium-forecourt-ribbon-right', position: [152, 6.1, campusCenterZ + 1110], size: [72, 360], color: '#e8eff4' },
    { id: 'stadium-forecourt-endcap', position: [0, 6.12, campusCenterZ + 1440], size: [280, 120], color: '#eef4f8' },
    { id: 'stadium-forecourt-axis-pad-left', position: [-214, 6.06, campusCenterZ + 1210], size: [132, 94], color: '#e3ebf1' },
    { id: 'stadium-forecourt-axis-pad-right', position: [214, 6.06, campusCenterZ + 1200], size: [132, 94], color: '#e3ebf1' },
    { id: 'stadium-forecourt-rear-band', position: [0, 6.08, campusCenterZ + 600], size: [868, 96], color: '#ebf2f6' },
    { id: 'stadium-forecourt-gallery-left', position: [-486, 6.04, campusCenterZ + 1010], size: [168, 92], color: '#e6edf2' },
    { id: 'stadium-forecourt-gallery-right', position: [486, 6.04, campusCenterZ + 1000], size: [168, 92], color: '#e6edf2' },
    { id: 'stadium-forecourt-terminal-left', position: [-118, 6.08, campusCenterZ + 1530], size: [112, 84], color: '#e7eef3' },
    { id: 'stadium-forecourt-terminal-right', position: [118, 6.08, campusCenterZ + 1520], size: [112, 84], color: '#e7eef3' },
    { id: 'stadium-forecourt-center-carpet', position: [0, 6.1, campusCenterZ + 1326], size: [184, 48], color: '#f4f8fb' },
    { id: 'stadium-forecourt-threshold-left', position: [-96, 6.08, campusCenterZ + 1134], size: [56, 22], color: '#edf4f8' },
    { id: 'stadium-forecourt-threshold-right', position: [96, 6.08, campusCenterZ + 1126], size: [56, 22], color: '#edf4f8' },
    { id: 'stadium-forecourt-outer-pocket-left', position: [-642, 6.02, campusCenterZ + 1216], size: [136, 116], color: '#e4ecf1' },
    { id: 'stadium-forecourt-outer-pocket-right', position: [642, 6.02, campusCenterZ + 1208], size: [136, 116], color: '#e4ecf1' },
    { id: 'stadium-forecourt-front-court-left', position: [-268, 6.06, campusCenterZ + 1288], size: [92, 54], color: '#edf4f8' },
    { id: 'stadium-forecourt-front-court-right', position: [268, 6.06, campusCenterZ + 1278], size: [92, 54], color: '#edf4f8' },
    { id: 'stadium-forecourt-front-threshold-left', position: [-58, 6.08, campusCenterZ + 1292], size: [34, 18], color: '#f1f6f9' },
    { id: 'stadium-forecourt-front-threshold-right', position: [58, 6.08, campusCenterZ + 1284], size: [34, 18], color: '#f1f6f9' },
  ];
}

export function buildRearCampusSidePavilions(campusCenterZ: number): CampusPavilion[] {
  return [
    { id: 'rear-campus-side-pavilion-left-front', position: [-1420, 0, campusCenterZ + 1040], size: [176, 132, 148], accentSide: 1 },
    { id: 'rear-campus-side-pavilion-left-rear', position: [-1220, 0, campusCenterZ - 1100], size: [232, 164, 188], accentSide: 1 },
    { id: 'rear-campus-side-pavilion-right-front', position: [1420, 0, campusCenterZ + 1040], size: [176, 132, 148], accentSide: -1 },
    { id: 'rear-campus-side-pavilion-right-rear', position: [1220, 0, campusCenterZ - 1100], size: [232, 164, 188], accentSide: -1 },
    { id: 'rear-campus-event-pavilion-left', position: [-720, 0, campusCenterZ + 1220], size: [188, 102, 132], accentSide: 1 },
    { id: 'rear-campus-event-pavilion-right', position: [720, 0, campusCenterZ + 1220], size: [188, 102, 132], accentSide: -1 },
    { id: 'rear-campus-axis-kiosk-left', position: [-240, 0, campusCenterZ + 1390], size: [116, 68, 74], accentSide: 1 },
    { id: 'rear-campus-axis-kiosk-right', position: [240, 0, campusCenterZ + 1390], size: [116, 68, 74], accentSide: -1 },
    { id: 'rear-campus-axis-gallery-left', position: [-412, 0, campusCenterZ + 1080], size: [124, 74, 86], accentSide: 1 },
    { id: 'rear-campus-axis-gallery-right', position: [412, 0, campusCenterZ + 1080], size: [124, 74, 86], accentSide: -1 },
    { id: 'rear-campus-terminal-left', position: [-212, 0, campusCenterZ + 1540], size: [118, 74, 78], accentSide: 1 },
    { id: 'rear-campus-terminal-right', position: [212, 0, campusCenterZ + 1532], size: [118, 74, 78], accentSide: -1 },
    { id: 'rear-campus-axis-front-left', position: [-118, 0, campusCenterZ + 1262], size: [96, 62, 58], accentSide: 1 },
    { id: 'rear-campus-axis-front-right', position: [118, 0, campusCenterZ + 1254], size: [96, 62, 58], accentSide: -1 },
  ];
}

export function buildRearCampusLandmarkTowers(campusCenterZ: number): CampusTower[] {
  return [
    { id: 'rear-campus-landmark-left', position: [-920, 0, campusCenterZ + 260] },
    { id: 'rear-campus-landmark-right', position: [920, 0, campusCenterZ + 260] },
    { id: 'rear-campus-landmark-center-left', position: [-420, 0, campusCenterZ + 520] },
    { id: 'rear-campus-landmark-center-right', position: [420, 0, campusCenterZ + 500] },
  ];
}
