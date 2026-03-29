import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';
import type { ExpoDistrictTheme } from './districtTheme';

export type DistrictLandmarkNode = {
  accentColor: string;
  id: string;
  kind: 'arrival_beacon' | 'sector_pavilion' | 'meeting_lounge' | 'networking_hub' | 'demo_gallery' | 'gateway_lantern' | 'photo_spot';
  label: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  sectorId: string | null;
  theme: ExpoDistrictTheme;
};

export type ProgrammedFillerNode = {
  accentColor: string;
  footprint: [number, number];
  id: string;
  kind: 'arrival_plaza' | 'networking_lounge_island' | 'meeting_pod' | 'demo_court' | 'info_pylon' | 'gallery_wall' | 'scenic_promenade';
  label: string;
  position: [number, number, number];
  rotationY: number;
  sectorId: string | null;
  subLabel: string;
  theme: ExpoDistrictTheme;
};

export type DistrictLandmarkPlan = {
  anchors: DistrictLandmarkNode[];
  programmedZones: ProgrammedFillerNode[];
  skylineBeacons: Array<{
    accentColor: string;
    id: string;
    intensity: number;
    position: [number, number, number];
    theme: ExpoDistrictTheme;
  }>;
};

export type DistrictLandmarkValidation = {
  issues: string[];
  valid: boolean;
};

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function hasNearbyZone(
  zones: ProgrammedFillerNode[],
  position: [number, number, number],
  minDistance: number
) {
  return zones.some((zone) => {
    const dx = zone.position[0] - position[0];
    const dz = zone.position[2] - position[2];
    return Math.sqrt((dx * dx) + (dz * dz)) < minDistance;
  });
}

function resolveFallbackTheme(source?: ExpoSectorMarker | ExpoBoothPlacement): ExpoDistrictTheme {
  return source?.districtTheme ?? {
    accentColor: '#38bdf8',
    boothShellFamily: 'gallery',
    gatewayStyle: 'studio_portal',
    groundPalette: {
      baseField: '#0f172a',
      grass: '#16392f',
      heroPath: '#d6dde8',
      lightPool: '#8bd4ff',
      plaza: '#cbd5e1',
      secondaryPath: '#8ca0b3',
      trim: '#38bdf8',
    },
    id: 'sponsor_gallery',
    landmarkStyle: 'arrival_beacon',
    lightLanguage: 'neutral-premium',
    name: 'Arrival',
    sectorId: null,
    sectorLabel: 'Arrival',
  };
}

function ensureAnchorClearance(
  position: [number, number, number],
  placements: ExpoBoothPlacement[],
  options?: {
    corridorHalfWidth?: number;
    minDistance?: number;
  }
): [number, number, number] {
  const corridorHalfWidth = options?.corridorHalfWidth ?? 20;
  const minDistance = options?.minDistance ?? 20;
  const next = [...position] as [number, number, number];

  if (Math.abs(next[0]) < corridorHalfWidth) {
    next[0] = next[0] < 0 ? -corridorHalfWidth : corridorHalfWidth;
  }

  placements.forEach((placement) => {
    const dx = next[0] - placement.position[0];
    const dz = next[2] - placement.position[2];
    const distance = Math.sqrt((dx * dx) + (dz * dz));
    if (distance < minDistance) {
      const pushX = dx === 0 ? (placement.position[0] < 0 ? -1 : 1) : Math.sign(dx);
      next[0] += pushX * (minDistance - distance + 4);
    }
  });

  if (Math.abs(next[0]) < corridorHalfWidth) {
    next[0] = next[0] < 0 ? -corridorHalfWidth : corridorHalfWidth;
  }

  return next;
}

