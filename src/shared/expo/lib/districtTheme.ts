import type { ExpoSceneSector } from '../sceneContract.js';

export type DistrictThemeId = 'design_district' | 'platform_corridor' | 'meetings_forum' | 'sponsor_gallery';
export type DistrictGatewayStyle = 'studio_portal' | 'signal_frame' | 'forum_arch' | 'gallery_blade';
export type DistrictLandmarkStyle = 'gallery_spine' | 'signal_bridge' | 'forum_lantern' | 'arrival_beacon';
export type DistrictBoothShellFamily = 'gallery' | 'spire' | 'forum' | 'arcade';

export type DistrictGroundPalette = {
  baseField: string;
  grass: string;
  heroPath: string;
  lightPool: string;
  plaza: string;
  secondaryPath: string;
  trim: string;
};

export type ExpoDistrictTheme = {
  accentColor: string;
  boothShellFamily: DistrictBoothShellFamily;
  gatewayStyle: DistrictGatewayStyle;
  groundPalette: DistrictGroundPalette;
  id: DistrictThemeId;
  landmarkStyle: DistrictLandmarkStyle;
  lightLanguage: 'cool-studio' | 'civic-blue' | 'warm-forum' | 'neutral-premium';
  name: string;
  sectorId: string | null;
  sectorLabel: string;
};

export type DistrictThemeAuditEntry = {
  districtThemeId: DistrictThemeId;
  matchedBy: 'fallback' | 'id' | 'name';
  sectorId: string | null;
  sectorLabel: string;
};

export type DistrictThemeAuditReport = {
  entries: DistrictThemeAuditEntry[];
  fallbackCount: number;
  fallbackRate: number;
  matchedBy: Record<DistrictThemeAuditEntry['matchedBy'], number>;
  themeCounts: Record<DistrictThemeId, number>;
  total: number;
};

const DISTRICT_THEME_LIBRARY: Record<DistrictThemeId, Omit<ExpoDistrictTheme, 'accentColor' | 'sectorId' | 'sectorLabel'>> = {
  design_district: {
    boothShellFamily: 'gallery',
    gatewayStyle: 'studio_portal',
    groundPalette: {
      baseField: '#111433',
      grass: '#123b36',
      heroPath: '#f3c969',
      lightPool: '#22e7ff',
      plaza: '#405879',
      secondaryPath: '#7da6bd',
      trim: '#22e7ff',
    },
    id: 'design_district',
    landmarkStyle: 'gallery_spine',
    lightLanguage: 'cool-studio',
    name: 'Design District',
  },
  platform_corridor: {
    boothShellFamily: 'spire',
    gatewayStyle: 'signal_frame',
    groundPalette: {
      baseField: '#0d1f36',
      grass: '#0d4d47',
      heroPath: '#7dd3fc',
      lightPool: '#2f6bff',
      plaza: '#2c4b69',
      secondaryPath: '#6388b6',
      trim: '#2f6bff',
    },
    id: 'platform_corridor',
    landmarkStyle: 'signal_bridge',
    lightLanguage: 'civic-blue',
    name: 'Platform Corridor',
  },
  meetings_forum: {
    boothShellFamily: 'forum',
    gatewayStyle: 'forum_arch',
    groundPalette: {
      baseField: '#1f1630',
      grass: '#24513f',
      heroPath: '#ffb84d',
      lightPool: '#f97316',
      plaza: '#5a423f',
      secondaryPath: '#a77556',
      trim: '#ffb84d',
    },
    id: 'meetings_forum',
    landmarkStyle: 'forum_lantern',
    lightLanguage: 'warm-forum',
    name: 'Meetings Forum',
  },
  sponsor_gallery: {
    boothShellFamily: 'arcade',
    gatewayStyle: 'gallery_blade',
    groundPalette: {
      baseField: '#17142d',
      grass: '#21483b',
      heroPath: '#c084fc',
      lightPool: '#a78bfa',
      plaza: '#40345f',
      secondaryPath: '#7c6aa4',
      trim: '#c084fc',
    },
    id: 'sponsor_gallery',
    landmarkStyle: 'gallery_spine',
    lightLanguage: 'neutral-premium',
    name: 'Sponsor Gallery',
  },
};

function normalizeThemeKey(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and');
}

