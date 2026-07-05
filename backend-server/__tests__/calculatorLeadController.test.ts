import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  captureCalculatorLeadWithDependencies,
  findDuplicateCalculatorLead,
  normalizeCalculatorLeadOpsUpdate,
} from '../controllers/calculatorLeadController.js';
import { validateCalculatorLeadRequest } from '../controllers/calculatorLeadValidation.js';
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

const valid = validateCalculatorLeadRequest({
  contact_info: {
    calculatorId: 'roof',
    calculatorTitle: 'Jumta tāme',
    email: 'client@example.com',
    estimateCurrency: 'EUR',
    estimateTotal: 12650.45,
    name: 'Klients',
    notes: 'Vajag piedāvājumu.',
    phone: '+371 20000000',
    sourcePath: '/roof-cost-calculator',
    summaryItems: [
      { label: 'Platība', value: '120 m²' },
      { label: 'Segums', value: 'Metāls' },
    ],
  },
  message: 'Calculator: Jumta tāme',
  score: 72,
  source: 'calculator:roof',
});

assert.equal(valid.contact_info.calculatorId, 'roof');
assert.equal(valid.contact_info.estimateTotal, 12650);
assert.equal(valid.contact_info.summaryItems.length, 2);
assert.equal(valid.source, 'calculator:roof');
assert.equal(valid.status, 'new');

assert.throws(() => validateCalculatorLeadRequest({
  contact_info: {
    calculatorId: 'roof',
    calculatorTitle: 'Jumta tāme',
    email: 'bad-email',
    estimateTotal: 100,
    name: 'Klients',
    phone: '+371 20000000',
  },
  source: 'calculator:roof',
}), /CALCULATOR_LEAD_EMAIL_INVALID/);

assert.throws(() => validateCalculatorLeadRequest({
  contact_info: {
    calculatorId: 'roof',
    calculatorTitle: 'Jumta tāme',
    email: 'client@example.com',
    estimateTotal: 100,
    name: 'Klients',
    phone: '+371 20000000',
  },
  source: 'website',
}), /CALCULATOR_LEAD_SOURCE_INVALID/);

assert.throws(() => validateCalculatorLeadRequest({
  contact_info: {
    calculatorId: 'roof',
    calculatorTitle: 'Jumta tāme',
    email: 'client@example.com',
    estimateTotal: -1,
    name: 'Klients',
    phone: '+371 20000000',
  },
  source: 'calculator:roof',
}), /CALCULATOR_LEAD_ESTIMATE_INVALID/);

const opsUpdate = normalizeCalculatorLeadOpsUpdate({
  leadQuality: 'high',
  salesNotes: 'Call tomorrow with premium offer.',
  salesPriority: 'urgent',
  status: 'contacted',
});

assert.equal(opsUpdate.status, 'contacted');
assert.equal(opsUpdate.salesPriority, 'urgent');
assert.equal(opsUpdate.leadQuality, 'high');
assert.equal(opsUpdate.salesNotes, 'Call tomorrow with premium offer.');

assert.deepEqual(normalizeCalculatorLeadOpsUpdate({ priority: 'medium', quality: 'low' }), {
  leadQuality: 'low',
  salesPriority: 'medium',
});

assert.throws(() => normalizeCalculatorLeadOpsUpdate({}), /CALCULATOR_LEAD_UPDATE_EMPTY/);
assert.throws(() => normalizeCalculatorLeadOpsUpdate({ salesPriority: 'now' }), /CALCULATOR_LEAD_PRIORITY_INVALID/);
assert.throws(() => normalizeCalculatorLeadOpsUpdate({ leadQuality: 'maybe' }), /CALCULATOR_LEAD_QUALITY_INVALID/);

