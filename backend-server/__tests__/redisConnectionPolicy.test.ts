import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getRedisTlsOptions,
  resolveRedisConnectionPolicy,
} from '../../src/backend/infrastructure/redisConnectionPolicy.js';
import { isRedisRateLimitConfigured } from '../services/redisRateLimit.js';

const productionEnv = { NODE_ENV: 'production' };

{
  const local = resolveRedisConnectionPolicy('redis://127.0.0.1:6379', productionEnv);
  assert.deepEqual(local, {
    protocol: 'redis:',
    tls: false,
    url: 'redis://127.0.0.1:6379',
  });
  assert.deepEqual(getRedisTlsOptions(local), {});
}

for (const url of [
  'redis://localhost:6379',
  'redis://redis:6379',
  'redis://redis-staging:6379',
  'redis://10.20.30.40:6379',
  'redis://172.20.0.4:6379',
  'redis://192.168.1.10:6379',
  'redis://cache.prod.internal:6379',
  'redis://[::1]:6379',
  'redis://[fd00::10]:6379',
]) {
  assert.equal(resolveRedisConnectionPolicy(url, productionEnv).tls, false, url);
}

{
  const secure = resolveRedisConnectionPolicy(
    'rediss://default:secret@eu1-example.upstash.io:6379',
    productionEnv,
  );
  assert.equal(secure.protocol, 'rediss:');
  assert.equal(secure.tls, true);
  assert.deepEqual(getRedisTlsOptions(secure), {
    tls: { rejectUnauthorized: true },
  });
}

assert.throws(
  () => resolveRedisConnectionPolicy('redis://example.upstash.io:6379', {}),
  /REDIS_URL_TLS_REQUIRED/,
);
assert.throws(
  () => resolveRedisConnectionPolicy('redis://cache.example.com:6379', productionEnv),
  /REDIS_URL_PLAINTEXT_REMOTE_FORBIDDEN/,
);
assert.throws(
  () => resolveRedisConnectionPolicy('redis://[2606:4700:4700::1111]:6379', productionEnv),
  /REDIS_URL_PLAINTEXT_REMOTE_FORBIDDEN/,
);
assert.equal(
  resolveRedisConnectionPolicy('redis://cache.example.com:6379', { NODE_ENV: 'development' }).tls,
  false,
);
assert.throws(
  () => resolveRedisConnectionPolicy('rediss://cache.example.com:6379?rejectUnauthorized=false', productionEnv),
  /REDIS_URL_TLS_OPTIONS_FORBIDDEN/,
);
assert.throws(
  () => resolveRedisConnectionPolicy('rediss://cache.example.com:6379?tls=false', productionEnv),
  /REDIS_URL_TLS_OPTIONS_FORBIDDEN/,
);
assert.throws(
  () => resolveRedisConnectionPolicy('http://cache.example.com:6379', productionEnv),
  /REDIS_URL_PROTOCOL_INVALID/,
);
assert.throws(
  () => resolveRedisConnectionPolicy('not-a-url', productionEnv),
  /REDIS_URL_INVALID/,
);

{
  const previousRedisUrl = process.env.REDIS_URL;
  try {
    process.env.REDIS_URL = 'redis://example.upstash.io:6379';
    assert.throws(() => isRedisRateLimitConfigured(), /REDIS_URL_TLS_REQUIRED/);

    process.env.REDIS_URL = 'rediss://example.upstash.io:6379';
    assert.equal(isRedisRateLimitConfigured(), true);

    delete process.env.REDIS_URL;
    assert.equal(isRedisRateLimitConfigured(), false);
  } finally {
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
  }
}

{
  const testDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(testDirectory, '..', '..');
  const productionFiles = [
    'backend-server/services/redisRateLimit.ts',
    'src/backend/distribution/contentScheduler.ts',
    'src/backend/events/eventBus.js',
    'src/backend/events/eventBus.ts',
    'src/backend/infrastructure/redisConnectionPolicy.js',
    'src/backend/infrastructure/redisConnectionPolicy.ts',
  ];

  for (const relativePath of productionFiles) {
    const contents = readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
    assert.doesNotMatch(contents, /rejectUnauthorized\s*:\s*false/, relativePath);
  }
}
