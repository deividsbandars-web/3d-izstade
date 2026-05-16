import {
  WORLD_PHYSICS_GROUND_PLAYER_Y,
  type WorldPhysicsSurfaceRegistry,
  type WorldPhysicsWalkableSurface,
} from './worldPhysicsSurfaceRegistry';
import type { WorldPhysicsTraversalGraph } from './worldPhysicsTraversalGraph';

export type WorldPhysicsAccessKind = 'ladder' | 'lift' | 'ramp';

export type WorldPhysicsAccessRecommendation = {
  accessKind: WorldPhysicsAccessKind;
  anchorPosition: [number, number, number];
  elevationDelta: number;
  ownerId: string;
  ownerLayer: WorldPhysicsWalkableSurface['ownerLayer'];
  planningZone: string | null;
  priority: 'high' | 'medium';
  reason: string;
  sourceFile: string;
  sourceKind: string;
  surfaceId: string;
  targetPosition: [number, number, number];
};

export type WorldPhysicsAccessAudit = {
  recommendations: WorldPhysicsAccessRecommendation[];
  summary: {
    highPriority: number;
    ladder: number;
    lift: number;
    mediumPriority: number;
    ramp: number;
    recommendationCount: number;
    unreachableSurfaceCount: number;
  };
};

export function buildWorldPhysicsAccessAudit({
  groundPlayerY = WORLD_PHYSICS_GROUND_PLAYER_Y,
  registry,
  traversalGraph,
}: {
  groundPlayerY?: number;
  registry: WorldPhysicsSurfaceRegistry;
  traversalGraph: WorldPhysicsTraversalGraph;
}): WorldPhysicsAccessAudit {
  const surfaceById = new Map(registry.walkableSurfaces.map((surface) => [surface.id, surface]));
  const recommendations = traversalGraph.unreachableSurfaceIds
    .map((surfaceId) => surfaceById.get(surfaceId) ?? null)
    .filter((surface): surface is WorldPhysicsWalkableSurface => Boolean(surface))
    .map((surface) => buildAccessRecommendation(surface, groundPlayerY))
    .sort((left, right) => (
      priorityWeight(right.priority) - priorityWeight(left.priority)
      || right.elevationDelta - left.elevationDelta
      || left.surfaceId.localeCompare(right.surfaceId)
    ));

  return {
    recommendations,
    summary: {
      highPriority: recommendations.filter((item) => item.priority === 'high').length,
      ladder: recommendations.filter((item) => item.accessKind === 'ladder').length,
      lift: recommendations.filter((item) => item.accessKind === 'lift').length,
      mediumPriority: recommendations.filter((item) => item.priority === 'medium').length,
      ramp: recommendations.filter((item) => item.accessKind === 'ramp').length,
      recommendationCount: recommendations.length,
      unreachableSurfaceCount: traversalGraph.unreachableSurfaceIds.length,
    },
  };
}

function buildAccessRecommendation(
  surface: WorldPhysicsWalkableSurface,
  groundPlayerY: number,
): WorldPhysicsAccessRecommendation {
  const elevationDelta = surface.playerY - groundPlayerY;
  const accessKind = resolveAccessKind(surface, elevationDelta);
  const footprintMin = Math.min(surface.size[0], surface.size[1]);
  const priority = resolveAccessPriority(surface, elevationDelta);

  return {
    accessKind,
    anchorPosition: resolveAccessAnchorPosition(surface, groundPlayerY),
    elevationDelta,
    ownerId: surface.ownerId,
    ownerLayer: surface.ownerLayer,
    planningZone: surface.planningZone,
    priority,
    reason: resolveAccessReason(accessKind, elevationDelta, footprintMin, surface),
    sourceFile: surface.sourceFile,
    sourceKind: surface.sourceKind,
    surfaceId: surface.id,
    targetPosition: surface.position,
  };
}

function resolveAccessKind(
  surface: WorldPhysicsWalkableSurface,
  elevationDelta: number,
): WorldPhysicsAccessKind {
  if (
    elevationDelta >= 180
    || surface.ownerLayer === 'city-tower'
    || surface.ownerLayer === 'stadium-tower'
    || surface.ownerLayer === 'mega-landmark'
  ) {
    return 'lift';
  }

  const footprintMin = Math.min(surface.size[0], surface.size[1]);
  if (elevationDelta <= 130 && footprintMin >= 48) {
    return 'ramp';
  }

  return 'ladder';
}

function resolveAccessPriority(
  surface: WorldPhysicsWalkableSurface,
  elevationDelta: number,
): WorldPhysicsAccessRecommendation['priority'] {
  return (
    elevationDelta >= 130
    || surface.ownerLayer === 'city-tower'
    || surface.ownerLayer === 'stadium-tower'
    || surface.ownerLayer === 'mega-landmark'
  )
    ? 'high'
    : 'medium';
}

function resolveAccessReason(
  accessKind: WorldPhysicsAccessKind,
  elevationDelta: number,
  footprintMin: number,
  surface: WorldPhysicsWalkableSurface,
) {
  if (accessKind === 'lift') {
    return `Unreachable high-value vertical surface (${surface.ownerLayer}) at +${Math.round(elevationDelta)} playerY; use a lift for reliable two-way access.`;
  }

  if (accessKind === 'ramp') {
    return `Unreachable broad mid-height surface with ${Math.round(footprintMin)} min footprint; ramp/stair access keeps movement readable.`;
  }

  return `Unreachable narrow mid-height surface at +${Math.round(elevationDelta)} playerY; ladder access is the lowest-footprint fix.`;
}

function resolveAccessAnchorPosition(
  surface: WorldPhysicsWalkableSurface,
  groundPlayerY: number,
): [number, number, number] {
  const centerX = surface.position[0];
  const centerZ = surface.position[2];
  const towardOriginX = -centerX;
  const towardOriginZ = -centerZ;
  const margin = 7.5;

  if (Math.abs(towardOriginX) >= Math.abs(towardOriginZ)) {
    const sideX = towardOriginX >= 0
      ? surface.bounds.minX - margin
      : surface.bounds.maxX + margin;
    return [sideX, groundPlayerY, centerZ];
  }

  const sideZ = towardOriginZ >= 0
    ? surface.bounds.minZ - margin
    : surface.bounds.maxZ + margin;
  return [centerX, groundPlayerY, sideZ];
}

function priorityWeight(priority: WorldPhysicsAccessRecommendation['priority']) {
  return priority === 'high' ? 2 : 1;
}
