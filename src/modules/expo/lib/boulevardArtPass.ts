export type BoulevardArtPlacement = {
  layoutFootprint?: {
    maxX: number;
    maxZ: number;
    minX: number;
    minZ: number;
  };
  position: [number, number, number];
};

export type BoulevardArtMarker = {
  color?: string;
  districtTheme?: {
    groundPalette: {
      lightPool: string;
      plaza: string;
      trim: string;
    };
  };
  id: string;
  position: [number, number, number];
  side: 'left' | 'right';
};

export type BoulevardSurfaceKind =
  | 'arrival_path'
  | 'arrival_plaza'
  | 'base_field'
  | 'cross_strip'
  | 'district_plaza'
  | 'grass_band'
  | 'hero_path'
  | 'light_pool'
  | 'median_strip'
  | 'secondary_path'
  | 'trim_band';

export type BoulevardMaterialKey =
  | 'dark_field'
  | 'hero_paver'
  | 'light_concrete'
  | 'trim_glow'
  | 'urban_grass';

export type BoulevardSurface = {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  id: string;
  kind: BoulevardSurfaceKind;
  materialKey: BoulevardMaterialKey;
  metalness: number;
  opacity?: number;
  position: [number, number, number];
  roughness: number;
  size: [number, number];
  textureRepeat?: [number, number];
};

export type BoulevardGrassCluster = {
  id: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
};

export type BoulevardArtPass = {
  footprint: {
    maxX: number;
    maxZ: number;
    minX: number;
    minZ: number;
  };
  grassClusters: BoulevardGrassCluster[];
  surfaces: BoulevardSurface[];
};

const BOULEVARD_ART = {
  arrivalLeadDepth: 64,
  arrivalPlazaDepth: 36,
  baseMarginX: 58,
  baseMarginZ: 84,
  clusterInsetX: 74,
  clusterStartOffset: 34,
  clusterStep: 38,
  crossStripDepth: 12,
  grassBandWidth: 28,
  heroPathWidth: 42,
  medianStripWidth: 4,
  secondaryGap: 8,
  secondaryPathWidth: 18,
  trimBandWidth: 3,
} as const;

function resolveFootprint(boothPlacements: BoulevardArtPlacement[]) {
  const plannedFootprint = boothPlacements[0]?.layoutFootprint;
  if (plannedFootprint) {
    return plannedFootprint;
  }

  const xs = boothPlacements.map((placement) => placement.position[0]);
  const zs = boothPlacements.map((placement) => placement.position[2]);

  return {
    maxX: (xs.length > 0 ? Math.max(...xs) : 84) + 42,
    maxZ: (zs.length > 0 ? Math.max(...zs) : 16) + 52,
    minX: (xs.length > 0 ? Math.min(...xs) : -84) - 42,
    minZ: (zs.length > 0 ? Math.min(...zs) : -240) - 52,
  };
}

