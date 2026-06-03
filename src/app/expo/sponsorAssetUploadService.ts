import { supabaseClient } from '../../lib/supabaseClient';
import {
  EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
  EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
} from '../../shared/expo/screenContentMedia';
import { EXPO_SPONSOR_ASSET_PACK_BROCHURE_EXTENSIONS } from '../../shared/expo/sponsorAssetPack';

export type ExpoSponsorAssetUploadTarget =
  | 'brochureUrl'
  | 'demoVideoUrl'
  | 'heroImageUrl'
  | 'logoUrl'
  | 'productImageUrls';

type ExpoSponsorAssetUploadConfig = {
  accept: string;
  allowedExtensions: readonly string[];
  label: string;
  maxBytes: number;
};

export type ExpoSponsorAssetUploadResult =
  | { error: null; publicUrl: string; storagePath: string }
  | { error: string; publicUrl: ''; storagePath: string };

export const EXPO_SPONSOR_ASSET_UPLOAD_BUCKET = 'expo_assets';

const MB = 1024 * 1024;

const UPLOAD_CONFIG: Record<ExpoSponsorAssetUploadTarget, ExpoSponsorAssetUploadConfig> = {
  brochureUrl: {
    accept: 'application/pdf,.pdf',
    allowedExtensions: EXPO_SPONSOR_ASSET_PACK_BROCHURE_EXTENSIONS,
    label: 'brochure PDF',
    maxBytes: 20 * MB,
  },
  demoVideoUrl: {
    accept: 'video/mp4,video/webm,.mp4,.webm',
    allowedExtensions: EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
    label: 'demo video',
    maxBytes: 80 * MB,
  },
  heroImageUrl: {
    accept: 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif',
    allowedExtensions: EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
    label: 'hero image',
    maxBytes: 8 * MB,
  },
  logoUrl: {
    accept: 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif',
    allowedExtensions: EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
    label: 'logo image',
    maxBytes: 4 * MB,
  },
  productImageUrls: {
    accept: 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif',
    allowedExtensions: EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
    label: 'product image',
    maxBytes: 8 * MB,
  },
};

function getExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

export function getSponsorAssetUploadAccept(target: ExpoSponsorAssetUploadTarget) {
  return UPLOAD_CONFIG[target].accept;
}

export function getSponsorAssetUploadLabel(target: ExpoSponsorAssetUploadTarget) {
  return UPLOAD_CONFIG[target].label;
}

export function validateSponsorAssetUploadFile(target: ExpoSponsorAssetUploadTarget, file: File | null | undefined) {
  const config = UPLOAD_CONFIG[target];

  if (!file) {
    return { ok: false as const, reason: `Choose a ${config.label} file first.` };
  }

  if (file.size <= 0) {
    return { ok: false as const, reason: `${config.label} file is empty.` };
  }

  if (file.size > config.maxBytes) {
    return { ok: false as const, reason: `${config.label} must be ${Math.floor(config.maxBytes / MB)} MB or smaller.` };
  }

  const extension = getExtension(file.name);
  if (!config.allowedExtensions.includes(extension)) {
    return { ok: false as const, reason: `Use ${config.allowedExtensions.join(', ')} for ${config.label}.` };
  }

  return { ok: true as const, reason: '' };
}

export async function uploadSponsorAssetPackFile({
  boothId,
  file,
  target,
}: {
  boothId: string;
  file: File;
  target: ExpoSponsorAssetUploadTarget;
}): Promise<ExpoSponsorAssetUploadResult> {
  const validation = validateSponsorAssetUploadFile(target, file);
  if (!validation.ok) {
    return { error: validation.reason, publicUrl: '', storagePath: '' };
  }

  const safeBoothId = sanitizePathSegment(boothId || 'new-booth');
  const safeFileName = sanitizePathSegment(file.name);
  const storagePath = `sponsor-assets/${safeBoothId}/${target}/${Date.now()}-${safeFileName}`;

  const { error } = await supabaseClient.storage
    .from(EXPO_SPONSOR_ASSET_UPLOAD_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '31536000',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    return {
      error: `Upload failed for ${getSponsorAssetUploadLabel(target)}. ${error.message}`,
      publicUrl: '',
      storagePath: '',
    };
  }

  const { data } = supabaseClient.storage
    .from(EXPO_SPONSOR_ASSET_UPLOAD_BUCKET)
    .getPublicUrl(storagePath);

  if (!data.publicUrl) {
    return { error: 'Upload finished, but no public URL was returned by Supabase Storage.', publicUrl: '', storagePath };
  }

  return { error: null, publicUrl: data.publicUrl, storagePath };
}
