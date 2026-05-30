import assert from 'node:assert/strict';
import { validateCalculatorLeadRequest } from '../controllers/calculatorLeadValidation.js';

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
