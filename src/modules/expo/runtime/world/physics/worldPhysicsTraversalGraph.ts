import {
  WORLD_PHYSICS_GROUND_PLAYER_Y,
  type WorldPhysicsBounds,
  type WorldPhysicsSurfaceRegistry,
  type WorldPhysicsWalkableSurface,
} from './worldPhysicsSurfaceRegistry';

export type WorldPhysicsTraversalNode =
  | {
      id: 'ground';
      kind: 'ground';
      playerY: number;
    }
  | {
      bounds: WorldPhysicsBounds;
      id: string;
      kind: 'surface';
      ownerId: string;
      ownerLayer: WorldPhysicsWalkableSurface['ownerLayer'];
      playerY: number;
      sourceFile: string;
      sourceKind: string;
    };

export type WorldPhysicsTraversalEdge = {
  elevationDelta: number;
  from: string;
  horizontalGap: number;
  kind: 'drop' | 'mantle' | 'same-level' | 'step-up';
  to: string;
};

export type WorldPhysicsTraversalGraph = {
  edges: WorldPhysicsTraversalEdge[];
  nodes: WorldPhysicsTraversalNode[];
  reachableNodeIds: string[];
  summary: {
    dropEdges: number;
    mantleEdges: number;
    reachableSurfaces: number;
    sameLevelEdges: number;
    stepUpEdges: number;
    surfaceCount: number;
    unreachableSurfaces: number;
  };
  unreachableSurfaceIds: string[];
};

export type WorldPhysicsTraversalGraphOptions = {
  groundPlayerY?: number;
  horizontalReach?: number;
  mantleMaxDelta?: number;
  sameLevelYTolerance?: number;
  stepUpMaxDelta?: number;
};

const DEFAULT_HORIZONTAL_REACH = 18;
const DEFAULT_MANTLE_MAX_DELTA = 112;
const DEFAULT_SAME_LEVEL_Y_TOLERANCE = 4;
const DEFAULT_STEP_UP_MAX_DELTA = 24;

export function buildWorldPhysicsTraversalGraph(
  registry: WorldPhysicsSurfaceRegistry,
  options: WorldPhysicsTraversalGraphOptions = {},
): WorldPhysicsTraversalGraph {
  const groundPlayerY = options.groundPlayerY ?? WORLD_PHYSICS_GROUND_PLAYER_Y;
  const horizontalReach = options.horizontalReach ?? DEFAULT_HORIZONTAL_REACH;
  const mantleMaxDelta = options.mantleMaxDelta ?? DEFAULT_MANTLE_MAX_DELTA;
  const sameLevelYTolerance = options.sameLevelYTolerance ?? DEFAULT_SAME_LEVEL_Y_TOLERANCE;
  const stepUpMaxDelta = options.stepUpMaxDelta ?? DEFAULT_STEP_UP_MAX_DELTA;
  const surfaceNodes: WorldPhysicsTraversalNode[] = registry.walkableSurfaces.map((surface) => ({
    bounds: surface.bounds,
    id: surface.id,
    kind: 'surface',
    ownerId: surface.ownerId,
    ownerLayer: surface.ownerLayer,
    playerY: surface.playerY,
    sourceFile: surface.sourceFile,
    sourceKind: surface.sourceKind,
  }));
  const nodes: WorldPhysicsTraversalNode[] = [
    { id: 'ground', kind: 'ground', playerY: groundPlayerY },
    ...surfaceNodes,
  ];
  const edges: WorldPhysicsTraversalEdge[] = [];

  for (const surface of registry.walkableSurfaces) {
    const deltaFromGround = surface.playerY - groundPlayerY;
    const upKind = resolveTraversalUpKind(deltaFromGround, stepUpMaxDelta, mantleMaxDelta);
    if (upKind) {
      edges.push({
        elevationDelta: deltaFromGround,
        from: 'ground',
        horizontalGap: 0,
        kind: upKind,
        to: surface.id,
      });
    }

    if (deltaFromGround > sameLevelYTolerance) {
      edges.push({
        elevationDelta: -deltaFromGround,
        from: surface.id,
        horizontalGap: 0,
        kind: 'drop',
        to: 'ground',
      });
    }
  }

  for (let leftIndex = 0; leftIndex < registry.walkableSurfaces.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < registry.walkableSurfaces.length; rightIndex += 1) {
      const left = registry.walkableSurfaces[leftIndex];
      const right = registry.walkableSurfaces[rightIndex];
      const horizontalGap = resolveBoundsHorizontalGap(left.bounds, right.bounds);
      if (horizontalGap > horizontalReach) {
        continue;
      }

      pushSurfaceTraversalEdges({
        edges,
        from: left,
        horizontalGap,
        mantleMaxDelta,
        sameLevelYTolerance,
        stepUpMaxDelta,
        to: right,
      });
      pushSurfaceTraversalEdges({
        edges,
        from: right,
        horizontalGap,
        mantleMaxDelta,
        sameLevelYTolerance,
        stepUpMaxDelta,
        to: left,
      });
    }
  }

  const reachableNodeIds = resolveReachableNodeIds(edges, 'ground');
  const reachableNodeIdSet = new Set(reachableNodeIds);
  const unreachableSurfaceIds = registry.walkableSurfaces
    .map((surface) => surface.id)
    .filter((id) => !reachableNodeIdSet.has(id));

  return {
    edges,
    nodes,
    reachableNodeIds,
    summary: {
      dropEdges: edges.filter((edge) => edge.kind === 'drop').length,
      mantleEdges: edges.filter((edge) => edge.kind === 'mantle').length,
      reachableSurfaces: registry.walkableSurfaces.length - unreachableSurfaceIds.length,
      sameLevelEdges: edges.filter((edge) => edge.kind === 'same-level').length,
      stepUpEdges: edges.filter((edge) => edge.kind === 'step-up').length,
      surfaceCount: registry.walkableSurfaces.length,
      unreachableSurfaces: unreachableSurfaceIds.length,
    },
    unreachableSurfaceIds,
  };
}

