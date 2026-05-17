import type { WorldObjectLayer, WorldObjectRegistryEntry } from '../inspection/worldObjectRegistry';

export type WorldPhysicsBounds = {
  maxX: number;
  maxY: number;
  maxZ: number;
  minX: number;
  minY: number;
  minZ: number;
};

export type WorldPhysicsSolid = {
  bounds: WorldPhysicsBounds;
  entryId: string;
  id: string;
  layer: WorldObjectLayer;
  partId?: string;
  planningRole?: string | null;
  planningZone: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  sourceFile: string;
  sourceFunction: string;
  sourceKind: string;
  walkableTop: boolean;
};

export type WorldPhysicsWalkableSurface = {
  bounds: WorldPhysicsBounds;
  id: string;
  ownerId: string;
  ownerLayer: WorldObjectLayer;
  planningZone: string | null;
  playerY: number;
  position: [number, number, number];
  size: [number, number];
  sourceFile: string;
  sourceFunction: string;
  sourceKind: string;
  topY: number;
};

export type WorldPhysicsSurfaceRegistry = {
  solids: WorldPhysicsSolid[];
  walkableSurfaces: WorldPhysicsWalkableSurface[];
};

export type WorldPhysicsPoint = {
  x: number;
  y: number;
  z: number;
};

export type WorldPhysicsCollisionHit = {
  penetrationXZ: number;
  solid: WorldPhysicsSolid;
};

export type WorldPhysicsTraversalSurfaceCandidate = {
  elevationDelta: number;
  landingPosition: WorldPhysicsPoint;
  surface: WorldPhysicsWalkableSurface;
};

export type WorldPhysicsSolidTopLanding = {
  playerY: number;
  solid: WorldPhysicsSolid;
  topY: number;
};

export const WORLD_PHYSICS_PLAYER_SURFACE_OFFSET = 4;
export const WORLD_PHYSICS_GROUND_PLAYER_Y = 5;
export const WORLD_PHYSICS_DEFAULT_EDGE_SLACK = 6;
export const WORLD_PHYSICS_DEFAULT_Y_TOLERANCE = 10;

const WALKABLE_MIN_FOOTPRINT = 18;
const COLLISION_VERTICAL_FOOT_CLEARANCE = 0.75;
const COLLISION_HEAD_CLEARANCE = 2;
const LEFT_CIVILIZATION_MONUMENT_SOURCE_KIND = 'left-civilization-monument-mass';

const SOLID_LAYERS = new Set<WorldObjectLayer>([
  'booth',
  'city-mass',
  'city-tower',
  'mega-landmark',
  'stadium-pavilion',
  'stadium-structure',
  'stadium-tower',
]);

function normalizeRotation(rotation?: [number, number, number]): [number, number, number] {
  return rotation ?? [0, 0, 0];
}

function isFinitePositiveSize(size?: [number, number, number]): size is [number, number, number] {
  return Boolean(size && size.every((value) => Number.isFinite(value) && value > 0));
}

function resolveYawAabbSize(size: [number, number, number], rotation: [number, number, number]) {
  const yaw = rotation[1] ?? 0;
  const cos = Math.abs(Math.cos(yaw));
  const sin = Math.abs(Math.sin(yaw));
  const widthX = (size[0] * cos) + (size[2] * sin);
  const depthZ = (size[0] * sin) + (size[2] * cos);

  return [widthX, size[1], depthZ] as [number, number, number];
}

function resolveWorldPhysicsBoundsFromBox(box: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
}): WorldPhysicsBounds | null {
  if (!isFinitePositiveSize(box.size)) {
    return null;
  }

  const aabbSize = resolveYawAabbSize(box.size, normalizeRotation(box.rotation));
  const [centerX, centerY, centerZ] = box.position;
  const halfX = aabbSize[0] * 0.5;
  const halfY = aabbSize[1] * 0.5;
  const halfZ = aabbSize[2] * 0.5;

  return {
    maxX: centerX + halfX,
    maxY: centerY + halfY,
    maxZ: centerZ + halfZ,
    minX: centerX - halfX,
    minY: centerY - halfY,
    minZ: centerZ - halfZ,
  };
}

export function resolveWorldPhysicsBounds(entry: WorldObjectRegistryEntry): WorldPhysicsBounds | null {
  return resolveWorldPhysicsBoundsFromBox(entry);
}

function isPhysicsSolidEntry(entry: WorldObjectRegistryEntry) {
  return SOLID_LAYERS.has(entry.layer) && isFinitePositiveSize(entry.size);
}

function isPerimeterStructure(entry: WorldObjectRegistryEntry) {
  const role = entry.planningRole ?? '';
  return (
    role.includes('perimeter')
    || entry.sourceKind.includes('perimeter')
    || entry.id.includes('perimeter')
  );
}

