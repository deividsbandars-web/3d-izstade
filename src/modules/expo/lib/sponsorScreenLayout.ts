import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld';

export type SponsorScreenKind = 'facade' | 'medium_billboard' | 'ground_pylon';

export type SponsorScreenNode = {
  accentColor: string;
  companyId: string | null;
  id: string;
  imageUrl: string;
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
  facadeScreens: SponsorScreenNode[];
  groundScreens: SponsorScreenNode[];
  mediumScreens: SponsorScreenNode[];
};

const HORIZONTAL_PLACEHOLDERS = [
  '/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_01.png',
  '/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_02.png',
  '/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_03.png',
  '/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_04.png',
] as const;

const VERTICAL_PLACEHOLDERS = [
  '/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_01.png',
  '/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_02.png',
  '/textures/expo/screen-placeholders-4k/vertical-9x16/screen_vertical_03.png',
] as const;

const HERO_FACADE_SCREEN = '/textures/expo/hero-facade-screen-8k/hero_facade_screen_01.png';

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

function pickScreenImage(placement: ExpoBoothPlacement | null, kind: SponsorScreenKind, index: number) {
  const company = placement?.company;
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

export function buildSponsorScreenLayout(
  boothPlacements: ExpoBoothPlacement[],
  sectorMarkers: ExpoSectorMarker[]
): SponsorScreenLayout {
  const rankedPlacements = [...boothPlacements].sort(comparePlacements);
  const footprint = deriveFootprint(boothPlacements);
  const centerX = (footprint.minX + footprint.maxX) * 0.5;
  const heroFacadeSources = rankedPlacements.slice(0, 3);
  const mediumSources = rankedPlacements.slice(0, Math.min(6, Math.max(4, rankedPlacements.length)));
  const groundBoothSources = rankedPlacements
    .filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' || placement.nodeType === 'endcap')
    .slice(0, 5);

  const facadeScreens: SponsorScreenNode[] = [
    {
      accentColor: heroFacadeSources[0]?.color || '#22c55e',
      companyId: heroFacadeSources[0]?.company?.id ?? null,
      id: 'facade-screen-hero',
      imageUrl: pickScreenImage(heroFacadeSources[0] ?? null, 'facade', 0),
      kind: 'facade',
      position: [centerX, 34, Math.min(22, footprint.maxZ - 8)],
      priority: Number(heroFacadeSources[0]?.priority || 100),
      rotation: [0, Math.PI, 0],
      sectorName: heroFacadeSources[0]?.sectorName || null,
      size: [46, 26],
      subtitle: pickSubtitle(heroFacadeSources[0] ?? null, 'Sponsor boulevard hero axis'),
      title: pickTitle(heroFacadeSources[0] ?? null, 'Warpala Platform'),
    },
    {
      accentColor: heroFacadeSources[1]?.color || '#38bdf8',
      companyId: heroFacadeSources[1]?.company?.id ?? null,
      id: 'facade-screen-west',
      imageUrl: pickScreenImage(heroFacadeSources[1] ?? null, 'facade', 1),
      kind: 'facade',
      position: [centerX - 118, 28, -58],
      priority: Number(heroFacadeSources[1]?.priority || 80),
      rotation: [0, 0.82, 0],
      sectorName: heroFacadeSources[1]?.sectorName || null,
      size: [32, 18],
      subtitle: pickSubtitle(heroFacadeSources[1] ?? null, 'Meetings and sponsor discovery'),
      title: pickTitle(heroFacadeSources[1] ?? null, 'Meeting Cluster'),
    },
    {
      accentColor: heroFacadeSources[2]?.color || '#f59e0b',
      companyId: heroFacadeSources[2]?.company?.id ?? null,
      id: 'facade-screen-east',
      imageUrl: pickScreenImage(heroFacadeSources[2] ?? null, 'facade', 2),
      kind: 'facade',
      position: [centerX + 124, 30, -104],
      priority: Number(heroFacadeSources[2]?.priority || 70),
      rotation: [0, -0.88, 0],
      sectorName: heroFacadeSources[2]?.sectorName || null,
      size: [34, 19],
      subtitle: pickSubtitle(heroFacadeSources[2] ?? null, 'Premium sponsor placements'),
      title: pickTitle(heroFacadeSources[2] ?? null, 'Sponsor Network'),
    },
  ];

  const mediumScreens: SponsorScreenNode[] = mediumSources.map((placement, index) => {
    const side = placement.position[0] < 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const zOffset = (index % 2 === 0 ? 6 : -10);

    return {
      accentColor: placement.color,
      companyId: placement.company?.id ?? null,
      id: `medium-screen-${placement.id}`,
      imageUrl: pickScreenImage(placement, 'medium_billboard', index),
      kind: 'medium_billboard',
      position: [placement.position[0] + (side * 22), 8.8 + (row * 0.5), placement.position[2] + zOffset] as [number, number, number],
      priority: Number(placement.priority || 0),
      rotation: [0, side < 0 ? 1.08 : -1.08, 0],
      sectorName: placement.sectorName || null,
      size: [11.5, 6.6],
      subtitle: pickSubtitle(placement, 'Premium boulevard messaging'),
      title: pickTitle(placement, 'Sponsor Screen'),
    };
  });

  while (mediumScreens.length < 4) {
    const index = mediumScreens.length;
    const side = index % 2 === 0 ? -1 : 1;
    mediumScreens.push({
      accentColor: side < 0 ? '#38bdf8' : '#22c55e',
      companyId: null,
      id: `medium-screen-generic-${index}`,
      imageUrl: HORIZONTAL_PLACEHOLDERS[index % HORIZONTAL_PLACEHOLDERS.length],
      kind: 'medium_billboard',
      position: [centerX + (side * 84), 9.2, footprint.maxZ - 46 - (index * 42)] as [number, number, number],
      priority: 10 - index,
      rotation: [0, side < 0 ? 1.02 : -1.02, 0],
      sectorName: null,
      size: [11.5, 6.6],
      subtitle: 'Premium sponsor boulevard messaging',
      title: side < 0 ? 'Sponsor Axis' : 'Boulevard Info',
    });
  }

  const markerGroundScreens = sectorMarkers.slice(0, 3).map((marker, index) => ({
    accentColor: marker.color,
    companyId: null,
    id: `ground-screen-marker-${marker.id}`,
    imageUrl: VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length],
    kind: 'ground_pylon' as const,
    position: [marker.position[0] + (marker.side === 'left' ? 16 : -16), 2.6, marker.position[2] + 6] as [number, number, number],
    priority: 20 - index,
    rotation: [0, marker.side === 'left' ? 1.18 : -1.18, 0] as [number, number, number],
    sectorName: marker.label,
    size: [3.6, 6.4] as [number, number],
    subtitle: marker.side === 'left' ? 'West hall routing' : 'East hall routing',
    title: marker.label,
  }));

  const arrivalGroundScreen: SponsorScreenNode = {
    accentColor: '#22c55e',
    companyId: null,
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

  const boothGroundScreens = groundBoothSources.map((placement, index) => {
    const side = placement.position[0] < 0 ? -1 : 1;
    return {
      accentColor: placement.color,
      companyId: placement.company?.id ?? null,
      id: `ground-screen-${placement.id}`,
      imageUrl: pickScreenImage(placement, 'ground_pylon', index),
      kind: 'ground_pylon' as const,
    position: [placement.position[0] + (side * 10), 2.5, placement.position[2] + 7] as [number, number, number],
      priority: Number(placement.priority || 0),
      rotation: [0, side < 0 ? 0.9 : -0.9, 0] as [number, number, number],
      sectorName: placement.sectorName || null,
      size: [3.2, 5.8] as [number, number],
      subtitle: pickSubtitle(placement, 'Open booth and continue'),
      title: pickTitle(placement, 'Sponsor'),
    };
  });

  const groundScreens = [arrivalGroundScreen, ...markerGroundScreens, ...boothGroundScreens].slice(0, 10);
  while (groundScreens.length < 6) {
    const index = groundScreens.length;
    const side = index % 2 === 0 ? -1 : 1;
      groundScreens.push({
      accentColor: side < 0 ? '#22c55e' : '#f59e0b',
      companyId: null,
      id: `ground-screen-generic-${index}`,
      imageUrl: VERTICAL_PLACEHOLDERS[index % VERTICAL_PLACEHOLDERS.length],
      kind: 'ground_pylon',
      position: [centerX + (side * 26), 2.5, footprint.maxZ - 24 - (index * 24)] as [number, number, number],
      priority: 5 - index,
      rotation: [0, side < 0 ? 0.68 : -0.68, 0],
      sectorName: null,
      size: [3.2, 5.8],
      subtitle: 'Directory and sponsor routing',
      title: side < 0 ? 'Directory' : 'Meetings',
    });
  }

  return {
    facadeScreens,
    groundScreens,
    mediumScreens: mediumScreens.slice(0, 6),
  };
}
