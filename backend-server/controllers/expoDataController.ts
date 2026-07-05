import { Request, Response } from 'express';
import { expoService } from '../../src/backend/expo/expoService.js';
import { cityMapService } from '../../src/backend/expo/city/cityMapService.js';
import { expoSceneService } from '../../src/backend/expo/scenes/expoSceneService.js';
import { boothAnalytics } from '../../src/backend/expo/analytics/boothAnalytics.js';
import { getExpoBoothById, listExpoBooths } from '../../src/backend/expo/data/expoBoothStore.js';
import { getSupabase } from '../services/supabase.js';
import { getSupabaseAdminClient } from '../../src/backend/lib/supabaseAdmin.js';
import {
  boothBelongsToUser,
  getBoothCompanyId,
  getManagedExpoBoothForUser,
  listManagedExpoBoothsForUser,
  mergeOwnedBoothPayload,
} from '../../src/backend/expo/booths/expoBoothManagementService.js';
import {
  buildExpoReviewBooth,
  buildExpoReviewSnapshot,
  updateExpoReviewLeadOps as updateExpoReviewLeadOpsUseCase,
  updateExpoReviewLeadStatus as updateExpoReviewLeadStatusUseCase,
} from '../../src/backend/expo/review/expoReviewService.js';
import {
  canTransitionExpoBoothPublicationStatus,
  getExpoBoothAllowedNextStatuses,
  normalizeExpoBoothPublicationStatus,
} from '../../src/shared/expo/boothPublicationStatus.js';
import {
  canApplyExpoMediaReviewUploadAdminAction,
  buildExpoMediaReviewStoragePath,
  EXPO_MEDIA_REVIEW_UPLOAD_BUCKET,
  getExpoMediaReviewUploadPromoteTargets,
  normalizeExpoMediaReviewUploadKind,
  normalizeExpoMediaReviewUploadPromoteTarget,
  sanitizeExpoMediaReviewUploadFilename,
  validateExpoMediaReviewUploadInput,
} from '../../src/shared/expo/mediaReviewUpload.js';
import {
  normalizeExpoMediaReviewReferencesForSave,
  readExpoMediaReviewReferencesFromAssets,
} from '../../src/shared/expo/mediaReviewReferences.js';
import { getExpoScreenSlotById } from '../../src/shared/expo/screenInventory.js';
import {
  findExpoCityScreenCampaignConflict,
  normalizeExpoCityScreenCampaign,
  type ExpoCityScreenCampaignRecord,
} from '../../src/shared/expo/cityScreenCampaign.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function getIdParam(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function getRequestedPublicationStatus(payload: Record<string, unknown>) {
  return Object.prototype.hasOwnProperty.call(payload, 'status')
    ? normalizeExpoBoothPublicationStatus(payload.status)
    : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function validateCityScreenCampaignRequest(
  payload: Record<string, unknown>,
  options: { boothId?: string; role?: string | null },
) {
  const assets = asRecord(payload.assets_3d);
  if (!Object.prototype.hasOwnProperty.call(assets, 'city_screen_content')) {
    return { error: null, status: 200 as const };
  }

  const rawCampaign = asRecord(assets.city_screen_content);
  const normalized = normalizeExpoCityScreenCampaign(rawCampaign, {
    today: new Date().toISOString().slice(0, 10),
  });
  if (!normalized.ok) {
    return {
      error: normalized.issues.map((issue) => issue.message).join(' '),
      status: 400 as const,
    };
  }

  if (options.role !== 'admin' && !['draft', 'submitted'].includes(normalized.campaign.campaignStatus)) {
    return {
      error: 'Only an operator can approve, reject, or publish a city screen campaign.',
      status: 403 as const,
    };
  }

  if (normalized.campaign.campaignStatus === 'draft') {
    return { error: null, status: 200 as const };
  }

  const boothsResult = await listExpoBooths();
  if (boothsResult.error || !boothsResult.data) {
    return {
      error: 'City screen availability could not be verified. Try again before submitting.',
      status: 503 as const,
    };
  }

  const existingCampaigns = boothsResult.data.flatMap((booth: {
    assets_3d?: Record<string, unknown> | null;
    company_name?: string;
    id: string;
  }) => {
    const boothAssets = asRecord(booth.assets_3d);
    const boothCampaign = normalizeExpoCityScreenCampaign(asRecord(boothAssets.city_screen_content));
    if (!boothCampaign.ok || !boothCampaign.campaign.screenSlotId) {
      return [];
    }

    return [{
      boothId: booth.id,
      campaignEndDate: boothCampaign.campaign.campaignEndDate,
      campaignStartDate: boothCampaign.campaign.campaignStartDate,
      campaignStatus: boothCampaign.campaign.campaignStatus,
      companyName: booth.company_name,
      screenSlotId: boothCampaign.campaign.screenSlotId,
    } satisfies ExpoCityScreenCampaignRecord];
  });

  const conflict = findExpoCityScreenCampaignConflict({
    boothId: options.boothId,
    ...normalized.campaign,
  }, existingCampaigns);
  if (conflict) {
    return {
      error: `This screen already has a campaign request for ${conflict.campaignStartDate} to ${conflict.campaignEndDate}. Choose different dates or another screen.`,
      status: 409 as const,
    };
  }

  return { error: null, status: 200 as const };
}

