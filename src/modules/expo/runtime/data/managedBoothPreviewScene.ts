import type { ExpoSceneCompany, ExpoSceneData } from '../../types/scene';
import { normalizeBooth, normalizeCompany, normalizeSlug } from './sceneContract';

const DEFAULT_MANAGED_PREVIEW_TARGET_COMPANY_ID = 'sponsor-concierge';
const MANAGED_BOOTH_PREVIEW_QUERY_KEYS = [
  'managedBoothPreview',
  'adminBoothPreview',
] as const;

type ManagedBoothPreviewPayload = {
  booth?: Record<string, any> | null;
};

function normalizePreviewId(value: unknown) {
  const normalized = String(value || '').trim();
  return /^[a-z0-9][a-z0-9_-]{2,80}$/i.test(normalized) ? normalized : null;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

function getScreenContent(booth: Record<string, any>) {
  const assets = asRecord(booth.assets_3d);
  return asRecord(assets.screen_content);
}

function getSponsorAssetPack(booth: Record<string, any>) {
  const assets = asRecord(booth.assets_3d);
  return asRecord(assets.sponsor_asset_pack);
}

function resolvePreviewBoothType(packageTier: unknown, fallback: ExpoSceneCompany) {
  const normalized = String(packageTier || '').trim().toLowerCase();
  if (normalized === 'landmarkzone') {
    return 'hero';
  }
  if (normalized === 'premium') {
    return 'premium';
  }
  if (normalized === 'standard') {
    return 'standard';
  }

  return fallback.boothType;
}

function resolvePreviewSponsorTier(packageTier: unknown, fallback: ExpoSceneCompany) {
  const normalized = String(packageTier || '').trim().toLowerCase();
  if (normalized === 'landmarkzone') {
    return 'hero';
  }
  if (normalized === 'premium') {
    return 'gold';
  }

  return fallback.sponsorTier;
}

export function getManagedBoothPreviewIdFromSearch(search: string | null | undefined) {
  const params = new URLSearchParams(search || '');
  for (const key of MANAGED_BOOTH_PREVIEW_QUERY_KEYS) {
    const previewId = normalizePreviewId(params.get(key));
    if (previewId) {
      return previewId;
    }
  }

  return null;
}

export function hasManagedBoothPreviewScreenContent(payload: ManagedBoothPreviewPayload | null | undefined) {
  const screenContent = getScreenContent(asRecord(payload?.booth));
  const status = String(screenContent.status || '').trim().toLowerCase();
  const mode = String(screenContent.mode || '').trim().toLowerCase();
  const hasImage = Boolean(screenContent.imageUrl || screenContent.image_url || screenContent.assetUrl || screenContent.asset_url);
  const hasVideo = Boolean(screenContent.videoUrl || screenContent.video_url);

  return status === 'published' && (
    (mode === 'image' && hasImage)
    || (mode === 'video-placeholder' && hasVideo)
    || mode === 'generated-card'
  );
}

export function applyManagedBoothPreviewToScene(
  scene: ExpoSceneData,
  payload: ManagedBoothPreviewPayload | null | undefined,
) {
  const managedBooth = asRecord(payload?.booth);
  const managedBoothId = normalizePreviewId(managedBooth.id);
  if (!managedBoothId || !hasManagedBoothPreviewScreenContent(payload)) {
    return scene;
  }

  const targetIndex = scene.companies.findIndex((company) => company.id === DEFAULT_MANAGED_PREVIEW_TARGET_COMPANY_ID);
  const fallbackTarget = scene.companies[targetIndex >= 0 ? targetIndex : 0];
  if (!fallbackTarget) {
    return scene;
  }

  const screenContent = getScreenContent(managedBooth);
  const sponsorAssetPack = getSponsorAssetPack(managedBooth);
  const packageTier = sponsorAssetPack.packageTier ?? sponsorAssetPack.package_tier;
  const boothType = resolvePreviewBoothType(packageTier, fallbackTarget);
  const sponsorTier = resolvePreviewSponsorTier(packageTier, fallbackTarget);
  const companyName = String(managedBooth.company_name || managedBooth.title || 'Managed Booth Preview').trim();
  const companySlug = normalizeSlug(managedBooth.slug, companyName) || `managed-booth-${managedBoothId}`;
  const ctaLabel = String(
    screenContent.ctaLabel
    || screenContent.cta_label
    || sponsorAssetPack.ctaPrimary
    || sponsorAssetPack.cta_primary
    || fallbackTarget.ctaLabel
    || '',
  ).trim() || null;
  const previewImageUrl = String(
    screenContent.imageUrl
    || screenContent.image_url
    || screenContent.assetUrl
    || screenContent.asset_url
    || sponsorAssetPack.heroImageUrl
    || sponsorAssetPack.hero_image_url
    || sponsorAssetPack.logoUrl
    || sponsorAssetPack.logo_url
    || '',
  ).trim() || null;
  const inheritedBooth = fallbackTarget.booth ?? null;

  const rawCompany = {
    ...fallbackTarget,
    id: managedBoothId,
    name: companyName,
    slug: companySlug,
    sector_id: fallbackTarget.sector_id ?? fallbackTarget.sectorId,
    sectorId: fallbackTarget.sectorId ?? fallbackTarget.sector_id,
    sponsorTier,
    sponsor_tier: sponsorTier,
    boothType,
    booth_type: boothType,
    tagline: String(sponsorAssetPack.shortPitch || sponsorAssetPack.short_pitch || screenContent.subtitle || '').trim()
      || fallbackTarget.tagline,
    logo_url: String(sponsorAssetPack.logoUrl || sponsorAssetPack.logo_url || fallbackTarget.logo_url || '').trim() || null,
    posterUrl: previewImageUrl || fallbackTarget.posterUrl,
    heroAssetUrl: fallbackTarget.heroAssetUrl,
    ctaLabel,
    booth: {
      ...(inheritedBooth ?? {}),
      id: managedBoothId,
      companyId: managedBoothId,
      company_id: managedBoothId,
      slug: companySlug,
      boothType,
      booth_type: boothType,
      ctaLabel,
      heroAssetUrl: inheritedBooth?.heroAssetUrl ?? fallbackTarget.heroAssetUrl,
      heroScreenImageUrl: previewImageUrl,
      heroScreenSlotId: String(screenContent.screenSlotId || screenContent.screen_slot_id || `managed-preview-${managedBoothId}`),
      heroScreenStatus: String(screenContent.status || 'published'),
      heroScreenText: String(screenContent.subtitle || screenContent.text || '').trim() || null,
      heroScreenTitle: String(screenContent.title || companyName).trim(),
      heroScreenType: String(screenContent.mode || 'generated-card'),
      heroScreenVideoUrl: String(screenContent.videoUrl || screenContent.video_url || '').trim() || null,
      model_url: inheritedBooth?.model_url ?? null,
      posterUrl: previewImageUrl || inheritedBooth?.posterUrl || fallbackTarget.posterUrl,
      video_url: inheritedBooth?.video_url ?? null,
    },
  };
  const previewCompany = normalizeCompany(rawCompany, normalizeBooth(rawCompany.booth, rawCompany));
  const companies = [...scene.companies];
  companies[targetIndex >= 0 ? targetIndex : 0] = previewCompany;

  return {
    ...scene,
    companies,
    sceneVersion: `${scene.sceneVersion}+managed-booth-preview`,
  };
}
