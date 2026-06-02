import { buildExpoBoothWeb3DRoomRoute } from '../../lib/expoBoothRoutes';
import { isSupportedExpoInternalRoute, type SponsorBoothPresentation } from '../../lib/sponsorBoothPresentation';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { bindBoothPresentation } from './BoothPresentationBinding';

export const EXPO_BOOTH_ENTRY_RADIUS = 64;

export type ExpoBoothEntryCandidate = {
  boothId: string;
  company: ExpoBoothPlacement['company'];
  companyId: string | null;
  displayName: string;
  distance: number;
  placementId: string;
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'>;
  route: string;
  sectorName: string | null;
  tierLabel: string;
};

type XzBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

function formatBoothTierLabel(value: SponsorBoothPresentation['adTier']) {
  if (value === 'elite') return 'Landmark sponsor room';
  if (value === 'premium') return 'Premium showroom';
  if (value === 'standard') return 'Standard showroom';
  return 'Sponsor showroom';
}

function distanceToBounds(bounds: XzBounds, x: number, z: number) {
  const dx = Math.max(bounds.minX - x, 0, x - bounds.maxX);
  const dz = Math.max(bounds.minZ - z, 0, z - bounds.maxZ);
  return Math.hypot(dx, dz);
}

function distanceToPlacement(placement: ExpoBoothPlacement, playerPosition: readonly number[]) {
  const bounds = placement.localFootprint?.worldBounds;
  if (bounds) {
    return distanceToBounds(bounds, playerPosition[0] ?? 0, playerPosition[2] ?? 0);
  }

  return Math.hypot(
    placement.position[0] - (playerPosition[0] ?? 0),
    placement.position[2] - (playerPosition[2] ?? 0),
  );
}

export function buildExpoBoothEntryCandidate(
  placement: ExpoBoothPlacement,
  playerPosition: readonly number[],
): ExpoBoothEntryCandidate | null {
  const { booth, presentation } = bindBoothPresentation(placement.company, placement);
  const route = buildExpoBoothWeb3DRoomRoute(presentation.demoRoomPath);

  if (!isSupportedExpoInternalRoute(route)) {
    return null;
  }

  return {
    boothId: String(booth?.id ?? placement.id),
    company: placement.company,
    companyId: placement.company?.id ? String(placement.company.id) : null,
    displayName: presentation.displayName,
    distance: distanceToPlacement(placement, playerPosition),
    placementId: placement.id,
    presentation: {
      demoRoomPath: route,
      template: presentation.template,
    },
    route,
    sectorName: placement.sectorName ?? null,
    tierLabel: formatBoothTierLabel(presentation.adTier),
  };
}

export function getNearestExpoBoothEntryCandidate({
  boothPlacements,
  playerPosition,
  radius = EXPO_BOOTH_ENTRY_RADIUS,
}: {
  boothPlacements: readonly ExpoBoothPlacement[];
  playerPosition: readonly number[];
  radius?: number;
}): ExpoBoothEntryCandidate | null {
  let nearest: ExpoBoothEntryCandidate | null = null;

  boothPlacements.forEach((placement) => {
    const candidate = buildExpoBoothEntryCandidate(placement, playerPosition);
    if (!candidate || candidate.distance > radius) {
      return;
    }

    if (!nearest || candidate.distance < nearest.distance) {
      nearest = candidate;
    }
  });

  return nearest;
}