function canUserSetPublicationStatus(
  status: ReturnType<typeof normalizeExpoBoothPublicationStatus> | null,
  role: string | null | undefined,
  currentStatus?: unknown,
) {
  if (!status) {
    return true;
  }

  if (role === 'admin') {
    return true;
  }

  if (currentStatus && status === normalizeExpoBoothPublicationStatus(currentStatus)) {
    return true;
  }

  return status === 'draft' || status === 'review';
}

function isAllowedPublicationStatusTransition(
  currentStatus: unknown,
  nextStatus: ReturnType<typeof normalizeExpoBoothPublicationStatus> | null,
) {
  if (!nextStatus) {
    return true;
  }

  const normalizedCurrentStatus = currentStatus === undefined
    ? 'draft'
    : normalizeExpoBoothPublicationStatus(currentStatus);

  return canTransitionExpoBoothPublicationStatus(normalizedCurrentStatus, nextStatus);
}

export const createBooth = async (req: AuthRequest, res: Response) => {
  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'booth payload is required' });
  }

  const requestedStatus = getRequestedPublicationStatus(payload as Record<string, unknown>);
  if (!canUserSetPublicationStatus(requestedStatus, req.user?.role)) {
    return res.status(403).json({ error: 'Only an admin can approve, activate, reject, archive, or publish an expo booth.' });
  }
  if (!isAllowedPublicationStatusTransition(undefined, requestedStatus)) {
    return res.status(400).json({
      error: `Invalid expo booth status transition. New booths may start only in ${getExpoBoothAllowedNextStatuses('draft').join(' or ')}.`,
    });
  }

  const cityScreenCampaignValidation = await validateCityScreenCampaignRequest(
    payload as Record<string, unknown>,
    { role: req.user?.role },
  );
  if (cityScreenCampaignValidation.error) {
    return res.status(cityScreenCampaignValidation.status).json({ error: cityScreenCampaignValidation.error });
  }

  const result = await expoService.createBooth(
    mergeOwnedBoothPayload(payload as Record<string, unknown>, req.user ?? {}) as any,
  );
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(201).json(result.data);
};

