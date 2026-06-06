import assert from 'node:assert/strict';
import {
  getMockModularHomeQuoteReviewRows,
  getModularHomeQuoteReviewSummary,
  normalizeModularHomeQuoteAdminRow,
  normalizeModularHomeQuoteReviewRow,
  serializeModularHomeQuoteReviewCsv,
  serializeModularHomeQuoteReviewJson,
} from '../runtime/modularHome/modularHomeQuoteReview.js';

const normalized = normalizeModularHomeQuoteReviewRow({
  budgetRange: '50k-100k',
  config: {
    facade: 'naturalTimber',
    finishLevel: 'standard',
    roof: 'pitched',
    terrace: 'smallTerrace',
  },
  countryCity: 'Latvia / Riga',
  createdAt: '2026-06-05T12:00:00.000Z',
  email: 'client@example.com',
  estimatedTotal: 68000,
  estimatedTotalLabel: 'EUR 68,000',
  id: 'local-quote-1',
  landOwned: 'yes',
  message: 'Need a quote.',
  model: 'Compact Timber 40',
  name: 'Client Name',
  phone: '+371 20000000',
  selectedOptions: {
    facade: 'Natural timber',
    finishLevel: 'Standard',
    roof: 'Pitched',
    terrace: 'Small terrace',
  },
  status: 'preview-local-only',
  targetBuildDate: '6-12-months',
}, 'local-preview');

assert.ok(normalized);
assert.equal(normalized.id, 'local-quote-1');
assert.equal(normalized.source, 'local-preview');
assert.equal(normalized.model, 'Compact Timber 40');
assert.equal(normalized.config.facade, 'Natural timber');
assert.equal(normalized.estimate.total, 68000);

const mockRows = getMockModularHomeQuoteReviewRows();
assert.equal(mockRows.length, 2);
assert.equal(mockRows.every((row) => row.source === 'mock-review'), true);

const backendRow = normalizeModularHomeQuoteAdminRow({
  config: {
    facade: 'darkThermoWood',
    finishLevel: 'premium',
    roof: 'flat',
    terrace: 'coveredTerrace',
  },
  created_at: '2026-06-06T08:30:00.000Z',
  estimate: { estimatedTotal: 94000 },
  id: 'backend-quote-1',
  project: { modelName: 'Family Timber 80' },
  requester: {
    budgetRange: '100k-150k',
    countryCity: 'Latvia / Liepaja',
    email: 'backend@example.com',
    landOwned: 'unknown',
    message: 'Protected backend quote request.',
    name: 'Backend Client',
    phone: '+371 21111111',
    targetBuildDate: '6-12-months',
  },
  status: 'new',
});

assert.ok(backendRow);
assert.equal(backendRow.source, 'backend-staging');
assert.equal(backendRow.status, 'new');
assert.equal(backendRow.contact.email, 'backend@example.com');
assert.equal(backendRow.estimate.total, 94000);

const rows = [normalized, backendRow, ...mockRows];
const summary = getModularHomeQuoteReviewSummary(rows);
assert.equal(summary.totalCount, 4);
assert.equal(summary.backendCount, 1);
assert.equal(summary.localCount, 1);
assert.equal(summary.mockCount, 2);
assert.ok(summary.totalEstimate > 68000);

const csv = serializeModularHomeQuoteReviewCsv(rows);
assert.match(csv, /Model/);
assert.match(csv, /Compact Timber 40/);
assert.match(csv, /client@example.com/);

const json = JSON.parse(serializeModularHomeQuoteReviewJson(rows)) as {
  rows: unknown[];
  summary: { totalCount: number };
};
assert.equal(json.rows.length, 4);
assert.equal(json.summary.totalCount, 4);
