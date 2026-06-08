import {
  parseSponsorPackageLeadMessage,
  type SponsorPackageLeadDetails,
} from './sponsorPackageLead';

export type SponsorLeadPriority = 'hot' | 'standard' | 'warm';

export type SponsorLeadQualification = {
  nextAction: string;
  priority: SponsorLeadPriority;
  priorityLabel: string;
  reason: string;
};

function includesAny(value: string, signals: string[]) {
  return signals.some((signal) => value.includes(signal));
}

function normalize(value?: string | null) {
  return String(value || '').toLowerCase();
}

export function getSponsorPackageLeadQualification(
  details: SponsorPackageLeadDetails,
): SponsorLeadQualification {
  const packageInterest = normalize(details.packageInterest);
  const budgetSignal = normalize(details.budgetSignal);
  const timeline = normalize(details.timeline);
  const message = normalize(details.message);
  const combinedText = `${packageInterest} ${budgetSignal} ${timeline} ${message}`;

  const isLandmarkOrArena = includesAny(packageInterest, ['landmark', 'zone sponsor', 'demo arena', 'arena sponsor']);
  const isPremium = packageInterest.includes('premium');
  const hasHighBudgetSignal = includesAny(budgetSignal, ['50k', '100k', 'enterprise', 'custom', 'landmark']);
  const hasConcreteBudget = Boolean(budgetSignal.trim());
  const hasNearTermTimeline = includesAny(timeline, ['asap', 'now', 'this month', 'this quarter', '30 days', 'q1', 'q2', 'q3', 'q4']);
  const asksForMeeting = includesAny(combinedText, ['meeting', 'call', 'walkthrough', 'demo request', 'book']);

  if (isLandmarkOrArena || (isPremium && (hasHighBudgetSignal || hasNearTermTimeline || asksForMeeting))) {
    return {
      nextAction: 'Reply today and propose a sponsor walkthrough.',
      priority: 'hot',
      priorityLabel: 'Hot lead',
      reason: isLandmarkOrArena
        ? 'High-value package interest.'
        : 'Premium package with budget, timing, or meeting intent.',
    };
  }

  if (isPremium || hasConcreteBudget || hasNearTermTimeline || asksForMeeting) {
    return {
      nextAction: 'Qualify package fit and schedule follow-up.',
      priority: 'warm',
      priorityLabel: 'Warm lead',
      reason: 'Shows package intent, budget signal, timing, or meeting intent.',
    };
  }

  return {
    nextAction: 'Send package overview and ask for sponsor goals.',
    priority: 'standard',
    priorityLabel: 'Standard lead',
    reason: 'Package interest is present, but urgency and budget are not clear yet.',
  };
}

export function getSponsorLeadQualificationForMessage(message?: string | null) {
  const details = parseSponsorPackageLeadMessage(message);
  return details ? getSponsorPackageLeadQualification(details) : null;
}
