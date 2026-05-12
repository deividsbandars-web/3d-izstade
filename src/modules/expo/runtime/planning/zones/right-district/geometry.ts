import type { CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';

function isRightDistrictPlane(plane: CityPlane) {
  return plane.position[0] > 40 && plane.position[2] > -2200;
}

function isRightDistrictMass(mass: CityMass) {
  return mass.position[0] > 40 && mass.position[2] > -2200;
}

export function buildRightDistrictZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isRightDistrictPlane),
    ...context.geometry.showcasePlazas.filter(isRightDistrictPlane),
    ...context.geometry.boothForecourtPlanes.filter(isRightDistrictPlane),
  ];

  const masses = [
    ...context.geometry.boulevardEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.showcaseMasses.filter(isRightDistrictMass),
    ...context.geometry.rightSupportMasses.filter(isRightDistrictMass),
    ...context.geometry.discoveryEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.supportEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isRightDistrictMass),
    ...context.geometry.discoverySupportMasses.filter(isRightDistrictMass),
    ...context.geometry.observatoryMasses.filter(isRightDistrictMass),
    ...context.geometry.signatureMasses.filter(isRightDistrictMass),
    ...context.geometry.skybridgeMasses.filter(isRightDistrictMass),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
