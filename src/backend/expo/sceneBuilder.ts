import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import {
  EXPO_SCENE_CANONICAL_DISTRICTS,
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
  type ExpoSceneContract,
} from '../../shared/expo/sceneContract.js';
import { isExpoBoothPublicSceneStatus } from '../../shared/expo/boothPublicationStatus.js';
import { listExpoBooths, type ExpoBoothRecord } from './data/expoBoothStore.js';

function resolveCanonicalSectorId(value: unknown, fallbackIndex = 0) {
  const normalized = String(value || '').trim().toLowerCase();
  if (EXPO_SCENE_CANONICAL_DISTRICTS.includes(normalized as (typeof EXPO_SCENE_CANONICAL_DISTRICTS)[number])) {
    return normalized;
  }

  return EXPO_SCENE_CANONICAL_DISTRICTS[fallbackIndex % EXPO_SCENE_CANONICAL_DISTRICTS.length];
}

function normalizeSceneLookupKey(value: unknown) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getManagedScreenContentRecord(booth: ExpoBoothRecord | null) {
  const assets = getRecord(booth?.assets_3d);
  return getRecord(assets.screen_content);
}

function getManagedBoothMergePriority(booth: ExpoBoothRecord | null) {
  if (!booth) {
    return 0;
  }

  const screenContent = getManagedScreenContentRecord(booth);
  const hasScreenContent = Object.keys(screenContent).length > 0;
  if (!hasScreenContent) {
    return 1;
  }

  const status = String(screenContent.status || '').trim().toLowerCase();
  if (status !== 'published') {
    return 0;
  }

  const mode = String(screenContent.mode || '').trim().toLowerCase();
  const hasMedia = Boolean(screenContent.imageUrl || screenContent.image_url || screenContent.assetUrl || screenContent.asset_url || screenContent.videoUrl || screenContent.video_url);

  return 100
    + (mode === 'image' || mode === 'video-placeholder' ? 10 : 0)
    + (hasMedia ? 5 : 0);
}

function getManagedBoothLookupKeys(booth: ExpoBoothRecord) {
  const boothRecord = booth as unknown as Record<string, unknown>;
  const contactInfo = getRecord(booth.contact_info);

  return [
    booth.id,
    booth.company_name,
    booth.title,
    boothRecord.company_id,
    boothRecord.companyId,
    boothRecord.booth_id,
    boothRecord.boothId,
    boothRecord.runtime_booth_id,
    boothRecord.runtimeBoothId,
    contactInfo.company_id,
    contactInfo.companyId,
    contactInfo.booth_id,
    contactInfo.boothId,
    contactInfo.slug,
  ]
    .map(normalizeSceneLookupKey)
    .filter(Boolean);
}

function buildManagedBoothIndex(managedBooths: ExpoBoothRecord[]) {
  const index = new Map<string, ExpoBoothRecord>();

  managedBooths.forEach((booth) => {
    if (!isExpoBoothPublicSceneStatus(booth.status)) {
      return;
    }

    getManagedBoothLookupKeys(booth).forEach((key) => {
      const existing = index.get(key) ?? null;
      if (!existing || getManagedBoothMergePriority(booth) > getManagedBoothMergePriority(existing)) {
        index.set(key, booth);
      }
    });
  });

  return index;
}

function resolveManagedBoothForSceneBooth(
  lookupKeys: string[],
  managedBoothIndex: Map<string, ExpoBoothRecord>,
) {
  const candidates = new Map<string, ExpoBoothRecord>();

  lookupKeys.forEach((key) => {
    const candidate = managedBoothIndex.get(key);
    if (candidate) {
      candidates.set(candidate.id, candidate);
    }
  });

  return [...candidates.values()]
    .sort((left, right) => getManagedBoothMergePriority(right) - getManagedBoothMergePriority(left))[0] ?? null;
}

function getSceneBoothLookupKeys(booth: Record<string, any>, company?: Record<string, any> | null) {
  return [
    booth.id,
    booth.company_id,
    booth.companyId,
    booth.booth_id,
    booth.boothId,
    booth.slug,
    company?.id,
    company?.name,
    company?.slug,
  ]
    .map(normalizeSceneLookupKey)
    .filter(Boolean);
}

