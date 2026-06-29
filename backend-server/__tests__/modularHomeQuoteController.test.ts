import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  MODULAR_HOME_QUOTE_CONSENT_VERSION,
  MODULAR_HOME_QUOTE_PRIVACY_VERSION,
  type ModularHomeQuoteStorageClient,
  checkModularHomeQuoteRateLimit,
  createModularHomeQuoteSafeLogEvent,
  createModularHomeQuoteDuplicateGuardKey,
  getModularHomeQuoteBackendHardeningPlan,
  getModularHomeQuoteSubmissionConfig,
  hasFilledModularHomeQuoteHoneypot,
  insertModularHomeQuoteRequest,
  findDuplicateModularHomeQuoteRequest,
  isModularHomeQuoteBackendRequestEnabled,
  isModularHomeQuoteProductionRequest,
  isModularHomeQuoteStagingRequest,
  resetModularHomeQuoteRateLimitForTests,
  submitModularHomeQuote,
  submitModularHomeQuoteWithDependencies,
  validateModularHomeQuoteRequest,
  verifyModularHomeQuoteTurnstile,
} from '../controllers/modularHomeQuoteController.js';

function createValidPayload() {
  return {
    attribution: {
      companySlug: 'warpala',
      salesOwner: 'modular-home-sales',
      sourceSurface: 'homeDemo',
      sponsorSlug: null,
    },
    config: {
      doorPlacement: 'frontEntry',
      facade: 'naturalTimber',
      facadeBoardOrientation: 'horizontal',
      facadeBoardProfile: 'squareEdge',
      facadeBoardSpacing: 'standard',
      facadeBoardWidth: 'standard',
      finishLevel: 'standard',
      floorFinish: 'oakLaminate',
      furniturePackage: 'standardFurniture',
      sofa: 'enabled',
      table: 'enabled',
      bed: 'enabled',
      kitchenLine: 'enabled',
      wardrobePlaceholder: 'enabled',
      interiorFloorStyle: 'warmPlank',
      interiorWallFinish: 'plywood',
      layoutVariant: 'oneBedroom',
      presetId: 'compactStandard',
      roof: 'pitched',
      roofEdgeColor: 'graphite',
      roofGutterStyle: 'minimalEdge',
      terrace: 'smallTerrace',
      trimColor: 'timber',
      windowFrameColor: 'timber',
      windowFrameType: 'standardFrame',
      windowPlacement: 'balanced',
      wallPanelStyle: 'plainPanel',
    },
    consent: {
      accepted: true,
      acceptedAt: '2026-06-05T12:00:00.000Z',
      consentText: MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
      consentVersion: MODULAR_HOME_QUOTE_CONSENT_VERSION,
      privacyVersion: MODULAR_HOME_QUOTE_PRIVACY_VERSION,
    },
    estimate: {
      currency: 'EUR',
      estimatedTotal: 68000,
      lineItems: [
        { amount: 38000, label: 'Base product module package' },
        { amount: 12000, label: 'Finish level: Standard' },
      ],
      scopeSummary: ['Included: Timber module shell'],
    },
    project: {
      floorAreaM2: 40,
      modelName: 'Compact Timber 40',
      productId: 'compact-timber-40',
      projectId: 'preview-project-1',
      shareUrl: 'https://staging.30sek24.com/expo-3d?homeDemo=1',
    },
    requester: {
      budgetRange: '50k-100k',
      countryCity: 'Latvia / Riga',
      email: 'Client@Example.com',
      landOwned: 'yes',
      message: 'Need a timber home quote.',
      name: 'Client Name',
      phone: '+371 20000000',
      targetBuildDate: '6-12-months',
    },
    source: {
      path: '/expo-3d?homeDemo=1&homeQuoteBackend=1',
      referrer: null,
      userAgent: 'test',
    },
  };
}

function createMockResponse() {
  const result = {
    body: null as unknown,
    headers: new Map<string, string>(),
    statusCode: 200,
  };
  const response = {
    json(body: unknown) {
      result.body = body;
      return response;
    },
    setHeader(name: string, value: string) {
      result.headers.set(name, value);
      return response;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return response;
    },
  } as Response;

  return { response, result };
}

const previousSubmissionFlag = process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;
const previousAppEnv = process.env.APP_ENV;
const previousVercelEnv = process.env.VERCEL_ENV;
const previousStagingHosts = process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS;
const previousProductionHosts = process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS;
const previousRedisUrl = process.env.REDIS_URL;
const previousTurnstileSecret = process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY;
const previousTurnstileRequired = process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED;
const previousEmailHandoffEnabled = process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED;

