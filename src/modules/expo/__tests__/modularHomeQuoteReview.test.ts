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
    facadeBoardProfile: 'squareEdge',
    facadeBoardSpacing: 'standard',
    presetId: 'compactStandard',
    roof: 'pitched',
    roofGutterStyle: 'minimalEdge',
    terrace: 'smallTerrace',
    trimColor: 'timber',
    windowFrameType: 'standardFrame',
    interiorFloorStyle: 'warmPlank',
    wallPanelStyle: 'plainPanel',
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
    layoutVariant: 'One bedroom',
    roof: 'Pitched',
    terrace: 'Small terrace',
    windowPlacement: 'Balanced openings',
    doorPlacement: 'Front entry placement',
  },
  status: 'preview-local-only',
  targetBuildDate: '6-12-months',
}, 'local-preview');

assert.ok(normalized);
assert.equal(normalized.id, 'local-quote-1');
assert.equal(normalized.source, 'local-preview');
assert.equal(normalized.model, 'Compact Timber 40');
assert.equal(normalized.config.facade, 'Natural timber');
assert.equal(normalized.config.layoutVariant, 'One bedroom');
assert.equal(normalized.config.presetId, 'compactStandard');
assert.equal(normalized.config.facadeBoardProfile, 'Square-edge boards');
assert.equal(normalized.config.facadeBoardSpacing, 'Standard spacing');
assert.equal(normalized.config.roofGutterStyle, 'Unknown gutter style');
assert.equal(normalized.config.trimColor, 'Unknown trim color');
assert.equal(normalized.config.windowFrameType, 'Unknown window frame type');
assert.equal(normalized.config.interiorFloorStyle, 'Unknown floor style');
assert.equal(normalized.config.wallPanelStyle, 'Unknown wall panel style');
assert.equal(normalized.config.windowPlacement, 'Balanced openings');
assert.equal(normalized.config.doorPlacement, 'Front entry placement');
assert.equal(normalized.estimate.total, 68000);
assert.equal(normalized.consultantAssignment, '');
assert.equal(normalized.followUpRequired, false);
assert.deepEqual(normalized.statusHistory, []);

const mockRows = getMockModularHomeQuoteReviewRows();
assert.equal(mockRows.length, 2);
assert.equal(mockRows.every((row) => row.source === 'mock-review'), true);

const backendRow = normalizeModularHomeQuoteAdminRow({
  config: {
    bed: 'enabled',
    doorPlacement: 'terraceFacing',
    facade: 'darkThermoWood',
    facadeBoardOrientation: 'vertical',
    facadeBoardProfile: 'shadowGap',
    facadeBoardSpacing: 'tight',
    facadeBoardWidth: 'narrow',
    finishLevel: 'premium',
    floorFinish: 'oakLaminate',
    furniturePackage: 'premiumFurniture',
    interiorFloorStyle: 'warmPlank',
    interiorWallFinish: 'warmPanel',
    kitchenLine: 'enabled',
    layoutVariant: 'largeLiving',
    presetId: 'familyWideLiving',
    roof: 'flat',
    roofEdgeColor: 'graphite',
    roofGutterStyle: 'boxGutter',
    sofa: 'enabled',
    table: 'enabled',
    terrace: 'coveredTerrace',
    trimColor: 'timber',
    wardrobePlaceholder: 'enabled',
    windowFrameColor: 'graphite',
    windowFrameType: 'deepReveal',
    windowPlacement: 'cornerFeature',
    wallPanelStyle: 'ribbedPanel',
  },
  created_at: '2026-06-06T08:30:00.000Z',
  estimate: { estimatedTotal: 94000 },
  consultant_assignment: 'Consultant D',
  follow_up_required: true,
  id: 'backend-quote-1',
  internal_note: 'Needs admin follow-up.',
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
  status: 'qualified',
  status_history: [{
    changedAt: '2026-06-06T09:00:00.000Z',
    changedBy: 'admin-1',
    consultantAssignment: 'Consultant D',
    followUpRequired: true,
    fromStatus: 'new',
    internalNote: 'Needs admin follow-up.',
    toStatus: 'quoted',
  }],
});

assert.ok(backendRow);
assert.equal(backendRow.source, 'backend-staging');
assert.equal(backendRow.status, 'quoted');
assert.equal(backendRow.internalNote, 'Needs admin follow-up.');
assert.equal(backendRow.contact.email, 'backend@example.com');
assert.equal(backendRow.config.facadeBoardOrientation, 'vertical');
assert.equal(backendRow.config.facadeBoardProfile, 'shadowGap');
assert.equal(backendRow.config.facadeBoardSpacing, 'tight');
assert.equal(backendRow.config.furniturePackage, 'premiumFurniture');
assert.equal(backendRow.config.kitchenLine, 'enabled');
assert.equal(backendRow.config.presetId, 'familyWideLiving');
assert.equal(backendRow.config.roofGutterStyle, 'boxGutter');
assert.equal(backendRow.config.trimColor, 'timber');
assert.equal(backendRow.config.windowFrameColor, 'graphite');
assert.equal(backendRow.config.windowFrameType, 'deepReveal');
assert.equal(backendRow.config.windowPlacement, 'cornerFeature');
assert.equal(backendRow.config.doorPlacement, 'terraceFacing');
assert.equal(backendRow.config.interiorFloorStyle, 'warmPlank');
assert.equal(backendRow.config.wallPanelStyle, 'ribbedPanel');
assert.equal(backendRow.estimate.total, 94000);
assert.equal(backendRow.consultantAssignment, 'Consultant D');
assert.equal(backendRow.followUpRequired, true);
assert.equal(backendRow.statusHistory.length, 1);
assert.equal(backendRow.statusHistory[0]?.toStatus, 'quoted');

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
assert.match(csv, /Needs admin follow-up/);
assert.match(csv, /Consultant D/);
assert.match(csv, /yes/);
assert.match(csv, /premiumFurniture/);
assert.match(csv, /graphite/);

const json = JSON.parse(serializeModularHomeQuoteReviewJson(rows)) as {
  rows: unknown[];
  summary: { totalCount: number };
};
assert.equal(json.rows.length, 4);
assert.equal(json.summary.totalCount, 4);
