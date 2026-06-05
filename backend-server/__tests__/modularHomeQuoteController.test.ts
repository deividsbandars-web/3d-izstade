import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  MODULAR_HOME_QUOTE_CONSENT_VERSION,
  MODULAR_HOME_QUOTE_PRIVACY_VERSION,
  getModularHomeQuoteBackendHardeningPlan,
  getModularHomeQuoteSubmissionConfig,
  isModularHomeQuoteBackendRequestEnabled,
  submitModularHomeQuote,
  validateModularHomeQuoteRequest,
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
      facade: 'naturalTimber',
      finishLevel: 'standard',
      roof: 'pitched',
      terrace: 'smallTerrace',
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

const previousSubmissionFlag = process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;

const valid = validateModularHomeQuoteRequest(createValidPayload());
assert.equal(valid.requester.email, 'client@example.com');
assert.equal(valid.project.productId, 'compact-timber-40');
assert.equal(valid.consent.accepted, true);
assert.equal(valid.consent.consentVersion, MODULAR_HOME_QUOTE_CONSENT_VERSION);
assert.equal(valid.consent.privacyVersion, MODULAR_HOME_QUOTE_PRIVACY_VERSION);
assert.equal(valid.source.vertical, 'modular-home');

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
{
  const submissionConfig = getModularHomeQuoteSubmissionConfig();
  assert.equal(submissionConfig.enabled, false);
  assert.equal(submissionConfig.productionReady, false);
  assert.equal(submissionConfig.hardeningPlan.enablementGate.defaultMode, 'disabled');
  assert.equal(submissionConfig.hardeningPlan.enablementGate.envFlag, 'MODULAR_HOME_QUOTE_SUBMISSION_ENABLED');
  assert.equal(submissionConfig.hardeningPlan.enablementGate.requestFlag, 'homeQuoteBackend=1');
}

{
  const hardeningPlan = getModularHomeQuoteBackendHardeningPlan();
  assert.equal(hardeningPlan.consent.consentVersion, MODULAR_HOME_QUOTE_CONSENT_VERSION);
  assert.equal(hardeningPlan.consent.privacyVersion, MODULAR_HOME_QUOTE_PRIVACY_VERSION);
  assert.ok(hardeningPlan.rateLimitingPlan.productionRequirement.some((item) => item.includes('distributed')));
  assert.ok(hardeningPlan.supabasePolicyNotes.some((item) => item.includes('Anon/client keys must not have SELECT')));
  assert.ok(hardeningPlan.auditLogRequirements.some((item) => item.includes('validation failures')));
}

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuote({
    body: createValidPayload(),
    query: { homeQuoteBackend: '1' },
  } as unknown as Request, response);
  assert.equal(result.statusCode, 503);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_BACKEND_DISABLED/);
}

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = 'true';
assert.equal(getModularHomeQuoteSubmissionConfig().enabled, true);

{
  const { response, result } = createMockResponse();
  await submitModularHomeQuote({
    body: createValidPayload(),
    query: {},
  } as unknown as Request, response);
  assert.equal(result.statusCode, 403);
  assert.match(JSON.stringify(result.body), /MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED/);
}

if (previousSubmissionFlag === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = previousSubmissionFlag;
}
