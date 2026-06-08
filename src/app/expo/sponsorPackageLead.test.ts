import assert from 'node:assert/strict';
import { isSponsorPackageLead, parseSponsorPackageLeadMessage } from './sponsorPackageLead';

const packageMessage = [
  'Sponsor package interest: Premium Booth',
  'Sponsor company: Warpala Sponsor',
  'Contact phone: +371 20000000',
  'Website: https://example.com',
  'Budget signal: 15k-50k',
  'Timeline: This quarter',
  '',
  'We want a premium booth and arena package.',
].join('\n');

const details = parseSponsorPackageLeadMessage(packageMessage);

assert.ok(details);
assert.equal(details.packageInterest, 'Premium Booth');
assert.equal(details.company, 'Warpala Sponsor');
assert.equal(details.phone, '+371 20000000');
assert.equal(details.website, 'https://example.com');
assert.equal(details.budgetSignal, '15k-50k');
assert.equal(details.timeline, 'This quarter');
assert.equal(details.message, 'We want a premium booth and arena package.');
assert.equal(isSponsorPackageLead(packageMessage), true);

assert.equal(parseSponsorPackageLeadMessage('Normal booth lead message'), null);
assert.equal(isSponsorPackageLead(null), false);