function createFakeQuoteStorage({ duplicateId = null }: { duplicateId?: string | null } = {}) {
  const insertedRows: unknown[] = [];
  const storage: ModularHomeQuoteStorageClient = {
    from(table: string) {
      assert.equal(table, 'modular_home_quote_requests');
      return {
        insert(rows: unknown[]) {
          insertedRows.push(...rows);
          return {
            select(columns: string) {
              assert.equal(columns, 'id');
              return {
                async single() {
                  return { data: { id: 'quote-test-id' }, error: null };
                },
              };
            },
          };
        },
        select(columns: string) {
          assert.equal(columns, 'id');
          const builder = {
            eq(_column: string, _value: string) {
              return builder;
            },
            async maybeSingle() {
              return duplicateId
                ? { data: { id: duplicateId }, error: null }
                : { data: null, error: null };
            },
          };
          return builder;
        },
      };
    },
  };

  return { insertedRows, storage };
}

const valid = validateModularHomeQuoteRequest(createValidPayload());
assert.equal(valid.requester.email, 'client@example.com');
assert.equal(valid.project.productId, 'compact-timber-40');
assert.equal(valid.config.layoutVariant, 'oneBedroom');
assert.equal(valid.config.windowPlacement, 'balanced');
assert.equal(valid.config.doorPlacement, 'frontEntry');
assert.equal(valid.config.facadeBoardOrientation, 'horizontal');
assert.equal(valid.config.facadeBoardProfile, 'squareEdge');
assert.equal(valid.config.facadeBoardSpacing, 'standard');
assert.equal(valid.config.facadeBoardWidth, 'standard');
assert.equal(valid.config.floorFinish, 'oakLaminate');
assert.equal(valid.config.furniturePackage, 'standardFurniture');
assert.equal(valid.config.kitchenLine, 'enabled');
assert.equal(valid.config.wardrobePlaceholder, 'enabled');
assert.equal(valid.config.interiorFloorStyle, 'warmPlank');
assert.equal(valid.config.interiorWallFinish, 'plywood');
assert.equal(valid.config.roofEdgeColor, 'graphite');
assert.equal(valid.config.roofGutterStyle, 'minimalEdge');
assert.equal(valid.config.trimColor, 'timber');
assert.equal(valid.config.windowFrameColor, 'timber');
assert.equal(valid.config.windowFrameType, 'standardFrame');
assert.equal(valid.config.presetId, 'compactStandard');
assert.equal(valid.config.wallPanelStyle, 'plainPanel');
assert.equal(valid.consent.accepted, true);
assert.equal(valid.consent.consentVersion, MODULAR_HOME_QUOTE_CONSENT_VERSION);
assert.equal(valid.consent.privacyVersion, MODULAR_HOME_QUOTE_PRIVACY_VERSION);
assert.equal(valid.source.vertical, 'modular-home');

const minimalLead = validateModularHomeQuoteRequest({
  ...createValidPayload(),
  requester: {
    ...createValidPayload().requester,
    budgetRange: '',
    countryCity: '',
    message: '',
    name: '',
    targetBuildDate: '',
  },
});
assert.equal(minimalLead.requester.email, 'client@example.com');
assert.equal(minimalLead.requester.phone, '+371 20000000');
assert.equal(minimalLead.requester.budgetRange, 'not-sure');
assert.equal(minimalLead.requester.countryCity, 'Location not provided');
assert.equal(minimalLead.requester.message, 'No message provided.');
assert.equal(minimalLead.requester.name, 'Name not provided');
assert.equal(minimalLead.requester.targetBuildDate, 'research-phase');

assert.throws(() => validateModularHomeQuoteRequest({
  ...createValidPayload(),
  requester: {
    ...createValidPayload().requester,
    email: 'bad-email',
  },
}), /MODULAR_HOME_QUOTE_EMAIL_INVALID/);

assert.throws(() => validateModularHomeQuoteRequest({
  ...createValidPayload(),
  consent: {
    ...createValidPayload().consent,
    accepted: false,
  },
}), /MODULAR_HOME_QUOTE_CONSENT_REQUIRED/);

assert.throws(() => validateModularHomeQuoteRequest({
  ...createValidPayload(),
  consent: {
    ...createValidPayload().consent,
    consentVersion: 'old-consent-version',
  },
}), /MODULAR_HOME_QUOTE_CONSENT_VERSION_INVALID/);

assert.throws(() => validateModularHomeQuoteRequest({
  ...createValidPayload(),
  consent: {
    ...createValidPayload().consent,
    privacyVersion: 'old-privacy-version',
  },
}), /MODULAR_HOME_QUOTE_PRIVACY_VERSION_INVALID/);