export const updateBooth = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'update payload is required' });
  }

  const existingBooth = await getExpoBoothById(boothId);
  if (existingBooth.error || !existingBooth.data) {
    return res.status(404).json({ error: existingBooth.error || `Booth ${boothId} not found` });
  }

  if (req.user?.role !== 'admin' && !boothBelongsToUser(existingBooth.data, req.user ?? {})) {
    return res.status(403).json({ error: 'Booth ownership mismatch' });
  }

  const requestedStatus = getRequestedPublicationStatus(payload as Record<string, unknown>);
  if (!canUserSetPublicationStatus(
    requestedStatus,
    req.user?.role,
    (existingBooth.data as { status?: unknown }).status,
  )) {
    return res.status(403).json({ error: 'Only an admin can approve, activate, reject, archive, or publish an expo booth.' });
  }
  if (!isAllowedPublicationStatusTransition((existingBooth.data as { status?: unknown }).status, requestedStatus)) {
    const currentStatus = normalizeExpoBoothPublicationStatus((existingBooth.data as { status?: unknown }).status);
    return res.status(400).json({
      error: `Invalid expo booth status transition from ${currentStatus} to ${requestedStatus}. Allowed next statuses: ${getExpoBoothAllowedNextStatuses(currentStatus).join(', ')}.`,
    });
  }

  const cityScreenCampaignValidation = await validateCityScreenCampaignRequest(
    payload as Record<string, unknown>,
    { boothId, role: req.user?.role },
  );
  if (cityScreenCampaignValidation.error) {
    return res.status(cityScreenCampaignValidation.status).json({ error: cityScreenCampaignValidation.error });
  }

  const result = await expoService.updateBooth(
    boothId,
    mergeOwnedBoothPayload(payload as Record<string, unknown>, req.user ?? {}) as any,
  );
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

function getSingleHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

const EXPO_PUBLIC_PROMOTED_MEDIA_BUCKET = 'expo_assets';

function asBodyRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function buildPromotedExpoMediaStoragePath(input: {
  boothId: string;
  companyId: string;
  fileName: string;
  target: 'booth-screen' | 'city-screen' | 'hero' | 'logo' | 'poster';
}) {
  const safeCompanyId = sanitizeExpoMediaReviewUploadFilename(input.companyId);
  const safeBoothId = sanitizeExpoMediaReviewUploadFilename(input.boothId);
  const safeTarget = sanitizeExpoMediaReviewUploadFilename(input.target);
  const safeFileName = sanitizeExpoMediaReviewUploadFilename(input.fileName);
  return `review-promoted/${safeCompanyId}/${safeBoothId}/${safeTarget}/${Date.now()}-${safeFileName}`;
}

async function applyPromotedExpoPublicMedia(input: {
  companyId: string;
  publicUrl: string;
  target: 'hero' | 'logo' | 'poster';
}) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (input.target === 'logo') {
    const companyResult = await supabaseAdmin
      .from('companies')
      .update({ logo_url: input.publicUrl })
      .eq('id', input.companyId)
      .select('id')
      .single();

    if (companyResult.error) {
      throw new Error(`Failed to update public company logo. ${companyResult.error.message}`);
    }

    return;
  }

  const companyField = input.target === 'poster' ? 'poster_url' : 'hero_asset_url';
  const boothField = companyField;
  const companyResult = await supabaseAdmin
    .from('companies')
    .update({ [companyField]: input.publicUrl })
    .eq('id', input.companyId)
    .select('id')
    .single();

  if (companyResult.error) {
    throw new Error(`Failed to update public company media. ${companyResult.error.message}`);
  }

  const boothResult = await supabaseAdmin
    .from('booths')
    .upsert([{ company_id: input.companyId, [boothField]: input.publicUrl }], { onConflict: 'company_id' })
    .select('id')
    .single();

  if (boothResult.error) {
    throw new Error(`Failed to update public booth media. ${boothResult.error.message}`);
  }
}

