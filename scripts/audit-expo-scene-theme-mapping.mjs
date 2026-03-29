function normalizeThemeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and');
}

const DISTRICT_THEME_KEYWORDS = {
  design_district: ['design', 'creative', 'studio', 'brand', 'experience', 'visual', 'ux', 'ui'],
  meetings_forum: ['meeting', 'meetings', 'demo', 'demos', 'suite', 'suites', 'lounge', 'forum', 'concierge'],
  platform_corridor: ['platform', 'partner', 'partners', 'integration', 'integrations', 'ecosystem', 'solution', 'solutions'],
};

function includesAnyKeyword(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function resolveDistrictThemeMatch(sector) {
  const normalizedName = normalizeThemeKey(sector?.name);
  const normalizedId = normalizeThemeKey(sector?.id);

  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.design_district) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.design_district)) {
    return { matchedBy: normalizedName ? 'name' : 'id', themeId: 'design_district' };
  }
  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.platform_corridor) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.platform_corridor)) {
    return { matchedBy: includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.platform_corridor) ? 'name' : 'id', themeId: 'platform_corridor' };
  }
  if (includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.meetings_forum) || includesAnyKeyword(normalizedId, DISTRICT_THEME_KEYWORDS.meetings_forum)) {
    return { matchedBy: includesAnyKeyword(normalizedName, DISTRICT_THEME_KEYWORDS.meetings_forum) ? 'name' : 'id', themeId: 'meetings_forum' };
  }

  return { matchedBy: 'fallback', themeId: 'sponsor_gallery' };
}

function auditDistrictThemeAssignments(sectors) {
  const entries = sectors.map((sector) => {
    const resolved = resolveDistrictThemeMatch(sector);
    return {
      districtThemeId: resolved.themeId,
      matchedBy: resolved.matchedBy,
      sectorId: sector?.id ? String(sector.id) : null,
      sectorLabel: sector?.name ? String(sector.name) : '',
    };
  });

  const fallbackCount = entries.filter((entry) => entry.matchedBy === 'fallback').length;
  const matchedBy = entries.reduce((acc, entry) => {
    acc[entry.matchedBy] += 1;
    return acc;
  }, { fallback: 0, id: 0, name: 0 });
  const themeCounts = entries.reduce((acc, entry) => {
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

const sceneUrl = process.env.THEME_AUDIT_SCENE_URL || process.env.RELEASE_BASE_URL
  ? `${String(process.env.THEME_AUDIT_SCENE_URL || process.env.RELEASE_BASE_URL).replace(/\/+$/, '')}${String(process.env.THEME_AUDIT_SCENE_URL ? '' : '/api/expo/scene')}`
  : null;

if (!sceneUrl) {
  console.error('Missing THEME_AUDIT_SCENE_URL or RELEASE_BASE_URL');
  process.exit(1);
}

const response = await fetch(sceneUrl, { headers: { Accept: 'application/json' } });
if (!response.ok) {
  console.error(`Theme audit failed to fetch scene: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const payload = await response.json();
const sectors = Array.isArray(payload?.sectors) ? payload.sectors : [];
const report = auditDistrictThemeAssignments(sectors);
const maxFallbackRate = Number(process.env.THEME_AUDIT_MAX_FALLBACK_RATE ?? '1');

console.log(JSON.stringify({
  fallbackCount: report.fallbackCount,
  fallbackRate: report.fallbackRate,
  matchedBy: report.matchedBy,
  themeCounts: report.themeCounts,
  total: report.total,
  unmatchedSectors: report.entries
    .filter((entry) => entry.matchedBy === 'fallback')
    .map((entry) => ({ sectorId: entry.sectorId, sectorLabel: entry.sectorLabel })),
}, null, 2));

if (report.fallbackRate > maxFallbackRate) {
  console.error(`Theme audit fallback rate ${report.fallbackRate} exceeded ${maxFallbackRate}`);
  process.exit(1);
}
