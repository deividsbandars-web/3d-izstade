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

function isRearCampusScreenSurface(surfaceId: string) {
  return (
    surfaceId === 'rear-campus-bowl-feed-surface'
    || (
      surfaceId.startsWith('rear-campus-')
      && (
        surfaceId.endsWith('-feed-surface')
        || surfaceId.endsWith('-host-surface')
      )
    )
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

function getRearCampusScreenHostDepth(surface: CityScreenSurface) {
  return Math.max(18, surface.size[2] * 5.2);
}

const REAR_CAMPUS_BODY_DEPTH_BY_SURFACE_ID: Readonly<Record<string, number>> = {
  'rear-campus-event-pavilion-left-feed-surface': 132,
  'rear-campus-event-pavilion-right-feed-surface': 132,
  'rear-campus-mega-civic-hall-host-surface': 324,
  'rear-campus-orbital-scoregate-host-surface': 320,
  'rear-campus-stage-monolith-canopy-host-surface': 176,
};

function getRearCampusRearContentZ(surface: CityScreenSurface) {
  const bodyDepth = REAR_CAMPUS_BODY_DEPTH_BY_SURFACE_ID[surface.id];
  if (bodyDepth) {
    // Some rear-campus screens are mounted on real pavilion/landmark bodies, not
    // only the lightweight screen shell. Push the rear clone behind that body so
    // the backside is readable instead of hidden by the structure.
    return -(getSocketAnchorDepth(surface) + bodyDepth + 8);
  }

  const hostDepth = getRearCampusScreenHostDepth(surface);
  const faceInset = 6;

  // Rear-campus screen hosts use a separate shell formula in rearCampusScreenHosts.ts.
  // This places the readable rear clone behind that shell so the mirrored front
  // material backface is not the only thing visible from the stadium side.
  return -(getSocketAnchorDepth(surface) + hostDepth - (surface.size[2] * 0.5) + faceInset + 0.75);
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

  if (isRearCampusScreenSurface(socket.surfaceId)) {
    return {
      enabled: true,
      rearZ: getRearCampusRearContentZ(surface),
      zone: 'rearCampus',
    };
  }

  return {
    enabled: false,
    rearZ: null,
    zone: null,
  };
}