function isNonWalkableSupportStructure(entry: WorldObjectRegistryEntry) {
  return (
    isPerimeterStructure(entry)
    || entry.sourceKind === LEFT_CIVILIZATION_MONUMENT_SOURCE_KIND
    || entry.sourceKind === 'tower-cluster-plinth-mass'
    || entry.id.endsWith('-tower-cluster-plinth')
    || (entry.sourceKind === 'tower-cluster-vertical-pilot-mass' && entry.id.includes('-core-'))
    || entry.sourceKind === 'city-screen-host-mass'
    || entry.planningRole === 'screen-host-shell'
    || entry.sourceKind === 'rear-campus-screen-host-shell'
  );
}

function resolvePhysicsBoxes(entry: WorldObjectRegistryEntry) {
  if (entry.physicsParts?.length) {
    return entry.physicsParts
      .filter((part) => isFinitePositiveSize(part.size))
      .map((part) => ({
        id: `${entry.id}:${part.id}`,
        partId: part.id,
        position: part.position,
        rotation: part.rotation,
        size: part.size,
        walkableTopOverride: part.walkableTop,
      }));
  }

  return [{
    id: entry.id,
    partId: undefined,
    position: entry.position,
    rotation: entry.rotation,
    size: entry.size,
    walkableTopOverride: undefined,
  }];
}

function shouldExposeWalkableTop(entry: WorldObjectRegistryEntry, bounds: WorldPhysicsBounds) {
  if (isNonWalkableSupportStructure(entry)) {
    return false;
  }

  const footprintX = bounds.maxX - bounds.minX;
  const footprintZ = bounds.maxZ - bounds.minZ;

  return (
    footprintX >= WALKABLE_MIN_FOOTPRINT
    && footprintZ >= WALKABLE_MIN_FOOTPRINT
    && bounds.maxY > 1
  );
}

export function buildWorldPhysicsSurfaceRegistry(
  entries: ReadonlyArray<WorldObjectRegistryEntry>,
): WorldPhysicsSurfaceRegistry {
  const solids: WorldPhysicsSolid[] = [];
  const walkableSurfaces: WorldPhysicsWalkableSurface[] = [];

  for (const entry of entries) {
    if (!isPhysicsSolidEntry(entry)) {
      continue;
    }

    for (const box of resolvePhysicsBoxes(entry)) {
      const bounds = resolveWorldPhysicsBoundsFromBox(box);
      if (!bounds || !box.size) {
        continue;
      }

      const resolvedWalkableTop = shouldExposeWalkableTop(entry, bounds);
      const walkableTop = box.walkableTopOverride ?? resolvedWalkableTop;
      const solid: WorldPhysicsSolid = {
        bounds,
        entryId: entry.id,
        id: box.id,
        layer: entry.layer,
        partId: box.partId,
        planningRole: entry.planningRole,
        planningZone: entry.planningZone,
        position: box.position,
        rotation: normalizeRotation(box.rotation),
        size: box.size,
        sourceFile: entry.sourceFile,
        sourceFunction: entry.sourceFunction,
        sourceKind: entry.sourceKind,
        walkableTop,
      };
      solids.push(solid);

      if (!walkableTop) {
        continue;
      }

      const footprintX = bounds.maxX - bounds.minX;
      const footprintZ = bounds.maxZ - bounds.minZ;
      const playerY = bounds.maxY + WORLD_PHYSICS_PLAYER_SURFACE_OFFSET;
      walkableSurfaces.push({
        bounds: {
          ...bounds,
          minY: playerY - WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
          maxY: playerY + WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
        },
        id: `${box.id}:top`,
        ownerId: box.id,
        ownerLayer: entry.layer,
        planningZone: entry.planningZone,
        playerY,
        position: [box.position[0], playerY, box.position[2]],
        size: [footprintX, footprintZ],
        sourceFile: entry.sourceFile,
        sourceFunction: entry.sourceFunction,
        sourceKind: entry.sourceKind,
        topY: bounds.maxY,
      });
    }
  }

  return {
    solids,
    walkableSurfaces: walkableSurfaces.filter((surface) => (
      findBlockingWorldPhysicsSolid(
        { x: surface.position[0], y: surface.playerY, z: surface.position[2] },
        solids,
        { radius: 1 },
      ) === null
    )),
  };
}

