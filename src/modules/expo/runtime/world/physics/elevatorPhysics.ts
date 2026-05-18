import type { ExpoVerticalElevatorRoute } from '../../planning/types';
import {
  buildElevatorRouteSegments,
  getElevatorRouteTotalLength,
  resolveElevatorRideableFootprint,
  resolveElevatorRideablePlayerY,
  resolveElevatorRoutePosition,
  type ExpoVerticalElevatorRouteSegment,
} from '../../planning/vertical/elevatorRouteMotion';
import {
  WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
  WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
  type WorldPhysicsSolid,
  type WorldPhysicsWalkableSurface,
} from './worldPhysicsSurfaceRegistry';

export const RIDEABLE_ELEVATOR_EDGE_SLACK = 5;
export const RIDEABLE_ELEVATOR_FLOOR_THICKNESS = 10;
export const RIDEABLE_ELEVATOR_WALL_THICKNESS = 7;

export type RideableElevatorRuntimeRoute = {
  fallbackPosition: [number, number, number];
  route: ExpoVerticalElevatorRoute;
  segments: ExpoVerticalElevatorRouteSegment[];
  totalLength: number;
};

export type RideableElevatorHit = {
  playerY: number;
  position: [number, number, number];
  route: ExpoVerticalElevatorRoute;
};

export type RideableElevatorPhysicalLayout = {
  floorCenterOffsetY: number;
  floorPlayerOffsetY: number;
  floorSize: [number, number, number];
  sideWallCenterOffsetY: number;
  sideWallHeight: number;
  sideWallOffsetX: number;
  sideWallSize: [number, number, number];
};

type ElevatorPhysicsPoint = {
  x: number;
  y?: number;
  z: number;
};

export function buildRideableElevatorRuntimeRoutes(
  routes: ReadonlyArray<ExpoVerticalElevatorRoute>,
): RideableElevatorRuntimeRoute[] {
  return routes
    .filter((route) => Boolean(route.rideable))
    .map((route) => {
      const segments = buildElevatorRouteSegments(route.waypoints);
      return {
        fallbackPosition: route.waypoints[0] ?? [0, 0, 0],
        route,
        segments,
        totalLength: getElevatorRouteTotalLength(segments),
      };
    });
}

export function resolveRideableElevatorPhysicalLayout(route: ExpoVerticalElevatorRoute): RideableElevatorPhysicalLayout {
  const footprint = resolveElevatorRideableFootprint(route);
  const floorPlayerOffsetY = route.rideable?.floorPlayerOffsetY
    ?? ((route.cabinSize[1] * -0.5) + 12);
  const floorTopOffsetY = floorPlayerOffsetY - WORLD_PHYSICS_PLAYER_SURFACE_OFFSET;
  const floorCenterOffsetY = floorTopOffsetY - (RIDEABLE_ELEVATOR_FLOOR_THICKNESS * 0.5);
  const sideWallHeight = Math.max(54, route.cabinSize[1] * 0.76);

  return {
    floorCenterOffsetY,
    floorPlayerOffsetY,
    floorSize: [footprint[0], RIDEABLE_ELEVATOR_FLOOR_THICKNESS, footprint[1]],
    sideWallCenterOffsetY: floorTopOffsetY + (sideWallHeight * 0.5),
    sideWallHeight,
    sideWallOffsetX: (footprint[0] * 0.5) + (RIDEABLE_ELEVATOR_WALL_THICKNESS * 0.5),
    sideWallSize: [
      RIDEABLE_ELEVATOR_WALL_THICKNESS,
      sideWallHeight,
      footprint[1] + (RIDEABLE_ELEVATOR_WALL_THICKNESS * 1.6),
    ],
  };
}

export function resolveRideableElevatorHit(
  playerPosition: ElevatorPhysicsPoint,
  elapsedTime: number,
  runtimeRoute: RideableElevatorRuntimeRoute,
) {
  const cabinPosition = resolveRideableElevatorCabinPosition(elapsedTime, runtimeRoute);
  const footprint = resolveElevatorRideableFootprint(runtimeRoute.route);
  const halfWidth = (footprint[0] * 0.5) + RIDEABLE_ELEVATOR_EDGE_SLACK;
  const halfDepth = (footprint[1] * 0.5) + RIDEABLE_ELEVATOR_EDGE_SLACK;

  if (
    Math.abs(playerPosition.x - cabinPosition[0]) > halfWidth
    || Math.abs(playerPosition.z - cabinPosition[2]) > halfDepth
  ) {
    return null;
  }

  return {
    playerY: resolveElevatorRideablePlayerY(runtimeRoute.route, cabinPosition[1]),
    position: cabinPosition,
    route: runtimeRoute.route,
  } satisfies RideableElevatorHit;
}

export function findCurrentRideableElevator(
  playerPosition: ElevatorPhysicsPoint,
  playerY: number,
  elapsedTime: number,
  runtimeRoutes: ReadonlyArray<RideableElevatorRuntimeRoute>,
) {
  const hits = runtimeRoutes
    .map((runtimeRoute) => resolveRideableElevatorHit(playerPosition, elapsedTime, runtimeRoute))
    .filter((hit): hit is RideableElevatorHit => Boolean(hit))
    .filter((hit) => Math.abs(playerY - hit.playerY) <= (hit.route.rideable?.pickupToleranceY ?? 14))
    .sort((left, right) => Math.abs(playerY - left.playerY) - Math.abs(playerY - right.playerY));

  return hits[0] ?? null;
}

