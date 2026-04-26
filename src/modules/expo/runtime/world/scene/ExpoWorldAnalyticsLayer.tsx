import { useEffect } from 'react';
import type { ZoneSystem } from '../../../../city/ZoneSystem.js';
import { trackExpoBoothViewed, trackExpoSceneLoaded, trackExpoSectorEntered } from '../../../lib/expoAnalytics';
import { buildSponsorBoothPresentation } from '../../../lib/sponsorBoothPresentation';
import { EXPO_FEATURE_FLAGS, type ExpoMode } from '../../../state/expoRuntime';
import { replaceDistrictBoothZones } from '../../../sceneWorld-support';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../../../layout-engine';
import { useExpoWorldAnalyticsActions, useExpoWorldAnalyticsState } from './ExpoWorldAnalyticsProvider';

export function ExpoWorldAnalyticsLayer({
  activeZone,
  mode,
  sectorCount,
  sectorMarkers,
  visibleBoothPlacements,
  zoneSystem,
}: {
  activeZone: { id?: string | null } | null | undefined;
  mode: ExpoMode;
  sectorCount: number;
  sectorMarkers: ExpoSectorMarker[];
  visibleBoothPlacements: ExpoBoothPlacement[];
  zoneSystem: unknown;
}) {
  const analytics = useExpoWorldAnalyticsState();
  const actions = useExpoWorldAnalyticsActions();
  const zoneSystemBridge = zoneSystem as
    | Pick<ZoneSystem, 'getZones' | 'replaceZonesByPrefix'>
    | null
    | undefined;

  useEffect(() => {
    const zoneReplacement = replaceDistrictBoothZones(zoneSystemBridge, visibleBoothPlacements);
    if (import.meta.env.DEV && zoneReplacement.replaced && zoneReplacement.registeredZoneCount !== visibleBoothPlacements.length) {
      console.warn('[ExpoWorld][Zones] District booth zone count mismatch after replacement.', {
        boothPlacementCount: visibleBoothPlacements.length,
        registeredZoneCount: zoneReplacement.registeredZoneCount,
      });
    }
  }, [visibleBoothPlacements, zoneSystemBridge]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || analytics.sceneLoaded) {
      return;
    }

    actions.markSceneLoaded();
    trackExpoSceneLoaded({
      boothCount: visibleBoothPlacements.length,
      mode,
      sectorCount,
    });
  }, [actions, analytics.sceneLoaded, mode, sectorCount, visibleBoothPlacements.length]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || !activeZone?.id) {
      return;
    }

    const placementId = String(activeZone.id).replace(/^district-booth-/, '');
    const placement = visibleBoothPlacements.find((entry) => entry.id === placementId);
    if (!placement) {
      return;
    }

    const boothKey = placement.company?.id ? String(placement.company.id) : placement.id;
    if (analytics.viewedBoothKeys.includes(boothKey)) {
      return;
    }

    actions.markBoothViewed(boothKey);
    trackExpoBoothViewed(placement.company, {
      boothId: placement.company?.booth?.id ?? placement.id,
      boothTemplate: buildSponsorBoothPresentation(
        placement.company,
        placement.company?.booth ?? null,
        placement.nodeType,
        { districtThemeId: placement.districtThemeId },
      ).template,
      sectorName: placement.sectorName,
    });
  }, [activeZone, actions, analytics.viewedBoothKeys, visibleBoothPlacements]);

  useEffect(() => {
    if (!EXPO_FEATURE_FLAGS.enableAnalytics || sectorMarkers.length === 0) {
      return;
    }

    const [playerX, , playerZ] = analytics.playerPosition;
    let nearestMarker = sectorMarkers[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    sectorMarkers.forEach((marker) => {
      const dx = marker.position[0] - playerX;
      const dz = marker.position[2] - playerZ;
      const distance = (dx * dx) + (dz * dz);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMarker = marker;
      }
    });

    const sectorKey = String(nearestMarker.sectorId ?? nearestMarker.label);
    if (sectorKey === analytics.lastSectorKey) {
      return;
    }

    actions.markSectorEntered(sectorKey);
    trackExpoSectorEntered(null, {
      sectorId: nearestMarker.sectorId ?? null,
      sectorName: nearestMarker.label,
    });
  }, [actions, analytics.lastSectorKey, analytics.playerPosition, sectorMarkers]);

  return null;
}