export function findBlockingWorldPhysicsSolid(
  playerPosition: WorldPhysicsPoint,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  options: {
    headClearance?: number;
    playerSurfaceOffset?: number;
    radius?: number;
  } = {},
): WorldPhysicsCollisionHit | null {
  const radius = options.radius ?? 1;
  const surfaceOffset = options.playerSurfaceOffset ?? WORLD_PHYSICS_PLAYER_SURFACE_OFFSET;
  const headClearance = options.headClearance ?? COLLISION_HEAD_CLEARANCE;
  const feetY = playerPosition.y - surfaceOffset;
  const headY = playerPosition.y + headClearance;

  const hits = solids.flatMap((solid) => {
    const bounds = solid.bounds;
    if (
      bounds.maxY <= feetY + COLLISION_VERTICAL_FOOT_CLEARANCE
      || bounds.minY >= headY
    ) {
      return [];
    }

    const overlapX = Math.min(
      playerPosition.x - (bounds.minX - radius),
      (bounds.maxX + radius) - playerPosition.x,
    );
    const overlapZ = Math.min(
      playerPosition.z - (bounds.minZ - radius),
      (bounds.maxZ + radius) - playerPosition.z,
    );
    if (overlapX <= 0 || overlapZ <= 0) {
      return [];
    }

    return [{
      penetrationXZ: Math.min(overlapX, overlapZ),
      solid,
    }];
  });

  return hits.sort((left, right) => right.penetrationXZ - left.penetrationXZ)[0] ?? null;
}

export function isWorldPhysicsPositionBlocked(
  playerPosition: WorldPhysicsPoint,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  options: Parameters<typeof findBlockingWorldPhysicsSolid>[2] = {},
) {
  return findBlockingWorldPhysicsSolid(playerPosition, solids, options) !== null;
}

export function isWorldPhysicsSurfacePlayerY(
  playerY: number,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  yTolerance = WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
) {
  return surfaces.some((surface) => Math.abs(playerY - surface.playerY) <= yTolerance);
}

export function isWorldPhysicsPositionOnWalkableSurface(
  playerPosition: WorldPhysicsPoint,
  playerY: number,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  options: {
    edgeSlack?: number;
    yTolerance?: number;
  } = {},
) {
  const yTolerance = options.yTolerance ?? WORLD_PHYSICS_DEFAULT_Y_TOLERANCE;

  return surfaces.some((surface) => (
    Math.abs(playerY - surface.playerY) <= yTolerance
    && isPointInsideWorldPhysicsWalkableSurface(playerPosition, surface, options.edgeSlack)
  ));
}

export function findCurrentWorldPhysicsSurfaceY(
  playerPosition: WorldPhysicsPoint,
  playerY: number,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  options: {
    edgeSlack?: number;
    yTolerance?: number;
  } = {},
) {
  const yTolerance = options.yTolerance ?? WORLD_PHYSICS_DEFAULT_Y_TOLERANCE;
  const surface = surfaces.find((candidate) => (
    Math.abs(playerY - candidate.playerY) <= yTolerance
    && isPointInsideWorldPhysicsWalkableSurface(playerPosition, candidate, options.edgeSlack)
  ));

  return surface?.playerY ?? null;
}

export function findCurrentWorldPhysicsSolidTopY(
  playerPosition: WorldPhysicsPoint,
  playerY: number,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  options: {
    edgeSlack?: number;
    radius?: number;
    yTolerance?: number;
  } = {},
) {
  const yTolerance = options.yTolerance ?? WORLD_PHYSICS_DEFAULT_Y_TOLERANCE;
  const solidTop = findClearWorldPhysicsSolidTopCandidate(
    playerPosition,
    playerY + yTolerance,
    playerY - yTolerance,
    solids,
    options,
  );

  return solidTop?.playerY ?? null;
}

export function findWorldPhysicsLandingY(
  playerPosition: WorldPhysicsPoint,
  fromY: number,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  options: {
    edgeSlack?: number;
    landingEpsilon?: number;
  } = {},
) {
  const landingEpsilon = options.landingEpsilon ?? 0.45;
  const lowerSurfaces = surfaces
    .filter((surface) => (
      surface.playerY < fromY - landingEpsilon
      && isPointInsideWorldPhysicsWalkableSurface(playerPosition, surface, options.edgeSlack)
    ))
    .sort((left, right) => right.playerY - left.playerY);

  return lowerSurfaces[0]?.playerY ?? WORLD_PHYSICS_GROUND_PLAYER_Y;
}

export function findWorldPhysicsSolidTopLanding(
  playerPosition: WorldPhysicsPoint,
  fromY: number,
  toY: number,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  options: {
    edgeSlack?: number;
    landingEpsilon?: number;
    radius?: number;
  } = {},
): WorldPhysicsSolidTopLanding | null {
  const landingEpsilon = options.landingEpsilon ?? 0.45;
  return findClearWorldPhysicsSolidTopCandidate(
    playerPosition,
    Math.max(fromY, toY) + landingEpsilon,
    Math.min(fromY, toY) - landingEpsilon,
    solids,
    options,
  );
}

