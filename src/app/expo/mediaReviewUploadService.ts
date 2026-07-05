import { ExpoDataAPI } from '../../services/expo';
import {
  canApplyExpoMediaReviewUploadAdminAction,
  getExpoMediaReviewUploadAccept,
  getExpoMediaReviewUploadLabel,
  getExpoMediaReviewUploadPromoteTargets,
  validateExpoMediaReviewUploadFile,
  type ExpoMediaReviewUploadAdminAction,
  type ExpoMediaReviewUploadKind,
  type ExpoMediaReviewUploadPromoteTarget,
  type ExpoMediaReviewUploadRecord,
} from '../../shared/expo/mediaReviewUpload';
import type { ExpoMediaReviewReferencesSavePayload } from '../../shared/expo/mediaReviewReferences';

export type ExpoMediaReviewUploadResult =
  | {
    error: null;
    mediaReview: ExpoMediaReviewReferencesSavePayload;
    uploadedAsset: ExpoMediaReviewUploadRecord;
  }
  | {
    error: string;
    mediaReview: null;
    uploadedAsset: null;
  };

export type ExpoMediaReviewAdminResult =
  | {
    error: null;
    mediaReview: ExpoMediaReviewReferencesSavePayload;
    reviewedAsset: ExpoMediaReviewUploadRecord;
  }
  | {
    error: string;
    mediaReview: null;
    reviewedAsset: null;
  };

export function getMediaReviewUploadAccept(kind: ExpoMediaReviewUploadKind) {
  return getExpoMediaReviewUploadAccept(kind);
}

export function getMediaReviewUploadLabel(kind: ExpoMediaReviewUploadKind) {
  return getExpoMediaReviewUploadLabel(kind);
}

export function getMediaReviewPromoteTargets(kind: ExpoMediaReviewUploadKind) {
  return getExpoMediaReviewUploadPromoteTargets(kind);
}

export async function uploadMediaReviewFile({
  boothId,
  file,
  kind,
}: {
  boothId: string;
  file: File;
  kind: ExpoMediaReviewUploadKind;
}): Promise<ExpoMediaReviewUploadResult> {
  const validation = validateExpoMediaReviewUploadFile(kind, file);
  if (!validation.ok) {
    return { error: validation.reason, mediaReview: null, uploadedAsset: null };
  }

  try {
    const response = await ExpoDataAPI.uploadBoothMediaReviewAsset(boothId, kind, file) as {
      mediaReview: ExpoMediaReviewReferencesSavePayload;
      uploadedAsset: ExpoMediaReviewUploadRecord;
    };

    return {
      error: null,
      mediaReview: response.mediaReview,
      uploadedAsset: response.uploadedAsset,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Review upload failed.',
      mediaReview: null,
      uploadedAsset: null,
    };
  }
}

export async function applyMediaReviewAdminAction({
  action,
  boothId,
  promoteTarget,
  upload,
}: {
  action: ExpoMediaReviewUploadAdminAction;
  boothId: string;
  promoteTarget?: ExpoMediaReviewUploadPromoteTarget;
  upload: ExpoMediaReviewUploadRecord;
}): Promise<ExpoMediaReviewAdminResult> {
  const validation = canApplyExpoMediaReviewUploadAdminAction({
    action,
    kind: upload.kind,
    promoteTarget: promoteTarget ?? null,
    reviewStatus: upload.reviewStatus,
  });

  if (!validation.ok) {
    return { error: validation.reason, mediaReview: null, reviewedAsset: null };
  }

  try {
    const response = await ExpoDataAPI.reviewBoothMediaReviewAsset(boothId, {
      action,
      path: upload.path,
      ...(promoteTarget ? { promoteTarget } : {}),
    }) as {
      mediaReview: ExpoMediaReviewReferencesSavePayload;
      reviewedAsset: ExpoMediaReviewUploadRecord;
    };

    return {
      error: null,
      mediaReview: response.mediaReview,
      reviewedAsset: response.reviewedAsset,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Media review action failed.',
      mediaReview: null,
      reviewedAsset: null,
    };
  }
}
