import type { SponsorLeadInboxLead } from './sponsorLeadInboxService';
import { getSponsorLeadQualificationForMessage } from './sponsorLeadQualification';
import { parseSponsorPackageLeadMessage } from './sponsorPackageLead';

export type SponsorLeadReplyDraft = {
  body: string;
  hasRecipient: boolean;
  mailtoHref: string;
  recipientEmail: string;
  subject: string;
};

function normalizeValue(value?: string | null) {
  return String(value || '').trim();
}

function getFirstName(name?: string | null) {
  const normalizedName = normalizeValue(name);
  return normalizedName ? normalizedName.split(/\s+/)[0] : '';
}

function buildSubject(packageInterest?: string) {
  return packageInterest
    ? `Web3D Expo ${packageInterest} follow-up`
    : 'Web3D Expo sponsor package follow-up';
}

export function buildSponsorLeadReplyDraft(lead: SponsorLeadInboxLead): SponsorLeadReplyDraft {
  const packageDetails = parseSponsorPackageLeadMessage(lead.message);
  const qualification = getSponsorLeadQualificationForMessage(lead.message);
  const firstName = getFirstName(lead.client_name);
  const packageInterest = normalizeValue(packageDetails?.packageInterest) || 'Web3D Expo sponsor package';
  const subject = buildSubject(packageDetails?.packageInterest);
  const recipientEmail = normalizeValue(lead.client_email);
  const contextLines = [
    packageDetails?.company ? `Company: ${packageDetails.company}` : null,
    packageDetails?.budgetSignal ? `Budget signal: ${packageDetails.budgetSignal}` : null,
    packageDetails?.timeline ? `Timeline: ${packageDetails.timeline}` : null,
    qualification?.nextAction ? `Internal next action: ${qualification.nextAction}` : null,
  ].filter((line): line is string => Boolean(line));
  const bodyLines = [
    `Hi ${firstName || 'there'},`,
    '',
    `Thanks for your interest in the ${packageInterest}.`,
    '',
    'The next best step is a short sponsor walkthrough where we can cover:',
    '- package fit and visibility',
    '- lead-generation flow',
    '- timeline and next steps',
    '',
    'Would you be available for a 20-minute walkthrough this week?',
    '',
    ...(
      contextLines.length > 0
        ? [
            'Reference from your request:',
            ...contextLines,
            '',
          ]
        : []
    ),
    'Best,',
    'Warpala Expo Team',
  ];
  const body = bodyLines.join('\n');
  const mailtoHref = recipientEmail
    ? `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : '';

  return {
    body,
    hasRecipient: Boolean(recipientEmail),
    mailtoHref,
    recipientEmail,
    subject,
  };
}