export function findWorldPhysicsLandingSurface(
  playerPosition: WorldPhysicsPoint,
  fromY: number,
  toY: number,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  options: {
    edgeSlack?: number;
    landingEpsilon?: number;
  } = {},
) {
  const landingEpsilon = options.landingEpsilon ?? 0.45;
  const upperY = Math.max(fromY, toY);
  const lowerY = Math.min(fromY, toY);
  const crossedSurfaces = surfaces
    .filter((surface) => (
      surface.playerY <= upperY + landingEpsilon
      && surface.playerY >= lowerY - landingEpsilon
      && isPointInsideWorldPhysicsWalkableSurface(playerPosition, surface, options.edgeSlack)
    ))
    .sort((left, right) => right.playerY - left.playerY);

  return crossedSurfaces[0] ?? null;
}

export function findWorldPhysicsTraversalSurface({
  blockingSolidId,
  desiredPosition,
  edgeSlack = WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
  landingMargin = 1.25,
  maxElevationDelta,
  minElevationDelta = 0.5,
  playerPosition,
  surfaces,
}: {
  blockingSolidId?: string | null;
  desiredPosition: WorldPhysicsPoint;
  edgeSlack?: number;
  landingMargin?: number;
  maxElevationDelta: number;
  minElevationDelta?: number;
  playerPosition: WorldPhysicsPoint;
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>;
}): WorldPhysicsTraversalSurfaceCandidate | null {
  const candidates = surfaces.flatMap((surface) => {
    if (blockingSolidId && surface.ownerId !== blockingSolidId) {
      return [];
    }

    const elevationDelta = surface.playerY - playerPosition.y;
    if (
      elevationDelta <= minElevationDelta
      || elevationDelta > maxElevationDelta
      || !isPointInsideWorldPhysicsWalkableSurface(desiredPosition, surface, edgeSlack)
    ) {
      return [];
    }

    return [{
      elevationDelta,
      landingPosition: {
        x: clampToSurfaceAxis(desiredPosition.x, surface.bounds.minX, surface.bounds.maxX, landingMargin),
        y: surface.playerY,
        z: clampToSurfaceAxis(desiredPosition.z, surface.bounds.minZ, surface.bounds.maxZ, landingMargin),
      },
      surface,
    }];
  });

  return candidates.sort((left, right) => (
    left.elevationDelta - right.elevationDelta
    || distanceSq2D(left.landingPosition, playerPosition) - distanceSq2D(right.landingPosition, playerPosition)
  ))[0] ?? null;
}

function isPointInsideWorldPhysicsWalkableSurface(
  playerPosition: WorldPhysicsPoint,
  surface: WorldPhysicsWalkableSurface,
  edgeSlack = WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
) {
  return (
    playerPosition.x >= surface.bounds.minX - edgeSlack
    && playerPosition.x <= surface.bounds.maxX + edgeSlack
    && playerPosition.z >= surface.bounds.minZ - edgeSlack
    && playerPosition.z <= surface.bounds.maxZ + edgeSlack
  );
}

function findClearWorldPhysicsSolidTopCandidate(
  playerPosition: WorldPhysicsPoint,
  upperY: number,
  lowerY: number,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  options: {
    edgeSlack?: number;
    radius?: number;
  } = {},
): WorldPhysicsSolidTopLanding | null {
  const edgeSlack = options.edgeSlack ?? 0;
  const radius = options.radius ?? 1;
  const candidates = solids
    .map((solid) => {
      const playerY = solid.bounds.maxY + WORLD_PHYSICS_PLAYER_SURFACE_OFFSET;
      return { playerY, solid, topY: solid.bounds.maxY };
    })
    .filter((candidate) => (
      candidate.playerY <= upperY
      && candidate.playerY >= lowerY
      && isPointInsideWorldPhysicsSolidTop(playerPosition, candidate.solid, edgeSlack)
      && findBlockingWorldPhysicsSolid(
        { x: playerPosition.x, y: candidate.playerY, z: playerPosition.z },
        solids,
        { radius },
      ) === null
    ))
    .sort((left, right) => right.playerY - left.playerY);

  return candidates[0] ?? null;
}

function isPointInsideWorldPhysicsSolidTop(
  playerPosition: WorldPhysicsPoint,
  solid: WorldPhysicsSolid,
  edgeSlack = 0,
) {
  return (
    playerPosition.x >= solid.bounds.minX - edgeSlack
    && playerPosition.x <= solid.bounds.maxX + edgeSlack
    && playerPosition.z >= solid.bounds.minZ - edgeSlack
    && playerPosition.z <= solid.bounds.maxZ + edgeSlack
  );
}

function clampToSurfaceAxis(value: number, min: number, max: number, margin: number) {
  if (max - min <= margin * 2) {
    return (min + max) * 0.5;
  }

  return Math.min(max - margin, Math.max(min + margin, value));
}

function distanceSq2D(left: WorldPhysicsPoint, right: WorldPhysicsPoint) {
  const dx = left.x - right.x;
  const dz = left.z - right.z;
  return (dx * dx) + (dz * dz);
}
