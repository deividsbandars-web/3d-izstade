import type { CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';

function isLeftDistrictPlane(plane: CityPlane) {
  return plane.position[0] < -40 && plane.position[2] > -2200;
}

function isLeftDistrictMass(mass: CityMass) {
  return mass.position[0] < -40 && mass.position[2] > -2200;
}

export function buildLeftDistrictZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isLeftDistrictPlane),
    ...context.geometry.showcasePlazas.filter(isLeftDistrictPlane),
    ...context.geometry.boothForecourtPlanes.filter(isLeftDistrictPlane),
  ];

  const masses = [
    ...context.geometry.boulevardEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.showcaseMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoveryEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.supportEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoverySupportMasses.filter(isLeftDistrictMass),
    ...context.geometry.observatoryMasses.filter(isLeftDistrictMass),
    ...context.geometry.signatureMasses.filter(isLeftDistrictMass),
    ...context.geometry.skybridgeMasses.filter(isLeftDistrictMass),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
