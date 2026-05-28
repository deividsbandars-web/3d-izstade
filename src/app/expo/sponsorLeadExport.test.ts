import assert from 'node:assert/strict';
import {
  buildSponsorLeadCopySummary,
  buildSponsorLeadExportRows,
  serializeSponsorLeadCsv,
} from './sponsorLeadExport';
import type { SponsorLeadInboxLead } from './sponsorLeadInboxService';

const packageLead: SponsorLeadInboxLead = {
  client_email: 'buyer@example.com',
  client_name: 'Sponsor Buyer',
  created_at: '2026-05-29T08:30:00.000Z',
  follow_up_at: '2026-06-01T10:00:00.000Z',
  id: 'lead-1',
  message: [
    'Sponsor package interest: Premium Booth',
    'Sponsor company: Warpala Sponsor',
    'Website: https://example.com',
    'Budget signal: 15k-50k',
    'Timeline: This quarter',
    '',
    'We want a premium booth and arena package.',
  ].join('\n'),
  service_name: 'expo_sponsor_lead:sponsor-concierge',
  status: 'pending',
};

const rows = buildSponsorLeadExportRows([packageLead]);

assert.equal(rows.length, 1);
assert.equal(rows[0].packageInterest, 'Premium Booth');
assert.equal(rows[0].company, 'Warpala Sponsor');
assert.equal(rows[0].budgetSignal, '15k-50k');
assert.equal(rows[0].message, 'We want a premium booth and arena package.');

const csv = serializeSponsorLeadCsv([packageLead]);

assert.match(csv, /^id,createdAt,status,clientName,clientEmail/);
assert.match(csv, /"Premium Booth"/);
assert.match(csv, /"We want a premium booth and arena package\."/);

const summary = buildSponsorLeadCopySummary(packageLead);

assert.match(summary, /Lead: Sponsor Buyer/);
assert.match(summary, /Package: Premium Booth/);
assert.match(summary, /Budget: 15k-50k/);
assert.match(summary, /We want a premium booth and arena package\./);
