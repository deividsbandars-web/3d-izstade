import { useEffect, useState } from 'react';
import { expoService } from '../../../services/expoService';
import { adaptBackendScenePayload, normalizeBooth, normalizeCompany, normalizeSector } from '../lib/sceneContract';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from '../lib/sceneFallbacks';
import type { ExpoSceneData } from '../types/scene';

function getPublicExpoSceneEndpoint() {
  if (typeof window === 'undefined') {
    return 'http://localhost/api/expo/scene';
  }

  return `${window.location.origin}/api/expo/scene`;
}

async function loadFromBackendContract(): Promise<ExpoSceneData> {
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

async function loadFromSupabaseService(): Promise<ExpoSceneData> {
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

export function useExpoSceneData() {
  const [data, setData] = useState<ExpoSceneData>({
    authPolicy: undefined,
    cityInfo: null,
    companies: [],
    generatedAt: null,
    releaseMode: 'sponsor-boulevard',
    sceneVersion: 'expo-scene-backend-unavailable',
    sectors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        try {
          const backendScene = await loadFromBackendContract();
          if (isActive) {
            setData(backendScene);
          }
          return;
        } catch (backendError) {
          if (import.meta.env.DEV) {
            console.warn('Expo scene backend contract unavailable, falling back to direct Supabase client access.', backendError);
          }
        }

        try {
          const supabaseScene = await loadFromSupabaseService();
          if (isActive) {
            setData(supabaseScene);
          }
        } catch (supabaseError) {
          if (import.meta.env.DEV) {
            console.error('Expo scene loading failed.', supabaseError);
          }
          if (!isActive) {
            return;
          }

          if (import.meta.env.DEV) {
            setData(buildDevFallbackScene());
            return;
          }

          setData(buildProductionSafeFallbackScene());
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    data,
    isLoading,
  };
}