export const uploadBoothMediaReviewAsset = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const fileBuffer = Buffer.isBuffer(req.body) ? req.body : null;
  if (!fileBuffer || fileBuffer.length <= 0) {
    return res.status(400).json({ error: 'Review upload file body is required.' });
  }

  const kind = normalizeExpoMediaReviewUploadKind(getSingleHeaderValue(req.headers['x-media-kind']));
  const originalFilename = getSingleHeaderValue(req.headers['x-upload-filename']);
  const mimeType = getSingleHeaderValue(req.headers['content-type']).toLowerCase();
  const validation = validateExpoMediaReviewUploadInput({
    fileName: originalFilename,
    kind,
    mimeType,
    size: fileBuffer.length,
  });

  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  const managedBoothResult = await getManagedExpoBoothForUser(boothId, req.user ?? {});
  if (managedBoothResult.error || !managedBoothResult.booth) {
    return res.status(managedBoothResult.status).json({ error: managedBoothResult.error });
  }

  const booth = managedBoothResult.booth;
  const companyId = getBoothCompanyId(booth);
  if (!companyId) {
    return res.status(400).json({ error: 'Booth does not have a valid company context for review uploads.' });
  }

  const storagePath = buildExpoMediaReviewStoragePath({
    boothId,
    companyId,
    fileName: validation.safeFileName,
  });

  const supabase = getSupabase();
  const uploadResult = await supabase.storage.from(EXPO_MEDIA_REVIEW_UPLOAD_BUCKET).upload(storagePath, fileBuffer, {
    cacheControl: '3600',
    contentType: mimeType,
    upsert: false,
  });

  if (uploadResult.error) {
    return res.status(500).json({ error: `Review upload failed. ${uploadResult.error.message}` });
  }

  const existingAssets =
    booth.assets_3d && typeof booth.assets_3d === 'object'
      ? booth.assets_3d as Record<string, unknown>
      : {};
  const existingMediaReview = readExpoMediaReviewReferencesFromAssets(existingAssets);
  const uploadedAsset = {
    bucket: EXPO_MEDIA_REVIEW_UPLOAD_BUCKET,
    kind,
    mimeType,
    originalFilename: validation.safeFileName,
    path: storagePath,
    reviewStatus: 'pending_review' as const,
    size: fileBuffer.length,
    uploadedAt: new Date().toISOString(),
  };
  const nextMediaReviewResult = normalizeExpoMediaReviewReferencesForSave({
    ...existingMediaReview,
    uploads: [...existingMediaReview.uploads, uploadedAsset],
  });
  const nextMediaReview = nextMediaReviewResult.mediaReview;
  const nextAssets = {
    ...existingAssets,
    media_review: nextMediaReview,
  };
  const updateResult = await expoService.updateBooth(boothId, {
    assets_3d: nextAssets,
  });

  if (updateResult.error || !updateResult.data) {
    await supabase.storage.from(EXPO_MEDIA_REVIEW_UPLOAD_BUCKET).remove([storagePath]);
    return res.status(500).json({ error: String(updateResult.error || 'Review upload metadata save failed.') });
  }

  return res.json({
    boothId,
    companyId,
    mediaReview: nextMediaReview,
    uploadedAsset,
  });
};

