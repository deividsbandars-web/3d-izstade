import type { AssetType, ValidatedCityModule } from '../../utils/proAssetPipeline';

export type CityAssetCollisionStrategy = ValidatedCityModule['collisionStrategy'];
export type CityAssetResidualIssue =
  | 'GEO_NOT_CENTERED'
  | 'GEO_NOT_GROUNDED'
  | 'GENERATOR_FOOTPRINT_TOO_SMALL';
export type CityAssetPlacementAnchor = 'center' | 'footprint-center' | 'base-center';
export type CityAssetRotationEuler = [number, number, number];

export interface CityAssetManifestEntry {
  match: string;
  category?: AssetType;
  snap?: {
    gridUnit?: number;
    alignToGround?: boolean;
  };
  allowedRotations?: number[];
  collisionStrategy?: CityAssetCollisionStrategy;
  targetSize?: number;
  footprint?: {
    width: number;
    depth: number;
  };
  rotationEuler?: CityAssetRotationEuler;
  scaleMultiplier?: number;
  groundOffsetY?: number;
  placementAnchor?: CityAssetPlacementAnchor;
  centerXZOnly?: boolean;
  snapToGround?: boolean;
  canonicalYawOnly?: boolean;
  allowResidualIssues?: CityAssetResidualIssue[];
  placementTags?: string[];
  disabled?: boolean;
  notes?: string;
  debugLabel?: string;
}

export interface ResolvedCityAssetManifestEntry extends CityAssetManifestEntry {
  sourceUrl: string;
  sourceName: string;
}

export const CITY_ASSET_MANIFEST: CityAssetManifestEntry[] = [
  {
    match: 'american_road.glb',
    category: 'road',
    snap: { gridUnit: 12, alignToGround: true },
    allowedRotations: [0, Math.PI / 2],
    collisionStrategy: 'none',
    targetSize: 12,
    footprint: { width: 12, depth: 12 },
    scaleMultiplier: 1,
    groundOffsetY: 0,
    placementAnchor: 'footprint-center',
    centerXZOnly: true,
    snapToGround: true,
    canonicalYawOnly: true,
    allowResidualIssues: ['GEO_NOT_CENTERED', 'GENERATOR_FOOTPRINT_TOO_SMALL'],
    placementTags: ['road-segment', 'street'],
    debugLabel: 'American Road Segment',
    notes: 'Primary road segment for grid-aligned street cells. Yaw-only placement is allowed only after verified canonical road normalization.',
  },
  {
    match: 'american_road_intersection.glb',
    category: 'road',
    snap: { gridUnit: 12, alignToGround: true },
    allowedRotations: [0, Math.PI / 2],
    collisionStrategy: 'none',
    targetSize: 12,
    footprint: { width: 12, depth: 12 },
    scaleMultiplier: 1,
    groundOffsetY: 0,
    placementAnchor: 'footprint-center',
    centerXZOnly: true,
    snapToGround: true,
    canonicalYawOnly: true,
    allowResidualIssues: ['GEO_NOT_CENTERED'],
    placementTags: ['road-intersection', 'street'],
    debugLabel: 'American Road Intersection',
    notes: 'Road intersection piece intended for cross streets. Yaw-only placement is allowed only after verified canonical road normalization.',
  },
  {
    match: 'free_london_kinnaird_house.glb',
    category: 'landmark',
    snap: { gridUnit: 6, alignToGround: true },
    allowedRotations: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: 'footprint',
    targetSize: 36,
    footprint: { width: 16, depth: 16 },
    scaleMultiplier: 0.45,
    groundOffsetY: 0,
    placementAnchor: 'base-center',
    centerXZOnly: true,
    snapToGround: true,
    allowResidualIssues: ['GEO_NOT_CENTERED', 'GEO_NOT_GROUNDED'],
    placementTags: ['landmark', 'residential'],
    debugLabel: 'Kinnaird Landmark House',
  },
  {
    match: 'free__atlanta_corperate_office_building.glb',
    category: 'building',
    snap: { gridUnit: 6, alignToGround: true },
    allowedRotations: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: 'footprint',
    targetSize: 24,
    footprint: { width: 14, depth: 14 },
    scaleMultiplier: 0.35,
    groundOffsetY: 0,
    placementAnchor: 'base-center',
    centerXZOnly: true,
    snapToGround: true,
    allowResidualIssues: ['GEO_NOT_CENTERED', 'GEO_NOT_GROUNDED'],
    placementTags: ['office', 'building'],
    debugLabel: 'Atlanta Corporate Office',
  },
  {
    match: 'european_buildings_asset_pack_3.glb',
    category: 'building',
    snap: { gridUnit: 6, alignToGround: true },
    allowedRotations: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: 'footprint',
    targetSize: 20,
    placementTags: ['building-pack', 'mixed-building'],
    debugLabel: 'European Building Pack',
  },
  {
    match: 'victorian_street_lamp.glb',
    category: 'nature',
    snap: { gridUnit: 6, alignToGround: true },
    allowedRotations: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: 'relaxed',
    targetSize: 4,
    footprint: { width: 1.5, depth: 1.5 },
    scaleMultiplier: 0.85,
    groundOffsetY: 0,
    placementAnchor: 'base-center',
    centerXZOnly: true,
    snapToGround: true,
    allowResidualIssues: ['GEO_NOT_GROUNDED'],
    placementTags: ['street-furniture', 'lamp'],
    debugLabel: 'Victorian Street Lamp',
    notes: 'Treated as relaxed decor instead of a structural building module.',
  },
  {
    match: 'trees_in_the_park_anthropos.glb',
    category: 'nature',
    snap: { gridUnit: 6, alignToGround: true },
    allowedRotations: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    collisionStrategy: 'relaxed',
    targetSize: 8,
    footprint: { width: 6, depth: 6 },
    scaleMultiplier: 0.75,
    groundOffsetY: 0,
    placementAnchor: 'base-center',
    centerXZOnly: true,
    snapToGround: true,
    allowResidualIssues: ['GEO_NOT_CENTERED'],
    placementTags: ['trees', 'park'],
    debugLabel: 'Trees In The Park',
  },
  {
    match: 'default_booth.glb',
    category: 'booth',
    disabled: true,
    placementTags: ['disabled', 'legacy-booth'],
    debugLabel: 'Legacy Default Booth',
    notes: 'Disabled by manifest until the placeholder booth asset is repaired and revalidated.',
  },
];

export function resolveCityAssetManifestEntry(sourceUrl: string): ResolvedCityAssetManifestEntry | null {
  const normalizedUrl = sourceUrl.toLowerCase();
  const normalizedName = normalizedUrl.split('/').pop() || normalizedUrl;
  const entry = CITY_ASSET_MANIFEST.find((item) => {
    const matcher = item.match.toLowerCase();
    return normalizedUrl.includes(matcher) || normalizedName === matcher;
  });

  if (!entry) {
    return null;
  }

  return {
    ...entry,
    sourceUrl,
    sourceName: sourceUrl.split('/').pop() || sourceUrl,
  };
}