export function buildDistrictLandmarkPlan(
  boothPlacements: ExpoBoothPlacement[],
  sectorMarkers: ExpoSectorMarker[]
): DistrictLandmarkPlan {
  const groupedPlacements = new Map<string, ExpoBoothPlacement[]>();
  boothPlacements.forEach((placement) => {
    const key = placement.sectorId || placement.districtThemeId;
    if (!key) {
      return;
    }

    const group = groupedPlacements.get(key) ?? [];
    group.push(placement);
    groupedPlacements.set(key, group);
  });

  const anchors: DistrictLandmarkNode[] = [];
  const programmedZones: ProgrammedFillerNode[] = [];
  const skylineBeacons: DistrictLandmarkPlan['skylineBeacons'] = [];
  const defaultTheme = resolveFallbackTheme(sectorMarkers[0] ?? boothPlacements[0]);

  anchors.push({
    accentColor: '#38bdf8',
    id: 'arrival-beacon',
    kind: 'arrival_beacon',
    label: 'Arrival Reveal',
    position: [0, 0, 10],
    rotationY: 0,
    scale: [1.2, 1.2, 1.2],
    sectorId: null,
    theme: defaultTheme,
  });

  programmedZones.push({
    accentColor: '#38bdf8',
    footprint: [28, 12],
    id: 'programmed-arrival-plaza',
    kind: 'arrival_plaza',
    label: 'Arrival Lounge',
    position: [0, 0, 24],
    rotationY: 0,
    sectorId: null,
    subLabel: 'Wayfinding, registration, lounge, routing',
    theme: defaultTheme,
  });
  programmedZones.push({
    accentColor: defaultTheme.accentColor,
    footprint: [12, 4.2],
    id: 'programmed-arrival-pylons',
    kind: 'info_pylon',
    label: 'Info Pylons',
    position: [-34, 0, 39],
    rotationY: 0,
    sectorId: null,
    subLabel: 'Agenda, directions, district highlights',
    theme: defaultTheme,
  });
  anchors.push({
    accentColor: defaultTheme.accentColor,
    id: 'arrival-photo-spot',
    kind: 'photo_spot',
    label: 'City Photo Spot',
    position: [-42, 0, 18],
    rotationY: Math.PI * 0.12,
    scale: [1, 1, 1],
    sectorId: null,
    theme: defaultTheme,
  });

  sectorMarkers
    .filter((_, index) => index % 2 === 0)
    .forEach((marker, index) => {
      const placements = groupedPlacements.get(marker.sectorId || marker.id) ?? [];
      const meanZ = placements.length > 0 ? average(placements.map((placement) => placement.position[2])) : marker.position[2] - 18;
      const meanX = placements.length > 0 ? average(placements.map((placement) => placement.position[0])) : (marker.side === 'left' ? -56 : 56);
      const anchorBaseX = marker.side === 'left'
        ? Math.min(meanX - 18, -32)
        : Math.max(meanX + 18, 32);
      const themedKind = marker.districtTheme.landmarkStyle === 'forum_lantern'
        ? 'meeting_lounge'
        : marker.districtTheme.landmarkStyle === 'signal_bridge'
          ? 'networking_hub'
          : 'demo_gallery';
      const sparseSector = placements.length <= 1;

      anchors.push({
        accentColor: marker.color,
        id: `anchor-${marker.id}`,
        kind: themedKind,
        label: marker.label,
        position: ensureAnchorClearance([anchorBaseX, 0, meanZ - 10], placements, {
          corridorHalfWidth: 28,
          minDistance: 24,
        }),
        rotationY: marker.side === 'left' ? Math.PI * 0.14 : -Math.PI * 0.14,
        scale: marker.districtTheme.id === 'meetings_forum' ? [1.05, 1.05, 1.05] : [1, 1, 1],
        sectorId: marker.sectorId ?? null,
        theme: marker.districtTheme,
      });

      if (sparseSector) {
        anchors.push({
          accentColor: marker.color,
          id: `pavilion-${marker.id}`,
          kind: 'sector_pavilion',
          label: `${marker.label} Pavilion`,
          position: ensureAnchorClearance([marker.side === 'left' ? -66 : 66, 0, meanZ + 8], placements, {
            corridorHalfWidth: 26,
            minDistance: 22,
          }),
          rotationY: marker.side === 'left' ? Math.PI * 0.09 : -Math.PI * 0.09,
          scale: [0.94, 0.94, 0.94],
          sectorId: marker.sectorId ?? null,
          theme: marker.districtTheme,
        });
      }
      const zoneSeedX = marker.side === 'left' ? -44 : 44;
      const zoneRotationY = marker.side === 'left' ? Math.PI * 0.06 : -Math.PI * 0.06;

      const pushZone = (
        idSuffix: string,
        kind: ProgrammedFillerNode['kind'],
        label: string,
        position: [number, number, number],
        subLabel: string,
        footprint: [number, number],
        corridorHalfWidth = 22,
        minDistance = 20
      ) => {
        const safePosition = ensureAnchorClearance(position, placements, { corridorHalfWidth, minDistance });
        if (hasNearbyZone(programmedZones, safePosition, 10)) {
          return;
        }

        programmedZones.push({
          accentColor: marker.color,
          footprint,
          id: `${idSuffix}-${marker.id}`,
          kind,
          label,
          position: safePosition,
          rotationY: zoneRotationY,
          sectorId: marker.sectorId ?? null,
          subLabel,
          theme: marker.districtTheme,
        });
      };

      pushZone(
        'networking-lounge',
        'networking_lounge_island',
        'Networking Lounge',
        [zoneSeedX, 0, meanZ + 14],
        'Soft seating, coffee, informal meetups',
        [15, 7.2]
      );

      if (marker.districtTheme.id === 'meetings_forum') {
        pushZone(
          'meeting-pod',
          'meeting_pod',
          'Meeting Pods',
          [marker.side === 'left' ? -58 : 58, 0, meanZ + 26],
          'Book, wait, meet, continue',
          [12.5, 6.8],
          24,
          20
        );
      } else if (marker.districtTheme.id === 'platform_corridor') {
        pushZone(
          'scenic-promenade',
          'scenic_promenade',
          'Scenic Promenade',
          [marker.side === 'left' ? -104 : 104, 0, meanZ + 10],
          'Routing views, city edge, photo walk',
          [18, 5.4],
          72,
          18
        );
      } else {
        pushZone(
          'demo-court',
          'demo_court',
          'Demo Court',
          [zoneSeedX, 0, meanZ + 26],
          'Product loop and guided demos',
          [14, 7]
        );
      }

      pushZone(
        'info-pylon',
        'info_pylon',
        'Info Pylons',
        [marker.side === 'left' ? -34 : 34, 0, meanZ + 10],
        'Agenda, district cues, sponsor pointers',
        [9, 3.6],
        22,
        18
      );

      pushZone(
        'gallery-wall',
        'gallery_wall',
        'Gallery Wall',
        [marker.side === 'left' ? -72 : 72, 0, meanZ - 2],
        'Stories, highlights, launch moments',
        [13, 4.4],
        40,
        18
      );

      anchors.push({
        accentColor: marker.color,
        id: `photo-spot-${marker.id}`,
        kind: 'photo_spot',
        label: `${marker.label} Photo Spot`,
        position: ensureAnchorClearance([marker.side === 'left' ? -118 : 118, 0, meanZ + 4], placements, {
          corridorHalfWidth: 80,
          minDistance: 18,
        }),
        rotationY: marker.side === 'left' ? Math.PI * 0.18 : -Math.PI * 0.18,
        scale: [0.9, 0.9, 0.9],
        sectorId: marker.sectorId ?? null,
        theme: marker.districtTheme,
      });

      anchors.push({
        accentColor: marker.color,
        id: `lantern-${marker.id}`,
        kind: 'gateway_lantern',
        label: `${marker.label} Gateway`,
        position: [marker.position[0] * 0.78, 0, marker.position[2] + 8],
        rotationY: marker.side === 'left' ? Math.PI / 2 : -Math.PI / 2,
        scale: [1, 1, 1],
        sectorId: marker.sectorId ?? null,
        theme: marker.districtTheme,
      });

      skylineBeacons.push({
        accentColor: marker.color,
        id: `skyline-${marker.id}`,
        intensity: 0.9 + (index * 0.08),
        position: [marker.side === 'left' ? -188 : 188, 24 + (index * 4), meanZ - 36],
        theme: marker.districtTheme,
      });
    });

  return {
    anchors,
    programmedZones,
    skylineBeacons,
  };
}

