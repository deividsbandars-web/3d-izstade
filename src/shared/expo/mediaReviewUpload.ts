export type ExpoMediaReviewUploadKind = 'hero' | 'logo' | 'poster' | 'reference';
export type ExpoMediaReviewUploadReviewStatus = 'approved' | 'pending_review' | 'promoted' | 'rejected';
export type ExpoMediaReviewUploadPromoteTarget = 'hero' | 'logo' | 'poster';
export type ExpoMediaReviewUploadAdminAction = 'approve' | 'promote' | 'reject';

export type ExpoMediaReviewUploadRecord = {
  bucket: string;
  kind: ExpoMediaReviewUploadKind;
  mimeType: string;
  originalFilename: string;
  path: string;
  promotedAt?: string;
  promotedTarget?: ExpoMediaReviewUploadPromoteTarget;
  publicBucket?: string;
  publicPath?: string;
  publicUrl?: string;
  reviewStatus: ExpoMediaReviewUploadReviewStatus;
  reviewedAt?: string;
  size: number;
  uploadedAt: string;
};

type ExpoMediaReviewUploadConfig = {
  accept: string;
  allowedMimeTypes: readonly string[];
  label: string;
  maxBytes: number;
};

const MB = 1024 * 1024;
export const EXPO_MEDIA_REVIEW_UPLOAD_BUCKET = 'expo_review_media';
export const EXPO_MEDIA_REVIEW_UPLOAD_MAX_IMAGE_BYTES = 5 * MB;
export const EXPO_MEDIA_REVIEW_UPLOAD_MAX_VIDEO_BYTES = 25 * MB;
export const EXPO_MEDIA_REVIEW_UPLOAD_RECORD_LIMIT = 12;

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const HERO_REFERENCE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] as const;
const VALID_UPLOAD_KINDS = new Set<ExpoMediaReviewUploadKind>(['hero', 'logo', 'poster', 'reference']);
const VALID_REVIEW_STATUSES = new Set<ExpoMediaReviewUploadReviewStatus>(['approved', 'pending_review', 'promoted', 'rejected']);
const VALID_PROMOTE_TARGETS = new Set<ExpoMediaReviewUploadPromoteTarget>(['hero', 'logo', 'poster']);

const UPLOAD_CONFIG: Record<ExpoMediaReviewUploadKind, ExpoMediaReviewUploadConfig> = {
  hero: {
    accept: 'image/jpeg,image/png,image/webp,video/mp4',
    allowedMimeTypes: HERO_REFERENCE_MIME_TYPES,
    label: 'hero media',
    maxBytes: EXPO_MEDIA_REVIEW_UPLOAD_MAX_VIDEO_BYTES,
  },
  logo: {
    accept: 'image/jpeg,image/png,image/webp',
    allowedMimeTypes: IMAGE_MIME_TYPES,
    label: 'logo',
    maxBytes: EXPO_MEDIA_REVIEW_UPLOAD_MAX_IMAGE_BYTES,
  },
  poster: {
    accept: 'image/jpeg,image/png,image/webp',
    allowedMimeTypes: IMAGE_MIME_TYPES,
    label: 'poster',
    maxBytes: EXPO_MEDIA_REVIEW_UPLOAD_MAX_IMAGE_BYTES,
  },
  reference: {
    accept: 'image/jpeg,image/png,image/webp,video/mp4',
    allowedMimeTypes: HERO_REFERENCE_MIME_TYPES,
    label: 'reference media',
    maxBytes: EXPO_MEDIA_REVIEW_UPLOAD_MAX_VIDEO_BYTES,
  },
};

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeUploadedAt(value: unknown) {
  const normalized = asString(value);
  if (!normalized) {
    return new Date(0).toISOString();
  }

  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? new Date(0).toISOString() : new Date(timestamp).toISOString();
}

export function normalizeExpoMediaReviewUploadKind(value: unknown): ExpoMediaReviewUploadKind {
  const normalized = asString(value).toLowerCase();
  return VALID_UPLOAD_KINDS.has(normalized as ExpoMediaReviewUploadKind)
    ? normalized as ExpoMediaReviewUploadKind
    : 'reference';
}

