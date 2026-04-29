export type ExpoBoothLocalFootprint = {
  depth: number;
  localBounds: {
    maxX: number;
    maxZ: number;
    minX: number;
    minZ: number;
  };
  source: 'conservative-node-baseline';
  width: number;
  worldBounds: {
    maxX: number;
    maxZ: number;
    minX: number;
    minZ: number;
  };
  yaw: number;
};

function resolveLocalFootprintSize(args: {
  boothType?: string | null;
  nodeType?: string | null;
  sponsorTier?: string | null;
}) {
  const boothType = String(args.boothType || '').toLowerCase();
  const nodeType = String(args.nodeType || '').toLowerCase();
  const sponsorTier = String(args.sponsorTier || '').toLowerCase();

  if (
    boothType === 'hero' ||
    sponsorTier === 'hero' ||
    nodeType === 'hero_left' ||
    nodeType === 'hero_right'
  ) {
    return { depth: 26, width: 36 };
  }

  if (
    boothType === 'premium' ||
    sponsorTier === 'platinum' ||
    sponsorTier === 'gold' ||
    sponsorTier === 'premium' ||
    sponsorTier === 'elite' ||
    nodeType === 'endcap'
  ) {
    return { depth: 22, width: 32 };
  }

  return { depth: 15.5, width: 20 };
}

export function buildExpoBoothLocalFootprint(args: {
  boothType?: string | null;
  nodeType?: string | null;
  position: [number, number, number];
  rotation?: [number, number, number] | null;
  sponsorTier?: string | null;
}): ExpoBoothLocalFootprint {
  const { depth, width } = resolveLocalFootprintSize(args);
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const yaw = Number.isFinite(args.rotation?.[1]) ? (args.rotation?.[1] ?? 0) : 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const corners = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ] as const;

  const worldCorners = corners.map(([localX, localZ]) => {
    const rotatedX = (localX * cos) - (localZ * sin);
    const rotatedZ = (localX * sin) + (localZ * cos);

    return {
      x: args.position[0] + rotatedX,
      z: args.position[2] + rotatedZ,
    };
  });

  return {
    depth,
    localBounds: {
      maxX: halfWidth,
      maxZ: halfDepth,
      minX: -halfWidth,
      minZ: -halfDepth,
    },
    source: 'conservative-node-baseline',
    width,
    worldBounds: {
      maxX: Math.max(...worldCorners.map((corner) => corner.x)),
      maxZ: Math.max(...worldCorners.map((corner) => corner.z)),
      minX: Math.min(...worldCorners.map((corner) => corner.x)),
      minZ: Math.min(...worldCorners.map((corner) => corner.z)),
    },
    yaw,
  };
}
