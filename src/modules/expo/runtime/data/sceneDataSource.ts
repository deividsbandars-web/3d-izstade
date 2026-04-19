import { expoService, type ExpoBusinessSceneAdapterPayload } from '../../../../services/expoService';
import { getFrontendRuntimeEnv } from '../../../../config/runtimeEnv';
import { buildExpoLayoutEngine } from '../../layout-engine';
import { reportExpoDevError } from '../../lib/devErrorReporter';
import { adaptBackendScenePayload, normalizeBooth, normalizeCompany, normalizeSector } from './sceneContract';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from './sceneFallbacks';
import { type ExpoSceneData } from '../../types/scene';

export function getPublicExpoSceneEndpoint() {
  return `${getFrontendRuntimeEnv().apiBaseUrl}/api/expo/scene`;
}

function isLocalOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch (error) {
    if (import.meta.env.DEV) {
      reportExpoDevError('sceneDataSource.isLocalOrigin', error, { value });
    }
    return false;
  }
}

export function shouldPreferLocalExpoDataSource() {
  if (!import.meta.env.DEV) {
    return false;
  }

  return isLocalOrigin(getFrontendRuntimeEnv().apiBaseUrl);
}

function reportBoothPlacementDiagnostics(scene: ExpoSceneData, source: string) {
  if (!import.meta.env.DEV) {
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

function getDevExpoDataMode() {
  if (typeof window === 'undefined') {
    return 'seeded';
  }

  const mode = new URLSearchParams(window.location.search).get('expoData');
  return mode === 'live' ? 'live' : 'seeded';
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
  if (import.meta.env.DEV && getDevExpoDataMode() === 'seeded') {
    return buildProductionSafeFallbackScene();
  }

  if (shouldPreferLocalExpoDataSource()) {
    try {
      return await loadExpoSceneFromSupabaseService();
    } catch (supabaseError) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.localSupabase', supabaseError);
      console.error('Expo local scene loading failed. Falling back to seeded Expo scene.', supabaseError);
      return buildDevFallbackScene();
    }
  }

  try {
    return await loadExpoSceneFromBackendContract();
  } catch (backendError) {
    if (import.meta.env.DEV) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.backendContract', backendError, {
        endpoint: getPublicExpoSceneEndpoint(),
      });
    }
    if (import.meta.env.DEV) {
      console.warn('Expo scene backend contract unavailable.', backendError);
    }
  }

  if (import.meta.env.DEV) {
    try {
      return await loadExpoSceneFromSupabaseService();
    } catch (supabaseError) {
      reportExpoDevError('sceneDataSource.loadExpoSceneForRelease.devSupabaseFallback', supabaseError);
      console.error('Expo scene loading failed.', supabaseError);
      return buildDevFallbackScene();
    }
  }

  return buildProductionSafeFallbackScene();
}
