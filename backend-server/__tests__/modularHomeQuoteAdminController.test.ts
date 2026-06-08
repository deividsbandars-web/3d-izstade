import assert from 'node:assert/strict';
import {
  buildModularHomeQuoteAdminStatusUpdatePayload,
  getModularHomeQuoteAdminAccessPlan,
  normalizeModularHomeQuoteAdminLimit,
  normalizeModularHomeQuoteAdminStatus,
  serializeModularHomeQuoteAdminCsv,
} from '../controllers/modularHomeQuoteAdminController.js';

const accessPlan = getModularHomeQuoteAdminAccessPlan();
assert.equal(accessPlan.authGuard, 'authMiddleware');
assert.equal(accessPlan.roleCheck, 'adminOnly');
assert.equal(accessPlan.publicExposure, false);
assert.equal(accessPlan.storageTable, 'modular_home_quote_requests');
assert.deepEqual(accessPlan.statusWorkflow, ['new', 'contacted', 'quoted', 'won', 'lost']);
assert.ok(accessPlan.adminRoutes.some((route) => route.path === '/api/modular-home/quotes'));
assert.ok(accessPlan.adminRoutes.some((route) => route.path === '/api/modular-home/quotes/:quoteId'));
assert.ok(accessPlan.adminRoutes.some((route) => route.path === '/api/modular-home/quotes/:quoteId/status'));
assert.ok(accessPlan.adminRoutes.some((route) => route.path.includes('/export')));

assert.equal(normalizeModularHomeQuoteAdminStatus('new'), 'new');
assert.equal(normalizeModularHomeQuoteAdminStatus('CONTACTED'), 'contacted');
assert.equal(normalizeModularHomeQuoteAdminStatus('quoted'), 'quoted');
assert.equal(normalizeModularHomeQuoteAdminStatus('won'), 'won');
assert.equal(normalizeModularHomeQuoteAdminStatus('lost'), 'lost');
assert.equal(normalizeModularHomeQuoteAdminStatus('qualified'), 'quoted');
assert.equal(normalizeModularHomeQuoteAdminStatus('closed'), 'won');
assert.throws(() => normalizeModularHomeQuoteAdminStatus('public'), /MODULAR_HOME_QUOTE_ADMIN_STATUS_INVALID/);

assert.equal(normalizeModularHomeQuoteAdminLimit(undefined), 50);
assert.equal(normalizeModularHomeQuoteAdminLimit('12'), 12);
assert.equal(normalizeModularHomeQuoteAdminLimit('999'), 200);
assert.equal(normalizeModularHomeQuoteAdminLimit('-1'), 50);

assert.deepEqual(buildModularHomeQuoteAdminStatusUpdatePayload('quoted', '  Call after permit review.  '), {
  internal_note: 'Call after permit review.',
  status: 'quoted',
});
assert.deepEqual(buildModularHomeQuoteAdminStatusUpdatePayload('won', ''), {
  internal_note: null,
  status: 'won',
});
assert.deepEqual(buildModularHomeQuoteAdminStatusUpdatePayload('won', undefined), {
  status: 'won',
});
assert.equal(
  buildModularHomeQuoteAdminStatusUpdatePayload('lost', 'x'.repeat(2100)).internal_note?.length,
  2000,
);

const csv = serializeModularHomeQuoteAdminCsv([
  {
    config: {
      doorPlacement: 'terraceFacing',
      facade: 'darkThermoWood',
      facadeBoardOrientation: 'vertical',
      facadeBoardWidth: 'narrow',
      finishLevel: 'premium',
      floorFinish: 'oakLaminate',
      furniturePackage: 'premiumFurniture',
      sofa: 'enabled',
      table: 'enabled',
      bed: 'enabled',
      kitchenLine: 'enabled',
      wardrobePlaceholder: 'enabled',
      interiorWallFinish: 'warmPanel',
      layoutVariant: 'oneBedroom',
      roof: 'pitched',
      roofEdgeColor: 'graphite',
      terrace: 'extendedTerrace',
      windowFrameColor: 'graphite',
      windowPlacement: 'frontPanoramic',
    },
    created_at: '2026-06-05T12:00:00.000Z',
    estimate: { estimatedTotal: 68000 },
    id: 'quote-1',
    internal_note: 'Ask about foundation scope.',
    project: { modelName: 'Compact Timber 40' },
    requester: {
      countryCity: 'Latvia / Riga',
      email: 'client@example.com',
      landOwned: 'yes',
      message: 'Needs premium walkthrough.',
      name: 'Client Name',
      phone: '+371 20000000',
      budgetRange: '50k-100k',
      targetBuildDate: '6-12-months',
    },
    source: {
      path: '/expo-3d?homeDemo=1&homeQuoteBackend=1',
    },
    status: 'new',
  },
]);

assert.match(csv, /Compact Timber 40/);
assert.match(csv, /client@example.com/);
assert.match(csv, /Ask about foundation scope/);
assert.match(csv, /68000/);
assert.match(csv, /frontPanoramic/);
assert.match(csv, /premiumFurniture/);
assert.match(csv, /Needs premium walkthrough/);
