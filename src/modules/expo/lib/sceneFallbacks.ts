import { normalizeBooth, normalizeCompany, normalizeSector } from './sceneContract';
import type { ExpoSceneData, ExpoSceneReleaseMode } from '../types/scene';
import {
  FALLBACK_COMPANIES,
  FALLBACK_SECTORS,
  PRODUCTION_SAFE_COMPANIES,
  PRODUCTION_SAFE_SECTORS,
} from '../state/expoRuntime';

function buildSceneFromSeed(
  companies: any[],
  sectors: any[],
  sceneVersion: string
): ExpoSceneData {
  return {
    authPolicy: undefined,
    cityInfo: null,
    companies: companies.map((company: any) => normalizeCompany(company, normalizeBooth(company?.booth ?? company?.booths, company))),
    generatedAt: null,
    releaseMode: 'sponsor-boulevard' satisfies ExpoSceneReleaseMode,
    sceneVersion,
    sectors: sectors.map(normalizeSector),
  };
}

export function buildDevFallbackScene(): ExpoSceneData {
  return buildSceneFromSeed(FALLBACK_COMPANIES, FALLBACK_SECTORS, 'expo-scene-dev-fallback');
}

export function buildProductionSafeFallbackScene(): ExpoSceneData {
  return buildSceneFromSeed(PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS, 'expo-scene-production-safe-fallback');
}
