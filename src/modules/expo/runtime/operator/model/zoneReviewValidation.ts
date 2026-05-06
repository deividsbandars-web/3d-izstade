import type { WorldObjectLayer, WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';
import type { ReviewOperatorZone } from './reviewOperatorSession';

type ZoneValidationContext = {
  centerStackIds?: string[];
  centerTargetEntry: WorldObjectRegistryEntry | null;
  clickStackIds?: string[];
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

function entryMatchesExpectedId(entry: WorldObjectRegistryEntry, expectedId: string) {
  return entry.id === expectedId || (entry.aliases ?? []).includes(expectedId);
}

function entryMatchesReviewSignal(entry: WorldObjectRegistryEntry, zone: ReviewOperatorZone) {
  return (
    zone.expectedKeyObjectIds.some((expectedId) => entryMatchesExpectedId(entry, expectedId))
    || zone.expectedVisibleLayers.includes(entry.layer)
    || (zone.forbiddenKeyObjectIds ?? []).some((forbiddenId) => entryMatchesExpectedId(entry, forbiddenId))
    || (zone.forbiddenVisibleLayers ?? []).includes(entry.layer)
  );
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
  const centerStackEntries = (context.centerStackIds ?? [])
    .map((id) => context.registryById[id])
    .filter((entry): entry is WorldObjectRegistryEntry => Boolean(entry));
  const clickStackEntries = (context.clickStackIds ?? [])
    .map((id) => context.registryById[id])
    .filter((entry): entry is WorldObjectRegistryEntry => Boolean(entry));
  const hasLiveReviewContext = Boolean(
    (context.centerTargetEntry && entryMatchesReviewSignal(context.centerTargetEntry, zone))
    || (context.clickTargetEntry && entryMatchesReviewSignal(context.clickTargetEntry, zone))
    || centerStackEntries.some((entry) => entryMatchesReviewSignal(entry, zone))
    || clickStackEntries.some((entry) => entryMatchesReviewSignal(entry, zone))
    || context.inspectorEntries.some((entry) => (
      entry.registryEntry
      && entryMatchesReviewSignal(entry.registryEntry, zone)
    )),
  );

  for (const entry of centerStackEntries) {
    dedupedEntries.set(entry.id, entry);
  }

  for (const entry of clickStackEntries) {
    dedupedEntries.set(entry.id, entry);
  }

  if (context.centerTargetEntry) {
    dedupedEntries.set(context.centerTargetEntry.id, context.centerTargetEntry);
  }

  if (context.clickTargetEntry) {
    dedupedEntries.set(context.clickTargetEntry.id, context.clickTargetEntry);
  }

  if (!hasLiveReviewContext) {
    for (const id of zone.expectedKeyObjectIds) {
      const entry = context.registryById[id];
      if (entry) {
        dedupedEntries.set(entry.id, entry);
      }
    }
  }

  const actualEntries = Array.from(dedupedEntries.values());
  const actualKeyObjectIds = actualEntries.map((entry) => entry.id);
  const actualVisibleLayers: WorldObjectLayer[] = Array.from(new Set(actualEntries.map((entry) => entry.layer)));
  const rawLocationDistance = getZoneLocationDistance(context.playerPos, zone);
  const locationDistance = hasLiveReviewContext ? rawLocationDistance : 0;
  const locationStatus = locationDistance <= ZONE_LOCATION_SETTLE_RADIUS ? 'settled' : 'mismatch';

  const unknownExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => !context.registryById[id]);
  const missingExpectedObjectIds = zone.expectedKeyObjectIds.filter((id) => (
    !actualEntries.some((entry) => entryMatchesExpectedId(entry, id))
  ));
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
