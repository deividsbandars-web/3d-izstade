import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Request, Response } from 'express';
import express from 'express';
import {
  captureCalculatorLeadWithDependencies,
} from '../../controllers/calculatorLeadController.js';
import {
  captureExpoLeadWithDependencies,
} from '../../controllers/expoLeadController.js';
import { estimateWithAi } from '../../controllers/aiController.js';
import { submitModularHomeQuote } from '../../controllers/modularHomeQuoteController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { createApiRouter } from '../api.js';
import type { PublicLeadAbuseConfig } from '../../config/publicLeadAbuse.js';
import type { RedisBackedRateLimitStore } from '../../services/redisRateLimit.js';
import { pubClient, subClient } from '../../../src/backend/events/eventBus.js';

const publicLeadTestConfig: PublicLeadAbuseConfig = {
  duplicateWindowMs: 30 * 60 * 1000,
  rateLimit: {
    maxRequests: { calculator: 5, expo: 5 },
    requireRedis: false,
    windowMs: 10 * 60 * 1000,
  },
  turnstile: { required: false, secretKey: null, timeoutMs: 5_000 },
};

function createPublicLeadRateLimitStore(count = 1): RedisBackedRateLimitStore {
  return {
    async increment(_key, windowMs, nowMs) {
      return { count, resetAt: nowMs + windowMs };
    },
  };
}

async function fetchApi(path: string, init?: Parameters<typeof fetch>[1]) {
  const app = express();
  app.use(express.json());
  app.post('/api/expo/lead', (req, res) => captureExpoLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: publicLeadTestConfig,
    rateLimitStore: createPublicLeadRateLimitStore(),
  }));
  app.post('/api/calculator/lead', (req, res) => captureCalculatorLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: publicLeadTestConfig,
    rateLimitStore: createPublicLeadRateLimitStore(),
  }));
  app.post('/api/modular-home/quote', submitModularHomeQuote);

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
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

async function fetchMountedApi(path: string, init?: Parameters<typeof fetch>[1]) {
  const app = express();
  app.use(express.json());

  const protectedRouter = express.Router();
  protectedRouter.use(authMiddleware);
  protectedRouter.post('/ai-estimate', estimateWithAi);
  app.use('/api', protectedRouter);

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
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

async function fetchRealMountedApi(path: string, init?: Parameters<typeof fetch>[1]) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter());

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
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

