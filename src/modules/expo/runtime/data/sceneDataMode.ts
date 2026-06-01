export type ExpoDataMode = 'default' | 'live' | 'review' | 'seeded';

export type ExpoReviewSceneSourceInput = {
  hostname?: string | null;
  isDev: boolean;
  search?: string | null;
};

function normalizeExpoDataMode(value: string | null | undefined): ExpoDataMode {
  switch (String(value || '').trim().toLowerCase()) {
    case 'live':
      return 'live';
    case 'review':
      return 'review';
    case 'seeded':
      return 'seeded';
    default:
      return 'default';
  }
}

function getExpoDataModeFromSearch(search: string | null | undefined): ExpoDataMode {
  return normalizeExpoDataMode(new URLSearchParams(search || '').get('expoData'));
}

function isReviewSceneHost(hostname: string | null | undefined) {
  const normalized = String(hostname || '').toLowerCase();
  return (
    normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized === '::1'
    || normalized === '[::1]'
    || /(^|\.)staging\.30sek24\.com$/i.test(normalized)
    || /\.vercel\.app$/i.test(normalized)
    || /\.vercel\.dev$/i.test(normalized)
  );
}

export function shouldUseReviewExpoSceneSource({
  hostname,
  isDev,
  search,
}: ExpoReviewSceneSourceInput) {
  const mode = getExpoDataModeFromSearch(search);

  if (isDev) {
    return mode !== 'live';
  }

  if (!isReviewSceneHost(hostname) || mode === 'live') {
    return false;
  }

  if (mode === 'review' || mode === 'seeded') {
    return true;
  }

  return true;
}
