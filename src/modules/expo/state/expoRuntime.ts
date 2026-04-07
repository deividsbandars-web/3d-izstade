export type ExpoMode = 'menu' | 'walk' | 'fly' | 'unreal';
export type ExpoQualityPreset = 'performance' | 'balanced' | 'quality';

function normalizeExpoDebugBoolean(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function resolveExpoDebugQueryFlag(paramName: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return normalizeExpoDebugBoolean(new URLSearchParams(window.location.search).get(paramName));
}

function normalizeExpoQualityPreset(value: string | null | undefined): ExpoQualityPreset | null {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'performance' || normalized === 'balanced' || normalized === 'quality') {
    return normalized;
  }

  return null;
}

function resolveExpoQualityPreset(): ExpoQualityPreset {
  const envPreset = normalizeExpoQualityPreset(import.meta.env?.VITE_EXPO_QUALITY_PRESET);
  if (envPreset) {
    return envPreset;
  }

  if (typeof window !== 'undefined') {
    const urlPreset = normalizeExpoQualityPreset(new URLSearchParams(window.location.search).get('expoQuality'));
    if (urlPreset) {
      return urlPreset;
    }

    const storedPreset = normalizeExpoQualityPreset(window.localStorage.getItem('warpala.expoQualityPreset'));
    if (storedPreset) {
      return storedPreset;
    }
  }

  return 'balanced';
}

export const EXPO_QUALITY_PRESETS = {
  performance: {
    enableAmbientMotionLayer: false,
    enableBoulevardGrassClusters: false,
    enableBoulevardGroundScreens: true,
    enableCuratedExpoProps: false,
    enableCuratedSkylineRing: false,
    enableDistrictAnchorNodes: false,
    enableDistrictLandmarks: false,
    enableEnhancedBoulevardDetail: false,
    enableFacadeScreens: true,
    enableFog: false,
    enableGroundArtPass: true,
    enableLocalizedLightPools: false,
    enablePremiumGroundTextures: false,
    enablePromenadeTexture: false,
    enableShowcaseSkylineDensity: false,
    enableSponsorBillboards: false,
    enableStreetEnvironmentLighting: false,
  },
  balanced: {
    enableAmbientMotionLayer: false,
    enableBoulevardGrassClusters: false,
    enableBoulevardGroundScreens: true,
    enableCuratedExpoProps: false,
    enableCuratedSkylineRing: false,
    enableDistrictAnchorNodes: false,
    enableDistrictLandmarks: false,
    enableEnhancedBoulevardDetail: false,
    enableFacadeScreens: true,
    enableFog: false,
    enableGroundArtPass: true,
    enableLocalizedLightPools: false,
    enablePremiumGroundTextures: false,
    enablePromenadeTexture: true,
    enableShowcaseSkylineDensity: false,
    enableSponsorBillboards: false,
    enableStreetEnvironmentLighting: false,
  },
  quality: {
    enableAmbientMotionLayer: false,
    enableBoulevardGrassClusters: false,
    enableBoulevardGroundScreens: true,
    enableCuratedExpoProps: true,
    enableCuratedSkylineRing: true,
    enableDistrictAnchorNodes: false,
    enableDistrictLandmarks: false,
    enableEnhancedBoulevardDetail: true,
    enableFacadeScreens: true,
    enableFog: true,
    enableGroundArtPass: true,
    enableLocalizedLightPools: true,
    enablePremiumGroundTextures: true,
    enablePromenadeTexture: true,
    enableShowcaseSkylineDensity: true,
    enableSponsorBillboards: true,
    enableStreetEnvironmentLighting: true,
  },
} as const;

export const EXPO_CITY_QUALITY_TIER: ExpoQualityPreset = resolveExpoQualityPreset();
export const EXPO_DEBUG_DEFAULT = false;
export const EXPO_FEATURE_FLAGS = {
  enableAmbientMotionLayer: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableAmbientMotionLayer,
  enableAnalytics: true,
  enableBoulevardGrassClusters: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableBoulevardGrassClusters,
  enableBoulevardGroundScreens: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableBoulevardGroundScreens,
  enableCuratedExpoProps: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableCuratedExpoProps,
  enableCuratedSkylineRing: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableCuratedSkylineRing,
  enableDistrictAnchorNodes: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableDistrictAnchorNodes,
  enableDistrictLandmarks: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableDistrictLandmarks,
  enableEnhancedBoulevardDetail: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableEnhancedBoulevardDetail,
  enableFacadeScreens: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableFacadeScreens,
  enableFog: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableFog,
  enableGroundArtPass: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableGroundArtPass,
  enableLegacyCityFallback: false,
  enableLocalizedLightPools: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableLocalizedLightPools,
  enablePremiumGroundTextures: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enablePremiumGroundTextures,
  enablePromenadeTexture: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enablePromenadeTexture,
  enableSceneGlobalsDebug: false,
  enableShowcaseSkylineDensity: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableShowcaseSkylineDensity,
  enableSponsorBillboards: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableSponsorBillboards,
  enableStreetEnvironmentLighting: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableStreetEnvironmentLighting,
} as const;

