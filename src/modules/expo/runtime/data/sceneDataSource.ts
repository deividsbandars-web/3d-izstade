import { expoService, type ExpoBusinessSceneAdapterPayload } from '../../../../services/expoService';
import { ExpoDataAPI } from '../../../../services/expo';
import { getFrontendRuntimeEnv } from '../../../../config/runtimeEnv';
import { buildExpoLayoutEngine } from '../../layout-engine';
import { reportExpoDevError } from '../../lib/devErrorReporter';
import { adaptBackendScenePayload, normalizeBooth, normalizeCompany, normalizeSector } from './sceneContract';
import { applyManagedBoothPreviewToScene, getManagedBoothPreviewIdFromSearch } from './managedBoothPreviewScene';
import { shouldUseReviewExpoSceneSource } from './sceneDataMode';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from './sceneFallbacks';
import { type ExpoSceneData } from '../../types/scene';

export function getPublicExpoSceneEndpoint() {
  return `${getFrontendRuntimeEnv().apiBaseUrl}/api/expo/scene`;
}

function isViteDev() {
  return Boolean(import.meta.env?.DEV);
}

function isLocalOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch (error) {
    if (isViteDev()) {
      reportExpoDevError('sceneDataSource.isLocalOrigin', error, { value });
    }
    return false;
  }
}

export function shouldPreferLocalExpoDataSource() {
  if (!isViteDev()) {
    return false;
  }

  return isLocalOrigin(getFrontendRuntimeEnv().apiBaseUrl);
}

function reportBoothPlacementDiagnostics(scene: ExpoSceneData, source: string) {
  if (!isViteDev()) {
    return;
  }

  try {
    const { placementDiagnostics } = buildExpoLayoutEngine(scene.companies, scene.sectors);
    if (placementDiagnostics.rejectedCompanyNodeCount === 0) {
      return;
    }

    console.warn('Expo booth placement validation rejected curated slots.', {
      diagnostics: placementDiagnostics,
      source,
    });
  } catch (error) {
    reportExpoDevError('sceneDataSource.reportBoothPlacementDiagnostics', error, { source });
  }
}

function shouldUseRuntimeReviewSceneSource() {
  if (typeof window === 'undefined') {
    return isViteDev();
  }

  return shouldUseReviewExpoSceneSource({
    hostname: window.location.hostname,
    isDev: isViteDev(),
    search: window.location.search,
  });
}

async function applyRuntimeManagedBoothPreview(scene: ExpoSceneData): Promise<ExpoSceneData> {
  if (typeof window === 'undefined') {
    return scene;
  }

  const boothId = getManagedBoothPreviewIdFromSearch(window.location.search);
  if (!boothId) {
    return scene;
  }

  try {
    const payload = await ExpoDataAPI.getReviewBooth(boothId);
    const previewScene = applyManagedBoothPreviewToScene(scene, payload as any);
    reportBoothPlacementDiagnostics(previewScene, 'managed-booth-preview');
    return previewScene;
  } catch (error) {
    reportExpoDevError('sceneDataSource.applyRuntimeManagedBoothPreview', error, { boothId });
    console.warn('Managed booth preview unavailable. Continuing with base Expo scene.', error);
    return scene;
  }
}

export async function loadExpoSceneFromBackendContract(): Promise<ExpoSceneData> {
  const response = await fetch(getPublicExpoSceneEndpoint(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`EXPO_SCENE_HTTP_${response.status}`);
  }

  const payload = await response.json();
  const normalized = adaptBackendScenePayload(payload);

  if (!normalized.sectors.length) {
    throw new Error('BACKEND_SCENE_EMPTY');
  }

  reportBoothPlacementDiagnostics(normalized, 'backend-contract');
  return normalized;
}

export async function loadExpoSceneFromSupabaseService(): Promise<ExpoSceneData> {
  const adapterPayload = await expoService.getSceneAdapterPayload();

  if (!adapterPayload.sectors || adapterPayload.sectors.length === 0) {
    throw new Error('NO_SECTORS_FOUND');
  }

  return buildRuntimeSceneFromAdapterPayload(adapterPayload);
}

function buildRuntimeSceneFromAdapterPayload(adapterPayload: ExpoBusinessSceneAdapterPayload): ExpoSceneData {
  const normalized: ExpoSceneData = {
    authPolicy: undefined,
    cityInfo: null,
    companies: Array.isArray(adapterPayload.companies)
      ? adapterPayload.companies.map((company: any) => normalizeCompany({
          ...company,
          sectorId: company.canonicalDistrictId,
          sector_id: company.canonicalDistrictId,
        }, normalizeBooth(company?.booth ?? company?.booths, company)))
      : [],
    generatedAt: null,
    releaseMode: adapterPayload.releaseMode,
    sceneVersion: `${adapterPayload.contractVersion}-adapter-supabase`,
    sectors: Array.isArray(adapterPayload.sectors)
      ? adapterPayload.sectors.map((sector) => normalizeSector({
          ...sector,
          id: sector.canonicalDistrictId,
          name: sector.name,
        })).filter((sector) => sector.id.length > 0)
      : [],
  };

  reportBoothPlacementDiagnostics(normalized, 'supabase-adapter');
  return normalized;
}

export async function loadExpoSceneForRelease(): Promise<ExpoSceneData> {
  if (shouldUseRuntimeReviewSceneSource()) {
    return applyRuntimeManagedBoothPreview(buildProductionSafeFallbackScene());
  }

  if (shouldPreferLocalExpoDataSource()) {
    try {
      return await applyRuntimeManagedBoothPreview(await loadExpoSceneFromSupabaseService());
    } catch (supabaseError) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.localSupabase', supabaseError);
      console.error('Expo local scene loading failed. Falling back to seeded Expo scene.', supabaseError);
      return applyRuntimeManagedBoothPreview(buildDevFallbackScene());
    }
  }

  try {
    return await applyRuntimeManagedBoothPreview(await loadExpoSceneFromBackendContract());
  } catch (backendError) {
    if (isViteDev()) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.backendContract', backendError, {
        endpoint: getPublicExpoSceneEndpoint(),
      });
    }
    if (isViteDev()) {
      console.warn('Expo scene backend contract unavailable.', backendError);
    }
  }

  if (isViteDev()) {
    try {
      return await applyRuntimeManagedBoothPreview(await loadExpoSceneFromSupabaseService());
    } catch (supabaseError) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.devSupabaseFallback', supabaseError);
      console.error('Expo scene loading failed.', supabaseError);
      return applyRuntimeManagedBoothPreview(buildDevFallbackScene());
    }
  }

  return applyRuntimeManagedBoothPreview(buildProductionSafeFallbackScene());
}
