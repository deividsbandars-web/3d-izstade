import { isIP } from 'node:net';

type RawRedisRuntimeEnv = Record<string, string | undefined>;

export type RedisConnectionPolicy = {
  protocol: 'redis:' | 'rediss:';
  tls: boolean;
  url: string;
};

function isProductionRuntime(rawEnv: RawRedisRuntimeEnv) {
  return [rawEnv.NODE_ENV, rawEnv.APP_ENV, rawEnv.VERCEL_ENV]
    .some((value) => value?.trim().toLowerCase() === 'production');
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return false;
  }

  return octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && (octets[1] ?? 0) >= 16 && (octets[1] ?? 0) <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === '::1'
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || /^fe[89ab]/.test(normalized);
}

function isLocalOrPrivateRedisHost(hostname: string) {
  const normalized = hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^\[|\]$/g, '');
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }
  if (ipVersion === 6) {
    return isPrivateIpv6(normalized);
  }

  if (
    normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized.endsWith('.local')
    || normalized.endsWith('.internal')
    || normalized.endsWith('.svc')
    || normalized.endsWith('.cluster.local')
    || !normalized.includes('.')
  ) {
    return true;
  }

  return false;
}

function isUpstashLikeHost(hostname: string) {
  return hostname.toLowerCase().includes('upstash');
}

function hasForbiddenTlsQueryOption(url: URL) {
  for (const key of url.searchParams.keys()) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
    if (
      normalized.includes('tls')
      || normalized.includes('ssl')
      || normalized.includes('rejectunauthorized')
      || normalized.includes('checkserveridentity')
    ) {
      return true;
    }
  }

  return false;
}

export function resolveRedisConnectionPolicy(
  rawRedisUrl: string,
  rawEnv: RawRedisRuntimeEnv = process.env,
): RedisConnectionPolicy {
  const redisUrl = rawRedisUrl.trim();
  if (!redisUrl) {
    throw new Error('REDIS_URL_REQUIRED');
  }

  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error('REDIS_URL_INVALID');
  }

  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL_PROTOCOL_INVALID');
  }
  if (!parsed.hostname || parsed.hash) {
    throw new Error('REDIS_URL_INVALID');
  }
  if (hasForbiddenTlsQueryOption(parsed)) {
    throw new Error('REDIS_URL_TLS_OPTIONS_FORBIDDEN');
  }
  if (parsed.protocol === 'redis:' && isUpstashLikeHost(parsed.hostname)) {
    throw new Error('REDIS_URL_TLS_REQUIRED');
  }
  if (
    parsed.protocol === 'redis:'
    && isProductionRuntime(rawEnv)
    && !isLocalOrPrivateRedisHost(parsed.hostname)
  ) {
    throw new Error('REDIS_URL_PLAINTEXT_REMOTE_FORBIDDEN');
  }

  return {
    protocol: parsed.protocol,
    tls: parsed.protocol === 'rediss:',
    url: redisUrl,
  };
}

export function getRedisTlsOptions(policy: RedisConnectionPolicy) {
  return policy.tls
    ? { tls: { rejectUnauthorized: true as const } }
    : {};
}
