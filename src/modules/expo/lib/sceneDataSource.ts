import { expoService } from '../../../services/expoService';
import { getFrontendRuntimeEnv } from '../../../config/runtimeEnv';
import { adaptBackendScenePayload, normalizeBooth, normalizeCompany, normalizeSector } from './sceneContract';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from './sceneFallbacks';
import type { ExpoSceneData } from '../types/scene';

export function getPublicExpoSceneEndpoint() {
  return `${getFrontendRuntimeEnv().apiBaseUrl}/api/expo/scene`;
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
  try {
    return await loadExpoSceneFromBackendContract();
  } catch (backendError) {
    if (import.meta.env.DEV) {
      console.warn('Expo scene backend contract unavailable.', backendError);
    }
  }

  if (import.meta.env.DEV) {
    try {
      return await loadExpoSceneFromSupabaseService();
    } catch (supabaseError) {
      console.error('Expo scene loading failed.', supabaseError);
      return buildDevFallbackScene();
    }
  }

  return buildProductionSafeFallbackScene();
}
