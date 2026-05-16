import type { ExpoVerticalAccessMode, ExpoVerticalAccessNode, ExpoVerticalLevelId } from '../../planning/types';
import {
  WORLD_PHYSICS_GROUND_PLAYER_Y,
  WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
} from './worldPhysicsSurfaceRegistry';
import type { WorldPhysicsAccessAudit, WorldPhysicsAccessRecommendation } from './worldPhysicsAccessAudit';

export const WORLD_PHYSICS_ACCESS_RECOMMENDATION_LIMIT = 36;

const NON_PLAYER_ACCESS_SOURCE_KINDS = new Set([
  'city-screen-host-mass',
  'rear-campus-screen-host-shell',
]);

export function buildWorldPhysicsVerticalAccessNodes(
  audit: WorldPhysicsAccessAudit,
  options: {
    maxRecommendations?: number;
  } = {},
): ExpoVerticalAccessNode[] {
  const maxRecommendations = options.maxRecommendations ?? WORLD_PHYSICS_ACCESS_RECOMMENDATION_LIMIT;

  return audit.recommendations
    .filter(shouldCreateVerticalAccessNode)
    .slice(0, maxRecommendations)
    .flatMap((recommendation) => buildAccessNodePair(recommendation));
}

function shouldCreateVerticalAccessNode(recommendation: WorldPhysicsAccessRecommendation) {
  return !NON_PLAYER_ACCESS_SOURCE_KINDS.has(recommendation.sourceKind);
}

function buildAccessNodePair(recommendation: WorldPhysicsAccessRecommendation): ExpoVerticalAccessNode[] {
  const idBase = `physics-access-${sanitizeAccessId(recommendation.ownerId)}`;
  const zoneId = recommendation.planningZone ?? 'physics-access';
  const mode = recommendation.accessKind satisfies ExpoVerticalAccessMode;
  const sourceLevel = resolveVerticalLevelFromPlayerY(recommendation.anchorPosition[1]);
  const targetLevel = resolveTargetLevel(recommendation);
  const radius = resolveAccessRadius(recommendation);
  const targetPadY = Math.max(0.25, recommendation.targetPosition[1] - WORLD_PHYSICS_PLAYER_SURFACE_OFFSET);

  return [
    {
      autoActivate: false,
      id: `${idBase}-up`,
      label: `${labelAccessMode(mode)} to ${compactOwnerLabel(recommendation.ownerId)}`,
      level: sourceLevel,
      mode,
      position: [recommendation.anchorPosition[0], 0.25, recommendation.anchorPosition[2]],
      radius,
      targetLevel,
      targetPosition: recommendation.targetPosition,
      zoneId,
    },
    {
      autoActivate: false,
      id: `${idBase}-down`,
      label: `${labelAccessMode(mode)} return ${compactOwnerLabel(recommendation.ownerId)}`,
      level: targetLevel,
      mode,
      position: [recommendation.targetPosition[0], targetPadY, recommendation.targetPosition[2]],
      radius: Math.max(18, Math.min(radius, 28)),
      targetLevel: sourceLevel,
      targetPosition: [
        recommendation.anchorPosition[0],
        WORLD_PHYSICS_GROUND_PLAYER_Y,
        recommendation.anchorPosition[2],
      ],
      zoneId,
    },
  ];
}

function resolveAccessRadius(recommendation: WorldPhysicsAccessRecommendation) {
  if (recommendation.accessKind === 'lift') {
    return recommendation.priority === 'high' ? 34 : 28;
  }

  if (recommendation.accessKind === 'ramp') {
    return 30;
  }

  return 22;
}

function resolveVerticalLevelFromPlayerY(playerY: number): ExpoVerticalLevelId {
  if (playerY <= WORLD_PHYSICS_GROUND_PLAYER_Y + 18) {
    return 'ground';
  }

  if (playerY < 96) {
    return 'level-1';
  }

  if (playerY < 144) {
    return 'level-2';
  }

  if (playerY < 216) {
    return 'roof';
  }

  return 'tower';
}

function resolveTargetLevel(recommendation: WorldPhysicsAccessRecommendation): ExpoVerticalLevelId {
  if (
    recommendation.ownerLayer === 'city-tower'
    || recommendation.ownerLayer === 'stadium-tower'
    || recommendation.ownerLayer === 'mega-landmark'
  ) {
    return 'tower';
  }

  return resolveVerticalLevelFromPlayerY(recommendation.targetPosition[1]);
}

function labelAccessMode(mode: ExpoVerticalAccessMode) {
  switch (mode) {
    case 'ladder':
      return 'Ladder';
    case 'ramp':
      return 'Ramp';
    case 'stair':
      return 'Stair';
    case 'jump-pad':
      return 'Jump';
    case 'lift':
    default:
      return 'Lift';
  }
}

function compactOwnerLabel(ownerId: string) {
  return ownerId
    .replace(/^mega-landmark-/, '')
    .replace(/^rear-campus-/, '')
    .replace(/^signature-mega-/, '')
    .replace(/-/g, ' ')
    .slice(0, 34);
}

function sanitizeAccessId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
