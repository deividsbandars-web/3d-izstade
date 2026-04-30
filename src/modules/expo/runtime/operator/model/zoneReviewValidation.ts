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
  registryById: Record<string, WorldObjectRegistryEntry>;
};

const ZONE_NEARBY_RADIUS = 1000;

function isEntryNearZone(
  entry: WorldObjectRegistryEntry,
  zone: ReviewOperatorZone,
): boolean {
  const [entryX, , entryZ] = entry.position;
  const [positionX, , positionZ] = zone.startView.position;
  const [lookAtX, , lookAtZ] = zone.startView.lookAt;

  const distanceToPosition = Math.hypot(entryX - positionX, entryZ - positionZ);
  const distanceToLookAt = Math.hypot(entryX - lookAtX, entryZ - lookAtZ);
  return Math.min(distanceToPosition, distanceToLookAt) <= ZONE_NEARBY_RADIUS;
}

export type ZoneReviewValidation = {
  actualKeyObjectIds: string[];
  actualVisibleLayers: WorldObjectLayer[];
  extraVisibleLayers: WorldObjectLayer[];
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

  for (const entry of Object.values(context.registryById)) {
    if (isEntryNearZone(entry, zone)) {
      dedupedEntries.set(entry.id, entry);
    }
  }

  const actualEntries = Array.from(dedupedEntries.values());
  const actualKeyObjectIds = actualEntries.map((entry) => entry.id);
  const actualVisibleLayers: WorldObjectLayer[] = Array.from(new Set(actualEntries.map((entry) => entry.layer)));

  const unknownExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => !context.registryById[id]);
  const missingExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => !actualKeyObjectIds.includes(id));
  const missingExpectedLayers = zone.expectedVisibleLayers.filter((layer) => !actualVisibleLayers.includes(layer));
  const extraVisibleLayers = actualVisibleLayers.filter((layer) => !zone.expectedVisibleLayers.includes(layer));

  return {
    actualKeyObjectIds,
    actualVisibleLayers,
    extraVisibleLayers,
    missingExpectedLayers,
    missingExpectedObjectIds,
    status:
      unknownExpectedObjectIds.length === 0 &&
      missingExpectedObjectIds.length === 0 &&
      missingExpectedLayers.length === 0
        ? 'ok'
        : 'warning',
    unknownExpectedObjectIds,
    zoneId: zone.id,
  };
}