{
  const insertedRows: unknown[] = [];
  const fakeSupabase = {
    from(table: string) {
      assert.equal(table, 'leads');
      return {
        insert(rows: unknown[]) {
          insertedRows.push(...rows);
          return {
            select(columns: string) {
              assert.equal(columns, 'id');
              return {
                async single() {
                  return { data: { id: 'lead-123' }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({
    body: {
      contact_info: {
        calculatorId: 'roof',
        calculatorTitle: 'Jumta tame',
        email: 'client@example.com',
        estimateTotal: 12650,
        name: 'Klients',
        phone: '+371 20000000',
      },
      message: 'Calculator: Jumta tame',
      score: 72,
      source: 'calculator:roof',
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
    calculatorId: 'roof',
    id: 'lead-123',
    source: 'calculator:roof',
    success: true,
  });
  assert.equal(insertedRows.length, 1);
  const inserted = insertedRows[0] as Record<string, any>;
  assert.match(inserted.submission_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(inserted.submission_metadata.turnstileVerified, false);
  assert.equal(inserted.submission_metadata.provenance.receivedAt, '2026-07-02T12:00:00.000Z');
  assert.doesNotMatch(JSON.stringify(inserted.submission_metadata), /client@example\.com/);
}

{
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({
    body: { antiSpam: { homepage: 'filled-by-bot' } },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    rateLimitStore: createRateLimitStore(),
  });
  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.body, { error: 'CALCULATOR_LEAD_SPAM_REJECTED' });
}

{
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({ body: {} } as Request, response, {
    audit: () => undefined,
    config: {
      ...testConfig,
      turnstile: { ...testConfig.turnstile, required: true, secretKey: 'secret-key' },
    },
    rateLimitStore: createRateLimitStore(),
  });
  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.body, { error: 'CALCULATOR_LEAD_TURNSTILE_REQUIRED' });
}

{
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({
    body: {
      contact_info: {
        calculatorId: 'roof',
        calculatorTitle: 'Roof estimate',
        email: 'client@example.com',
        estimateTotal: 100,
        name: 'Client',
        phone: '+371 20000000',
      },
      source: 'calculator:roof',
    },
  } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    duplicateLookup: async () => 'existing-lead-id',
    nowMs: () => nowMs,
    rateLimitStore: createRateLimitStore(),
    supabase: {} as any,
  });
  assert.equal(result.statusCode, 409);
  assert.deepEqual(result.body, { error: 'CALCULATOR_LEAD_DUPLICATE' });
}

{
  const fakeSupabase = {
    from(table: string) {
      assert.equal(table, 'leads');
      return {
        insert() {
          return {
            select() {
              return {
                async single() {
                  return { data: null, error: { code: '23505' } };
                },
              };
            },
          };
        },
      };
    },
  };
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({
    body: {
      contact_info: {
        calculatorId: 'roof',
        calculatorTitle: 'Roof estimate',
        email: 'client@example.com',
        estimateTotal: 100,
        name: 'Client',
        phone: '+371 20000000',
      },
      source: 'calculator:roof',
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
  assert.deepEqual(result.body, { error: 'CALCULATOR_LEAD_DUPLICATE' });
}

{
  const { response, result } = createMockResponse();
  await captureCalculatorLeadWithDependencies({ body: {} } as Request, response, {
    audit: () => undefined,
    config: testConfig,
    rateLimitStore: createRateLimitStore(6),
  });
  assert.equal(result.statusCode, 429);
  assert.deepEqual(result.body, {
    error: 'CALCULATOR_LEAD_RATE_LIMITED',
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
  const duplicateId = await findDuplicateCalculatorLead(
    valid,
    nowMs,
    testConfig,
    { from: () => query } as any,
  );
  assert.equal(duplicateId, 'existing-lead-id');
  assert.deepEqual(operations, [
    ['select', 'id'],
    ['eq:source', 'calculator:roof'],
    ['eq:contact_info->>email', 'client@example.com'],
    ['gte:created_at', '2026-07-02T11:30:00.000Z'],
    ['limit', 1],
  ]);
}