assert.equal(isModularHomeQuoteBackendRequestEnabled({}), false);
assert.equal(isModularHomeQuoteBackendRequestEnabled({ homeQuoteBackend: '0' }), false);
assert.equal(isModularHomeQuoteBackendRequestEnabled({ homeQuoteBackend: '1' }), true);
assert.equal(isModularHomeQuoteBackendRequestEnabled({ homeQuoteBackend: ['0', '1'] }), true);

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = '';
process.env.APP_ENV = '';
process.env.VERCEL_ENV = '';
process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS = '';
process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = '';
process.env.REDIS_URL = '';
process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = '';
process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = '';
process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED = '';
{
  const submissionConfig = getModularHomeQuoteSubmissionConfig();
  assert.equal(submissionConfig.enabled, false);
  assert.equal(submissionConfig.productionReady, false);
  assert.equal(submissionConfig.production.allowedHosts.length, 0);
  assert.equal(submissionConfig.production.redisConfigured, false);
  assert.equal(submissionConfig.production.turnstileConfigured, false);
  assert.equal(submissionConfig.rateLimit.maxRequests, 5);
  assert.equal(submissionConfig.rateLimit.windowMs, 10 * 60 * 1000);
  assert.equal(submissionConfig.requiresStagingEnvironment, true);
  assert.equal(submissionConfig.hardeningPlan.enablementGate.defaultMode, 'disabled');
  assert.equal(submissionConfig.hardeningPlan.enablementGate.envFlag, 'MODULAR_HOME_QUOTE_SUBMISSION_ENABLED');
  assert.equal(submissionConfig.hardeningPlan.enablementGate.requestFlag, 'homeQuoteBackend=1');
  assert.match(submissionConfig.hardeningPlan.enablementGate.stagingRequirement, /production host allowlist/);
  assert.ok(submissionConfig.staging.allowedHosts.includes('staging.30sek24.com'));
  assert.match(submissionConfig.staging.allowedPreviewHostPattern, /app-staging/);
  assert.equal(submissionConfig.staging.enabledByEnvironment, false);
}

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = 'www.30sek24.com, api.30sek24.com';
process.env.REDIS_URL = 'redis://localhost:6379';
{
  const submissionConfig = getModularHomeQuoteSubmissionConfig();
  assert.equal(submissionConfig.productionReady, true);
  assert.equal(submissionConfig.requiresStagingEnvironment, false);
  assert.deepEqual(submissionConfig.production.allowedHosts, ['www.30sek24.com', 'api.30sek24.com']);
}
process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = 'true';
assert.equal(getModularHomeQuoteSubmissionConfig().productionReady, false);
process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = 'turnstile-secret';
assert.equal(getModularHomeQuoteSubmissionConfig().productionReady, true);
process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = '';
process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = '';
process.env.REDIS_URL = '';
process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = '';
process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = '';

{
  const hardeningPlan = getModularHomeQuoteBackendHardeningPlan();
  assert.equal(hardeningPlan.consent.consentVersion, MODULAR_HOME_QUOTE_CONSENT_VERSION);
  assert.equal(hardeningPlan.consent.privacyVersion, MODULAR_HOME_QUOTE_PRIVACY_VERSION);
  assert.ok(hardeningPlan.rateLimitingPlan.productionRequirement.some((item) => item.includes('distributed')));
  assert.ok(hardeningPlan.supabasePolicyNotes.some((item) => item.includes('Anon/client keys must not have SELECT')));
  assert.ok(hardeningPlan.auditLogRequirements.some((item) => item.includes('validation failures')));
}

assert.equal(isModularHomeQuoteStagingRequest({
  headers: { host: 'staging.30sek24.com' },
  query: {},
} as unknown as Request), true);
assert.equal(isModularHomeQuoteStagingRequest({
  headers: { host: 'app-staging-h0m300eh1-esaukans-6934s-projects.vercel.app' },
  query: {},
} as unknown as Request), true);
assert.equal(isModularHomeQuoteStagingRequest({
  headers: { host: 'random-preview.vercel.app' },
  query: {},
} as unknown as Request), false);
assert.equal(isModularHomeQuoteStagingRequest({
  headers: { host: 'www.30sek24.com' },
  query: {},
} as unknown as Request), false);
assert.equal(isModularHomeQuoteProductionRequest({
  headers: { host: 'www.30sek24.com' },
  query: {},
} as unknown as Request), false);
process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = 'www.30sek24.com';
assert.equal(isModularHomeQuoteProductionRequest({
  headers: { host: 'www.30sek24.com' },
  query: {},
} as unknown as Request), true);
process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = '';

