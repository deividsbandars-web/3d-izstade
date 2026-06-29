import assert from 'node:assert/strict';
import {
  enqueueModularHomeQuoteEmailHandoff,
  getModularHomeQuoteNotifierConfig,
  resetModularHomeQuoteNotifierForTests,
  sendModularHomeQuoteEmailHandoff,
  type ModularHomeQuoteEmailClient,
  type ModularHomeQuoteNotifierState,
} from '../services/modularHomeQuoteNotifier.js';
import {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  MODULAR_HOME_QUOTE_CONSENT_VERSION,
  MODULAR_HOME_QUOTE_PRIVACY_VERSION,
  validateModularHomeQuoteRequest,
} from '../schemas/quoteValidation.js';

function createPayload() {
  return validateModularHomeQuoteRequest({
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
      lineItems: [{ amount: 38000, label: 'Base product module package' }],
      scopeSummary: ['Included: timber module shell'],
    },
    project: {
      floorAreaM2: 40,
      modelName: 'Compact Timber 40',
      productId: 'compact-timber-40',
      projectId: 'preview-project-1',
      shareUrl: 'https://staging.30sek24.com/expo-3d?homeDemo=1',
    },
    requester: {
      budgetRange: '',
      countryCity: '',
      email: 'client@example.com',
      landOwned: 'unknown',
      message: '',
      name: '',
      phone: '+371 20000000',
      targetBuildDate: '',
    },
    source: {
      path: '/expo-3d?homeDemo=1&homeQuoteBackend=1',
      referrer: null,
      userAgent: 'test',
      vertical: 'modular-home',
    },
  });
}

const previousEnabled = process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED;
const previousFrom = process.env.MODULAR_HOME_QUOTE_EMAIL_FROM;
const previousTo = process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO;

process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED = '';
process.env.MODULAR_HOME_QUOTE_EMAIL_FROM = '';
process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO = '';

const payload = createPayload();
const job = { payload, quoteId: 'quote-123' };

assert.equal(getModularHomeQuoteNotifierConfig().enabled, false);
assert.equal(enqueueModularHomeQuoteEmailHandoff(job), false);
assert.deepEqual(await sendModularHomeQuoteEmailHandoff(job), {
  messageId: null,
  quoteId: 'quote-123',
  skipped: true,
  status: 'disabled',
});

const state: ModularHomeQuoteNotifierState = {
  completedQuoteIds: new Set<string>(),
  queuedQuoteIds: new Set<string>(),
};
const sentMessages: unknown[] = [];
const fakeClient: ModularHomeQuoteEmailClient = {
  async send(message) {
    sentMessages.push(message);
    return { data: { id: 'resend-message-1' }, error: null };
  },
};
const enabledConfig = {
  enabled: true,
  from: 'Warpala Quotes <quotes@example.com>',
  replyTo: null,
  to: ['sales@example.com'],
};
const scheduledTasks: Array<() => void> = [];

assert.equal(enqueueModularHomeQuoteEmailHandoff(job, {
  client: fakeClient,
  config: enabledConfig,
  scheduler: (task) => scheduledTasks.push(task),
  state,
}), true);
assert.equal(enqueueModularHomeQuoteEmailHandoff(job, {
  client: fakeClient,
  config: enabledConfig,
  scheduler: (task) => scheduledTasks.push(task),
  state,
}), false);
assert.equal(scheduledTasks.length, 1);
assert.equal(sentMessages.length, 0);

resetModularHomeQuoteNotifierForTests(state);
const sent = await sendModularHomeQuoteEmailHandoff(job, {
  client: fakeClient,
  config: enabledConfig,
  state,
});
assert.deepEqual(sent, {
  messageId: 'resend-message-1',
  quoteId: 'quote-123',
  skipped: false,
  status: 'sent',
});
assert.equal(sentMessages.length, 1);

const duplicate = await sendModularHomeQuoteEmailHandoff(job, {
  client: fakeClient,
  config: enabledConfig,
  state,
});
assert.deepEqual(duplicate, {
  messageId: null,
  quoteId: 'quote-123',
  skipped: true,
  status: 'duplicate',
});
assert.equal(sentMessages.length, 1);

const misconfigured = await sendModularHomeQuoteEmailHandoff({ payload, quoteId: 'quote-456' }, {
  client: fakeClient,
  config: { ...enabledConfig, to: [] },
  state: {
    completedQuoteIds: new Set<string>(),
    queuedQuoteIds: new Set<string>(),
  },
});
assert.equal(misconfigured.status, 'misconfigured');

if (previousEnabled === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED = previousEnabled;
}
if (previousFrom === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_EMAIL_FROM;
} else {
  process.env.MODULAR_HOME_QUOTE_EMAIL_FROM = previousFrom;
}
if (previousTo === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO;
} else {
  process.env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO = previousTo;
}
