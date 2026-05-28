import assert from 'node:assert/strict';
import {
  buildSponsorPackageLeadPayload,
  getSponsorPackageInterestLabel,
  INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  normalizeSponsorPackageRequestForm,
  saveSponsorPackageRequest,
  validateSponsorPackageRequestForm,
  type SponsorPackageRequestForm,
} from './sponsorPackageRequest';

const validForm: SponsorPackageRequestForm = {
  ...INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  budgetRange: ' 10k-25k ',
  company: ' Warpala Sponsor ',
  email: ' buyer@example.com ',
  message: ' Interested in Premium Booth and Demo Arena sponsorship. ',
  name: ' Sponsor Buyer ',
  packageInterest: 'premium',
  timeline: ' next-month ',
  website: ' https://example.com ',
};

assert.deepEqual(normalizeSponsorPackageRequestForm(validForm), {
  budgetRange: '10k-25k',
  company: 'Warpala Sponsor',
  email: 'buyer@example.com',
  message: 'Interested in Premium Booth and Demo Arena sponsorship.',
  name: 'Sponsor Buyer',
  packageInterest: 'premium',
  timeline: 'next-month',
  website: 'https://example.com',
});

assert.equal(validateSponsorPackageRequestForm(validForm), null);
assert.equal(validateSponsorPackageRequestForm({ ...validForm, email: 'bad-email' }), 'Enter a valid work email.');
assert.equal(validateSponsorPackageRequestForm({ ...validForm, company: '' }), 'Enter a company name.');
assert.equal(getSponsorPackageInterestLabel('arena'), 'Demo Arena Sponsor');
assert.equal(getSponsorPackageInterestLabel('unsure'), 'Not sure yet');

const payload = buildSponsorPackageLeadPayload(validForm, '/expo/sponsor-packages?source=test');

assert.equal(payload.clientEmail, 'buyer@example.com');
assert.equal(payload.clientName, 'Sponsor Buyer');
assert.equal(payload.companyId, '1a14ad1c-1536-4c27-9c0c-00c4f3224819');
assert.equal(payload.companySlug, 'sponsor-concierge');
assert.equal(payload.sourcePath, '/expo/sponsor-packages?source=test');
assert.match(payload.message, /Sponsor package interest: Premium Booth/);
assert.match(payload.message, /Sponsor company: Warpala Sponsor/);
assert.match(payload.message, /Website: https:\/\/example\.com/);
assert.match(payload.message, /Interested in Premium Booth and Demo Arena sponsorship\./);

const originalWindow = globalThis.window;
const storage: Record<string, string> = {};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
    },
    location: {
      pathname: '/expo/sponsor-packages',
      search: '?source=test',
    },
  },
});

const result = saveSponsorPackageRequest(validForm);

assert.equal(result.queueCount, 1);
assert.equal(result.record.company, 'Warpala Sponsor');
assert.equal(result.record.persistence, 'local-preview');
assert.equal(result.record.syncStatus, 'backend-pending');
assert.equal(result.record.sourcePath, '/expo/sponsor-packages?source=test');

const syncedResult = saveSponsorPackageRequest(validForm, {
  persistence: 'backend',
  syncStatus: 'backend-synced',
});

assert.equal(syncedResult.queueCount, 2);
assert.equal(syncedResult.record.persistence, 'backend');
assert.equal(syncedResult.record.syncStatus, 'backend-synced');

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
