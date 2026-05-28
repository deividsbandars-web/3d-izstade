export type SponsorPackageLeadDetails = {
  budgetSignal: string | null;
  company: string | null;
  message: string;
  packageInterest: string;
  timeline: string | null;
  website: string | null;
};

const PACKAGE_FIELD_PREFIXES = {
  budgetSignal: 'Budget signal:',
  company: 'Sponsor company:',
  packageInterest: 'Sponsor package interest:',
  timeline: 'Timeline:',
  website: 'Website:',
} as const;

function readField(lines: string[], prefix: string) {
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() || null : null;
}

export function parseSponsorPackageLeadMessage(message?: string | null): SponsorPackageLeadDetails | null {
  const normalizedMessage = String(message || '').trim();
  if (!normalizedMessage) {
    return null;
  }

  const lines = normalizedMessage.split(/\r?\n/).map((line) => line.trim());
  const packageInterest = readField(lines, PACKAGE_FIELD_PREFIXES.packageInterest);
  if (!packageInterest) {
    return null;
  }

  const firstMessageLine = lines.findIndex((line) => line === '');
  const requestMessage = firstMessageLine >= 0
    ? lines.slice(firstMessageLine + 1).join('\n').trim()
    : lines.filter((line) => !Object.values(PACKAGE_FIELD_PREFIXES).some((prefix) => line.startsWith(prefix))).join('\n').trim();

  return {
    budgetSignal: readField(lines, PACKAGE_FIELD_PREFIXES.budgetSignal),
    company: readField(lines, PACKAGE_FIELD_PREFIXES.company),
    message: requestMessage || normalizedMessage,
    packageInterest,
    timeline: readField(lines, PACKAGE_FIELD_PREFIXES.timeline),
    website: readField(lines, PACKAGE_FIELD_PREFIXES.website),
  };
}

export function isSponsorPackageLead(message?: string | null) {
  return parseSponsorPackageLeadMessage(message) !== null;
}
