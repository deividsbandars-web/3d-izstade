import { expoService } from '../../../services/expoService';
import { getFrontendRuntimeEnv } from '../../../config/runtimeEnv';
import { reportExpoDevError } from './devErrorReporter';
import { adaptBackendScenePayload, normalizeBooth, normalizeCompany, normalizeSector } from './sceneContract';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from './sceneFallbacks';
import type { ExpoSceneData } from '../types/scene';

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

  return normalized;
}

export async function loadExpoSceneFromSupabaseService(): Promise<ExpoSceneData> {
  const [sectors, companies] = await Promise.all([
    expoService.getSectors(),
    expoService.getCompaniesWithBooths(),
  ]);

  if (!sectors || sectors.length === 0) {
    throw new Error('NO_SECTORS_FOUND');
  }

  return {
    authPolicy: undefined,
    cityInfo: null,
    companies: Array.isArray(companies)
      ? companies.map((company: any) => normalizeCompany(company, normalizeBooth(company?.booth ?? company?.booths, company)))
      : [],
    generatedAt: null,
    releaseMode: 'sponsor-boulevard',
    sceneVersion: 'expo-scene-supabase-fallback',
    sectors: Array.isArray(sectors) ? sectors.map(normalizeSector).filter((sector) => sector.id.length > 0) : [],
  };
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
