export type SponsorTier = 'hero' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';

export type BoothType = 'hero' | 'premium' | 'standard' | 'poster';

export type ExpoSceneReleaseMode = 'sponsor-boulevard';

export const EXPO_SCENE_RELEASE_MODE: ExpoSceneReleaseMode = 'sponsor-boulevard';
export const EXPO_SCENE_CONTRACT_VERSION = 'expo-scene-v3-canonical';
export const EXPO_SCENE_CANONICAL_DISTRICTS = [
  'architecture',
  'construction',
  'materials',
  'design',
  'real_estate',
  'tech',
  'logistics',
] as const;

export interface ExpoSceneSector {
  color_theme: string | null;
  id: string;
  map_position: unknown;
  name: string;
}

export interface ExpoSceneBooth {
  boothType: BoothType;
  companyId: string;
  ctaLabel: string | null;
  featuredAssetDescription?: string | null;
  featuredAssetTitle?: string | null;
  featuredAssetType?: string | null;
  featuredAssetUrl?: string | null;
  heroAssetUrl: string | null;
  heroScreenImageUrl?: string | null;
  heroScreenSlotId?: string | null;
  heroScreenStatus?: string | null;
  heroScreenText?: string | null;
  heroScreenTitle?: string | null;
  heroScreenType?: string | null;
  heroScreenVideoUrl?: string | null;
  id: string;
  model_url: string | null;
  posterUrl: string | null;
  showroomEnabled?: boolean;
  slug: string | null;
  slotId?: string | null;
  video_url: string | null;
}

export interface ExpoSceneCompany {
  activeEmployees: number;
  activityScore: number;
  booth: ExpoSceneBooth | null;
  boothType: BoothType;
  bookingUrl: string | null;
  ctaLabel: string | null;
  currentRevenue: number;
  heroAssetUrl: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  posterUrl: string | null;
  priority: number;
  sectorId?: string | null;
  sector_id?: string | null;
  slug: string | null;
  slotId?: string | null;
  sponsorTier: SponsorTier;
  tagline: string | null;
  website: string | null;
}

export interface ExpoSceneContract {
  authPolicy: string;
  booths: ExpoSceneBooth[];
  cityInfo: {
    globalLocation: unknown;
    id: string;
    name: string;
    style: number;
  };
  companies: Omit<ExpoSceneCompany, 'booth'>[];
  generatedAt: string;
  releaseMode: ExpoSceneReleaseMode;
  sceneVersion: string;
  sectors: ExpoSceneSector[];
}

export interface ExpoSceneData {
  authPolicy?: string;
  cityInfo: ExpoSceneContract['cityInfo'] | null;
  companies: ExpoSceneCompany[];
  generatedAt: string | null;
  releaseMode: ExpoSceneReleaseMode;
  sceneVersion: string;
  sectors: ExpoSceneSector[];
}