function pushSurfaceTraversalEdges({
  edges,
  from,
  horizontalGap,
  mantleMaxDelta,
  sameLevelYTolerance,
  stepUpMaxDelta,
  to,
}: {
  edges: WorldPhysicsTraversalEdge[];
  from: WorldPhysicsWalkableSurface;
  horizontalGap: number;
  mantleMaxDelta: number;
  sameLevelYTolerance: number;
  stepUpMaxDelta: number;
  to: WorldPhysicsWalkableSurface;
}) {
  const delta = to.playerY - from.playerY;
  if (Math.abs(delta) <= sameLevelYTolerance) {
    edges.push({
      elevationDelta: delta,
      from: from.id,
      horizontalGap,
      kind: 'same-level',
      to: to.id,
    });
    return;
  }

  if (delta < 0) {
    edges.push({
      elevationDelta: delta,
      from: from.id,
      horizontalGap,
      kind: 'drop',
      to: to.id,
    });
    return;
  }

  const upKind = resolveTraversalUpKind(delta, stepUpMaxDelta, mantleMaxDelta);
  if (upKind) {
    edges.push({
      elevationDelta: delta,
      from: from.id,
      horizontalGap,
      kind: upKind,
      to: to.id,
    });
  }
}

function resolveTraversalUpKind(
  elevationDelta: number,
  stepUpMaxDelta: number,
  mantleMaxDelta: number,
) {
  if (elevationDelta <= 0) {
    return null;
  }

  if (elevationDelta <= stepUpMaxDelta) {
    return 'step-up' as const;
  }

  if (elevationDelta <= mantleMaxDelta) {
    return 'mantle' as const;
  }

  return null;
}

function resolveBoundsHorizontalGap(left: WorldPhysicsBounds, right: WorldPhysicsBounds) {
  const gapX = Math.max(0, Math.max(left.minX - right.maxX, right.minX - left.maxX));
  const gapZ = Math.max(0, Math.max(left.minZ - right.maxZ, right.minZ - left.maxZ));
  return Math.hypot(gapX, gapZ);
}

function resolveReachableNodeIds(edges: ReadonlyArray<WorldPhysicsTraversalEdge>, startId: string) {
  const reachable = new Set<string>([startId]);
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const edge of edges) {
      if (edge.from !== current || reachable.has(edge.to)) {
        continue;
      }

      reachable.add(edge.to);
      queue.push(edge.to);
    }
  }

  return Array.from(reachable);
}
