import type { CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';

function isCenterSpinePlane(plane: CityPlane) {
  return Math.abs(plane.position[0]) <= 260 && plane.position[2] > -2200;
}

function isCenterSpineMass(mass: CityMass) {
  return Math.abs(mass.position[0]) <= 260 && mass.position[2] > -2200;
}

export function buildCenterSpineZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isCenterSpinePlane),
    ...context.geometry.showcasePlazas.filter(isCenterSpinePlane),
    ...context.geometry.boothForecourtPlanes.filter(isCenterSpinePlane),
  ];

  const masses = [
    ...context.geometry.mediaWallMasses.filter((mass) => isCenterSpineMass(mass) && mass.id.startsWith('screen-spine-')),
    ...context.geometry.showcaseMasses.filter(isCenterSpineMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isCenterSpineMass),
    ...context.geometry.discoverySupportMasses.filter(isCenterSpineMass),
    ...context.geometry.observatoryMasses.filter(isCenterSpineMass),
    ...context.geometry.signatureMasses.filter(isCenterSpineMass),
    ...context.geometry.skybridgeMasses.filter(isCenterSpineMass),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
