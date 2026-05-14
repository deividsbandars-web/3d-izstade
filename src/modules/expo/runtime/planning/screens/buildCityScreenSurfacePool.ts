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
  const sideArrayUpperX = 1560;
  const sideArrayY = (districtIndex: number) => 148 + (districtIndex * 18);
  const sideArrayUpperY = (districtIndex: number) => 218 + (districtIndex * 16);
  const sideArraySize = (districtIndex: number): [number, number, number] => [142 + (districtIndex * 6), 196 + (districtIndex * 14), 2.8];
  const sideArrayUpperSize = (districtIndex: number): [number, number, number] => [120 + (districtIndex * 4), 186 + (districtIndex * 12), 2.8];
  const sideArrayLeftDepthOffset = (districtIndex: number) => (
    districtIndex === 1
      ? sideArrayLeftForwardZ - 218
      : sideArrayLeftForwardZ + (districtIndex === 2 ? -24 : 0)
  );
  const sideArrayRightDepthOffset = (districtIndex: number) => (
    districtIndex === 0 ? sideArrayRightForwardZ + 14 : sideArrayRightForwardZ
  );
  const sideArrayLeftUpperDepthOffset = (districtIndex: number) => (
    districtIndex === 0 ? -2 : districtIndex === 1 ? -186 : -46
  );

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
        position: [-968 - sideArrayClearanceX, sideArrayY(districtIndex), baseZ + 104 + sideArrayLeftDepthOffset(districtIndex)],
        rotation: [0, flankYawLeft, 0],
        size: sideArraySize(districtIndex),
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-left-upper-${districtIndex}`,
        position: [-sideArrayUpperX, sideArrayUpperY(districtIndex), baseZ + sideArrayLeftUpperDepthOffset(districtIndex)],
        rotation: [0, inwardYawLeft, 0],
        size: sideArrayUpperSize(districtIndex),
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-${districtIndex}`,
        position: [968 + sideArrayClearanceX, sideArrayY(districtIndex) - 2, baseZ + 86 + sideArrayRightDepthOffset(districtIndex)],
        rotation: [0, flankYawRight, 0],
        size: sideArraySize(districtIndex),
        color: '#091320',
        glowColor: palette.supportRight,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-upper-${districtIndex}`,
        position: [sideArrayUpperX, sideArrayUpperY(districtIndex) - 2, baseZ - 44],
        rotation: [0, inwardYawRight, 0],
        size: sideArrayUpperSize(districtIndex),
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
