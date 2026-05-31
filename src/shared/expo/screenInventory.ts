export type ExpoScreenSlotScope = 'booth' | 'city' | 'event';
export type ExpoScreenSlotStatus = 'available' | 'reserved' | 'preview-only';
export type ExpoScreenSlotValueTier = 'landmark' | 'hero' | 'premium' | 'standard';

export type ExpoScreenInventorySlot = {
  boothId?: string;
  id: string;
  label: string;
  monthlyPriceHintEur: number;
  operatorZoneId: string;
  packageFit: readonly string[];
  placementNotes: string;
  reservedByBoothId?: string;
  runtimeTargetId?: string;
  scope: ExpoScreenSlotScope;
  sizeLabel: string;
  status: ExpoScreenSlotStatus;
  supportsImage: boolean;
  supportsVideoPlaceholder: boolean;
  valueScore: number;
  valueTier: ExpoScreenSlotValueTier;
  visibilityRank: number;
};

export const EXPO_SCREEN_INVENTORY_SLOTS: readonly ExpoScreenInventorySlot[] = [
  {
    id: 'booth-sponsor-concierge-main-screen',
    boothId: 'sponsor-concierge',
    label: 'Sponsor Concierge booth main screen',
    monthlyPriceHintEur: 350,
    operatorZoneId: 'sponsor-boulevard-right',
    packageFit: ['Premium Booth'],
    placementNotes: 'Owned booth screen; best for sponsor offer, lead-gen CTA and meeting package content.',
    reservedByBoothId: 'sponsor-concierge',
    runtimeTargetId: 'booth-sponsor-concierge',
    scope: 'booth',
    sizeLabel: 'Large booth screen',
    status: 'reserved',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 72,
    valueTier: 'premium',
    visibilityRank: 3,
  },
  {
    id: 'booth-immersive-fabric-labs-main-screen',
    boothId: 'immersive-fabric-labs',
    label: 'Immersive Fabric Labs booth main screen',
    monthlyPriceHintEur: 220,
    operatorZoneId: 'right-marquee',
    packageFit: ['Standard Booth', 'Premium Booth'],
    placementNotes: 'Owned booth screen; best for product story, demo image and package request content.',
    reservedByBoothId: 'immersive-fabric-labs',
    runtimeTargetId: 'booth-immersive-fabric-labs',
    scope: 'booth',
    sizeLabel: 'Medium booth screen',
    status: 'reserved',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 58,
    valueTier: 'standard',
    visibilityRank: 5,
  },
  {
    id: 'city-center-spine-hero-wall',
    label: 'Center Spine hero wall',
    monthlyPriceHintEur: 950,
    operatorZoneId: 'center-spine',
    packageFit: ['Landmark Zone Sponsor', 'Launch Sponsor'],
    placementNotes: 'Main arrival-to-stadium axis screen; high sponsor visibility and navigation value.',
    runtimeTargetId: 'center-spine-hero-wall',
    scope: 'city',
    sizeLabel: 'Hero city wall',
    status: 'available',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 96,
    valueTier: 'landmark',
    visibilityRank: 1,
  },
  {
    id: 'city-right-marquee-hero',
    label: 'Right Marquee hero screen',
    monthlyPriceHintEur: 720,
    operatorZoneId: 'right-marquee',
    packageFit: ['Premium Booth', 'District Sponsor'],
    placementNotes: 'High-traffic right district screen near sponsor boulevard flow.',
    runtimeTargetId: 'right-marquee-hero-wall',
    scope: 'city',
    sizeLabel: 'Large city screen',
    status: 'available',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 86,
    valueTier: 'hero',
    visibilityRank: 2,
  },
  {
    id: 'city-left-marquee-hero',
    label: 'Left Marquee hero screen',
    monthlyPriceHintEur: 680,
    operatorZoneId: 'left-marquee',
    packageFit: ['Premium Booth', 'District Sponsor'],
    placementNotes: 'High-visibility district marquee for featured sponsor or campaign content.',
    runtimeTargetId: 'left-marquee-hero-wall',
    scope: 'city',
    sizeLabel: 'Large city screen',
    status: 'available',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 82,
    valueTier: 'hero',
    visibilityRank: 4,
  },
  {
    id: 'city-sponsor-boulevard-right-screen',
    label: 'Sponsor Boulevard right screen',
    monthlyPriceHintEur: 480,
    operatorZoneId: 'sponsor-boulevard-right',
    packageFit: ['Standard Booth', 'Premium Booth'],
    placementNotes: 'Good booth-adjacent upsell screen for sponsor route reinforcement.',
    runtimeTargetId: 'sponsor-boulevard-right-screen',
    scope: 'city',
    sizeLabel: 'District screen',
    status: 'available',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 68,
    valueTier: 'premium',
    visibilityRank: 6,
  },
  {
    id: 'event-demo-arena-main-stage',
    label: 'Demo Arena main stage screen',
    monthlyPriceHintEur: 1200,
    operatorZoneId: 'rear-campus-center',
    packageFit: ['Landmark Zone Sponsor', 'Demo Arena Sponsor'],
    placementNotes: 'Highest-value event surface for demo battles, stage sponsor slots and monthly event inventory.',
    runtimeTargetId: 'demo-arena-main-stage',
    scope: 'event',
    sizeLabel: 'Arena hero screen',
    status: 'preview-only',
    supportsImage: true,
    supportsVideoPlaceholder: true,
    valueScore: 100,
    valueTier: 'landmark',
    visibilityRank: 0,
  },
];

export function getExpoScreenInventorySlots() {
  return [...EXPO_SCREEN_INVENTORY_SLOTS].sort((left, right) => left.visibilityRank - right.visibilityRank);
}

export function getExpoScreenSlotById(slotId: string | null | undefined) {
  const normalized = String(slotId || '').trim();
  return EXPO_SCREEN_INVENTORY_SLOTS.find((slot) => slot.id === normalized) ?? null;
}

export function isValidExpoScreenSlotId(slotId: string | null | undefined) {
  return Boolean(getExpoScreenSlotById(slotId));
}

export function getAvailableExpoScreenSlots() {
  return getExpoScreenInventorySlots().filter((slot) => slot.status === 'available');
}

export function getExpoScreenSlotsForBooth(boothId: string | null | undefined) {
  const normalized = String(boothId || '').trim();
  if (!normalized) {
    return [];
  }

  return getExpoScreenInventorySlots().filter((slot) => (
    slot.boothId === normalized || slot.reservedByBoothId === normalized
  ));
}

export function getExpoScreenInventorySummary() {
  const slots = getExpoScreenInventorySlots();
  const availableSlots = slots.filter((slot) => slot.status === 'available');
  const reservedSlots = slots.filter((slot) => slot.status === 'reserved');
  const previewOnlySlots = slots.filter((slot) => slot.status === 'preview-only');

  return {
    availableCount: availableSlots.length,
    highestValueAvailableSlotId: availableSlots[0]?.id ?? null,
    previewOnlyCount: previewOnlySlots.length,
    reservedCount: reservedSlots.length,
    totalCount: slots.length,
  };
}
