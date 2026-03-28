const baseUrl = process.env.RELEASE_BASE_URL;

if (!baseUrl) {
  console.error('Missing RELEASE_BASE_URL');
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
const checks = [
  `${normalizedBaseUrl}/health`,
  `${normalizedBaseUrl}/api/expo/scene`,
  `${normalizedBaseUrl}/api/pixel-streaming/status`,
];

for (const url of checks) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  console.log(`${url} -> ${response.status}`);
  if (!response.ok) {
    process.exit(1);
  }
}

const themeAuditMaxFallbackRate = process.env.THEME_AUDIT_MAX_FALLBACK_RATE;
if (themeAuditMaxFallbackRate) {
  const sceneResponse = await fetch(`${normalizedBaseUrl}/api/expo/scene`, { headers: { Accept: 'application/json' } });
  const scenePayload = await sceneResponse.json();
  const sectorNames = Array.isArray(scenePayload?.sectors)
    ? scenePayload.sectors.map((sector) => String(sector?.name || '')).filter(Boolean)
    : [];

  console.log(`theme-audit sectors -> ${sectorNames.length}`);
  console.log('theme-audit follow-up -> run scripts/audit-expo-scene-theme-mapping.mjs against this payload in CI or staging QA');
}