export function findAttachedRideableElevator(
  playerPosition: ElevatorPhysicsPoint,
  elapsedTime: number,
  runtimeRoutes: ReadonlyArray<RideableElevatorRuntimeRoute>,
  routeId: string | null,
) {
  if (!routeId) {
    return null;
  }

  const runtimeRoute = runtimeRoutes.find((candidate) => candidate.route.id === routeId);
  if (!runtimeRoute) {
    return null;
  }

  return resolveRideableElevatorHit(playerPosition, elapsedTime, runtimeRoute);
}

export function findRideableElevatorLandingY(
  playerPosition: ElevatorPhysicsPoint,
  fromY: number,
  toY: number,
  elapsedTime: number,
  runtimeRoutes: ReadonlyArray<RideableElevatorRuntimeRoute>,
) {
  const upperY = Math.max(fromY, toY);
  const lowerY = Math.min(fromY, toY);
  const landings = runtimeRoutes
    .map((runtimeRoute) => resolveRideableElevatorHit(playerPosition, elapsedTime, runtimeRoute))
    .filter((hit): hit is RideableElevatorHit => Boolean(hit))
    .filter((hit) => hit.playerY <= upperY + 0.45 && hit.playerY >= lowerY - 0.45)
    .sort((left, right) => right.playerY - left.playerY);

  return landings[0]?.playerY ?? null;
}

export function buildRideableElevatorPhysicsFrame(
  elapsedTime: number,
  runtimeRoutes: ReadonlyArray<RideableElevatorRuntimeRoute>,
) {
  const solids: WorldPhysicsSolid[] = [];
  const walkableSurfaces: WorldPhysicsWalkableSurface[] = [];

  for (const runtimeRoute of runtimeRoutes) {
    const cabinPosition = resolveRideableElevatorCabinPosition(elapsedTime, runtimeRoute);
    const layout = resolveRideableElevatorPhysicalLayout(runtimeRoute.route);
    const floorTopY = cabinPosition[1] + layout.floorCenterOffsetY + (layout.floorSize[1] * 0.5);
    const playerY = floorTopY + WORLD_PHYSICS_PLAYER_SURFACE_OFFSET;
    const floorSolid = createElevatorSolid({
      id: `${runtimeRoute.route.id}:dynamic-cabin-floor`,
      partId: 'floor',
      position: [cabinPosition[0], cabinPosition[1] + layout.floorCenterOffsetY, cabinPosition[2]],
      route: runtimeRoute.route,
      size: layout.floorSize,
      sourceKind: 'vertical-elevator-cabin-floor',
      walkableTop: true,
    });
    solids.push(floorSolid);
    walkableSurfaces.push({
      bounds: {
        ...floorSolid.bounds,
        minY: playerY - WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
        maxY: playerY + WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
      },
      id: `${floorSolid.id}:top`,
      ownerId: floorSolid.id,
      ownerLayer: floorSolid.layer,
      planningZone: runtimeRoute.route.zoneId,
      playerY,
      position: [cabinPosition[0], playerY, cabinPosition[2]],
      size: [layout.floorSize[0], layout.floorSize[2]],
      sourceFile: floorSolid.sourceFile,
      sourceFunction: floorSolid.sourceFunction,
      sourceKind: floorSolid.sourceKind,
      topY: floorTopY,
    });

    for (const side of [-1, 1] as const) {
      solids.push(createElevatorSolid({
        id: `${runtimeRoute.route.id}:dynamic-cabin-side-wall-${side < 0 ? 'left' : 'right'}`,
        partId: side < 0 ? 'left-wall' : 'right-wall',
        position: [
          cabinPosition[0] + (layout.sideWallOffsetX * side),
          cabinPosition[1] + layout.sideWallCenterOffsetY,
          cabinPosition[2],
        ],
        route: runtimeRoute.route,
        size: layout.sideWallSize,
        sourceKind: 'vertical-elevator-cabin-side-wall',
        walkableTop: false,
      }));
    }
  }

  return { solids, walkableSurfaces };
}

function resolveRideableElevatorCabinPosition(
  elapsedTime: number,
  runtimeRoute: RideableElevatorRuntimeRoute,
) {
  return resolveElevatorRoutePosition({
    elapsedTime,
    fallbackPosition: runtimeRoute.fallbackPosition,
    route: runtimeRoute.route,
    segments: runtimeRoute.segments,
    totalLength: runtimeRoute.totalLength,
  });
}

function createElevatorSolid({
  id,
  partId,
  position,
  route,
  size,
  sourceKind,
  walkableTop,
}: {
  id: string;
  partId: string;
  position: [number, number, number];
  route: ExpoVerticalElevatorRoute;
  size: [number, number, number];
  sourceKind: string;
  walkableTop: boolean;
}): WorldPhysicsSolid {
  const halfX = size[0] * 0.5;
  const halfY = size[1] * 0.5;
  const halfZ = size[2] * 0.5;

  return {
    bounds: {
      maxX: position[0] + halfX,
      maxY: position[1] + halfY,
      maxZ: position[2] + halfZ,
      minX: position[0] - halfX,
      minY: position[1] - halfY,
      minZ: position[2] - halfZ,
    },
    entryId: route.id,
    id,
    layer: 'vertical-elevator-route',
    partId,
    planningRole: 'rideable-elevator-cabin',
    planningZone: route.zoneId,
    position,
    rotation: [0, 0, 0],
    size,
    sourceFile: 'src/modules/expo/runtime/planning/vertical/verticalCitySystem.ts',
    sourceFunction: 'EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes',
    sourceKind,
    walkableTop,
  };
}