export const reviewBoothMediaReviewAsset = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const body = asBodyRecord(req.body);
  const actionRaw = typeof body.action === 'string' ? body.action.trim().toLowerCase() : '';
  const action = actionRaw === 'approve' || actionRaw === 'reject' || actionRaw === 'promote'
    ? actionRaw
    : '';
  const uploadPath = typeof body.path === 'string' ? body.path.trim() : '';
  const promoteTarget = normalizeExpoMediaReviewUploadPromoteTarget(body.promoteTarget);

  if (!action) {
    return res.status(400).json({ error: 'Valid media review action is required.' });
  }

  if (!uploadPath) {
    return res.status(400).json({ error: 'Review upload path is required.' });
  }

  const managedBoothResult = await getManagedExpoBoothForUser(boothId, req.user ?? {});
  if (managedBoothResult.error || !managedBoothResult.booth) {
    return res.status(managedBoothResult.status).json({ error: managedBoothResult.error });
  }

  const booth = managedBoothResult.booth;
  const companyId = getBoothCompanyId(booth);
  if (!companyId) {
    return res.status(400).json({ error: 'Booth does not have a valid company context for review actions.' });
  }

  const existingAssets =
    booth.assets_3d && typeof booth.assets_3d === 'object'
      ? booth.assets_3d as Record<string, unknown>
      : {};
  const existingMediaReview = readExpoMediaReviewReferencesFromAssets(existingAssets);
  const uploadIndex = existingMediaReview.uploads.findIndex((upload) => (
    upload.bucket === EXPO_MEDIA_REVIEW_UPLOAD_BUCKET && upload.path === uploadPath
  ));

  if (uploadIndex < 0) {
    return res.status(404).json({ error: 'Review upload metadata not found for this booth.' });
  }

  const existingUpload = existingMediaReview.uploads[uploadIndex];
  const actionValidation = canApplyExpoMediaReviewUploadAdminAction({
    action: action as 'approve' | 'promote' | 'reject',
    kind: existingUpload.kind,
    promoteTarget,
    reviewStatus: existingUpload.reviewStatus,
  });

  if (!actionValidation.ok) {
    return res.status(400).json({ error: actionValidation.reason });
  }

  const now = new Date().toISOString();
  let nextUpload = {
    ...existingUpload,
  };
  let promotedScreenAsset: {
    assetKey: 'city_screen_content' | 'screen_content';
    mimeType: string;
    publicUrl: string;
  } | null = null;

  if (action === 'approve') {
    nextUpload = {
      ...existingUpload,
      reviewStatus: 'approved',
      reviewedAt: now,
    };
  }

  if (action === 'reject') {
    nextUpload = {
      ...existingUpload,
      reviewStatus: 'rejected',
      reviewedAt: now,
    };
  }

  if (action === 'promote') {
    const resolvedTarget = promoteTarget;
    if (!resolvedTarget || !getExpoMediaReviewUploadPromoteTargets(existingUpload.kind).includes(resolvedTarget)) {
      return res.status(400).json({ error: 'This review upload cannot be promoted to the requested public media target.' });
    }
    if (resolvedTarget === 'city-screen') {
      const cityScreenContent = asBodyRecord(existingAssets.city_screen_content);
      const cityScreenSlot = getExpoScreenSlotById(String(cityScreenContent.screenSlotId || ''));
      if (!cityScreenSlot || cityScreenSlot.scope !== 'city') {
        return res.status(400).json({ error: 'Choose a valid city advertising screen before promoting this campaign.' });
      }
    }

    const supabase = getSupabase();
    const downloadResult = await supabase.storage.from(EXPO_MEDIA_REVIEW_UPLOAD_BUCKET).download(existingUpload.path);
    if (downloadResult.error || !downloadResult.data) {
      return res.status(500).json({ error: `Failed to read private review upload. ${downloadResult.error?.message || 'Unknown storage error'}` });
    }

    const publicPath = buildPromotedExpoMediaStoragePath({
      boothId,
      companyId,
      fileName: existingUpload.originalFilename,
      target: resolvedTarget,
    });
    const publicFileBuffer = Buffer.from(await downloadResult.data.arrayBuffer());
    const publicUploadResult = await supabase.storage.from(EXPO_PUBLIC_PROMOTED_MEDIA_BUCKET).upload(publicPath, publicFileBuffer, {
      cacheControl: '31536000',
      contentType: existingUpload.mimeType,
      upsert: false,
    });

    if (publicUploadResult.error) {
      return res.status(500).json({ error: `Failed to copy approved media to public storage. ${publicUploadResult.error.message}` });
    }

    const { data: publicUrlResult } = supabase.storage
      .from(EXPO_PUBLIC_PROMOTED_MEDIA_BUCKET)
      .getPublicUrl(publicPath);
    const publicUrl = typeof publicUrlResult.publicUrl === 'string' ? publicUrlResult.publicUrl.trim() : '';

    if (!publicUrl) {
      return res.status(500).json({ error: 'Public media URL could not be created for the promoted upload.' });
    }

    if (resolvedTarget === 'booth-screen' || resolvedTarget === 'city-screen') {
      promotedScreenAsset = {
        assetKey: resolvedTarget === 'city-screen' ? 'city_screen_content' : 'screen_content',
        mimeType: existingUpload.mimeType,
        publicUrl,
      };
    } else {
      try {
        await applyPromotedExpoPublicMedia({
          companyId,
          publicUrl,
          target: resolvedTarget,
        });
      } catch (error) {
        await supabase.storage.from(EXPO_PUBLIC_PROMOTED_MEDIA_BUCKET).remove([publicPath]);
        return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    }

    nextUpload = {
      ...existingUpload,
      promotedAt: now,
      promotedTarget: resolvedTarget,
      publicBucket: EXPO_PUBLIC_PROMOTED_MEDIA_BUCKET,
      publicPath,
      publicUrl,
      reviewStatus: 'promoted',
      reviewedAt: existingUpload.reviewedAt || now,
    };
  }

  const nextUploads = existingMediaReview.uploads.map((upload, index) => (
    index === uploadIndex ? nextUpload : upload
  ));
  const nextMediaReviewResult = normalizeExpoMediaReviewReferencesForSave({
    ...existingMediaReview,
    uploads: nextUploads,
  });
  const nextMediaReview = nextMediaReviewResult.mediaReview;
  const nextAssets: Record<string, unknown> = {
    ...existingAssets,
    media_review: nextMediaReview,
  };
  if (promotedScreenAsset) {
    const existingScreenContent = asBodyRecord(existingAssets[promotedScreenAsset.assetKey]);
    const isVideo = promotedScreenAsset.mimeType === 'video/mp4';
    nextAssets[promotedScreenAsset.assetKey] = {
      ...existingScreenContent,
      imageUrl: isVideo ? String(existingScreenContent.imageUrl || '') : promotedScreenAsset.publicUrl,
      mode: isVideo ? 'video' : 'image',
      status: 'published',
      videoUrl: isVideo ? promotedScreenAsset.publicUrl : '',
    };
  }
  const updateResult = await expoService.updateBooth(boothId, {
    assets_3d: nextAssets,
  });

  if (updateResult.error || !updateResult.data) {
    return res.status(500).json({ error: String(updateResult.error || 'Media review action metadata save failed.') });
  }

  return res.json({
    boothId,
    companyId,
    mediaReview: nextMediaReview,
    reviewedAsset: nextUpload,
  });
};

