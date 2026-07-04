import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { createRateLimitMiddleware } from '../middleware/rateLimit.js';
import type { RedisBackedRateLimitStore } from '../services/redisRateLimit.js';

async function fetchWithTrustProxy(trustProxy: false | number, spoofedForwardedFor: string) {
  const capturedKeys: string[] = [];
  const store: RedisBackedRateLimitStore = {
    async increment(key: string, windowMs: number, nowMs: number) {
      capturedKeys.push(key);
      return { count: 1, resetAt: nowMs + windowMs };
    },
  };

  const app = express();
  app.set('trust proxy', trustProxy);
  app.use(createRateLimitMiddleware({
    nowMs: () => Date.parse('2026-07-02T12:00:00.000Z'),
    store,
  }));
  app.get('/probe', (_req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/probe`, {
      headers: {
        'x-forwarded-for': spoofedForwardedFor,
      },
    });
    return {
      capturedKeys,
      response,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

{
  const spoofedIp = '203.0.113.77';
  const { capturedKeys, response } = await fetchWithTrustProxy(false, spoofedIp);
  assert.equal(response.status, 200);
  assert.equal(capturedKeys.length, 1);
  assert.equal(capturedKeys[0].includes(spoofedIp), false);
}

{
  const trustedForwardedIp = '203.0.113.88';
  const { capturedKeys, response } = await fetchWithTrustProxy(1, trustedForwardedIp);
  assert.equal(response.status, 200);
  assert.deepEqual(capturedKeys, [`backend-api-global:${trustedForwardedIp}`]);
}
