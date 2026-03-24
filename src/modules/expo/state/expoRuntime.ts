export type ExpoMode = 'menu' | 'walk' | 'fly' | 'unreal';
export const EXPO_CITY_QUALITY_TIER = 'balanced' as const;

export const EXPO_ASSET_URLS = [
  '/models/free_london_kinnaird_house.glb',
  '/models/free__atlanta_corperate_office_building.glb',
  '/models/european_buildings_asset_pack_3.glb',
  '/models/american_road.glb',
  '/models/american_road_intersection.glb',
  '/models/victorian_street_lamp.glb',
  '/models/trees_in_the_park_anthropos.glb',
] as const;

export const FALLBACK_SECTORS = [
  { id: '1', name: 'Construction', color_theme: '#3b82f6', map_position: { x: 0, y: 0, z: -100 } },
  { id: '2', name: 'Technology', color_theme: '#10b981', map_position: { x: 0, y: 0, z: -300 } },
];

export const FALLBACK_COMPANIES = [
  { id: 'c1', name: 'BuildMaster SIA', sector_id: '1', website: 'https://warpala.com', booth: {} },
  { id: 'c2', name: 'TechCorp Global', sector_id: '2', website: 'https://warpala.com', booth: {} },
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
  premiumConnectingCta: 'CHECKING PREMIUM UNREAL...',
  premiumServerLabel: 'Signaling route:',
  premiumStatusCheckedAt: 'Pārbaudīts:',
  premiumStatusWarningsLabel: 'Brīdinājumi:',
  premiumViewerConnecting: 'Pārbauda premium Unreal pieejamību...',
  premiumViewerUnavailable: 'Premium Unreal šobrīd nav pieejams.',
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