process.env.APP_ENV = 'staging';
assert.equal(isModularHomeQuoteStagingRequest({
  headers: { host: 'www.30sek24.com' },
  query: {},
} as unknown as Request), false);
assert.equal(isModularHomeQuoteStagingRequest({
  headers: {},
  query: {},
} as unknown as Request), true);
process.env.APP_ENV = '';

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuote({
    body: createValidPayload(),
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response);
  assert.equal(result.statusCode, 503);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_BACKEND_DISABLED/);
}

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
assert.equal(getModularHomeQuoteSubmissionConfig().enabled, true);

resetModularHomeQuoteRateLimitForTests();
{
  const rateLimitedRequest = {
    headers: { 'x-forwarded-for': '203.0.113.10' },
    query: { homeQuoteBackend: '1' },
  } as unknown as Request;
  const now = Date.parse('2026-06-05T12:00:00.000Z');

  for (let index = 0; index < 5; index += 1) {
    const result = await checkModularHomeQuoteRateLimit(rateLimitedRequest, now + index);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4 - index);
    assert.equal(result.unavailable, false);
  }

  const blocked = await checkModularHomeQuoteRateLimit(rateLimitedRequest, now + 5);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds > 0, true);
}
resetModularHomeQuoteRateLimitForTests();

{
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: createValidPayload(),
    headers: { host: 'staging.30sek24.com', 'x-forwarded-for': '203.0.113.50' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, {
    rateLimitStore: {
      async increment(_key: string, _windowMs: number, nowMs: number) {
        return { count: 6, resetAt: nowMs + 60_000 };
      },
    },
    storage: createFakeQuoteStorage().storage,
  });
  assert.equal(result.statusCode, 429);
  assert.equal(result.headers.get('Retry-After'), '60');
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_RATE_LIMITED/);
}

{
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: {
      ...createValidPayload(),
      requester: {
        ...createValidPayload().requester,
        email: 'bad-email',
      },
    },
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, {
    rateLimitStore: {
      async increment(_key: string, windowMs: number, nowMs: number) {
        return { count: 1, resetAt: nowMs + windowMs };
      },
    },
    storage: createFakeQuoteStorage().storage,
  });
  assert.equal(result.statusCode, 400);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_EMAIL_INVALID/);
}

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuote({
    body: createValidPayload(),
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: {},
  } as unknown as Request, response);
  assert.equal(result.statusCode, 403);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED/);
}

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuote({
    body: createValidPayload(),
    headers: { host: 'www.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response);
  assert.equal(result.statusCode, 403);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_HOST_NOT_ALLOWED/);
}

{
  const payload = validateModularHomeQuoteRequest(createValidPayload());
  const { insertedRows, storage } = createFakeQuoteStorage();
  const insertedId = await insertModularHomeQuoteRequest(payload, getModularHomeQuoteSubmissionConfig(), storage);
  assert.equal(insertedId, 'quote-test-id');
  assert.equal(insertedRows.length, 1);
  const row = insertedRows[0] as {
    attribution?: {
      duplicateGuardKey?: string;
    };
    config?: {
      facadeBoardOrientation?: string;
      facadeBoardProfile?: string;
      facadeBoardSpacing?: string;
      furniturePackage?: string;
      kitchenLine?: string;
      roofGutterStyle?: string;
      roofEdgeColor?: string;
      trimColor?: string;
      windowFrameColor?: string;
      windowFrameType?: string;
      wallPanelStyle?: string;
    };
    status?: string;
  };
  assert.equal(row.status, 'new');
  assert.equal(row.attribution?.duplicateGuardKey, createModularHomeQuoteDuplicateGuardKey(payload));
  assert.equal(row.config?.facadeBoardOrientation, 'horizontal');
  assert.equal(row.config?.facadeBoardProfile, 'squareEdge');
  assert.equal(row.config?.facadeBoardSpacing, 'standard');
  assert.equal(row.config?.furniturePackage, 'standardFurniture');
  assert.equal(row.config?.kitchenLine, 'enabled');
  assert.equal(row.config?.roofEdgeColor, 'graphite');
  assert.equal(row.config?.roofGutterStyle, 'minimalEdge');
  assert.equal(row.config?.trimColor, 'timber');
  assert.equal(row.config?.windowFrameColor, 'timber');
  assert.equal(row.config?.windowFrameType, 'standardFrame');
  assert.equal(row.config?.wallPanelStyle, 'plainPanel');

  const existingDuplicateId = await findDuplicateModularHomeQuoteRequest(
    payload,
    getModularHomeQuoteSubmissionConfig(),
    createFakeQuoteStorage({ duplicateId: 'existing-quote-id' }).storage,
  );
  assert.equal(existingDuplicateId, 'existing-quote-id');
}

{
  resetModularHomeQuoteRateLimitForTests();
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
  process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = '';
  const { insertedRows, storage } = createFakeQuoteStorage();
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: createValidPayload(),
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, { storage });
  assert.equal(result.statusCode, 201);
  assert.match(JSON.stringify(result.body), /quote-test-id/);
  assert.equal(insertedRows.length, 1);
}

