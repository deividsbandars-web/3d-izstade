import assert from 'node:assert/strict';
import {
  buildSponsorPackageLeadPayload,
  getSponsorPackageInterestLabel,
  getPendingSponsorPackageRequestQueue,
  INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  normalizeSponsorPackageRequestForm,
  saveSponsorPackageRequest,
  syncPendingSponsorPackageRequests,
  validateSponsorPackageRequestForm,
  type SponsorPackageRequestForm,
} from './sponsorPackageRequest';
import { ExpoDataAPI } from '../../services/expo';

const validForm: SponsorPackageRequestForm = {
  ...INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  budgetRange: ' 10k-25k ',
  company: ' Warpala Sponsor ',
  email: ' buyer@example.com ',
  message: ' Interested in Premium Booth and Demo Arena sponsorship. ',
  name: ' Sponsor Buyer ',
  packageInterest: 'premium',
  phone: ' +371 20000000 ',
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
  phone: '+371 20000000',
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
assert.match(payload.message, /Contact phone: \+371 20000000/);
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
assert.equal(getPendingSponsorPackageRequestQueue().length, 1);

const originalCreateExpoLead = ExpoDataAPI.createExpoLead;
const capturedLeadPayloads: unknown[] = [];
ExpoDataAPI.createExpoLead = async (leadPayload: unknown) => {
  capturedLeadPayloads.push(leadPayload);
  return { success: true };
};

const syncResult = await syncPendingSponsorPackageRequests();

assert.equal(syncResult.syncedCount, 1);
assert.equal(syncResult.failedCount, 0);
assert.equal(syncResult.pendingCount, 0);
assert.equal(syncResult.queueCount, 2);
assert.equal(capturedLeadPayloads.length, 1);
assert.match(JSON.stringify(capturedLeadPayloads[0]), /Sponsor package interest: Premium Booth/);
assert.equal(getPendingSponsorPackageRequestQueue().length, 0);

ExpoDataAPI.createExpoLead = originalCreateExpoLead;

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