export const EXPO_SPATIAL_DEBUG_FLAGS = {
  disableArrivalReveal: resolveExpoDebugQueryFlag('expoDebugNoArrivalReveal'),
  disableBoothArchitectureKit: resolveExpoDebugQueryFlag('expoDebugNoBoothArchitectureKit'),
  disableCuratedSkylineRing: resolveExpoDebugQueryFlag('expoDebugNoCuratedSkylineRing'),
  disableDistrictAnchorNodes: resolveExpoDebugQueryFlag('expoDebugNoDistrictAnchorNodes'),
  disableExpoLandmarkLayer: resolveExpoDebugQueryFlag('expoDebugNoExpoLandmarkLayer'),
  showBoothColliderBoxes: resolveExpoDebugQueryFlag('expoDebugBoothColliders'),
  showSkylineBounds: resolveExpoDebugQueryFlag('expoDebugSkylineBounds'),
  showSpawnMarkers: resolveExpoDebugQueryFlag('expoDebugSpawn'),
  showWalkCorridor: resolveExpoDebugQueryFlag('expoDebugWalkCorridor'),
} as const;

export const EXPO_ASSET_URLS = [] as const;

export const FALLBACK_SECTORS = [
  { id: '1', name: 'Construction', color_theme: '#3b82f6', map_position: { x: 0, y: 0, z: -100 } },
  { id: '2', name: 'Technology', color_theme: '#10b981', map_position: { x: 0, y: 0, z: -300 } },
];

export const FALLBACK_COMPANIES = [
  { id: 'c1', name: 'BuildMaster SIA', sector_id: '1', website: 'https://warpala.com', booth: {} },
  { id: 'c2', name: 'TechCorp Global', sector_id: '2', website: 'https://warpala.com', booth: {} },
];

export const PRODUCTION_SAFE_SECTORS = [
  { id: 'arrival-core', name: 'Arrival Sponsors', color_theme: '#2563eb', map_position: { x: 0, y: 0, z: -80 } },
  { id: 'meetings', name: 'Meetings', color_theme: '#0f766e', map_position: { x: 0, y: 0, z: -180 } },
  { id: 'showcase-row', name: 'Showcase Row', color_theme: '#7c3aed', map_position: { x: 0, y: 0, z: -320 } },
];

export const PRODUCTION_SAFE_COMPANIES = [
  {
    id: 'warpala-platform',
    name: 'Warpala Platform',
    slug: 'warpala-platform',
    sector_id: 'arrival-core',
    sponsorTier: 'hero',
    boothType: 'hero',
    priority: 100,
    tagline: 'Platform overview, sponsor discovery, and live expo entry point.',
    website: 'https://warpala.com',
    bookingUrl: null,
    ctaLabel: null,
    logo_url: '/textures/expo-runtime/screen-placeholders-4k/vertical-9x16/screen_vertical_01.webp',
    posterUrl: '/textures/expo-runtime/hero-facade-screen-8k/hero_facade_screen_01.webp',
    heroAssetUrl: '/models/helix_bridge.glb',
    booth: {
      id: 'booth-warpala-platform',
      model_url: '/models/helix_bridge.glb',
      video_url: null,
      posterUrl: '/textures/expo-runtime/hero-facade-screen-8k/hero_facade_screen_01.webp',
      heroAssetUrl: '/models/helix_bridge.glb',
      ctaLabel: null,
      boothType: 'hero',
    },
  },
  {
    id: 'sponsor-concierge',
    name: 'Sponsor Concierge',
    slug: 'sponsor-concierge',
    sector_id: 'meetings',
    sponsorTier: 'gold',
    boothType: 'premium',
    priority: 80,
    tagline: 'Book sponsor meetings and navigate the boulevard without disruption.',
    website: 'https://warpala.com/contact',
    bookingUrl: 'https://warpala.com/contact',
    ctaLabel: 'Book Meeting',
    logo_url: '/textures/expo-runtime/screen-placeholders-4k/vertical-9x16/screen_vertical_02.webp',
    posterUrl: '/textures/expo-runtime/screen-placeholders-4k/horizontal-16x9/screen_horizontal_02.webp',
    heroAssetUrl: '/models/bridge_design.glb',
    booth: {
      id: 'booth-sponsor-concierge',
      model_url: '/models/bridge_design.glb',
      video_url: null,
      posterUrl: '/textures/expo-runtime/screen-placeholders-4k/horizontal-16x9/screen_horizontal_02.webp',
      heroAssetUrl: '/models/bridge_design.glb',
      ctaLabel: 'Book Meeting',
      boothType: 'premium',
    },
  },
  {
    id: 'immersive-fabric-labs',
    name: 'Immersive Fabric Labs',
    slug: 'immersive-fabric-labs',
    sector_id: 'showcase-row',
    sponsorTier: 'platinum',
    boothType: 'premium',
    priority: 76,
    tagline: 'Enterprise digital twin showcases, portfolio walls, and buyer-stage product demos.',
    website: 'https://warpala.com/showcase',
    bookingUrl: 'https://warpala.com/showcase',
    ctaLabel: 'Schedule Tour',
    logo_url: '/textures/expo-runtime/screen-placeholders-4k/vertical-9x16/screen_vertical_03.webp',
    posterUrl: '/textures/expo-runtime/screen-placeholders-4k/horizontal-16x9/screen_horizontal_03.webp',
    heroAssetUrl: '/models/6twelve.glb',
    booth: {
      id: 'booth-immersive-fabric-labs',
      model_url: '/models/6twelve.glb',
      video_url: null,
      posterUrl: '/textures/expo-runtime/screen-placeholders-4k/horizontal-16x9/screen_horizontal_03.webp',
      heroAssetUrl: '/models/6twelve.glb',
      ctaLabel: 'Schedule Tour',
      boothType: 'premium',
    },
  },
];

