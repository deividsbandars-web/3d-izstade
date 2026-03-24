import { useEffect, useState } from 'react';
import { expoService } from '../../../services/expoService';
import { FALLBACK_COMPANIES, FALLBACK_SECTORS } from '../state/expoRuntime';

interface ExpoSceneData {
  sectors: any[];
  companies: any[];
}

function getPublicExpoSceneEndpoint() {
  if (typeof window === 'undefined') {
    return 'http://localhost/api/expo/scene';
  }

  return `${window.location.origin}/api/expo/scene`;
}

function normalizeBoothRelation(value: any) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  if (value && typeof value === 'object') {
    return value;
  }

  return null;
}

function normalizeCompanies(companies: any[] = []) {
  return companies.map((company) => ({
    ...company,
    sector_id: company.sector_id || company.sectorId || null,
    booth: normalizeBoothRelation(company.booth ?? company.booths),
  }));
}

function adaptBackendScenePayload(payload: any): ExpoSceneData {
  const boothsByCompanyId = new Map<string, any>();

  if (Array.isArray(payload?.booths)) {
    payload.booths.forEach((booth: any) => {
      const companyId = String(booth.companyId || booth.company_id || '');
      if (companyId) {
        boothsByCompanyId.set(companyId, booth);
      }
    });
  }

  const companies = Array.isArray(payload?.companies)
    ? payload.companies.map((company: any) => ({
        ...company,
        sector_id: company.sector_id || company.sectorId || null,
        booth: boothsByCompanyId.get(String(company.id)) || null,
      }))
    : [];

  const sectors = Array.isArray(payload?.sectors) ? payload.sectors : [];

  return { sectors, companies };
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
    sectors,
    companies: normalizeCompanies(companies),
  };
}

function buildFallbackScene(): ExpoSceneData {
  return {
    sectors: FALLBACK_SECTORS,
    companies: normalizeCompanies(FALLBACK_COMPANIES),
  };
}

export function useExpoSceneData() {
  const [data, setData] = useState<ExpoSceneData>({ sectors: [], companies: [] });
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
          console.warn('Expo scene backend contract unavailable, falling back to direct Supabase client access.', backendError);
        }

        try {
          const supabaseScene = await loadFromSupabaseService();
          if (isActive) {
            setData(supabaseScene);
          }
        } catch (supabaseError) {
          console.error('Using fallback expo data due to scene loading error:', supabaseError);
          if (isActive) {
            setData(buildFallbackScene());
          }
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
