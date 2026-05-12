import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../../world-contract';
import type {
  CanonicalPrimitive,
  CanonicalPrimitiveBox,
  CanonicalPrimitiveCylinder,
  CanonicalPrimitivePlane,
  CanonicalPrimitiveText,
  CanonicalPrimitiveTexturePlane,
  CityGeometryPlanningSource,
  CityMass,
  CityMassRenderIntent,
  CityPlane,
  CityScreenAssignment,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  StadiumReserve,
} from '../legacy/worldCityGeometry';

export type {
  CanonicalPrimitive,
  CanonicalPrimitiveBox,
  CanonicalPrimitiveCylinder,
  CanonicalPrimitivePlane,
  CanonicalPrimitiveText,
  CanonicalPrimitiveTexturePlane,
  CityGeometryPlanningSource,
  CityMass,
  CityMassRenderIntent,
  CityPlane,
  CityScreenAssignment,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  StadiumReserve,
};

export type ExpoPlanningZoneId =
  | 'arrival'
  | 'left-district'
  | 'center-spine'
  | 'right-district'
  | 'tower-cluster'
  | 'rear-campus';

export type ExpoPlanningScreenFamily =
  | 'arrival-banner'
  | 'district-marquee'
  | 'district-array'
  | 'center-spine'
  | 'tower-ribbon'
  | 'tower-crown'
  | 'rear-campus-bowl'
  | 'rear-campus-tower';

export type ExpoPlanningPlacementClass =
  | 'gateway'
  | 'district'
  | 'spine'
  | 'tower'
  | 'stadium'
  | 'city-support';

export type ExpoPlanningViewerFacing =
  | 'inbound'
  | 'outbound'
  | 'inward'
  | 'bidirectional'
  | 'event-facing';

export type ExpoPlanningSectionId =
  | 'arrival'
  | 'left'
  | 'middle'
  | 'right';

export type ExpoPlanningAnchor = {
  id: string;
  ownerId: string;
  ownerKind: 'plane' | 'mass' | 'surface' | 'tower' | 'campus';
  position: [number, number, number];
};

export type ExpoPlanningDensityCaps = {
  assignmentCap: number;
  screenSocketCap: number;
  screenSurfaceCap: number;
};

export type ExpoPlanningInputs = {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  districtStride: number;
  visualProfile: ExpoWorldVisualProfile;
};

export type RearCampusForecourt = {
  color: string;
  id: string;
  position: [number, number, number];
  size: [number, number];
};

export type RearCampusPavilion = {
  accentSide: number;
  id: string;
  position: [number, number, number];
  size: [number, number, number];
};

export type RearCampusLandmarkTower = {
  id: string;
  position: [number, number, number];
};

export type RearCampusPerimeterConnector = {
  accent: 'wall' | 'cap' | 'rail' | 'post' | 'gate';
  id: string;
  position: [number, number, number];
  size: [number, number, number];
};

export type RearCampusZoneExtension = {
  campusCenterZ: number;
  feedSocketIds: {
    bowl: string | null;
    leftTower: string | null;
    rightTower: string | null;
  };
  forecourts: RearCampusForecourt[];
  landmarkTowers: RearCampusLandmarkTower[];
  perimeterConnectors: RearCampusPerimeterConnector[];
  sidePavilions: RearCampusPavilion[];
  stadiumBackWallZ: number;
};

export type ExpoPlanningZonePlan = {
  allowedScreenFamilies: ExpoPlanningScreenFamily[];
  anchors: ExpoPlanningAnchor[];
  assignments: CityScreenAssignment[];
  densityCaps: ExpoPlanningDensityCaps;
  id: ExpoPlanningZoneId;
  masses: CityMass[];
  name: string;
  placementClasses: ExpoPlanningPlacementClass[];
  planes: CityPlane[];
  screenSockets: CityScreenSocket[];
  screenSurfaces: CityScreenSurface[];
  towers: CityTower[];
  viewerFacing: ExpoPlanningViewerFacing;
  zoneExtension?: {
    rearCampus?: RearCampusZoneExtension;
  };
};

export type CanonicalWorldPlan = {
  arrivalPlanes: CityPlane[];
  arrivalZone: ExpoPlanningZonePlan;
  boothForecourtPlanes: CityPlane[];
  districtStride: number;
  filteredCityPlanes: CityPlane[];
  filteredMasses: CityMass[];
  filteredScreenSurfaces: CityScreenSurface[];
  filteredTowerLandmarks: CityTower[];
  promenadeAxisPlanes: CityPlane[];
  screenAssignments: CityScreenAssignment[];
  screenSockets: CityScreenSocket[];
  showcasePlazas: CityPlane[];
  stadiumReserve: StadiumReserve;
  zones: ExpoPlanningZonePlan[];
};

export type ExpoPlanningGeometryPools = {
  arrivalPlanes: CityPlane[];
  arrivalGatewayMasses: CityMass[];
  boothForecourtPlanes: CityPlane[];
  boulevardEdgeMasses: CityMass[];
  discoveryEdgeMasses: CityMass[];
  discoveryLandmarkMasses: CityMass[];
  discoverySupportMasses: CityMass[];
  mediaWallMasses: CityMass[];
  observatoryMasses: CityMass[];
  promenadeAxisPlanes: CityPlane[];
  rightSupportMasses: CityMass[];
  showcaseMasses: CityMass[];
  showcasePlazas: CityPlane[];
  signatureMasses: CityMass[];
  stadiumReserve: StadiumReserve;
  supportEdgeMasses: CityMass[];
  skybridgeMasses: CityMass[];
  towers: CityTower[];
};

export type ExpoZonePlannerContext = {
  geometry: ExpoPlanningGeometryPools;
  inputs: ExpoPlanningInputs;
};
