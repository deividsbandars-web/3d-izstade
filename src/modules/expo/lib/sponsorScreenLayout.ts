import type { ExpoBoothPlacement, ExpoSectorMarker } from '../layout-engine';
import type { ExpoDistrictProgramSummary } from '../world-contract';
import { resolveExpoRuntimeTextureUrl } from './expoTexturePipeline';
import { buildSponsorBoothPresentation } from './sponsorBoothPresentation';

export type SponsorScreenKind = 'facade' | 'medium_billboard' | 'ground_pylon';

export type SponsorScreenNode = {
  accentColor: string;
  ctaLabel: string;
  companyId: string | null;
  fallbackEyebrow: string;
  fallbackMonogram: string;
  fallbackMode: boolean;
  id: string;
  imageUrl: string | null;
  kind: SponsorScreenKind;
  position: [number, number, number];
  priority: number;
  rotation: [number, number, number];
  sectorName: string | null;
  size: [number, number];
  subtitle: string;
  title: string;
};

export type SponsorScreenLayout = {
  districtFrontage: Record<string, {
    hasGroundEngagement: boolean;
    hasPrimaryScreenPlane: boolean;
    hasSecondarySupport: boolean;
    intensity: number;
  }>;
  facadeScreens: SponsorScreenNode[];
  groundScreens: SponsorScreenNode[];
  mediumScreens: SponsorScreenNode[];
};

const HORIZONTAL_PLACEHOLDERS = [
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_01.png')!,
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_02.png')!,
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_03.png')!,
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_04.png')!,
] as const;

const VERTICAL_PLACEHOLDERS = [
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_01.png')!,
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_02.png')!,
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_03.png')!,
] as const;

const HERO_FACADE_SCREEN = resolveExpoRuntimeTextureUrl('/textures/expo/hero-facade-screen-8k/hero_facade_screen_01.png')!;

const SPONSOR_TIER_WEIGHT: Record<string, number> = {
  hero: 6,
  platinum: 5,
  gold: 4,
  silver: 3,
  bronze: 2,
  standard: 1,
};

function deriveFootprint(boothPlacements: ExpoBoothPlacement[]) {
  const footprint = boothPlacements[0]?.layoutFootprint;
  if (footprint) {
    return footprint;
  }

  const xs = boothPlacements.map((placement) => placement.position[0]);
  const zs = boothPlacements.map((placement) => placement.position[2]);

  return {
    maxX: xs.length > 0 ? Math.max(...xs) + 40 : 120,
    maxZ: zs.length > 0 ? Math.max(...zs) + 50 : 40,
    minX: xs.length > 0 ? Math.min(...xs) - 40 : -120,
    minZ: zs.length > 0 ? Math.min(...zs) - 60 : -260,
  };
}

function comparePlacements(left: ExpoBoothPlacement, right: ExpoBoothPlacement) {
  const byPriority = Number(right.priority || 0) - Number(left.priority || 0);
  if (byPriority !== 0) {
    return byPriority;
  }

  const byTier = (SPONSOR_TIER_WEIGHT[String(right.sponsorTier || 'standard')] || 0)
    - (SPONSOR_TIER_WEIGHT[String(left.sponsorTier || 'standard')] || 0);
  if (byTier !== 0) {
    return byTier;
  }

  return String(left.id).localeCompare(String(right.id));
}

function pickScreenImage(placement: ExpoBoothPlacement | null, kind: SponsorScreenKind, index: number, hasBrandAssets: boolean) {
  const company = placement?.company;
  if (!hasBrandAssets) {
    if (kind === 'ground_pylon') {
      return VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length];
    }
    return kind === 'facade' && index === 0
      ? HERO_FACADE_SCREEN
      : HORIZONTAL_PLACEHOLDERS[index % HORIZONTAL_PLACEHOLDERS.length];
  }

  if (kind === 'facade') {
    return company?.posterUrl || company?.heroAssetUrl || company?.logo_url || (index === 0 ? HERO_FACADE_SCREEN : HORIZONTAL_PLACEHOLDERS[index % HORIZONTAL_PLACEHOLDERS.length]);
  }

  if (kind === 'medium_billboard') {
    return company?.posterUrl || company?.logo_url || HORIZONTAL_PLACEHOLDERS[index % HORIZONTAL_PLACEHOLDERS.length];
  }

  return company?.logo_url || company?.posterUrl || VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length];
}

function pickTitle(placement: ExpoBoothPlacement | null, fallback: string) {
  return String(placement?.company?.name || placement?.sectorName || fallback);
}

function pickSubtitle(placement: ExpoBoothPlacement | null, fallback: string) {
  return String(placement?.company?.tagline || placement?.sectorName || fallback);
}

function getDistrictRoles(
  sectorId: string | null | undefined,
  clusterIndex: number | undefined,
  districtPrograms: ExpoDistrictProgramSummary[]
) {
  const district = (sectorId ? districtPrograms.find((entry) => entry.sectorId === sectorId) : undefined)
    ?? districtPrograms.find((entry) => entry.clusterIndex === clusterIndex);
  return new Set((district?.programTargets ?? []).filter((target) => target.allocated > 0).map((target) => target.role));
}