export function getExpoMediaReviewUploadLabel(kind: ExpoMediaReviewUploadKind) {
  return UPLOAD_CONFIG[kind].label;
}

export function getExpoMediaReviewUploadAccept(kind: ExpoMediaReviewUploadKind) {
  return UPLOAD_CONFIG[kind].accept;
}

export function getExpoMediaReviewUploadPromoteTargets(kind: ExpoMediaReviewUploadKind): readonly ExpoMediaReviewUploadPromoteTarget[] {
  switch (kind) {
    case 'logo':
      return ['logo'] as const;
    case 'poster':
      return ['poster'] as const;
    case 'hero':
    case 'reference':
      return ['hero'] as const;
    default:
      return [] as const;
  }
}

export function normalizeExpoMediaReviewUploadPromoteTarget(value: unknown): ExpoMediaReviewUploadPromoteTarget | null {
  const normalized = asString(value).toLowerCase();
  return VALID_PROMOTE_TARGETS.has(normalized as ExpoMediaReviewUploadPromoteTarget)
    ? normalized as ExpoMediaReviewUploadPromoteTarget
    : null;
}

export function sanitizeExpoMediaReviewUploadFilename(fileName: string) {
  const trimmed = fileName.trim();
  const withoutPath = trimmed.split(/[\\/]/).pop() || trimmed;
  const normalized = withoutPath
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return normalized || 'review-media';
}

function normalizeOptionalIsoTimestamp(value: unknown) {
  const normalized = asString(value);
  if (!normalized) {
    return undefined;
  }

  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

export function getExpoMediaReviewUploadStatusLabel(status: ExpoMediaReviewUploadReviewStatus) {
  return status.replace(/_/g, ' ');
}

export function canApplyExpoMediaReviewUploadAdminAction(input: {
  action: ExpoMediaReviewUploadAdminAction;
  kind: ExpoMediaReviewUploadKind;
  promoteTarget?: ExpoMediaReviewUploadPromoteTarget | null;
  reviewStatus: ExpoMediaReviewUploadReviewStatus;
}) {
  if (input.action === 'approve') {
    if (input.reviewStatus === 'pending_review' || input.reviewStatus === 'rejected') {
      return { ok: true as const, reason: '' };
    }

    return { ok: false as const, reason: 'Only pending or rejected review uploads can be approved.' };
  }

  if (input.action === 'reject') {
    if (input.reviewStatus === 'pending_review' || input.reviewStatus === 'approved') {
      return { ok: true as const, reason: '' };
    }

    return { ok: false as const, reason: 'Only pending or approved review uploads can be rejected.' };
  }

  if (input.action === 'promote') {
    if (input.reviewStatus !== 'approved') {
      return { ok: false as const, reason: 'Only approved review uploads can be promoted to public media.' };
    }

    const promoteTarget = input.promoteTarget ?? null;
    if (!promoteTarget) {
      return { ok: false as const, reason: 'Choose a valid promote target.' };
    }

    if (!(getExpoMediaReviewUploadPromoteTargets(input.kind) as readonly ExpoMediaReviewUploadPromoteTarget[]).includes(promoteTarget)) {
      return { ok: false as const, reason: `This upload kind cannot be promoted to ${promoteTarget}.` };
    }

    return { ok: true as const, reason: '' };
  }

  return { ok: false as const, reason: 'Unsupported media review admin action.' };
}

export function validateExpoMediaReviewUploadInput(input: {
  fileName: string;
  kind: ExpoMediaReviewUploadKind;
  mimeType: string;
  size: number;
}) {
  const config = UPLOAD_CONFIG[input.kind];
  const normalizedMimeType = asString(input.mimeType).toLowerCase();
  const safeFileName = sanitizeExpoMediaReviewUploadFilename(input.fileName);

  if (!safeFileName) {
    return { ok: false as const, reason: `Choose a valid ${config.label} file.`, safeFileName: '' };
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false as const, reason: `${config.label} file is empty.`, safeFileName };
  }

  if (input.size > config.maxBytes) {
    return {
      ok: false as const,
      reason: `${config.label} must be ${Math.floor(config.maxBytes / MB)} MB or smaller.`,
      safeFileName,
    };
  }

  if (!config.allowedMimeTypes.includes(normalizedMimeType as never)) {
    return {
      ok: false as const,
      reason: `Use ${config.allowedMimeTypes.join(', ')} for ${config.label}.`,
      safeFileName,
    };
  }

  return { ok: true as const, reason: '', safeFileName };
}

