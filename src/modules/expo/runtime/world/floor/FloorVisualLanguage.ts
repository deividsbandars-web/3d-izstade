export type FloorVisualLanguageRole =
  | 'globalBase'
  | 'seamTransition'
  | 'arrivalAnchor'
  | 'sponsorZoneAnchor'
  | 'centerSpineGuide'
  | 'futureDemoArenaPlaza'
  | 'futureBoothPad'
  | 'futurePassportPath'
  | 'futureZoneBoundary';

export type FloorMaterialIntent =
  | 'globalBase'
  | 'seamTransition'
  | 'arrivalAnchor'
  | 'sponsorZoneAnchor'
  | 'centerSpineGuide';

export type FloorSurfaceTokenId =
  | 'cityStadiumSeamTransition'
  | 'sponsorBoulevardRightAnchor'
  | 'arrivalGateAnchor'
  | 'centerSpineGuide';

export type FloorRoleToken = {
  performanceIntent: string;
  purpose: string;
  visualIntent: string;
};

export type FloorMaterialIntentToken = {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
};

export type FloorSurfaceToken = {
  floorLanguageToken: FloorSurfaceTokenId;
  intent: string;
  isFutureExpandable: boolean;
  isVisualPolish: boolean;
  materialIntent: FloorMaterialIntent;
  role: FloorVisualLanguageRole;
};

export const FLOOR_ROLE_TOKENS: Record<FloorVisualLanguageRole, FloorRoleToken> = {
  arrivalAnchor: {
    performanceIntent: 'one static raycast-disabled plane; no texture, transparency, or dynamic shadow',
    purpose: 'First-impression entry pad that grounds the arrival moment.',
    visualIntent: 'Frame entry without becoming a busy graphic system.',
  },
  centerSpineGuide: {
    performanceIntent: 'one static raycast-disabled plane; no texture, transparency, or dynamic shadow',
    purpose: 'Subtle path cue from arrival toward the center/reactor axis.',
    visualIntent: 'Orientation guide, not the future Expo Passport route.',
  },
  futureBoothPad: {
    performanceIntent: 'reserved; should stay simple, pooled, and mobile-safe',
    purpose: 'Reserved role for later booth footprint unification.',
    visualIntent: 'Future booth pads must not obscure sponsor content or navigation.',
  },
  futureDemoArenaPlaza: {
    performanceIntent: 'reserved; should be planned with Demo Arena visibility and mobile tiers',
    purpose: 'Reserved role for a future Demo Arena plaza floor language.',
    visualIntent: 'Future arena floor should feel intentional, not like extra patches.',
  },
  futurePassportPath: {
    performanceIntent: 'reserved; no animated/texture-heavy pathing by default',
    purpose: 'Reserved role for later Expo Passport route markers.',
    visualIntent: 'Future route markers should be a product system, not ad-hoc strips.',
  },
  futureZoneBoundary: {
    performanceIntent: 'reserved; keep boundary markers low-cost and non-interactive by default',
    purpose: 'Reserved role for later zone ownership and boundary cues.',
    visualIntent: 'Future boundaries should clarify zones without clutter.',
  },
  globalBase: {
    performanceIntent: 'one simple base surface; no route/product metadata implied',
    purpose: 'Large neutral world foundation surface.',
    visualIntent: 'Neutral base that supports the city and should not dominate.',
  },
  seamTransition: {
    performanceIntent: 'one static raycast-disabled plane; no texture, transparency, or dynamic shadow',
    purpose: 'Soften the city-to-rear-campus seam.',
    visualIntent: 'Blend the transition without becoming a feature element.',
  },
  sponsorZoneAnchor: {
    performanceIntent: 'one static raycast-disabled plane; no texture, transparency, or dynamic shadow',
    purpose: 'Give sponsor zones commercial floor ownership.',
    visualIntent: 'Premium sponsor base, not a random patch.',
  },
};

export const FLOOR_MATERIAL_INTENTS: Record<FloorMaterialIntent, FloorMaterialIntentToken> = {
  arrivalAnchor: {
    color: '#909ba3',
    emissive: '#d8e4ec',
    emissiveIntensity: 0.011,
    metalness: 0.016,
    roughness: 0.92,
  },
  centerSpineGuide: {
    color: '#9aa5ad',
    emissive: '#d8e4ec',
    emissiveIntensity: 0.01,
    metalness: 0.016,
    roughness: 0.92,
  },
  globalBase: {
    color: 'visual-profile-ground-base',
    emissive: '#d8e4ec',
    emissiveIntensity: 0.016,
    metalness: 0.01,
    roughness: 0.96,
  },
  seamTransition: {
    color: '#89949d',
    emissive: '#d8e4ec',
    emissiveIntensity: 0.012,
    metalness: 0.015,
    roughness: 0.94,
  },
  sponsorZoneAnchor: {
    color: '#7f8b94',
    emissive: '#d8e4ec',
    emissiveIntensity: 0.01,
    metalness: 0.018,
    roughness: 0.92,
  },
};

export const FLOOR_SURFACE_TOKENS: Record<FloorSurfaceTokenId, FloorSurfaceToken> = {
  arrivalGateAnchor: {
    floorLanguageToken: 'arrivalGateAnchor',
    intent: FLOOR_ROLE_TOKENS.arrivalAnchor.purpose,
    isFutureExpandable: true,
    isVisualPolish: true,
    materialIntent: 'arrivalAnchor',
    role: 'arrivalAnchor',
  },
  centerSpineGuide: {
    floorLanguageToken: 'centerSpineGuide',
    intent: FLOOR_ROLE_TOKENS.centerSpineGuide.purpose,
    isFutureExpandable: true,
    isVisualPolish: true,
    materialIntent: 'centerSpineGuide',
    role: 'centerSpineGuide',
  },
  cityStadiumSeamTransition: {
    floorLanguageToken: 'cityStadiumSeamTransition',
    intent: FLOOR_ROLE_TOKENS.seamTransition.purpose,
    isFutureExpandable: false,
    isVisualPolish: true,
    materialIntent: 'seamTransition',
    role: 'seamTransition',
  },
  sponsorBoulevardRightAnchor: {
    floorLanguageToken: 'sponsorBoulevardRightAnchor',
    intent: FLOOR_ROLE_TOKENS.sponsorZoneAnchor.purpose,
    isFutureExpandable: true,
    isVisualPolish: true,
    materialIntent: 'sponsorZoneAnchor',
    role: 'sponsorZoneAnchor',
  },
};

export const FLOOR_LAYER_ORDER = {
  globalBase: 0,
  polishAnchor: 10,
  surfaceMarker: 20,
} as const;

// Future floor geometry should use these tokens first. Avoid ad-hoc plates:
// mobile-safe floors are simple, static, non-textured, non-transparent,
// non-shadow-casting, and raycast-disabled unless a product feature proves otherwise.
