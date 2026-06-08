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
      return 'Live in public scene';
    case 'approved':
      return 'Approved for release';
    case 'archived':
      return 'Archived';
    case 'rejected':
      return 'Changes requested';
    case 'review':
      return 'Submitted for review';
    case 'draft':
    default:
      return 'Draft/admin preview';
  }
}
