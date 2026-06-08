import assert from 'node:assert/strict';
import {
  buildSponsorConciergeLeadPayload,
  normalizeSponsorConciergeLeadForm,
  submitSponsorConciergeLead,
  validateSponsorConciergeLeadForm,
  type SponsorConciergeLeadFormState,
} from '../runtime/boothProduct/sponsorConciergeLeadCapture';

const validForm: SponsorConciergeLeadFormState = {
  company: '  Acme Sponsors  ',
  email: ' lead@example.com ',
  interest: ' Demo Arena package ',
  name: ' Jane Buyer ',
};

assert.deepEqual(normalizeSponsorConciergeLeadForm(validForm), {
  company: 'Acme Sponsors',
  email: 'lead@example.com',
  interest: 'Demo Arena package',
  name: 'Jane Buyer',
});

assert.equal(validateSponsorConciergeLeadForm(validForm), null);

assert.equal(validateSponsorConciergeLeadForm({
  ...validForm,
  email: 'not-an-email',
}), 'Enter a valid work email.');

const payload = buildSponsorConciergeLeadPayload(validForm, '/expo-3d?salesDemo=1');
assert.equal(payload.clientEmail, 'lead@example.com');
assert.equal(payload.clientName, 'Jane Buyer');
assert.equal(payload.companyId, 'sponsor-concierge');
assert.equal(payload.companySlug, 'sponsor-concierge');
assert.equal(payload.sourcePath, '/expo-3d?salesDemo=1');
assert.match(payload.message, /Company: Acme Sponsors/);
assert.match(payload.message, /Interest: Demo Arena package/);
assert.match(payload.message, /Package: Sponsor Concierge Premium Booth/);

const originalWindow = globalThis.window;
const capturedRequests: Array<{ body: string; url: string }> = [];

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    clearTimeout: globalThis.clearTimeout,
    localStorage: {
      getItem: () => null,
      setItem: () => undefined,
    },
    location: {
      hostname: 'staging.30sek24.com',
      pathname: '/expo-3d',
      search: '?boothProductPreview=1',
    },
    setTimeout: globalThis.setTimeout,
  },
});

const submitResult = await submitSponsorConciergeLead(validForm, async (url, init) => {
  capturedRequests.push({
    body: String(init?.body ?? ''),
    url: String(url),
  });
  return new Response(JSON.stringify({ success: true }), { status: 201 });
});

assert.equal(submitResult.persistence, 'backend');
assert.equal(submitResult.status, 201);
assert.equal(capturedRequests[0]?.url, 'https://api-staging.30sek24.com/api/expo/lead');
assert.equal(JSON.parse(capturedRequests[0]?.body || '{}').companyId, 'sponsor-concierge');

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
