import type { SponsorLeadInboxLead } from './sponsorLeadInboxService';
import { getSponsorPackageLeadQualification } from './sponsorLeadQualification';
import { parseSponsorPackageLeadMessage } from './sponsorPackageLead';

export type SponsorLeadExportRow = {
  budgetSignal: string;
  clientEmail: string;
  clientName: string;
  company: string;
  createdAt: string;
  followUpAt: string;
  id: string;
  message: string;
  nextAction: string;
  packageInterest: string;
  priority: string;
  serviceName: string;
  status: string;
  timeline: string;
  website: string;
};

const CSV_HEADERS: Array<keyof SponsorLeadExportRow> = [
  'id',
  'createdAt',
  'status',
  'clientName',
  'clientEmail',
  'serviceName',
  'packageInterest',
  'company',
  'website',
  'budgetSignal',
  'timeline',
  'priority',
  'nextAction',
  'message',
  'followUpAt',
];

function normalizeValue(value?: string | null) {
  return String(value || '').trim();
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildSponsorLeadExportRows(leads: SponsorLeadInboxLead[]): SponsorLeadExportRow[] {
  return leads.map((lead) => {
    const packageDetails = parseSponsorPackageLeadMessage(lead.message);
    const qualification = packageDetails ? getSponsorPackageLeadQualification(packageDetails) : null;

    return {
      budgetSignal: normalizeValue(packageDetails?.budgetSignal),
      clientEmail: normalizeValue(lead.client_email),
      clientName: normalizeValue(lead.client_name),
      company: normalizeValue(packageDetails?.company),
      createdAt: normalizeValue(lead.created_at),
      followUpAt: normalizeValue(lead.follow_up_at),
      id: normalizeValue(lead.id),
      message: normalizeValue(packageDetails?.message ?? lead.message),
      nextAction: normalizeValue(qualification?.nextAction),
      packageInterest: normalizeValue(packageDetails?.packageInterest),
      priority: normalizeValue(qualification?.priorityLabel),
      serviceName: normalizeValue(lead.service_name),
      status: normalizeValue(lead.status || 'pending'),
      timeline: normalizeValue(packageDetails?.timeline),
      website: normalizeValue(packageDetails?.website),
    };
  });
}

export function serializeSponsorLeadCsv(leads: SponsorLeadInboxLead[]) {
  const rows = buildSponsorLeadExportRows(leads);
  const headerLine = CSV_HEADERS.join(',');
  const rowLines = rows.map((row) =>
    CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(','),
  );

  return [headerLine, ...rowLines].join('\n');
}

export function buildSponsorLeadCopySummary(lead: SponsorLeadInboxLead) {
  const packageDetails = parseSponsorPackageLeadMessage(lead.message);
  const qualification = packageDetails ? getSponsorPackageLeadQualification(packageDetails) : null;
  const lines = [
    `Lead: ${normalizeValue(lead.client_name) || 'Unnamed lead'}`,
    `Email: ${normalizeValue(lead.client_email) || 'No email provided'}`,
    `Status: ${normalizeValue(lead.status || 'pending')}`,
    `Created: ${normalizeValue(lead.created_at) || 'No timestamp'}`,
    packageDetails ? `Package: ${packageDetails.packageInterest}` : null,
    qualification ? `Priority: ${qualification.priorityLabel}` : null,
    qualification ? `Next action: ${qualification.nextAction}` : null,
    packageDetails?.company ? `Company: ${packageDetails.company}` : null,
    packageDetails?.website ? `Website: ${packageDetails.website}` : null,
    packageDetails?.budgetSignal ? `Budget: ${packageDetails.budgetSignal}` : null,
    packageDetails?.timeline ? `Timeline: ${packageDetails.timeline}` : null,
    '',
    packageDetails?.message || normalizeValue(lead.message) || 'No message provided.',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}
