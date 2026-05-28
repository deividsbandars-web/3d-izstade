import assert from 'node:assert/strict';
import {
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

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
