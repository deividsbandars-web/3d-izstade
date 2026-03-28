import type { ExpoWalkRegion } from '../sceneWorld';

export type SkylineAssetId = 'atlanta' | 'bridge' | 'helix';

export type SkylinePlacementInput = {
  asset: SkylineAssetId;
  boundsSize: [number, number, number];
  id: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

export type SkylinePlacementOutput = SkylinePlacementInput & {
  wasAdjusted: boolean;
};

function overlapsWalkRegions(position: [number, number, number], boundsSize: [number, number, number], walkRegions: ExpoWalkRegion[]) {
  const halfX = boundsSize[0] * 0.5;
  const halfZ = boundsSize[2] * 0.5;
  const minX = position[0] - halfX;
  const maxX = position[0] + halfX;
  const minZ = position[2] - halfZ;
  const maxZ = position[2] + halfZ;

  return walkRegions.some((region) => (
    maxX >= region.minX &&
    minX <= region.maxX &&
    maxZ >= region.minZ &&
    minZ <= region.maxZ
  ));
}

export function sanitizeSkylinePlacements(
  placements: SkylinePlacementInput[],
  walkRegions: ExpoWalkRegion[]
): SkylinePlacementOutput[] {
  if (walkRegions.length === 0) {
    return placements.map((placement) => ({ ...placement, wasAdjusted: false }));
  }

  const corridorMaxX = Math.max(...walkRegions.map((region) => region.maxX));
  const corridorMinX = Math.min(...walkRegions.map((region) => region.minX));
  const corridorMinZ = Math.min(...walkRegions.map((region) => region.minZ));
  const clearance = 18;

  return placements.map((placement, index) => {
    const next = {
      ...placement,
      boundsSize: [...placement.boundsSize] as [number, number, number],
      position: [...placement.position] as [number, number, number],
      wasAdjusted: false,
    };

    const shiftOutward = () => {
      const side = next.position[0] === 0 ? (index % 2 === 0 ? -1 : 1) : Math.sign(next.position[0]);
      const halfX = next.boundsSize[0] * 0.5;
      const safeX = side < 0
        ? corridorMinX - halfX - clearance
        : corridorMaxX + halfX + clearance;
      next.position[0] = safeX;
    };

    if (overlapsWalkRegions(next.position, next.boundsSize, walkRegions)) {
      shiftOutward();
      next.wasAdjusted = true;
    }

    if (overlapsWalkRegions(next.position, next.boundsSize, walkRegions)) {
      const halfZ = next.boundsSize[2] * 0.5;
      next.position[2] = corridorMinZ - halfZ - clearance;
      next.wasAdjusted = true;
    }

    if (overlapsWalkRegions(next.position, next.boundsSize, walkRegions)) {
      next.scale = Number((next.scale * 0.82).toFixed(3));
      next.boundsSize = [
        Number((next.boundsSize[0] * 0.82).toFixed(3)),
        Number((next.boundsSize[1] * 0.82).toFixed(3)),
        Number((next.boundsSize[2] * 0.82).toFixed(3)),
      ];
      shiftOutward();
      next.position[2] = corridorMinZ - (next.boundsSize[2] * 0.5) - clearance;
      next.wasAdjusted = true;
    }

    return next;
  });
}