{
  resetModularHomeQuoteRateLimitForTests();
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
  process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = 'www.30sek24.com';
  const { storage } = createFakeQuoteStorage();
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: createValidPayload(),
    headers: { host: 'www.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, {
    rateLimitStore: {
      async increment(_key: string, _windowMs: number, nowMs: number) {
        return { count: 1, resetAt: nowMs + 10 * 60 * 1000 };
      },
    },
    storage,
  });
  assert.equal(result.statusCode, 201);
  assert.match(JSON.stringify(result.body), /quote-test-id/);
  process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = '';
}

{
  assert.equal(hasFilledModularHomeQuoteHoneypot(createValidPayload()), false);
  assert.equal(hasFilledModularHomeQuoteHoneypot({
    ...createValidPayload(),
    antiSpam: { website: 'https://bot.example' },
  }), true);
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: {
      ...createValidPayload(),
      antiSpam: { website: 'https://bot.example' },
    },
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, { storage: createFakeQuoteStorage().storage });
  assert.equal(result.statusCode, 400);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_SPAM_REJECTED/);
}

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuoteWithDependencies({
    body: createValidPayload(),
    headers: { host: 'staging.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response, {
    storage: createFakeQuoteStorage({ duplicateId: 'existing-quote-id' }).storage,
  });
  assert.equal(result.statusCode, 409);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_DUPLICATE/);
}

{
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = 'turnstile-secret';
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = 'true';
  const missing = await verifyModularHomeQuoteTurnstile(createValidPayload(), {
    headers: { host: 'staging.30sek24.com' },
    query: { homeQuoteBackend: '1' },
  } as unknown as Request);
  assert.deepEqual(missing, { code: 'MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED', ok: false });

  const verified = await verifyModularHomeQuoteTurnstile({
    ...createValidPayload(),
    antiSpam: { turnstileToken: 'token-123', website: '' },
  }, {
    headers: { 'x-forwarded-for': '203.0.113.42', host: 'staging.30sek24.com' },
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, async () => new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  }));
  assert.deepEqual(verified, { ok: true });
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = '';
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = '';
}

{
  const event = createModularHomeQuoteSafeLogEvent({
    body: createValidPayload(),
    headers: { host: 'www.30sek24.com' },
    method: 'POST',
    path: '/api/modular-home/quote',
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, 'MODULAR_HOME_QUOTE_EMAIL_INVALID', 400, 'validation');
  const serialized = JSON.stringify(event);
  assert.match(serialized, /MODULAR_HOME_QUOTE_EMAIL_INVALID/);
  assert.doesNotMatch(serialized, /Client@Example\.com/i);
  assert.doesNotMatch(serialized, /Client Name/);
  assert.doesNotMatch(serialized, /\+371 20000000/);
  assert.doesNotMatch(serialized, /Need a timber home quote/);
  assert.equal(event.hasRequester, true);
  assert.equal(event.hasConsent, true);
}

if (previousSubmissionFlag === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = previousSubmissionFlag;
}
if (previousAppEnv === undefined) {
  delete process.env.APP_ENV;
} else {
  process.env.APP_ENV = previousAppEnv;
}
if (previousVercelEnv === undefined) {
  delete process.env.VERCEL_ENV;
} else {
  process.env.VERCEL_ENV = previousVercelEnv;
}
if (previousStagingHosts === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS;
} else {
  process.env.MODULAR_HOME_QUOTE_STAGING_HOSTS = previousStagingHosts;
}
if (previousProductionHosts === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS;
} else {
  process.env.MODULAR_HOME_QUOTE_PRODUCTION_HOSTS = previousProductionHosts;
}
if (previousRedisUrl === undefined) {
  delete process.env.REDIS_URL;
} else {
  process.env.REDIS_URL = previousRedisUrl;
}
if (previousTurnstileSecret === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY;
} else {
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_SECRET_KEY = previousTurnstileSecret;
}
if (previousTurnstileRequired === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED;
} else {
  process.env.MODULAR_HOME_QUOTE_TURNSTILE_REQUIRED = previousTurnstileRequired;
}
if (previousEmailHandoffEnabled === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED = previousEmailHandoffEnabled;
}