export function validateDistrictLandmarkPlan(
  plan: DistrictLandmarkPlan,
  boothPlacements: ExpoBoothPlacement[]
): DistrictLandmarkValidation {
  const issues: string[] = [];

  plan.anchors
    .filter((anchor) => anchor.kind !== 'arrival_beacon')
    .forEach((anchor) => {
      if (Math.abs(anchor.position[0]) < 28) {
        issues.push(`${anchor.id}: corridor intrusion`);
      }

      boothPlacements.forEach((placement) => {
        const dx = anchor.position[0] - placement.position[0];
        const dz = anchor.position[2] - placement.position[2];
        const distance = Math.sqrt((dx * dx) + (dz * dz));
        if (distance < 18) {
          issues.push(`${anchor.id}: too close to booth ${placement.id}`);
        }
      });
    });

  plan.programmedZones.forEach((zone) => {
    if (zone.kind !== 'arrival_plaza' && Math.abs(zone.position[0]) < 20) {
      issues.push(`${zone.id}: corridor intrusion`);
    }

    boothPlacements.forEach((placement) => {
      const dx = zone.position[0] - placement.position[0];
      const dz = zone.position[2] - placement.position[2];
      const distance = Math.sqrt((dx * dx) + (dz * dz));
      if (distance < 16) {
        issues.push(`${zone.id}: too close to booth ${placement.id}`);
      }
    });
  });

  return {
    issues,
    valid: issues.length === 0,
  };
}