export const EXPO_MODE_COPY = {
  title: 'WARPALA',
  subtitle: 'INDUSTRIAL METAVERSE',
  publicLabel: 'Public / lightweight:',
  publicDescription: 'WALK LITE and DRONE VIEW open the stable Web3D city route.',
  premiumLabel: 'Premium / Unreal:',
  premiumDescription: 'Pixel Streaming stays optional and is entered only through FULL UNREAL ENGINE CITY.',
  fallbackLabel: 'Fallback:',
  fallbackDescription: 'If premium streaming is unavailable, continue in Web3D and enter sponsor rooms individually.',
  walkCta: 'WALK LITE (WEB3D)',
  flyCta: 'DRONE VIEW',
  premiumCta: 'ENTER FULL UNREAL ENGINE CITY (PIXEL STREAM)',
  backToDashboard: 'BACK TO OS DASHBOARD',
  publicModeBadge: 'WEB3D PUBLIC MODE',
  exitToLobby: 'EXIT TO LOBBY',
  premiumStatusLabel: 'Premium Unreal status:',
  premiumGatewayLabel: 'Gateway:',
  premiumStreamerLabel: 'Streamer:',
  premiumTurnLabel: 'TURN/ICE:',
  premiumSessionLabel: 'Session:',
  premiumAvailable: 'Available. You can open Unreal Pixel Streaming.',
  premiumDegraded: 'Premium Unreal gateway is reachable, but the session is not release-ready. Web3D remains primary.',
  premiumConnecting: 'Checking premium Unreal gateway...',
  premiumUnavailable: 'Premium Unreal is unavailable. Stay in Web3D mode and use sponsor rooms as fallback.',
  premiumGatewayUp: 'signaling gateway reachable',
  premiumGatewayDown: 'signaling gateway unreachable',
  premiumStreamerReady: 'live streamer ready',
  premiumStreamerWaiting: 'gateway up, streamer not ready yet',
  premiumTurnConfigured: 'TURN configured',
  premiumTurnNotConfigured: 'TURN not configured',
  premiumTurnUnknown: 'TURN status unknown',
  premiumSessionReady: 'single-instance session ready',
  premiumSessionNotReady: 'single-instance session not ready',
  premiumSessionUnknown: 'session readiness unknown',
  premiumUnavailableCta: 'PREMIUM UNREAL TEMPORARILY UNAVAILABLE',
  premiumDegradedCta: 'PREMIUM UNREAL DEGRADED',
  premiumConnectingCta: 'CHECKING PREMIUM UNREAL...',
  premiumServerLabel: 'Signaling route:',
  premiumStatusCheckedAt: 'Checked at:',
  premiumStatusWarningsLabel: 'Warnings:',
  premiumViewerConnecting: 'Checking premium Unreal availability...',
  premiumViewerUnavailable: 'Premium Unreal is unavailable.',
  premiumViewerDegraded: 'Premium Unreal is degraded. Continue the sponsor route in Web3D mode.',
  premiumViewerGatewayOnly: 'Gateway is up, but no live streamer is available yet.',
  premiumViewerFallback: 'Stay in Web3D fallback mode or return to the lobby to continue without streaming.',
  premiumViewerDiscovering: 'Waiting for Unreal Engine streamer...',
  premiumViewerSelectStreamer: 'Found {count} channels. Choose the premium stream.',
  premiumViewerConnected: 'Premium Unreal connected.',
  premiumViewerDisconnected: 'Premium Unreal connection dropped.',
  premiumViewerConnectTo: 'Connecting to {streamerId}...',
  premiumViewerLaunch: 'Launch: {streamerId}',
} as const;

export const EXPO_SYNC_THROTTLE = 50;


