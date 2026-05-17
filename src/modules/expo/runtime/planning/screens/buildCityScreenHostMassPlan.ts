import type { CityMass, CityScreenSurface } from '../types';

const CITY_SCREEN_HOST_SOURCE_FILE = 'src/modules/expo/runtime/planning/screens/buildCityScreenHostMassPlan.ts';

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function isPreviousCivilizationMonumentScreen(surface: CityScreenSurface) {
  return surface.id === 'screen-array-left-upper-3';
}

export function buildCityScreenHostMasses(surfaces: ReadonlyArray<CityScreenSurface>): CityMass[] {
  return surfaces
    .filter((surface) => surface.type === 'wall')
    .map((surface) => {
      const yaw = surface.rotation[1] ?? 0;
      const isMarquee = surface.id.startsWith('screen-marquee-');
      const isSpine = surface.id.startsWith('screen-spine-');
      const isSideArray = surface.id.startsWith('screen-array-');
      const isMonumentScreen = isPreviousCivilizationMonumentScreen(surface);
      const hostTop = surface.position[1] + (surface.size[1] * 0.5) + (isSideArray ? 42 : isMarquee ? 8 : 6);
      const hostBaseY = isMonumentScreen ? 196 : 0;
      const hostWidth = Math.max(
        surface.size[0] + (isSideArray ? 36 : 8),
        surface.size[0] * (isSideArray ? 1.26 : 1.08),
      );
      const hostDepth = Math.max(isSideArray ? 32 : 24, surface.size[2] * (isSideArray ? 9.4 : 7.2));
      const backset = (hostDepth * 0.5) + (surface.size[2] * 0.5) - 1.2;
      const hostHeight = isMonumentScreen
        ? Math.max(surface.size[1] + 56, hostTop - hostBaseY)
        : Math.max(surface.size[1] + (isMarquee ? 58 : isSpine ? 46 : isSideArray ? 126 : 34), hostTop);

      return {
        id: `${surface.id}-host`,
        planningSource: {
          safeEditSeam: CITY_SCREEN_HOST_SOURCE_FILE,
          sourceFile: CITY_SCREEN_HOST_SOURCE_FILE,
          sourceFunction: 'buildCityScreenHostMasses',
          sourceKind: 'city-screen-host-mass',
        },
        position: [
          round1(surface.position[0] - (Math.sin(yaw) * backset)),
          0,
          round1(surface.position[2] - (Math.cos(yaw) * backset)),
        ],
        rotation: [0, yaw, 0],
        size: [
          round1(hostWidth),
          round1(hostHeight),
          round1(hostDepth),
        ],
        vertical: isMonumentScreen
          ? {
              baseY: hostBaseY,
              floorCount: 1,
              floorHeight: round1(hostHeight),
              heightBand: 'high-rise',
              level: 'tower',
              verticalOwner: 'city',
            }
          : undefined,
        color: isMonumentScreen ? '#a9b9c1' : isSpine ? '#7c909e' : isMarquee ? '#718795' : '#8294a0',
        sections: surface.sections,
      } satisfies CityMass;
    });
}
