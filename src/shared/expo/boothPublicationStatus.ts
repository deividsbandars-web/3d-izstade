export type ExpoBoothPublicationStatus =
  | 'active'
  | 'approved'
  | 'archived'
  | 'draft'
  | 'rejected'
  | 'review';

export const EXPO_BOOTH_PUBLICATION_STATUSES: ExpoBoothPublicationStatus[] = [
  'draft',
  'review',
  'approved',
  'active',
  'rejected',
  'archived',
];

export const EXPO_BOOTH_PUBLIC_SCENE_STATUS: ExpoBoothPublicationStatus = 'active';

export const EXPO_BOOTH_ALLOWED_STATUS_TRANSITIONS: Record<
  ExpoBoothPublicationStatus,
  readonly ExpoBoothPublicationStatus[]
> = {
  active: ['active', 'archived'],
  approved: ['approved', 'active'],
  archived: ['archived'],
  draft: ['draft', 'review'],
  rejected: ['rejected', 'draft'],
  review: ['review', 'approved', 'rejected'],
} as const;

export function normalizeExpoBoothPublicationStatus(value: unknown): ExpoBoothPublicationStatus {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'pending' || normalized === 'submitted' || normalized === 'in-review') {
    return 'review';
  }

  if (EXPO_BOOTH_PUBLICATION_STATUSES.includes(normalized as ExpoBoothPublicationStatus)) {
    return normalized as ExpoBoothPublicationStatus;
  }

  return 'draft';
}

export function isExpoBoothPublicSceneStatus(value: unknown) {
  return normalizeExpoBoothPublicationStatus(value) === EXPO_BOOTH_PUBLIC_SCENE_STATUS;
}

export function getExpoBoothPublicationStatusLabel(value: unknown) {
  const status = normalizeExpoBoothPublicationStatus(value);
  switch (status) {
    case 'active':
      return 'Published';
    case 'approved':
      return 'Approved';
    case 'archived':
      return 'Archived';
    case 'rejected':
      return 'Rejected';
    case 'review':
      return 'Submitted';
    case 'draft':
    default:
      return 'Draft';
  }
}

export function canTransitionExpoBoothPublicationStatus(currentValue: unknown, nextValue: unknown) {
  const currentStatus = normalizeExpoBoothPublicationStatus(currentValue);
  const nextStatus = normalizeExpoBoothPublicationStatus(nextValue);
  return EXPO_BOOTH_ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getExpoBoothAllowedNextStatuses(currentValue: unknown) {
  const currentStatus = normalizeExpoBoothPublicationStatus(currentValue);
  return [...EXPO_BOOTH_ALLOWED_STATUS_TRANSITIONS[currentStatus]];
}
