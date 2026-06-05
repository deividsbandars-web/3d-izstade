import assert from 'node:assert/strict';
import {
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
assert.ok(accessPlan.adminRoutes.some((route) => route.path === '/api/modular-home/quotes'));
assert.ok(accessPlan.adminRoutes.some((route) => route.path === '/api/modular-home/quotes/:quoteId/status'));
assert.ok(accessPlan.adminRoutes.some((route) => route.path.includes('/export')));

assert.equal(normalizeModularHomeQuoteAdminStatus('new'), 'new');
assert.equal(normalizeModularHomeQuoteAdminStatus('CONTACTED'), 'contacted');
assert.equal(normalizeModularHomeQuoteAdminStatus('qualified'), 'qualified');
assert.equal(normalizeModularHomeQuoteAdminStatus('closed'), 'closed');
assert.throws(() => normalizeModularHomeQuoteAdminStatus('public'), /MODULAR_HOME_QUOTE_ADMIN_STATUS_INVALID/);

assert.equal(normalizeModularHomeQuoteAdminLimit(undefined), 50);
assert.equal(normalizeModularHomeQuoteAdminLimit('12'), 12);
assert.equal(normalizeModularHomeQuoteAdminLimit('999'), 200);
assert.equal(normalizeModularHomeQuoteAdminLimit('-1'), 50);

const csv = serializeModularHomeQuoteAdminCsv([
  {
    created_at: '2026-06-05T12:00:00.000Z',
    estimate: { estimatedTotal: 68000 },
    id: 'quote-1',
    project: { modelName: 'Compact Timber 40' },
    requester: {
      countryCity: 'Latvia / Riga',
      email: 'client@example.com',
      name: 'Client Name',
      phone: '+371 20000000',
    },
    status: 'new',
  },
]);

assert.match(csv, /Compact Timber 40/);
assert.match(csv, /client@example.com/);
assert.match(csv, /68000/);