function getDistrictSummary(
  sectorId: string | null | undefined,
  clusterIndex: number | undefined,
  districtPrograms: ExpoDistrictProgramSummary[]
) {
  return (sectorId ? districtPrograms.find((entry) => entry.sectorId === sectorId) : undefined)
    ?? districtPrograms.find((entry) => entry.clusterIndex === clusterIndex)
    ?? null;
}

function hasScreenEligibleBrandAssets(placement: ExpoBoothPlacement) {
  const company = placement.company;
  return Boolean(company?.posterUrl || company?.heroAssetUrl || company?.logo_url);
}

export function buildSponsorScreenLayout(
  boothPlacements: ExpoBoothPlacement[],
  sectorMarkers: ExpoSectorMarker[],
  districtPrograms: ExpoDistrictProgramSummary[] = []
): SponsorScreenLayout {
  const rankedPlacements = [...boothPlacements].sort((left, right) => {
    const leftRoles = getDistrictRoles(left.sectorId, left.clusterIndex, districtPrograms);
    const rightRoles = getDistrictRoles(right.sectorId, right.clusterIndex, districtPrograms);
    const leftBias = (leftRoles.has('demo_stage') ? 3 : 0) + (leftRoles.has('info_pavilion') ? 2 : 0) - (leftRoles.has('scenic_showcase') ? 1 : 0);
    const rightBias = (rightRoles.has('demo_stage') ? 3 : 0) + (rightRoles.has('info_pavilion') ? 2 : 0) - (rightRoles.has('scenic_showcase') ? 1 : 0);
    if (rightBias !== leftBias) {
      return rightBias - leftBias;
    }
    return comparePlacements(left, right);
  });

  const activeEligiblePlacements = rankedPlacements.filter((placement) => getDistrictSummary(placement.sectorId, placement.clusterIndex, districtPrograms)?.expressionMode === 'active-commercial');
  const footprint = deriveFootprint(boothPlacements);
  const centerX = (footprint.minX + footprint.maxX) * 0.5;

  const facadeLayouts = [
    { id: 'facade-screen-hero', position: [centerX, 34, Math.min(22, footprint.maxZ - 8)] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], size: [46, 26] as [number, number] },
    { id: 'facade-screen-side', position: [centerX - 112, 28, -58] as [number, number, number], rotation: [0, 0.82, 0] as [number, number, number], size: [32, 18] as [number, number] },
  ] as const;

  const facadeScreens: SponsorScreenNode[] = activeEligiblePlacements
    .filter((placement) => hasScreenEligibleBrandAssets(placement))
    .slice(0, facadeLayouts.length)
    .map((placement, index) => {
    const presentation = buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId });
    const layout = facadeLayouts[index];

    return {
      accentColor: placement.color,
      ctaLabel: presentation.actions.find((action) => !action.disabled)?.label || 'Open',
      companyId: placement.company?.id ?? null,
      fallbackEyebrow: presentation.fallbackIdentity.eyebrow,
      fallbackMonogram: presentation.fallbackIdentity.monogram,
      fallbackMode: !presentation.hasBrandAssets,
      id: layout.id,
      imageUrl: pickScreenImage(placement, 'facade', index, presentation.hasBrandAssets),
      kind: 'facade',
      position: layout.position,
      priority: Number(placement.priority || 0),
      rotation: layout.rotation,
      sectorName: placement.sectorName || null,
      size: layout.size,
      subtitle: pickSubtitle(placement, 'Sponsor frontage'),
      title: pickTitle(placement, 'Sponsor'),
    };
    });

  const mediumScreens: SponsorScreenNode[] = activeEligiblePlacements
    .filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' || placement.nodeType === 'endcap')
    .filter((placement) => hasScreenEligibleBrandAssets(placement))
    .slice(0, 1)
    .map((placement, index) => {
    const presentation = buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId });
    const side = placement.position[0] < 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const zOffset = index % 2 === 0 ? 6 : -10;

    return {
      accentColor: placement.color,
      ctaLabel: presentation.actions.find((action) => !action.disabled)?.label || 'Open',
      companyId: placement.company?.id ?? null,
      fallbackEyebrow: presentation.fallbackIdentity.eyebrow,
      fallbackMonogram: presentation.fallbackIdentity.monogram,
      fallbackMode: !presentation.hasBrandAssets,
      id: `medium-screen-${placement.id}`,
      imageUrl: pickScreenImage(placement, 'medium_billboard', index, presentation.hasBrandAssets),
      kind: 'medium_billboard',
      position: [placement.position[0] + (side * 14), 7.1 + (row * 0.35), placement.position[2] + (zOffset * 0.8)],
      priority: Number(placement.priority || 0),
      rotation: [0, side < 0 ? 1.08 : -1.08, 0],
      sectorName: placement.sectorName || null,
      size: [8.2, 4.6],
      subtitle: pickSubtitle(placement, 'Sponsor frontage'),
      title: pickTitle(placement, 'Sponsor Screen'),
    };
    });

  const arrivalGroundScreen: SponsorScreenNode = {
    accentColor: '#22c55e',
    ctaLabel: 'Enter',
    companyId: null,
    fallbackEyebrow: 'ARRIVAL',
    fallbackMonogram: 'AR',
    fallbackMode: true,
    id: 'ground-screen-arrival',
    imageUrl: VERTICAL_PLACEHOLDERS[0],
    kind: 'ground_pylon',
    position: [centerX + 18, 2.8, footprint.maxZ + 16],
    priority: 40,
    rotation: [0, -0.26, 0],
    sectorName: 'Arrival',
    size: [4, 7.2],
    subtitle: 'Meetings, demos, and sponsor discovery',
    title: 'Arrival',
  };

  const markerGroundScreens: SponsorScreenNode[] = sectorMarkers.slice(0, 3).flatMap((marker, index) => {
    const district = getDistrictSummary(marker.sectorId, marker.clusterIndex, districtPrograms);
    const roles = getDistrictRoles(marker.sectorId, marker.clusterIndex, districtPrograms);
    const activeDistrict = district?.expressionMode === 'active-commercial' || roles.has('demo_stage') || roles.has('info_pavilion');
    if (!activeDistrict) {
      return [];
    }

    return [{
      accentColor: marker.color,
      ctaLabel: 'Live',
      companyId: null,
      fallbackEyebrow: `${marker.label.toUpperCase()} • PROGRAM`,
      fallbackMonogram: marker.label.slice(0, 2).toUpperCase(),
      fallbackMode: true,
      id: `ground-screen-marker-${marker.id}`,
      imageUrl: VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length],
      kind: 'ground_pylon',
      position: [marker.position[0] + (marker.side === 'left' ? 16 : -16), 2.6, marker.position[2] + 6],
      priority: 20 - index,
      rotation: [0, marker.side === 'left' ? 1.18 : -1.18, 0],
      sectorName: marker.label,
      size: [3.6, 6.4],
      subtitle: 'Live demos and active routing',
      title: `${marker.label} Live`,
    }];
  });

  const boothGroundScreens: SponsorScreenNode[] = rankedPlacements
    .filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' || placement.nodeType === 'endcap')
    .filter((placement) => getDistrictSummary(placement.sectorId, placement.clusterIndex, districtPrograms)?.expressionMode === 'active-commercial')
    .filter((placement) => hasScreenEligibleBrandAssets(placement))
    .slice(0, 3)
    .map((placement, index) => {
      const presentation = buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId });
      const side = placement.position[0] < 0 ? -1 : 1;

      return {
        accentColor: placement.color,
        ctaLabel: presentation.actions.find((action) => !action.disabled)?.label || 'Live Demo',
        companyId: placement.company?.id ?? null,
        fallbackEyebrow: `${presentation.fallbackIdentity.eyebrow} • LIVE`,
        fallbackMonogram: presentation.fallbackIdentity.monogram,
        fallbackMode: !presentation.hasBrandAssets,
        id: `ground-screen-${placement.id}`,
        imageUrl: pickScreenImage(placement, 'ground_pylon', index, presentation.hasBrandAssets),
        kind: 'ground_pylon',
        position: [placement.position[0] + (side * 10), 2.5, placement.position[2] + 7],
        priority: Number(placement.priority || 0),
        rotation: [0, side < 0 ? 0.9 : -0.9, 0],
        sectorName: placement.sectorName || null,
        size: [3.2, 5.8],
        subtitle: pickSubtitle(placement, 'Open booth and join the live program'),
        title: pickTitle(placement, 'Sponsor'),
      };
    });

  const groundScreens = [arrivalGroundScreen, ...markerGroundScreens, ...boothGroundScreens].slice(0, 6);

  const districtFrontage = Object.fromEntries(districtPrograms.map((district) => {
    const key = district.sectorId ?? `cluster-${district.clusterIndex}`;
    return [key, {
      hasGroundEngagement: district.frontagePackage.hasGroundEngagement,
      hasPrimaryScreenPlane: district.expressionMode === 'active-commercial' && (facadeScreens.some((screen) => screen.sectorName === district.sectorLabel) || mediumScreens.some((screen) => screen.sectorName === district.sectorLabel)),
      hasSecondarySupport: district.frontagePackage.hasSecondarySupport && (mediumScreens.some((screen) => screen.sectorName === district.sectorLabel) || groundScreens.some((screen) => screen.sectorName === district.sectorLabel)),
      intensity: district.frontageIntensity,
    }];
  }));

  return {
    districtFrontage,
    facadeScreens,
    groundScreens,
    mediumScreens: mediumScreens.slice(0, 2),
  };
}
