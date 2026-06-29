import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { captureCalculatorLead } from '../../controllers/calculatorLeadController.js';
import { captureExpoLead } from '../../controllers/expoLeadController.js';
import { submitModularHomeQuote } from '../../controllers/modularHomeQuoteController.js';

async function fetchApi(path: string, init?: Parameters<typeof fetch>[1]) {
  const app = express();
  app.use(express.json());
  app.post('/api/expo/lead', captureExpoLead);
  app.post('/api/calculator/lead', captureCalculatorLead);
  app.post('/api/modular-home/quote', submitModularHomeQuote);

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

const previousQuoteSubmissionEnabled = process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;

const expoLeadInvalid = await fetchApi('/api/expo/lead', {
  body: JSON.stringify({
    clientEmail: 'not-an-email',
    clientName: 'Expo Buyer',
    companyId: 'company-1',
  }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(expoLeadInvalid.status, 400);
assert.deepEqual(await expoLeadInvalid.json(), { error: 'EXPO_LEAD_EMAIL_INVALID' });

const calculatorLeadInvalid = await fetchApi('/api/calculator/lead', {
  body: JSON.stringify({
    contact_info: {
      calculatorId: 'roof',
      calculatorTitle: 'Roof estimate',
      email: 'client@example.com',
      estimateTotal: 100,
      name: 'Client',
      phone: '+371 20000000',
    },
    source: 'website',
  }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
assert.equal(calculatorLeadInvalid.status, 400);
assert.deepEqual(await calculatorLeadInvalid.json(), { error: 'CALCULATOR_LEAD_SOURCE_INVALID' });

process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = '';
const modularHomeQuoteDisabled = await fetchApi('/api/modular-home/quote?homeQuoteBackend=1', {
  body: JSON.stringify({}),
  headers: {
    'content-type': 'application/json',
    host: 'staging.30sek24.com',
  },
  method: 'POST',
});
assert.equal(modularHomeQuoteDisabled.status, 503);
assert.equal((await modularHomeQuoteDisabled.json() as { error?: string }).error, 'MODULAR_HOME_QUOTE_BACKEND_DISABLED');

if (previousQuoteSubmissionEnabled === undefined) {
  delete process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED;
} else {
  process.env.MODULAR_HOME_QUOTE_SUBMISSION_ENABLED = previousQuoteSubmissionEnabled;
}
