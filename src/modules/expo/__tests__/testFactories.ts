import type { ExpoSceneCompany } from '../types/scene.js';

export function createExpoSceneCompany(overrides: Partial<ExpoSceneCompany> & Pick<ExpoSceneCompany, 'id' | 'name'>): ExpoSceneCompany & { booth: ExpoSceneCompany['booth'] } {
  const { id, name, ...rest } = overrides;
  return {
    activeEmployees: 0,
    activityScore: 0,
    booth: null,
    boothType: 'standard',
    bookingUrl: null,
    ctaLabel: null,
    currentRevenue: 0,
    heroAssetUrl: null,
    id,
    logo_url: null,
    name,
    posterUrl: null,
    priority: 0,
    sectorId: null,
    sector_id: null,
    slug: null,
    sponsorTier: 'standard',
    tagline: null,
    website: null,
    ...rest,
  };
}