async function fetchControlledLeadApi(
  route: string,
  handler: (req: Request, res: Response) => Promise<unknown>,
  init: Parameters<typeof fetch>[1],
) {
  const app = express();
  app.use(express.json());
  app.post(route, async (req, res) => {
    await handler(req, res);
  });

  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  try {
    return await fetch(`http://127.0.0.1:${address.port}${route}`, init);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

const previousQuoteSubmissionEnabled = process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;

const expoLeadInvalid = await fetchApi('/api/expo/lead', {
  body: JSON.stringify({
    clientEmail: 'not-an-email',
    clientName: 'Expo Buyer',
    companyId: 'company-1',
  }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(expoLeadInvalid.status, 400);
assert.deepEqual(await expoLeadInvalid.json(), { error: 'EXPO_LEAD_EMAIL_INVALID' });

const calculatorLeadInvalid = await fetchApi('/api/calculator/lead', {
  body: JSON.stringify({
    contact_info: {
      calculatorId: 'roof',
      calculatorTitle: 'Roof estimate',
      email: 'client@example.com',
      estimateTotal: 100,
      name: 'Client',
      phone: '+371 20000000',
    },
    source: 'website',
  }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(calculatorLeadInvalid.status, 400);
assert.deepEqual(await calculatorLeadInvalid.json(), { error: 'CALCULATOR_LEAD_SOURCE_INVALID' });

const expoHoneypot = await fetchControlledLeadApi(
  '/api/expo/lead',
  (req, res) => captureExpoLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: publicLeadTestConfig,
    rateLimitStore: createPublicLeadRateLimitStore(),
  }),
  {
    body: JSON.stringify({ antiSpam: { website: 'filled-by-bot' } }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  },
);
assert.equal(expoHoneypot.status, 400);
assert.deepEqual(await expoHoneypot.json(), { error: 'EXPO_LEAD_SPAM_REJECTED' });

const calculatorTurnstileRequired = await fetchControlledLeadApi(
  '/api/calculator/lead',
  (req, res) => captureCalculatorLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: {
      ...publicLeadTestConfig,
      turnstile: {
        ...publicLeadTestConfig.turnstile,
        required: true,
        secretKey: 'turnstile-secret',
      },
    },
    rateLimitStore: createPublicLeadRateLimitStore(),
  }),
  {
    body: JSON.stringify({}),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  },
);
assert.equal(calculatorTurnstileRequired.status, 403);
assert.deepEqual(await calculatorTurnstileRequired.json(), {
  error: 'CALCULATOR_LEAD_TURNSTILE_REQUIRED',
});

const calculatorDuplicate = await fetchControlledLeadApi(
  '/api/calculator/lead',
  (req, res) => captureCalculatorLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: publicLeadTestConfig,
    duplicateLookup: async () => 'existing-lead-id',
    rateLimitStore: createPublicLeadRateLimitStore(),
    supabase: {} as any,
  }),
  {
    body: JSON.stringify({
      contact_info: {
        calculatorId: 'roof',
        calculatorTitle: 'Roof estimate',
        email: 'client@example.com',
        estimateTotal: 100,
        name: 'Client',
        phone: '+371 20000000',
      },
      source: 'calculator:roof',
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  },
);
assert.equal(calculatorDuplicate.status, 409);
assert.deepEqual(await calculatorDuplicate.json(), { error: 'CALCULATOR_LEAD_DUPLICATE' });

const expoRateLimited = await fetchControlledLeadApi(
  '/api/expo/lead',
  (req, res) => captureExpoLeadWithDependencies(req, res, {
    audit: () => undefined,
    config: publicLeadTestConfig,
    rateLimitStore: createPublicLeadRateLimitStore(6),
  }),
  {
    body: JSON.stringify({}),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  },
);
assert.equal(expoRateLimited.status, 429);
assert.equal((await expoRateLimited.json() as { error?: string }).error, 'EXPO_LEAD_RATE_LIMITED');

const aiEstimateUnauthenticated = await fetchMountedApi('/api/ai-estimate', {
  body: JSON.stringify({ description: 'Estimate a sponsor booth.' }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(aiEstimateUnauthenticated.status, 401);
assert.deepEqual(await aiEstimateUnauthenticated.json(), { error: 'Authentication required' });

const mountedLeadCaptureMissingFields = await fetchRealMountedApi('/api/leads/capture', {
  body: new URLSearchParams().toString(),
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  method: 'POST',
});
assert.equal(mountedLeadCaptureMissingFields.status, 400);
assert.equal(await mountedLeadCaptureMissingFields.text(), 'Email and Page ID are required.');

const mountedAiEstimateUnauthenticated = await fetchRealMountedApi('/api/ai-estimate', {
  body: JSON.stringify({ description: 'Estimate a sponsor booth.' }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(mountedAiEstimateUnauthenticated.status, 401);
assert.deepEqual(await mountedAiEstimateUnauthenticated.json(), { error: 'Authentication required' });

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = '';
const modularHomeQuoteDisabled = await fetchApi('/api/modular-home/quote?homeQuoteBackend=1', {
  body: JSON.stringify({}),
  headers: {
    'content-type': 'application/json',
    host: 'staging.30sek24.com',
  },
  method: 'POST',
});
assert.equal(modularHomeQuoteDisabled.status, 503);
assert.equal((await modularHomeQuoteDisabled.json() as { error?: string }).error, 'MODULAR_HOME_QUOTE_BACKEND_DISABLED');

if (previousQuoteSubmissionEnabled === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = previousQuoteSubmissionEnabled;
}

pubClient.disconnect();
subClient.disconnect();
