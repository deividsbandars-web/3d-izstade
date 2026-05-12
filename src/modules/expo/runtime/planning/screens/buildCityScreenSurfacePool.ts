import type { CityScreenSurface } from '../types';

export function buildCityScreenSurfacePool(districtCount: number, districtStride: number): CityScreenSurface[] {
  const paletteByDistrict = [
    { heroLeft: '#7dd3fc', heroRight: '#fbbf24', supportLeft: '#a78bfa', supportRight: '#67e8f9', spine: '#93c5fd' },
    { heroLeft: '#93c5fd', heroRight: '#fb7185', supportLeft: '#67e8f9', supportRight: '#fde68a', spine: '#c4b5fd' },
    { heroLeft: '#67e8f9', heroRight: '#c084fc', supportLeft: '#93c5fd', supportRight: '#fca5a5', spine: '#7dd3fc' },
  ] as const;

  const inwardYawLeft = 0.78;
  const inwardYawRight = -0.78;
  const flankYawLeft = 1.08;
  const flankYawRight = -1.08;
  const marqueeClearanceZ = 52;
  const marqueeLeftOutwardX = -80;
  const marqueeRightOutwardX = 128;
  const sideArrayClearanceX = 236;
  const sideArrayLeftForwardZ = 64;
  const sideArrayRightForwardZ = 0;

  return Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -214 - (districtIndex * districtStride);
    const palette = paletteByDistrict[districtIndex % paletteByDistrict.length];

    return [
      {
        id: `screen-marquee-left-${districtIndex}`,
        position: [-(708 + marqueeLeftOutwardX), 148, baseZ - 82 + marqueeClearanceZ],
        rotation: [0, inwardYawLeft, 0],
        size: [156, 184, 3.4],
        color: '#08111c',
        glowColor: palette.heroLeft,
        role: 'hero-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-marquee-right-${districtIndex}`,
        position: [708 + marqueeRightOutwardX, 144, baseZ - 114 - marqueeClearanceZ],
        rotation: [0, inwardYawRight, 0],
        size: [150, 178, 3.4],
        color: '#091320',
        glowColor: palette.heroRight,
        role: 'hero-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-left-${districtIndex}`,
        position: [-968 - sideArrayClearanceX, 98, baseZ + 104 + sideArrayLeftForwardZ],
        rotation: [0, flankYawLeft, 0],
        size: [126, 122, 2.8],
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-left-upper-${districtIndex}`,
        position: [-1470, 142, baseZ - 18],
        rotation: [0, inwardYawLeft, 0],
        size: [104, 116, 2.8],
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-${districtIndex}`,
        position: [968 + sideArrayClearanceX, 94, baseZ + 86 + sideArrayRightForwardZ],
        rotation: [0, flankYawRight, 0],
        size: [126, 122, 2.8],
        color: '#091320',
        glowColor: palette.supportRight,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-upper-${districtIndex}`,
        position: [1470, 138, baseZ - 44],
        rotation: [0, inwardYawRight, 0],
        size: [104, 116, 2.8],
        color: '#091320',
        glowColor: palette.supportRight,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-spine-primary-${districtIndex}`,
        position: [-110, 108, baseZ - 34],
        rotation: [0, inwardYawLeft, 0],
        size: [118, 136, 2.8],
        color: '#091320',
        glowColor: palette.spine,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-spine-secondary-${districtIndex}`,
        position: [184, 116, baseZ + 58],
        rotation: [0, inwardYawRight, 0],
        size: [104, 118, 2.6],
        color: '#0a1420',
        glowColor: palette.spine,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
    ] satisfies CityScreenSurface[];
  }).flat();
}
