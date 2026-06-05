import assert from 'node:assert/strict';
import {
  getMockModularHomeQuoteReviewRows,
  getModularHomeQuoteReviewSummary,
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

const rows = [normalized, ...mockRows];
const summary = getModularHomeQuoteReviewSummary(rows);
assert.equal(summary.totalCount, 3);
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
assert.equal(json.rows.length, 3);
assert.equal(json.summary.totalCount, 3);
