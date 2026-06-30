import assert from 'node:assert/strict';
import {
  buildCalculatorLeadPayload,
  CALCULATOR_LEAD_STORAGE_KEY,
  INITIAL_CALCULATOR_LEAD_FORM,
  readCalculatorLeadQueue,
  submitCalculatorLeadRequest,
  validateCalculatorLeadForm,
  type CalculatorLeadContext,
  type CalculatorLeadFormState,
} from './calculatorLeadCapture';
import { LeadsAPI } from '../../services/leads';

const context: CalculatorLeadContext = {
  calculatorId: 'roof',
  calculatorTitle: 'Jumta izmaksu kalkulators',
  estimateCurrency: 'EUR',
  estimateTotal: 12499.6,
  summaryItems: [
    { label: 'Platība', value: '120 m²' },
    { label: 'Materiāls', value: 'Metāla profils' },
  ],
};

const validForm: CalculatorLeadFormState = {
  ...INITIAL_CALCULATOR_LEAD_FORM,
  email: ' client@example.com ',
  name: ' Klients ',
  notes: ' Vajag piedāvājumu šomēnes. ',
  phone: ' +371 20000000 ',
};

const originalWindow = globalThis.window;
const originalCreateCalculatorLead = LeadsAPI.createCalculatorLead;
const storage: Record<string, string> = {};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage[key] ?? null,
      removeItem: (key: string) => {
        delete storage[key];
      },
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
    },
    location: {
      pathname: '/roof-cost-calculator',
      search: '?source=test',
    },
  },
});

assert.equal(validateCalculatorLeadForm({ ...validForm, name: '' }), 'Ievadi kontaktpersonas vārdu.');
assert.equal(validateCalculatorLeadForm({ ...validForm, email: 'bad-email' }), 'Ievadi derīgu e-pastu.');
assert.equal(validateCalculatorLeadForm({ ...validForm, phone: '' }), 'Ievadi tālruni, lai meistars var precizēt objektu.');
assert.equal(validateCalculatorLeadForm(validForm), null);

const payload = buildCalculatorLeadPayload(validForm, context);

assert.equal(payload.contact_info.name, 'Klients');
assert.equal(payload.contact_info.email, 'client@example.com');
assert.equal(payload.contact_info.phone, '+371 20000000');
assert.equal(payload.contact_info.estimateTotal, 12500);
assert.equal(payload.contact_info.sourcePath, '/roof-cost-calculator?source=test');
assert.equal(payload.source, 'calculator:roof');
assert.equal(payload.status, 'new');
assert.match(payload.message, /Calculator: Jumta izmaksu kalkulators/);
assert.match(payload.message, /Estimate: 12500 EUR/);
assert.match(payload.message, /Platība: 120 m²/);
assert.match(payload.message, /Client notes: Vajag piedāvājumu šomēnes\./);

const backendPayloads: unknown[] = [];
LeadsAPI.createCalculatorLead = async (leadPayload: unknown) => {
  backendPayloads.push(leadPayload);
  return { success: true };
};

const backendResult = await submitCalculatorLeadRequest(validForm, context);

assert.deepEqual(backendResult, { persistence: 'backend' });
assert.equal(backendPayloads.length, 1);
assert.equal(readCalculatorLeadQueue().length, 0);

LeadsAPI.createCalculatorLead = async () => {
  throw new Error('SERVER_API_UNAVAILABLE');
};

const fallbackResult = await submitCalculatorLeadRequest(validForm, context);
const fallbackQueue = readCalculatorLeadQueue();

assert.equal(fallbackResult.persistence, 'backend-fallback');
assert.equal(fallbackResult.localQueueCount, 1);
assert.equal(fallbackResult.reason, 'SERVER_API_UNAVAILABLE');
assert.equal(fallbackQueue.length, 1);
assert.equal(fallbackQueue[0]?.name, 'Klients');
assert.equal(fallbackQueue[0]?.sourcePath, '/roof-cost-calculator?source=test');
assert.equal(fallbackQueue[0]?.persistence, 'backend-fallback');

delete storage[CALCULATOR_LEAD_STORAGE_KEY];
LeadsAPI.createCalculatorLead = originalCreateCalculatorLead;
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