export const getBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoService.getBoothById(boothId);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBooths = async (_req: Request, res: Response) => {
  const result = await expoService.getBooths();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getManagedBooths = async (req: AuthRequest, res: Response) => {
  const result = await listManagedExpoBoothsForUser(req.user ?? {});
  if (result.error || !result.data) {
    return res.status(500).json({ error: String(result.error || 'Managed booths unavailable') });
  }

  res.json(result.data);
};

export const getBoothAnalytics = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await boothAnalytics.getBoothStats(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getExpoCity = async (_req: Request, res: Response) => {
  const result = await cityMapService.getCityMap();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getDistricts = async (_req: Request, res: Response) => {
  const result = await cityMapService.getDistricts();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const assignBoothToDistrict = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const districtName =
    typeof req.body?.districtName === 'string' && req.body.districtName.trim().length > 0
      ? req.body.districtName.trim()
      : '';

  if (!boothId || !districtName) {
    return res.status(400).json({ error: 'boothId and districtName are required' });
  }

  const result = await cityMapService.assignBoothToDistrict(boothId, districtName);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBoothScene = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoSceneService.getBoothScene(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getCityScene = async (_req: Request, res: Response) => {
  const result = await expoSceneService.getCityScene();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getExpoReviewSnapshot = async (_req: Request, res: Response) => {
  try {
    const snapshot = await buildExpoReviewSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getExpoReviewBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await buildExpoReviewBooth(boothId);
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};

export const updateExpoReviewLeadStatus = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const nextStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (!['pending', 'contacted', 'closed', 'rejected'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Unsupported expo lead status' });
  }

  const result = await updateExpoReviewLeadStatusUseCase(boothId, leadId, nextStatus, req.user ?? {});
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};

export const updateExpoReviewLeadOps = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const opsNotes =
    typeof req.body?.opsNotes === 'string' && req.body.opsNotes.trim().length > 0
      ? req.body.opsNotes.trim()
      : null;
  const followUpAt =
    typeof req.body?.followUpAt === 'string' && req.body.followUpAt.trim().length > 0
      ? req.body.followUpAt.trim()
      : null;

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (followUpAt && Number.isNaN(Date.parse(followUpAt))) {
    return res.status(400).json({ error: 'followUpAt must be a valid datetime' });
  }

  const result = await updateExpoReviewLeadOpsUseCase(boothId, leadId, opsNotes, followUpAt, req.user ?? {});
  if (result.error || !result.data) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};
