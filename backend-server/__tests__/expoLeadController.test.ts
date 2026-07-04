import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  captureExpoLeadWithDependencies,
  findDuplicateExpoLead,
  validateExpoLeadRequest,
} from '../controllers/expoLeadController.js';
import type { PublicLeadAbuseConfig } from '../config/publicLeadAbuse.js';
import type { RedisBackedRateLimitStore } from '../services/redisRateLimit.js';

const nowMs = Date.parse('2026-07-02T12:00:00.000Z');
const testConfig: PublicLeadAbuseConfig = {
  duplicateWindowMs: 30 * 60 * 1000,
  rateLimit: {
    maxRequests: { calculator: 5, expo: 5 },
    requireRedis: false,
    windowMs: 10 * 60 * 1000,
  },
  turnstile: { required: false, secretKey: null, timeoutMs: 5_000 },
};

function createRateLimitStore(count = 1): RedisBackedRateLimitStore {
  return {
    async increment(_key, windowMs, currentNowMs) {
      return { count, resetAt: currentNowMs + windowMs };
    },
  };
}

function createMockResponse() {
  const result = {
    body: null as unknown,
    statusCode: 200,
  };
  const response = {
    json(body: unknown) {
      result.body = body;
      return response;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return response;
    },
  } as Response;

  return { response, result };
}

const valid = validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: 'Expo Buyer',
  companyId: 'company-1',
  companySlug: 'hero-one',
  message: 'Need a follow-up meeting.',
  sourcePath: '/expo/booth/hero-one',
});

assert.equal(valid.clientEmail, 'sponsor@example.com');
assert.equal(valid.clientName, 'Expo Buyer');
assert.equal(valid.companyId, 'company-1');
assert.equal(valid.companySlug, 'hero-one');

assert.equal(validateExpoLeadRequest({
  clientEmail: 'SPONSOR@EXAMPLE.COM',
  clientName: 'Expo Buyer',
  companyId: 'company-1',
}).clientEmail, 'sponsor@example.com');

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'invalid',
  clientName: 'Expo Buyer',
  companyId: 'company-1',
}), /EXPO_LEAD_EMAIL_INVALID/);

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: '',
  companyId: 'company-1',
}), /EXPO_LEAD_NAME_REQUIRED/);

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: 'Expo Buyer',
  companyId: '',
}), /EXPO_LEAD_COMPANY_REQUIRED/);

{
  const insertedRows: unknown[] = [];
  const fakeSupabase = {
    from(table: string) {
      if (table === 'companies') {
        return {
          select(columns: string) {
            assert.equal(columns, 'id');
            return {
              eq(column: string, value: string) {
                assert.equal(column, 'slug');
                assert.equal(value, 'hero-one');
                return {
                  async maybeSingle() {
                    return { data: { id: 'company-uuid-1' }, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === 'service_requests') {
        return {
          async insert(rows: unknown[]) {
            insertedRows.push(...rows);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({
    body: {
      clientEmail: 'sponsor@example.com',
      clientName: 'Expo Buyer',
      companyId: 'hero-one',
      companySlug: 'hero-one',
      message: 'Need a follow-up meeting.',
      sourcePath: '/expo/booth/hero-one',
    },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    duplicateLookup: async () => null,
    nowMs: () => nowMs,
    rateLimitStore: createRateLimitStore(),
    supabase: fakeSupabase as any,
  });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body, {
    companyId: 'company-uuid-1',
    companySlug: 'hero-one',
    sourcePath: '/expo/booth/hero-one',
    success: true,
  });
  assert.equal(insertedRows.length, 1);
  const inserted = insertedRows[0] as Record<string, any>;
  assert.match(inserted.submission_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(inserted.submission_metadata.provenance.sourcePath, '/expo/booth/hero-one');
  assert.equal(inserted.submission_metadata.turnstileVerified, false);
  assert.doesNotMatch(JSON.stringify(inserted.submission_metadata), /sponsor@example\.com/);
}

{
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({
    body: { antiSpam: { website: 'https://spam.example' } },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    rateLimitStore: createRateLimitStore(),
  });
  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.body, { error: 'EXPO_LEAD_SPAM_REJECTED' });
}

{
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({ body: {} } as Request, response, {
    audit: () => undefined,
    config: {
      ...testConfig,
      turnstile: { ...testConfig.turnstile, required: true, secretKey: 'secret-key' },
    },
    rateLimitStore: createRateLimitStore(),
  });
  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.body, { error: 'EXPO_LEAD_TURNSTILE_REQUIRED' });
}

{
  const fakeSupabase = {
    from(table: string) {
      assert.equal(table, 'companies');
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: { id: 'company-uuid-1' }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({
    body: {
      clientEmail: 'sponsor@example.com',
      clientName: 'Expo Buyer',
      companyId: 'hero-one',
      companySlug: 'hero-one',
    },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    duplicateLookup: async () => 'existing-lead-id',
    nowMs: () => nowMs,
    rateLimitStore: createRateLimitStore(),
    supabase: fakeSupabase as any,
  });
  assert.equal(result.statusCode, 409);
  assert.deepEqual(result.body, { error: 'EXPO_LEAD_DUPLICATE' });
}

{
  const fakeSupabase = {
    from(table: string) {
      assert.equal(table, 'service_requests');
      return {
        async insert() {
          return { error: { code: '23505' } };
        },
      };
    },
  };
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({
    body: {
      clientEmail: 'sponsor@example.com',
      clientName: 'Expo Buyer',
      companyId: '123e4567-e89b-42d3-a456-426614174000',
    },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    duplicateLookup: async () => null,
    nowMs: () => nowMs,
    rateLimitStore: createRateLimitStore(),
    supabase: fakeSupabase as any,
  });
  assert.equal(result.statusCode, 409);
  assert.deepEqual(result.body, { error: 'EXPO_LEAD_DUPLICATE' });
}

{
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({ body: {} } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    rateLimitStore: createRateLimitStore(6),
  });
  assert.equal(result.statusCode, 429);
  assert.deepEqual(result.body, {
    error: 'EXPO_LEAD_RATE_LIMITED',
    retryAfterSeconds: 600,
  });
}

{
  const operations: Array<[string, unknown]> = [];
  const query = {
    eq(column: string, value: unknown) {
      operations.push([`eq:${column}`, value]);
      return query;
    },
    gte(column: string, value: unknown) {
      operations.push([`gte:${column}`, value]);
      return query;
    },
    limit(value: number) {
      operations.push(['limit', value]);
      return query;
    },
    async maybeSingle() {
      return { data: { id: 'existing-lead-id' }, error: null };
    },
    select(value: string) {
      operations.push(['select', value]);
      return query;
    },
  };
  const duplicateId = await findDuplicateExpoLead(
    valid,
    'company-uuid-1',
    nowMs,
    testConfig,
    { from: () => query } as any,
  );
  assert.equal(duplicateId, 'existing-lead-id');
  assert.deepEqual(operations, [
    ['select', 'id'],
    ['eq:client_email', 'sponsor@example.com'],
    ['eq:service_name', 'expo_sponsor_lead:hero-one'],
    ['gte:created_at', '2026-07-02T11:30:00.000Z'],
    ['eq:company_id', 'company-uuid-1'],
    ['limit', 1],
  ]);
}
