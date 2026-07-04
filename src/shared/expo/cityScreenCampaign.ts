import { getExpoScreenSlotById } from './screenInventory.js';

export type ExpoCityScreenCampaignStatus = 'draft' | 'submitted' | 'approved' | 'live' | 'rejected';

export type ExpoCityScreenCampaignInput = {
  campaignEndDate?: unknown;
  campaignStartDate?: unknown;
  campaignStatus?: unknown;
  screenSlotId?: unknown;
};

export type ExpoCityScreenCampaignIssue = {
  field: 'campaignEndDate' | 'campaignStartDate' | 'campaignStatus' | 'screenSlotId';
  message: string;
};

export type ExpoCityScreenCampaignRecord = {
  boothId?: string;
  campaignEndDate: string;
  campaignStartDate: string;
  campaignStatus: ExpoCityScreenCampaignStatus;
  companyName?: string;
  screenSlotId: string;
};

const CAMPAIGN_STATUSES = new Set<ExpoCityScreenCampaignStatus>([
  'draft',
  'submitted',
  'approved',
  'live',
  'rejected',
]);

const BLOCKING_CAMPAIGN_STATUSES = new Set<ExpoCityScreenCampaignStatus>([
  'submitted',
  'approved',
  'live',
]);

const DAY_MS = 24 * 60 * 60 * 1000;
export const EXPO_CITY_SCREEN_MAX_CAMPAIGN_DAYS = 366;

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseIsoDate(value: unknown) {
  const normalized = asString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== normalized) {
    return null;
  }

  return { normalized, timestamp };
}

export function normalizeExpoCityScreenCampaignStatus(value: unknown): ExpoCityScreenCampaignStatus {
  const normalized = asString(value).toLowerCase() as ExpoCityScreenCampaignStatus;
  return CAMPAIGN_STATUSES.has(normalized) ? normalized : 'draft';
}

export function getExpoCityScreenCampaignStatusLabel(status: ExpoCityScreenCampaignStatus) {
  const labels: Record<ExpoCityScreenCampaignStatus, string> = {
    approved: 'Approved',
    draft: 'Draft',
    live: 'Live in city',
    rejected: 'Changes requested',
    submitted: 'Waiting for review',
  };
  return labels[status];
}

export function normalizeExpoCityScreenCampaign(
  input: ExpoCityScreenCampaignInput = {},
  options: { requireSchedule?: boolean; today?: string } = {},
) {
  const campaignStartDate = parseIsoDate(input.campaignStartDate);
  const campaignEndDate = parseIsoDate(input.campaignEndDate);
  const campaignStatus = normalizeExpoCityScreenCampaignStatus(input.campaignStatus);
  const screenSlotId = asString(input.screenSlotId);
  const slot = getExpoScreenSlotById(screenSlotId);
  const issues: ExpoCityScreenCampaignIssue[] = [];
  const scheduleRequired = options.requireSchedule || BLOCKING_CAMPAIGN_STATUSES.has(campaignStatus);

  if (screenSlotId && (!slot || slot.scope !== 'city')) {
    issues.push({ field: 'screenSlotId', message: 'Choose a valid city advertising screen.' });
  } else if (scheduleRequired && !screenSlotId) {
    issues.push({ field: 'screenSlotId', message: 'Choose a city advertising screen.' });
  }

  if (!campaignStartDate && (scheduleRequired || asString(input.campaignStartDate))) {
    issues.push({ field: 'campaignStartDate', message: 'Choose a valid campaign start date.' });
  }

  if (!campaignEndDate && (scheduleRequired || asString(input.campaignEndDate))) {
    issues.push({ field: 'campaignEndDate', message: 'Choose a valid campaign end date.' });
  }

  let durationDays = 0;
  if (campaignStartDate && campaignEndDate) {
    durationDays = Math.floor((campaignEndDate.timestamp - campaignStartDate.timestamp) / DAY_MS) + 1;
    if (durationDays < 1) {
      issues.push({ field: 'campaignEndDate', message: 'End date must be on or after the start date.' });
    } else if (durationDays > EXPO_CITY_SCREEN_MAX_CAMPAIGN_DAYS) {
      issues.push({ field: 'campaignEndDate', message: 'Campaigns can be booked for up to 12 months at a time.' });
    }

    const today = parseIsoDate(options.today);
    if (scheduleRequired && today && campaignStartDate.timestamp < today.timestamp) {
      issues.push({ field: 'campaignStartDate', message: 'Campaign start date cannot be in the past.' });
    }
  }

  const billingMonths = durationDays > 0 ? Math.max(1, Math.ceil(durationDays / 30)) : 0;
  const estimatedPriceEur = slot && slot.scope === 'city'
    ? slot.monthlyPriceHintEur * billingMonths
    : 0;

  return {
    billingMonths,
    campaign: {
      campaignEndDate: campaignEndDate?.normalized ?? '',
      campaignStartDate: campaignStartDate?.normalized ?? '',
      campaignStatus,
      screenSlotId: slot?.scope === 'city' ? slot.id : '',
    },
    durationDays,
    estimatedPriceEur,
    issues,
    ok: issues.length === 0,
  };
}

export function doExpoCityScreenCampaignsOverlap(
  left: Pick<ExpoCityScreenCampaignRecord, 'campaignStartDate' | 'campaignEndDate'>,
  right: Pick<ExpoCityScreenCampaignRecord, 'campaignStartDate' | 'campaignEndDate'>,
) {
  const leftStart = parseIsoDate(left.campaignStartDate);
  const leftEnd = parseIsoDate(left.campaignEndDate);
  const rightStart = parseIsoDate(right.campaignStartDate);
  const rightEnd = parseIsoDate(right.campaignEndDate);

  if (!leftStart || !leftEnd || !rightStart || !rightEnd) {
    return false;
  }

  return leftStart.timestamp <= rightEnd.timestamp && rightStart.timestamp <= leftEnd.timestamp;
}

export function isExpoCityScreenCampaignActive(
  campaign: ExpoCityScreenCampaignInput,
  today = new Date().toISOString().slice(0, 10),
) {
  const normalized = normalizeExpoCityScreenCampaign(campaign, { requireSchedule: true });
  const currentDate = parseIsoDate(today);
  const startDate = parseIsoDate(normalized.campaign.campaignStartDate);
  const endDate = parseIsoDate(normalized.campaign.campaignEndDate);

  return Boolean(
    normalized.ok
    && normalized.campaign.campaignStatus === 'live'
    && currentDate
    && startDate
    && endDate
    && startDate.timestamp <= currentDate.timestamp
    && currentDate.timestamp <= endDate.timestamp
  );
}

export function findExpoCityScreenCampaignConflict(
  requested: ExpoCityScreenCampaignRecord,
  existing: readonly ExpoCityScreenCampaignRecord[],
) {
  if (!BLOCKING_CAMPAIGN_STATUSES.has(requested.campaignStatus)) {
    return null;
  }

  return existing.find((campaign) => (
    campaign.boothId !== requested.boothId
    && campaign.screenSlotId === requested.screenSlotId
    && BLOCKING_CAMPAIGN_STATUSES.has(campaign.campaignStatus)
    && doExpoCityScreenCampaignsOverlap(requested, campaign)
  )) ?? null;
}
