export type ExpoMode = 'menu' | 'walk' | 'fly' | 'unreal';
export type ExpoQualityPreset = 'performance' | 'balanced' | 'quality';

export const EXPO_QUALITY_PRESETS = {
  performance: {
    enableBoulevardGrassClusters: false,
    enableBoulevardGroundScreens: true,
    enableFacadeScreens: true,
    enableGroundArtPass: true,
    enableFog: true,
    enablePromenadeTexture: false,
    enableSponsorBillboards: false,
    enableStreetEnvironmentLighting: true,
  },
  balanced: {
    enableBoulevardGrassClusters: true,
    enableBoulevardGroundScreens: true,
    enableFacadeScreens: true,
    enableGroundArtPass: true,
    enableFog: true,
    enablePromenadeTexture: true,
    enableSponsorBillboards: true,
    enableStreetEnvironmentLighting: true,
  },
  quality: {
    enableBoulevardGrassClusters: true,
    enableBoulevardGroundScreens: true,
    enableFacadeScreens: true,
    enableGroundArtPass: true,
    enableFog: true,
    enablePromenadeTexture: true,
    enableSponsorBillboards: true,
    enableStreetEnvironmentLighting: true,
  },
} as const;

export const EXPO_CITY_QUALITY_TIER: ExpoQualityPreset = 'balanced';
export const EXPO_DEBUG_DEFAULT = false;
export const EXPO_FEATURE_FLAGS = {
  enableAnalytics: true,
  enableBoulevardGrassClusters: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableBoulevardGrassClusters,
  enableBoulevardGroundScreens: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableBoulevardGroundScreens,
  enableFacadeScreens: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableFacadeScreens,
  enableGroundArtPass: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableGroundArtPass,
  enableLegacyCityFallback: false,
  enableSceneGlobalsDebug: false,
  enableSponsorBillboards: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableSponsorBillboards,
  enableStreetEnvironmentLighting: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableStreetEnvironmentLighting,
  enablePromenadeTexture: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enablePromenadeTexture,
  enableFog: EXPO_QUALITY_PRESETS[EXPO_CITY_QUALITY_TIER].enableFog,
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
    logo_url: null,
    posterUrl: null,
    heroAssetUrl: null,
    booth: {
      id: 'booth-warpala-platform',
      model_url: null,
      video_url: null,
      posterUrl: null,
      heroAssetUrl: null,
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
    logo_url: null,
    posterUrl: null,
    heroAssetUrl: null,
    booth: {
      id: 'booth-sponsor-concierge',
      model_url: null,
      video_url: null,
      posterUrl: null,
      heroAssetUrl: null,
      ctaLabel: 'Book Meeting',
      boothType: 'premium',
    },
  },
];

export const EXPO_MODE_COPY = {
  title: 'WARPALA',
  subtitle: 'INDUSTRIĀLĀ METAVERSE',
  publicLabel: 'Public / lightweight:',
  publicDescription: 'WALK LITE un DRONE VIEW atver stabilo Web3D pilsētu pārlūkā.',
  premiumLabel: 'Premium / Unreal:',
  premiumDescription: 'Pixel Streaming ieeja ir tikai viena, caur FULL UNREAL ENGINE CITY pogu.',
  fallbackLabel: 'Fallback:',
  fallbackDescription: 'ja premium straume nav pieejama, vari turpināt apskati Web3D pilsētā un ieiet atsevišķos booth room.',
  walkCta: '🚶 WALK LITE (WEB3D)',
  flyCta: '🦅 DRONE VIEW',
  premiumCta: '🎮 ENTER FULL UNREAL ENGINE CITY (PIXEL STREAM)',
  backToDashboard: '← BACK TO OS DASHBOARD',
  publicModeBadge: 'WEB3D PUBLIC MODE',
  exitToLobby: 'EXIT TO LOBBY',
  premiumStatusLabel: 'Premium Unreal status:',
  premiumGatewayLabel: 'Gateway:',
  premiumStreamerLabel: 'Streamer:',
  premiumTurnLabel: 'TURN/ICE:',
  premiumSessionLabel: 'Session:',
  premiumAvailable: 'Pieejams. Vari atvērt Unreal Pixel Streaming.',
  premiumDegraded: 'Premium Unreal gateway ir sasniedzams, bet sesija vēl nav release-ready. Web3D maršruts paliek primārais.',
  premiumConnecting: 'Pārbauda premium Unreal gateway...',
  premiumUnavailable: 'Premium Unreal šobrīd nav pieejams. Paliec Web3D režīmā un izmanto booth room kā fallback.',
  premiumGatewayUp: 'signaling gateway sasniedzams',
  premiumGatewayDown: 'signaling gateway nav sasniedzams',
  premiumStreamerReady: 'dzīvs streamer ir gatavs',
  premiumStreamerWaiting: 'gateway augšā, bet streamer vēl nav gatavs',
  premiumTurnConfigured: 'TURN konfigurēts',
  premiumTurnNotConfigured: 'TURN nav konfigurēts',
  premiumTurnUnknown: 'TURN statuss nav droši nosakāms',
  premiumSessionReady: 'single-instance sesija gatava',
  premiumSessionNotReady: 'single-instance sesija vēl nav gatava',
  premiumSessionUnknown: 'sesijas gatavība nav zināma',
  premiumUnavailableCta: 'PREMIUM UNREAL TEMPORARILY UNAVAILABLE',
  premiumDegradedCta: 'PREMIUM UNREAL DEGRADED',
  premiumConnectingCta: 'CHECKING PREMIUM UNREAL...',
  premiumServerLabel: 'Signaling route:',
  premiumStatusCheckedAt: 'Pārbaudīts:',
  premiumStatusWarningsLabel: 'Brīdinājumi:',
  premiumViewerConnecting: 'Pārbauda premium Unreal pieejamību...',
  premiumViewerUnavailable: 'Premium Unreal šobrīd nav pieejams.',
  premiumViewerDegraded: 'Premium Unreal ir degradētā stāvoklī. Turpini sponsoru maršrutu Web3D režīmā.',
  premiumViewerGatewayOnly: 'Gateway ir augšā, bet dzīvs streamer vēl nav pieejams.',
  premiumViewerFallback: 'Paliec Web3D fallback režīmā vai atgriezies lobby, lai turpinātu expo bez straumes.',
  premiumViewerDiscovering: 'Gaidu Unreal Engine straumeri...',
  premiumViewerSelectStreamer: 'Atrasti {count} kanāli. Izvēlies premium straumi.',
  premiumViewerConnected: 'Premium Unreal pieslēgts.',
  premiumViewerDisconnected: 'Premium Unreal savienojums pārtrūka.',
  premiumViewerConnectTo: 'Pieslēdzas pie {streamerId}...',
  premiumViewerLaunch: 'Palaist: {streamerId}',
} as const;

export const EXPO_SYNC_THROTTLE = 50;