function tokenizeThemeKey(value: string) {
  return value
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

const DISTRICT_THEME_KEYWORDS: Record<DistrictThemeId, string[]> = {
  design_district: ['design', 'creative', 'studio', 'brand', 'experience', 'visual', 'ux', 'ui'],
  meetings_forum: ['meeting', 'meetings', 'demo', 'demos', 'suite', 'suites', 'lounge', 'forum', 'concierge'],
  platform_corridor: ['platform', 'partner', 'partners', 'integration', 'integrations', 'ecosystem', 'solution', 'solutions'],
  sponsor_gallery: [],
};

function includesAnyKeyword(value: string, keywords: string[]) {
  const tokens = tokenizeThemeKey(value);
  return keywords.some((keyword) => tokens.includes(keyword));
}

export function resolveDistrictThemeMatch(
  sector: Pick<ExpoSceneSector, 'color_theme' | 'id' | 'name'> | null | undefined
): { matchedBy: DistrictThemeAuditEntry['matchedBy']; themeId: DistrictThemeId } {
  const normalizedName = normalizeThemeKey(sector?.name);
  const normalizedId = normalizeThemeKey(sector?.id);

  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.design_district) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.design_district)) {
    return { matchedBy: normalizedName ? 'name' : 'id', themeId: 'design_district' as const };
  }
  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.platform_corridor) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.platform_corridor)) {
    return { matchedBy: includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.platform_corridor) ? 'name' : 'id', themeId: 'platform_corridor' as const };
  }
  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.meetings_forum) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.meetings_forum)) {
    return { matchedBy: includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.meetings_forum) ? 'name' : 'id', themeId: 'meetings_forum' as const };
  }

  return { matchedBy: 'fallback' as const, themeId: 'sponsor_gallery' as const };
}

export function resolveDistrictThemeForSector(sector: Pick<ExpoSceneSector, 'color_theme' | 'id' | 'name'> | null | undefined): ExpoDistrictTheme {
  const { themeId } = resolveDistrictThemeMatch(sector);
  const libraryTheme = DISTRICT_THEME_LIBRARY[themeId];
  return {
    ...libraryTheme,
    accentColor: sector?.color_theme || libraryTheme.groundPalette.trim,
    sectorId: sector?.id ? String(sector.id) : null,
    sectorLabel: sector?.name ? String(sector.name) : libraryTheme.name,
  };
}

export function buildDistrictThemeMap(sectors: Pick<ExpoSceneSector, 'color_theme' | 'id' | 'name'>[]) {
  return new Map(
    sectors.map((sector) => {
      const theme = resolveDistrictThemeForSector(sector);
      return [String(sector.id), theme] as const;
    })
  );
}

export function auditDistrictThemeAssignments(sectors: Pick<ExpoSceneSector, 'color_theme' | 'id' | 'name'>[]): DistrictThemeAuditReport {
  const entries: DistrictThemeAuditEntry[] = sectors.map((sector) => {
    const resolved = resolveDistrictThemeMatch(sector);
    return {
      districtThemeId: resolved.themeId,
      matchedBy: resolved.matchedBy,
      sectorId: sector?.id ? String(sector.id) : null,
      sectorLabel: sector?.name ? String(sector.name) : '',
    };
  });

  const fallbackCount = entries.filter((entry) => entry.matchedBy === 'fallback').length;
  const matchedBy = entries.reduce<Record<DistrictThemeAuditEntry['matchedBy'], number>>((acc, entry) => {
    acc[entry.matchedBy] += 1;
    return acc;
  }, { fallback: 0, id: 0, name: 0 });
  const themeCounts = entries.reduce<Record<DistrictThemeId, number>>((acc, entry) => {
    acc[entry.districtThemeId] += 1;
    return acc;
  }, {
    design_district: 0,
    meetings_forum: 0,
    platform_corridor: 0,
    sponsor_gallery: 0,
  });

  return {
    entries,
    fallbackCount,
    fallbackRate: entries.length > 0 ? fallbackCount / entries.length : 0,
    matchedBy,
    themeCounts,
    total: entries.length,
  };
}

export function resolveDistrictThemeBySectorId(
  sectorId: string | null | undefined,
  themeMap: Map<string, ExpoDistrictTheme>
) {
  if (sectorId) {
    const mapped = themeMap.get(String(sectorId));
    if (mapped) {
      return mapped;
    }
  }

  return {
    ...DISTRICT_THEME_LIBRARY.sponsor_gallery,
    accentColor: DISTRICT_THEME_LIBRARY.sponsor_gallery.groundPalette.trim,
    sectorId: sectorId ? String(sectorId) : null,
    sectorLabel: 'Sponsor Gallery',
  } satisfies ExpoDistrictTheme;
}
