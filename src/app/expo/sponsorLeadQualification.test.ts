import assert from 'node:assert/strict';
import { getSponsorPackageLeadQualification } from './sponsorLeadQualification';
import type { SponsorPackageLeadDetails } from './sponsorPackageLead';

const baseLead: SponsorPackageLeadDetails = {
  budgetSignal: null,
  company: 'Example Sponsor',
  message: 'We want to understand package options.',
  packageInterest: 'Standard Booth',
  timeline: null,
  website: 'https://example.com',
};

assert.deepEqual(getSponsorPackageLeadQualification({
  ...baseLead,
  budgetSignal: '50k+',
  packageInterest: 'Premium Booth',
  timeline: 'This quarter',
}).priority, 'hot');

assert.deepEqual(getSponsorPackageLeadQualification({
  ...baseLead,
  packageInterest: 'Landmark Zone Sponsor',
}).priority, 'hot');

assert.deepEqual(getSponsorPackageLeadQualification({
  ...baseLead,
  budgetSignal: '15k-50k',
}).priority, 'warm');

assert.deepEqual(getSponsorPackageLeadQualification(baseLead), {
  nextAction: 'Send package overview and ask for sponsor goals.',
  priority: 'standard',
  priorityLabel: 'Standard lead',
  reason: 'Package interest is present, but urgency and budget are not clear yet.',
});
