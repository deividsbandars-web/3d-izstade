import type { CityScreenSocket, CityScreenSurface } from '../planning/types';

export type CityScreenRearContentZone = 'mainCity' | 'rearCampus';

export type CityScreenRearContentPolicy = {
  enabled: boolean;
  rearZ: number | null;
  zone: CityScreenRearContentZone | null;
};

function isMainCityFlatStandaloneScreenSurface(surfaceId: string) {
  return (
    surfaceId.startsWith('screen-marquee-')
    || surfaceId.startsWith('screen-array-')
    || surfaceId.startsWith('screen-spine-')
  );
}

function getSurfaceHousingDepth(surface: CityScreenSurface) {
  if (surface.renderIntent?.housingDepth) {
    return surface.renderIntent.housingDepth;
  }

  if (surface.role === 'hero-wall') {
    return Math.max(10, surface.size[2] * 4.2);
  }

  if (surface.role === 'support-wall') {
    return Math.max(8, surface.size[2] * 3.5);
  }

  if (surface.role === 'tower-crown') {
    return Math.max(4.8, surface.size[2] * 2.2);
  }

  return Math.max(4.4, surface.size[2] * 2.1);
}

function getSocketAnchorDepth(surface: CityScreenSurface) {
  return getSurfaceHousingDepth(surface) * 0.55;
}

function isElevatedLandmarkHostSurface(surface: CityScreenSurface) {
  return surface.id === 'screen-array-left-upper-3' || surface.id === 'screen-array-right-upper-3';
}

function getMainCityScreenHostDepth(surface: CityScreenSurface) {
  if (isElevatedLandmarkHostSurface(surface)) {
    return Math.max(12, surface.size[2] * 3.2);
  }

  const isSideArray = surface.id.startsWith('screen-array-');

  return Math.max(isSideArray ? 32 : 24, surface.size[2] * (isSideArray ? 9.4 : 7.2));
}

function getMainCityRearContentZ(surface: CityScreenSurface) {
  const hostDepth = getMainCityScreenHostDepth(surface);
  const hostBackDepthFromSurface = hostDepth + (surface.size[2] * 0.5) - 1.2;

  // Sockets are anchored on the front face by buildScreenSockets at housingDepth * 0.55.
  // These flat city screens sit on screen-host masses, so the rear clone must cross
  // the host mass too or it remains hidden behind the blank rear plate.
  return -(getSocketAnchorDepth(surface) + hostBackDepthFromSurface + 0.75);
}

export function getCityScreenRearContentPolicy(
  socket: CityScreenSocket,
  surface: CityScreenSurface | undefined,
): CityScreenRearContentPolicy {
  if (!surface || surface.type !== 'wall') {
    return {
      enabled: false,
      rearZ: null,
      zone: null,
    };
  }

  if (isMainCityFlatStandaloneScreenSurface(socket.surfaceId)) {
    return {
      enabled: true,
      rearZ: getMainCityRearContentZ(surface),
      zone: 'mainCity',
    };
  }

  return {
    enabled: false,
    rearZ: null,
    zone: null,
  };
}