export function buildBoulevardArtPass(
  boothPlacements: BoulevardArtPlacement[],
  sectorMarkers: BoulevardArtMarker[],
  options?: {
    showcase?: boolean;
  }
): BoulevardArtPass {
  const footprint = resolveFootprint(boothPlacements);
  const showcase = Boolean(options?.showcase);
  const centerX = (footprint.minX + footprint.maxX) * 0.5;
  const entryMaxZ = footprint.maxZ + BOULEVARD_ART.arrivalLeadDepth;
  const pathLength = entryMaxZ - footprint.minZ;
  const sidePathX = (BOULEVARD_ART.heroPathWidth * 0.5) + (BOULEVARD_ART.secondaryGap + (BOULEVARD_ART.secondaryPathWidth * 0.5));
  const grassBandX = sidePathX + (BOULEVARD_ART.secondaryPathWidth * 0.5) + BOULEVARD_ART.secondaryGap + (BOULEVARD_ART.grassBandWidth * 0.5);
  const trimBandX = grassBandX - (BOULEVARD_ART.grassBandWidth * 0.5) - (BOULEVARD_ART.trimBandWidth * 0.5) - 2;
  const fieldWidth = Math.max(
    (footprint.maxX - footprint.minX) + (BOULEVARD_ART.baseMarginX * 2),
    (grassBandX * 2) + BOULEVARD_ART.grassBandWidth + 24
  );
  const pathCenterZ = (entryMaxZ + footprint.minZ) * 0.5;
  const arrivalPathCenterZ = footprint.maxZ + (BOULEVARD_ART.arrivalLeadDepth * 0.42);
  const arrivalPlazaCenterZ = footprint.maxZ + (BOULEVARD_ART.arrivalPlazaDepth * 0.08);

  const crossStripZs = Array.from(new Set(
    sectorMarkers
      .map((marker) => Math.round(marker.position[2]))
      .filter((value) => Number.isFinite(value))
  )).sort((left, right) => right - left);

  const surfaces: BoulevardSurface[] = [
    {
      color: '#111827',
      id: 'boulevard-base-field',
      kind: 'base_field',
      materialKey: 'dark_field',
      metalness: 0.04,
      position: [centerX, 0.004, pathCenterZ],
      roughness: 0.95,
      size: [fieldWidth, pathLength + BOULEVARD_ART.baseMarginZ],
    },
    {
      color: '#d7d0c5',
      id: 'boulevard-arrival-plaza',
      kind: 'arrival_plaza',
      materialKey: 'light_concrete',
      metalness: 0.06,
      position: [centerX, 0.022, arrivalPlazaCenterZ],
      roughness: 0.8,
      size: [66, BOULEVARD_ART.arrivalPlazaDepth],
    },
    {
      color: '#d2c8b8',
      id: 'boulevard-hero-path',
      kind: 'hero_path',
      materialKey: 'hero_paver',
      metalness: 0.08,
      position: [centerX, 0.028, pathCenterZ],
      roughness: 0.74,
      size: [BOULEVARD_ART.heroPathWidth, pathLength],
      textureRepeat: [2.8, Math.max(6, pathLength / 44)],
    },
    {
      color: '#cfd8e3',
      id: 'boulevard-arrival-path',
      kind: 'arrival_path',
      materialKey: 'hero_paver',
      metalness: 0.09,
      position: [centerX, 0.032, arrivalPathCenterZ],
      roughness: 0.74,
      size: [56, BOULEVARD_ART.arrivalLeadDepth * 0.96],
      textureRepeat: [3.4, 2.6],
    },
    {
      color: '#8ca0b3',
      id: 'boulevard-secondary-left',
      kind: 'secondary_path',
      materialKey: 'light_concrete',
      metalness: 0.06,
      position: [centerX - sidePathX, 0.024, pathCenterZ - 8],
      roughness: 0.84,
      size: [BOULEVARD_ART.secondaryPathWidth, pathLength - 24],
      textureRepeat: [1.2, Math.max(5, pathLength / 56)],
    },
    {
      color: '#8ca0b3',
      id: 'boulevard-secondary-right',
      kind: 'secondary_path',
      materialKey: 'light_concrete',
      metalness: 0.06,
      position: [centerX + sidePathX, 0.024, pathCenterZ - 8],
      roughness: 0.84,
      size: [BOULEVARD_ART.secondaryPathWidth, pathLength - 24],
      textureRepeat: [1.2, Math.max(5, pathLength / 56)],
    },
    {
      color: '#21503d',
      id: 'boulevard-grass-left',
      kind: 'grass_band',
      materialKey: 'urban_grass',
      metalness: 0.01,
      position: [centerX - grassBandX, 0.018, pathCenterZ - 4],
      roughness: 0.98,
      size: [BOULEVARD_ART.grassBandWidth, pathLength - 16],
      opacity: 0.96,
    },
    {
      color: '#21503d',
      id: 'boulevard-grass-right',
      kind: 'grass_band',
      materialKey: 'urban_grass',
      metalness: 0.01,
      position: [centerX + grassBandX, 0.018, pathCenterZ - 4],
      roughness: 0.98,
      size: [BOULEVARD_ART.grassBandWidth, pathLength - 16],
      opacity: 0.96,
    },
    {
      color: '#60a5fa',
      emissive: '#60a5fa',
      emissiveIntensity: showcase ? 0.22 : 0.14,
      id: 'boulevard-trim-left',
      kind: 'trim_band',
      materialKey: 'trim_glow',
      metalness: 0.02,
      opacity: 0.42,
      position: [centerX - trimBandX, 0.02, pathCenterZ - 10],
      roughness: 0.4,
      size: [BOULEVARD_ART.trimBandWidth, pathLength - 40],
    },
    {
      color: '#60a5fa',
      emissive: '#60a5fa',
      emissiveIntensity: showcase ? 0.22 : 0.14,
      id: 'boulevard-trim-right',
      kind: 'trim_band',
      materialKey: 'trim_glow',
      metalness: 0.02,
      opacity: 0.42,
      position: [centerX + trimBandX, 0.02, pathCenterZ - 10],
      roughness: 0.4,
      size: [BOULEVARD_ART.trimBandWidth, pathLength - 40],
    },
    {
      color: '#b6c6d9',
      id: 'boulevard-median-top',
      kind: 'median_strip',
      materialKey: 'light_concrete',
      metalness: 0.05,
      position: [centerX, 0.025, pathCenterZ - 56],
      roughness: 0.84,
      size: [BOULEVARD_ART.medianStripWidth, pathLength * 0.42],
    },
    {
      color: '#b6c6d9',
      id: 'boulevard-median-bottom',
      kind: 'median_strip',
      materialKey: 'light_concrete',
      metalness: 0.05,
      position: [centerX, 0.025, pathCenterZ + 40],
      roughness: 0.84,
      size: [BOULEVARD_ART.medianStripWidth, pathLength * 0.22],
    },
  ];

  crossStripZs.forEach((z, index) => {
    surfaces.push({
      color: index === 0 ? '#182233' : '#1f2937',
      id: `boulevard-cross-strip-${index}`,
      kind: 'cross_strip',
      materialKey: 'dark_field',
      metalness: 0.05,
      position: [centerX, 0.02, z],
      roughness: 0.9,
      size: [fieldWidth - 12, BOULEVARD_ART.crossStripDepth],
    });
  });

  sectorMarkers.forEach((marker) => {
    const palette = marker.districtTheme?.groundPalette;
    const lateralOffset = marker.side === 'left' ? -34 : 34;
    surfaces.push({
      color: palette?.plaza || marker.color || '#cbd5e1',
      id: `district-plaza-${marker.id}`,
      kind: 'district_plaza',
      materialKey: 'light_concrete',
      metalness: 0.05,
      opacity: 0.92,
      position: [centerX + lateralOffset, 0.02, marker.position[2] - 12],
      roughness: 0.82,
      size: [22, showcase ? 22 : 18],
    });
    surfaces.push({
      color: palette?.lightPool || marker.color || '#60a5fa',
      emissive: palette?.lightPool || marker.color || '#60a5fa',
      emissiveIntensity: showcase ? 0.18 : 0.12,
      id: `light-pool-${marker.id}`,
      kind: 'light_pool',
      materialKey: 'trim_glow',
      metalness: 0.02,
      opacity: 0.24,
      position: [centerX + (marker.side === 'left' ? -20 : 20), 0.03, marker.position[2] - 8],
      roughness: 0.32,
      size: [12, showcase ? 14 : 10],
    });
  });

  const grassClusters: BoulevardGrassCluster[] = Array.from({ length: Math.max(6, Math.floor(pathLength / BOULEVARD_ART.clusterStep)) }, (_, index) => {
    const z = entryMaxZ - BOULEVARD_ART.clusterStartOffset - (index * BOULEVARD_ART.clusterStep);
    const side = index % 2 === 0 ? -1 : 1;
    const alternateOffset = index % 3 === 0 ? 8 : 0;
    const xBase = centerX + (side * (BOULEVARD_ART.clusterInsetX + alternateOffset));

    return {
      id: `grass-cluster-${index}`,
      position: [xBase, 0.08, z] as [number, number, number],
      rotationY: (index % 5) * 0.45,
      scale: [
        1.9 + ((index % 3) * 0.18),
        1.7 + ((index % 4) * 0.12),
        1.9 + ((index % 2) * 0.16),
      ] as [number, number, number],
    };
  }).filter((cluster) => cluster.position[2] > footprint.minZ - 18);

  return {
    footprint: {
      maxX: centerX + (fieldWidth * 0.5),
      maxZ: entryMaxZ + 18,
      minX: centerX - (fieldWidth * 0.5),
      minZ: footprint.minZ - 18,
    },
    grassClusters,
    surfaces,
  };
}
