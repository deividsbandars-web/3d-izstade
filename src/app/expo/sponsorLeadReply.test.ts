import assert from 'node:assert/strict';
import {
  appendSponsorLeadOpsNote,
  buildSponsorLeadReplyDraft,
  buildSponsorLeadReplySentNote,
  getLatestSponsorLeadReplySentAt,
} from './sponsorLeadReply';
import type { SponsorLeadInboxLead } from './sponsorLeadInboxService';

const packageLead: SponsorLeadInboxLead = {
  client_email: 'buyer@example.com',
  client_name: 'Sponsor Buyer',
  created_at: '2026-05-29T08:30:00.000Z',
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

const draft = buildSponsorLeadReplyDraft(packageLead);

assert.equal(draft.recipientEmail, 'buyer@example.com');
assert.equal(draft.hasRecipient, true);
assert.equal(draft.subject, 'Web3D Expo Premium Booth follow-up');
assert.match(draft.body, /Hi Sponsor,/);
assert.match(draft.body, /Thanks for your interest in the Premium Booth\./);
assert.match(draft.body, /Would you be available for a 20-minute walkthrough this week\?/);
assert.match(draft.body, /Company: Warpala Sponsor/);
assert.match(draft.body, /Budget signal: 15k-50k/);
assert.match(draft.body, /Timeline: This quarter/);
assert.match(draft.mailtoHref, /^mailto:buyer%40example\.com\?/);
assert.match(draft.mailtoHref, /subject=Web3D%20Expo%20Premium%20Booth%20follow-up/);

const anonymousLead: SponsorLeadInboxLead = {
  message: 'General sponsor question.',
};
const anonymousDraft = buildSponsorLeadReplyDraft(anonymousLead);

assert.equal(anonymousDraft.hasRecipient, false);
assert.equal(anonymousDraft.mailtoHref, '');
assert.match(anonymousDraft.body, /Hi there,/);
assert.match(anonymousDraft.body, /Web3D Expo sponsor package/);

const sentAt = new Date('2026-05-30T09:15:00.000Z');
const replySentNote = buildSponsorLeadReplySentNote(packageLead, sentAt);

assert.equal(replySentNote, '[2026-05-30T09:15:00.000Z] Reply sent: Web3D Expo Premium Booth follow-up');
assert.equal(appendSponsorLeadOpsNote('', replySentNote), replySentNote);
assert.equal(
  appendSponsorLeadOpsNote('Initial note', replySentNote),
  `Initial note\n${replySentNote}`,
);
assert.equal(getLatestSponsorLeadReplySentAt({ ...packageLead, ops_notes: replySentNote }), '2026-05-30T09:15:00.000Z');
assert.equal(
  getLatestSponsorLeadReplySentAt({
    ...packageLead,
    ops_notes: [
      '[2026-05-29T12:00:00.000Z] Reply sent: Old',
      '[2026-05-30T09:15:00.000Z] Reply sent: New',
    ].join('\n'),
  }),
  '2026-05-30T09:15:00.000Z',
);
