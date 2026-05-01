import type { WorldObjectLayer, WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';
import type { ReviewOperatorZone } from './reviewOperatorSession';

type ZoneValidationContext = {
  centerTargetEntry: WorldObjectRegistryEntry | null;
  clickTargetEntry: WorldObjectRegistryEntry | null;
  inspectorEntries: Array<{
    distance: number;
    id: string;
    layer: WorldObjectLayer;
    registryEntry: WorldObjectRegistryEntry | null;
  }>;
  playerPos: number[];
  registryById: Record<string, WorldObjectRegistryEntry>;
};

const ZONE_LOCATION_SETTLE_RADIUS = 180;

function getZoneLocationDistance(
  playerPos: number[],
  zone: ReviewOperatorZone,
): number {
  const [playerX, , playerZ] = playerPos;
  const [positionX, , positionZ] = zone.startView.position;
  const [lookAtX, , lookAtZ] = zone.startView.lookAt;

  const distanceToPosition = Math.hypot(playerX - positionX, playerZ - positionZ);
  const distanceToLookAt = Math.hypot(playerX - lookAtX, playerZ - lookAtZ);
  return Math.min(distanceToPosition, distanceToLookAt);
}

export type ZoneReviewValidation = {
  actualKeyObjectIds: string[];
  actualVisibleLayers: WorldObjectLayer[];
  extraVisibleLayers: WorldObjectLayer[];
  forbiddenExpectedLayersPresent: WorldObjectLayer[];
  forbiddenObjectIdsPresent: string[];
  locationDistance: number;
  locationStatus: 'mismatch' | 'settled';
  missingExpectedLayers: WorldObjectLayer[];
  missingExpectedObjectIds: string[];
  status: 'ok' | 'warning';
  unknownExpectedObjectIds: string[];
  zoneId: string;
};

export function validateReviewZone(
  zone: ReviewOperatorZone,
  context: ZoneValidationContext,
): ZoneReviewValidation {
  const dedupedEntries = new Map<string, WorldObjectRegistryEntry>();

  for (const entry of context.inspectorEntries) {
    if (entry.registryEntry) {
      dedupedEntries.set(entry.registryEntry.id, entry.registryEntry);
    }
  }

  if (context.centerTargetEntry) {
    dedupedEntries.set(context.centerTargetEntry.id, context.centerTargetEntry);
  }

  if (context.clickTargetEntry) {
    dedupedEntries.set(context.clickTargetEntry.id, context.clickTargetEntry);
  }

  const actualEntries = Array.from(dedupedEntries.values());
  const actualKeyObjectIds = actualEntries.map((entry) => entry.id);
  const actualVisibleLayers: WorldObjectLayer[] = Array.from(new Set(actualEntries.map((entry) => entry.layer)));
  const locationDistance = getZoneLocationDistance(context.playerPos, zone);
  const locationStatus = locationDistance <= ZONE_LOCATION_SETTLE_RADIUS ? 'settled' : 'mismatch';

  const unknownExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => !context.registryById[id]);
  const missingExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => !actualKeyObjectIds.includes(id));
  const missingExpectedLayers = zone.expectedVisibleLayers.filter((layer) => !actualVisibleLayers.includes(layer));
  const extraVisibleLayers = actualVisibleLayers.filter((layer) => !zone.expectedVisibleLayers.includes(layer));
  const forbiddenObjectIdsPresent = (zone.forbiddenKeyObjectIds ?? []).filter((id) => actualKeyObjectIds.includes(id));
  const forbiddenExpectedLayersPresent = (zone.forbiddenVisibleLayers ?? []).filter((layer) => actualVisibleLayers.includes(layer));

  return {
    actualKeyObjectIds,
    actualVisibleLayers,
    extraVisibleLayers,
    forbiddenExpectedLayersPresent,
    forbiddenObjectIdsPresent,
    locationDistance,
    locationStatus,
    missingExpectedLayers,
    missingExpectedObjectIds,
    status:
      locationStatus === 'settled' &&
      forbiddenObjectIdsPresent.length === 0 &&
      forbiddenExpectedLayersPresent.length === 0 &&
      unknownExpectedObjectIds.length === 0 &&
      missingExpectedObjectIds.length === 0 &&
      missingExpectedLayers.length === 0
        ? 'ok'
        : 'warning',
    unknownExpectedObjectIds,
    zoneId: zone.id,
  };
}
