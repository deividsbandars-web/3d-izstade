import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  captureCalculatorLeadWithDependencies,
  normalizeCalculatorLeadOpsUpdate,
} from '../controllers/calculatorLeadController.js';
import { validateCalculatorLeadRequest } from '../controllers/calculatorLeadValidation.js';

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
  } as Request, response, { supabase: fakeSupabase as any });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body, {
    calculatorId: 'roof',
    id: 'lead-123',
    source: 'calculator:roof',
    success: true,
  });
  assert.equal(insertedRows.length, 1);
}
