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
