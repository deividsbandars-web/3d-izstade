import type { ExpoBoothPlacement, ExpoSectorMarker } from '../layout-engine';
import type { ExpoDistrictProgramSummary } from '../world-contract';
import { resolveExpoRuntimeTextureUrl } from './expoTexturePipeline';
import { buildSponsorBoothPresentation } from './sponsorBoothPresentation';

export type SponsorScreenKind = 'facade' | 'medium_billboard' | 'ground_pylon';
export type SponsorPlacementTier = 'elite' | 'premium' | 'standard' | 'city';

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
  placementTier: SponsorPlacementTier;
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

function cyclePickPlacement<T>(placements: T[], index: number): T | null {
  if (placements.length === 0) {
    return null;
  }
  return placements[index % placements.length] ?? null;
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
    { id: 'facade-screen-hero', position: [centerX, 44, Math.min(58, footprint.maxZ + 12)] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number], size: [72, 38] as [number, number], placementTier: 'elite' as const },
    { id: 'facade-screen-left-crown', position: [centerX - 188, 34, -12] as [number, number, number], rotation: [0, 0.18, 0] as [number, number, number], size: [46, 26] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-right-crown', position: [centerX + 188, 34, -28] as [number, number, number], rotation: [0, -0.18, 0] as [number, number, number], size: [46, 26] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-left-apex', position: [centerX - 96, 38, -94] as [number, number, number], rotation: [0, 0.08, 0] as [number, number, number], size: [42, 24] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-right-apex', position: [centerX + 96, 38, -108] as [number, number, number], rotation: [0, -0.08, 0] as [number, number, number], size: [42, 24] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-left-boulevard', position: [centerX - 302, 28, -176] as [number, number, number], rotation: [0, 0.12, 0] as [number, number, number], size: [36, 21] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-right-boulevard', position: [centerX + 302, 28, -198] as [number, number, number], rotation: [0, -0.12, 0] as [number, number, number], size: [36, 21] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-left-citywall', position: [centerX - 468, 32, -358] as [number, number, number], rotation: [0, 0.08, 0] as [number, number, number], size: [40, 23] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-right-citywall', position: [centerX + 468, 32, -382] as [number, number, number], rotation: [0, -0.08, 0] as [number, number, number], size: [40, 23] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-left-promenade', position: [centerX - 388, 24, -278] as [number, number, number], rotation: [0, 0.1, 0] as [number, number, number], size: [34, 20] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-right-promenade', position: [centerX + 388, 24, -302] as [number, number, number], rotation: [0, -0.1, 0] as [number, number, number], size: [34, 20] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-left-grandwall', position: [centerX - 612, 38, -548] as [number, number, number], rotation: [0, 0.04, 0] as [number, number, number], size: [52, 28] as [number, number], placementTier: 'elite' as const },
    { id: 'facade-screen-right-grandwall', position: [centerX + 612, 38, -572] as [number, number, number], rotation: [0, -0.04, 0] as [number, number, number], size: [52, 28] as [number, number], placementTier: 'elite' as const },
    { id: 'facade-screen-left-district', position: [centerX - 286, 26, -694] as [number, number, number], rotation: [0, 0.02, 0] as [number, number, number], size: [34, 20] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-right-district', position: [centerX + 286, 26, -724] as [number, number, number], rotation: [0, -0.02, 0] as [number, number, number], size: [34, 20] as [number, number], placementTier: 'standard' as const },
    { id: 'facade-screen-left-far-district', position: [centerX - 522, 28, -884] as [number, number, number], rotation: [0, 0.03, 0] as [number, number, number], size: [38, 22] as [number, number], placementTier: 'premium' as const },
    { id: 'facade-screen-right-far-district', position: [centerX + 522, 28, -914] as [number, number, number], rotation: [0, -0.03, 0] as [number, number, number], size: [38, 22] as [number, number], placementTier: 'premium' as const },
  ] as const;

  const facadeSourcePlacements = activeEligiblePlacements.length > 0
    ? [...activeEligiblePlacements, ...rankedPlacements.filter((placement) => !activeEligiblePlacements.includes(placement))]
    : rankedPlacements;

  const facadeScreens = facadeLayouts
    .map((layout, index) => {
    const placement = cyclePickPlacement(facadeSourcePlacements, index);
    if (!placement) {
      return null;
    }
    const presentation = buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId });

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
      placementTier: layout.placementTier,
      position: layout.position,
      priority: Number(placement.priority || 0),
      rotation: layout.rotation,
      sectorName: placement.sectorName || null,
      size: layout.size,
      subtitle: pickSubtitle(placement, 'Sponsor frontage'),
      title: pickTitle(placement, 'Sponsor'),
    } satisfies SponsorScreenNode;
    })
    .filter((node): node is NonNullable<typeof node> => node !== null);

  const mediumScreens: SponsorScreenNode[] = rankedPlacements
    .slice(0, 10)
    .map((placement, index) => {
      const presentation = buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId });
      const side = placement.position[0] < 0 ? -1 : 1;
      const laneOffset = [164, 248, 336, 428][index % 4] ?? 248;
      const isElite = presentation.adTier === 'elite';
      const depthOffset = 48 + Math.floor(index / 2) * 112;

      return {
        accentColor: placement.color,
        ctaLabel: presentation.actions.find((action) => !action.disabled)?.label || 'Open',
        companyId: placement.company?.id ?? null,
        fallbackEyebrow: presentation.fallbackIdentity.eyebrow,
        fallbackMonogram: presentation.fallbackIdentity.monogram,
        fallbackMode: !presentation.hasBrandAssets,
        id: `medium-screen-${placement.id}-${index}`,
        imageUrl: pickScreenImage(placement, 'medium_billboard', index, presentation.hasBrandAssets),
        kind: 'medium_billboard' as const,
        placementTier: isElite ? 'premium' : index < 4 ? 'premium' : 'standard',
        position: [placement.position[0] + (side * laneOffset), isElite ? 18 : 15, placement.position[2] - depthOffset] as [number, number, number],
        priority: Number(placement.priority || 0),
        rotation: [0, side < 0 ? 0.36 : -0.36, 0] as [number, number, number],
        sectorName: placement.sectorName || null,
        size: isElite ? ([24, 13.6] as [number, number]) : ([18, 10.2] as [number, number]),
        subtitle: pickSubtitle(placement, 'City sponsor showcase'),
        title: pickTitle(placement, 'Sponsor showcase'),
      } satisfies SponsorScreenNode;
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
    placementTier: 'city',
    position: [centerX + 18, 2.8, footprint.maxZ + 16],
    priority: 40,
    rotation: [0, -0.26, 0],
    sectorName: 'Arrival',
    size: [4, 7.2],
    subtitle: 'Meetings, demos, and sponsor discovery',
    title: 'Arrival',
  };

  const districtGroundScreens = sectorMarkers.slice(0, 12).map((marker, index) => {
    const placement = rankedPlacements[index % Math.max(1, rankedPlacements.length)] ?? null;
    const presentation = placement
      ? buildSponsorBoothPresentation(placement.company, placement.company.booth ?? null, placement.nodeType, { districtThemeId: placement.districtThemeId })
      : null;

    return {
      accentColor: marker.color,
      ctaLabel: presentation?.actions.find((action) => !action.disabled)?.label || 'Discover',
      companyId: placement?.company?.id ?? null,
      fallbackEyebrow: presentation?.fallbackIdentity.eyebrow || marker.label.toUpperCase(),
      fallbackMonogram: presentation?.fallbackIdentity.monogram || marker.label.slice(0, 2).toUpperCase(),
      fallbackMode: !presentation?.hasBrandAssets,
      id: `ground-screen-${marker.id}`,
      imageUrl: placement ? pickScreenImage(placement, 'ground_pylon', index, Boolean(presentation?.hasBrandAssets)) : VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length],
      kind: 'ground_pylon' as const,
      placementTier: (presentation?.adTier === 'elite' ? 'premium' : 'city') as SponsorPlacementTier,
      position: [marker.position[0] + (marker.side === 'left' ? -26 : 26), 3.4, marker.position[2] + 18] as [number, number, number],
      priority: Number(placement?.priority || 10),
      rotation: [0, marker.side === 'left' ? 0.22 : -0.22, 0] as [number, number, number],
      sectorName: marker.label,
      size: presentation?.adTier === 'elite' ? ([5.4, 9.4] as [number, number]) : ([4.4, 7.8] as [number, number]),
      subtitle: placement ? pickSubtitle(placement, 'District sponsor') : 'District sponsor',
      title: placement ? pickTitle(placement, marker.label) : marker.label,
    } satisfies SponsorScreenNode;
  });

  const groundScreens = [arrivalGroundScreen, ...districtGroundScreens];

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
    mediumScreens,
  };
}