function mergeManagedBoothScreenContent(
  booth: Record<string, any>,
  managedBooth: ExpoBoothRecord | null,
) {
  const managedAssets = managedBooth?.assets_3d && typeof managedBooth.assets_3d === 'object'
    ? managedBooth.assets_3d
    : null;
  const screenContent = managedAssets?.screen_content;

  if (!screenContent || typeof screenContent !== 'object' || Array.isArray(screenContent)) {
    return booth;
  }
  if (String((screenContent as Record<string, unknown>).status || '').trim().toLowerCase() !== 'published') {
    return booth;
  }

  return {
    ...booth,
    assets_3d: {
      ...(booth.assets_3d && typeof booth.assets_3d === 'object' ? booth.assets_3d : {}),
      screen_content: screenContent,
    },
  };
}

export const sceneBuilder = {
  /**
   * Compiles the entire 3D scene data into a single structured payload for the frontend / Unreal Engine.
   */
  async buildScene() {
    try {
      logger.info('SceneBuilder', 'Building Expo Scene...');

      const [sectorsResult, companiesResult, boothsResult, managedBoothsResult] = await Promise.all([
        supabaseClient.from('sectors').select('*'),
        supabaseClient.from('companies').select('*').eq('is_active', true),
        supabaseClient.from('booths').select('*'),
        listExpoBooths().catch((error) => ({ data: null, error, table: 'expo_booths' as const })),
      ]);

      if (sectorsResult.error) throw new Error(`Failed to load sectors: ${sectorsResult.error.message}`);
      if (companiesResult.error) throw new Error(`Failed to load companies: ${companiesResult.error.message}`);
      if (boothsResult.error) throw new Error(`Failed to load booths: ${boothsResult.error.message}`);

      const rawBooths = boothsResult.data || [];
      const managedBoothIndex = buildManagedBoothIndex(!managedBoothsResult.error && managedBoothsResult.data ? managedBoothsResult.data : []);
      const sectors = (sectorsResult.data || []).map((sector: any, index: number) => ({
        ...sector,
        id: resolveCanonicalSectorId(sector.id || sector.name, index),
      }));
      const booths = rawBooths.map((booth: any) => {
        const company = (companiesResult.data || []).find((entry: any) => entry.id === booth.company_id || entry.id === booth.companyId);
        const managedBooth = resolveManagedBoothForSceneBooth(
          getSceneBoothLookupKeys(booth, company),
          managedBoothIndex,
        );

        return mergeManagedBoothScreenContent(booth, managedBooth);
      });
      const companies = (companiesResult.data || []).map((company: any, index: number) => {
        const companyBooth = booths.find(b => b.company_id === company.id);
        const sectorId = resolveCanonicalSectorId(company.sector_id, index);
        return {
          ...company,
          boothType: companyBooth?.booth_type || company.booth_type || null,
          booth: companyBooth || {}
          ,
          heroAssetUrl: companyBooth?.hero_asset_url || null,
          posterUrl: companyBooth?.poster_url || null,
          sectorId,
          sector_id: sectorId,
        };
      });
      const sceneData: ExpoSceneContract = {
        authPolicy: 'public-readonly',
        booths: booths.map((booth: any) => ({
          ...booth,
          companyId: String(booth.companyId || booth.company_id || ''),
        })),
        cityInfo: {
          globalLocation: null,
          id: 'warpala-expo-city',
          name: 'Warpala Expo',
          style: 0,
        },
        companies,
        generatedAt: new Date().toISOString(),
        releaseMode: EXPO_SCENE_RELEASE_MODE,
        sceneVersion: EXPO_SCENE_CONTRACT_VERSION,
        sectors,
      };

      logger.info('SceneBuilder', `Scene built with ${sectors.length} sectors and ${companies.length} companies.`);
      return { data: sceneData, error: null };
    } catch (error) {
      logger.error('SceneBuilder', 'Failed to build scene', error);
      return { data: null, error: String(error) };
    }
  }
};