export function validateExpoMediaReviewUploadFile(kind: ExpoMediaReviewUploadKind, file: File | null | undefined) {
  if (!file) {
    return { ok: false as const, reason: `Choose a ${getExpoMediaReviewUploadLabel(kind)} file first.` };
  }

  return validateExpoMediaReviewUploadInput({
    fileName: file.name,
    kind,
    mimeType: file.type,
    size: file.size,
  });
}

export function buildExpoMediaReviewStoragePath(input: {
  boothId: string;
  companyId: string;
  fileName: string;
}) {
  const safeCompanyId = sanitizeExpoMediaReviewUploadFilename(input.companyId);
  const safeBoothId = sanitizeExpoMediaReviewUploadFilename(input.boothId);
  const safeFileName = sanitizeExpoMediaReviewUploadFilename(input.fileName);
  return `sponsor-media/${safeCompanyId}/${safeBoothId}/${Date.now()}-${safeFileName}`;
}

export function normalizeExpoMediaReviewUploadRecord(value: unknown): ExpoMediaReviewUploadRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const bucket = asString(candidate.bucket);
  const path = asString(candidate.path);
  const originalFilename = sanitizeExpoMediaReviewUploadFilename(asString(candidate.originalFilename));
  const mimeType = asString(candidate.mimeType).toLowerCase();
  const kind = normalizeExpoMediaReviewUploadKind(candidate.kind);
  const reviewStatusRaw = asString(candidate.reviewStatus).toLowerCase();
  const reviewStatus = VALID_REVIEW_STATUSES.has(reviewStatusRaw as ExpoMediaReviewUploadReviewStatus)
    ? reviewStatusRaw as ExpoMediaReviewUploadReviewStatus
    : 'pending_review';
  const size = Number(candidate.size);
  const promotedTarget = normalizeExpoMediaReviewUploadPromoteTarget(candidate.promotedTarget);
  const publicBucket = asString(candidate.publicBucket);
  const publicPath = asString(candidate.publicPath);
  const publicUrl = asString(candidate.publicUrl);
  const reviewedAt = normalizeOptionalIsoTimestamp(candidate.reviewedAt);
  const promotedAt = normalizeOptionalIsoTimestamp(candidate.promotedAt);

  if (!bucket || !path || !originalFilename || !mimeType || !Number.isFinite(size) || size <= 0) {
    return null;
  }

  const validation = validateExpoMediaReviewUploadInput({
    fileName: originalFilename,
    kind,
    mimeType,
    size,
  });

  if (!validation.ok) {
    return null;
  }

  return {
    bucket,
    kind,
    mimeType,
    originalFilename,
    path,
    ...(promotedAt ? { promotedAt } : {}),
    ...(promotedTarget ? { promotedTarget } : {}),
    ...(publicBucket ? { publicBucket } : {}),
    ...(publicPath ? { publicPath } : {}),
    ...(publicUrl ? { publicUrl } : {}),
    reviewStatus,
    ...(reviewedAt ? { reviewedAt } : {}),
    size: Math.floor(size),
    uploadedAt: normalizeUploadedAt(candidate.uploadedAt),
  };
}

export function normalizeExpoMediaReviewUploadRecords(value: unknown) {
  const items = Array.isArray(value) ? value : [];
  const seen = new Set<string>();

  return items
    .map((item) => normalizeExpoMediaReviewUploadRecord(item))
    .filter((item): item is ExpoMediaReviewUploadRecord => item !== null)
    .filter((item) => {
      const key = `${item.bucket}:${item.path}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, EXPO_MEDIA_REVIEW_UPLOAD_RECORD_LIMIT);
}
