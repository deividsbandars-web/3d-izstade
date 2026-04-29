type XzBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

type ScreenSurfaceFootprintCandidate = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
};

export function hasFiniteTuple3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length >= 3 && value.every((entry) => Number.isFinite(entry));
}

export function hasFinitePositiveSizeTuple(value: unknown): value is [number, number, number] {
  return hasFiniteTuple3(value) && value[0] > 0 && value[1] > 0 && value[2] > 0;
}

export function resolveYawAwareScreenSurfaceBounds(
  surface: ScreenSurfaceFootprintCandidate,
): XzBounds {
  const halfX = surface.size[0] * 0.5;
  const halfZ = surface.size[2] * 0.5;
  const yaw = surface.rotation[1];
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  const corners = [
    [-halfX, -halfZ],
    [-halfX, halfZ],
    [halfX, -halfZ],
    [halfX, halfZ],
  ] as const;

  const transformedCorners = corners.map(([localX, localZ]) => ({
    x: surface.position[0] + (localX * cosYaw) - (localZ * sinYaw),
    z: surface.position[2] + (localX * sinYaw) + (localZ * cosYaw),
  }));

  return {
    maxX: Math.max(...transformedCorners.map((corner) => corner.x)),
    maxZ: Math.max(...transformedCorners.map((corner) => corner.z)),
    minX: Math.min(...transformedCorners.map((corner) => corner.x)),
    minZ: Math.min(...transformedCorners.map((corner) => corner.z)),
  };
}
