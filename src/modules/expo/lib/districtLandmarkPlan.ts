import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';
import type { ExpoDistrictTheme } from './districtTheme';

export type DistrictLandmarkNode = {
  accentColor: string;
  id: string;
  kind: 'arrival_beacon' | 'sector_pavilion' | 'meeting_lounge' | 'networking_hub' | 'demo_gallery' | 'gateway_lantern';
  label: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  sectorId: string | null;
  theme: ExpoDistrictTheme;
};

export type DistrictLandmarkPlan = {
  anchors: DistrictLandmarkNode[];
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
  const skylineBeacons: DistrictLandmarkPlan['skylineBeacons'] = [];

  anchors.push({
    accentColor: '#38bdf8',
    id: 'arrival-beacon',
    kind: 'arrival_beacon',
    label: 'Arrival Reveal',
    position: [0, 0, 10],
    rotationY: 0,
    scale: [1.2, 1.2, 1.2],
    sectorId: null,
    theme: sectorMarkers[0]?.districtTheme ?? boothPlacements[0]?.districtTheme ?? {
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
    },
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

  return {
    issues,
    valid: issues.length === 0,
  };
}
