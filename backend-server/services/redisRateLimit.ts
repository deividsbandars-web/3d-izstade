import { Redis, type Redis as RedisClient } from 'ioredis';
import {
  getRedisTlsOptions,
  resolveRedisConnectionPolicy,
} from '../../src/backend/infrastructure/redisConnectionPolicy.js';

export type RedisBackedRateLimitStore = {
  increment: (key: string, windowMs: number, nowMs: number) => Promise<{
    count: number;
    resetAt: number;
  }>;
};

export type RedisBackedRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
  store: 'redis' | 'memory' | 'unavailable';
  unavailable: boolean;
};

const redisIncrementScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  return { current, ARGV[1] }
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = ARGV[1]
end
return { current, ttl }
`;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
let redisClient: RedisClient | null | undefined;
let redisClientErrorLogged = false;

function normalizeRedisUrl() {
  const redisUrl = process.env.REDIS_URL?.trim();
  return redisUrl ? resolveRedisConnectionPolicy(redisUrl).url : '';
}

function getRedisClient(): RedisClient | null {
  const redisUrl = normalizeRedisUrl();
  if (!redisUrl) {
    return null;
  }

  if (redisClient !== undefined) {
    return redisClient;
  }

  const policy = resolveRedisConnectionPolicy(redisUrl);
  const client = new Redis(policy.url, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    ...getRedisTlsOptions(policy),
  });
  redisClient = client;
  client.on('error', (error) => {
    if (redisClientErrorLogged) {
      return;
    }

    redisClientErrorLogged = true;
    console.warn('[redis-rate-limit]', {
      code: 'REDIS_RATE_LIMIT_CLIENT_ERROR',
      message: error instanceof Error ? error.message : String(error),
    });
  });

  return client;
}

function createRedisRateLimitStore(client: RedisClient): RedisBackedRateLimitStore {
  return {
    async increment(key: string, windowMs: number, nowMs: number) {
      if (client.status === 'wait') {
        await client.connect();
      }

      const result = await client.eval(redisIncrementScript, 1, key, String(windowMs));
      const [count, ttlMs] = Array.isArray(result) ? result : [1, windowMs];
      const safeTtlMs = Math.max(1, Number(ttlMs) || windowMs);

      return {
        count: Math.max(1, Number(count) || 1),
        resetAt: nowMs + safeTtlMs,
      };
    },
  };
}

export function createInMemoryRateLimitStore(namespace = 'memory'): RedisBackedRateLimitStore {
  return {
    async increment(key: string, windowMs: number, nowMs: number) {
      const bucketKey = `${namespace}:${key}`;
      const current = memoryBuckets.get(bucketKey);

      if (!current || current.resetAt <= nowMs) {
        const resetAt = nowMs + windowMs;
        memoryBuckets.set(bucketKey, { count: 1, resetAt });
        return { count: 1, resetAt };
      }

      current.count += 1;
      return {
        count: current.count,
        resetAt: current.resetAt,
      };
    },
  };
}

export function isRedisRateLimitConfigured() {
  return Boolean(normalizeRedisUrl());
}

export function resetRedisRateLimitForTests() {
  memoryBuckets.clear();
}

export async function checkRedisBackedRateLimit({
  key,
  limit,
  namespace,
  nowMs = Date.now(),
  requireRedis = false,
  store,
  windowMs,
}: {
  key: string;
  limit: number;
  namespace: string;
  nowMs?: number;
  requireRedis?: boolean;
  store?: RedisBackedRateLimitStore;
  windowMs: number;
}): Promise<RedisBackedRateLimitResult> {
  const namespacedKey = `${namespace}:${key}`;
  const client = store ? null : getRedisClient();
  const activeStore = store
    ?? (client ? createRedisRateLimitStore(client) : null)
    ?? (requireRedis ? null : createInMemoryRateLimitStore(namespace));

  if (!activeStore) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(nowMs + windowMs).toISOString(),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      store: 'unavailable',
      unavailable: true,
    };
  }

  try {
    const current = await activeStore.increment(namespacedKey, windowMs, nowMs);
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - nowMs) / 1000));
    const remaining = Math.max(0, limit - current.count);

    return {
      allowed: current.count <= limit,
      remaining,
      resetAt: new Date(current.resetAt).toISOString(),
      retryAfterSeconds: current.count <= limit ? 0 : retryAfterSeconds,
      store: store ? 'memory' : client ? 'redis' : 'memory',
      unavailable: false,
    };
  } catch (error) {
    console.warn('[redis-rate-limit]', {
      code: 'REDIS_RATE_LIMIT_INCREMENT_FAILED',
      message: error instanceof Error ? error.message : String(error),
      namespace,
    });

    if (requireRedis) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(nowMs + windowMs).toISOString(),
        retryAfterSeconds: Math.ceil(windowMs / 1000),
        store: 'unavailable',
        unavailable: true,
      };
    }

    return checkRedisBackedRateLimit({
      key,
      limit,
      namespace,
      nowMs,
      store: createInMemoryRateLimitStore(namespace),
      windowMs,
    });
  }
}
