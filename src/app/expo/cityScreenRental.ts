import {
  getExpoScreenInventorySlots,
  getExpoScreenSlotById,
  type ExpoScreenInventorySlot,
} from '../../shared/expo/screenInventory';

type CityScreenMapCoordinate = {
  mapXPercent: number;
  mapYPercent: number;
  routeHint: string;
  viewHint: string;
};

export const CITY_SCREEN_BUYER_STEPS = [
  {
    body: 'Pick the real city location, size and monthly price before you start.',
    number: '1',
    title: 'Choose the exact city screen',
  },
  {
    body: 'Add one clear message plus an image, video, or simple text card.',
    number: '2',
    title: 'Add what visitors will see',
  },
  {
    body: 'Send the request. Warpala confirms dates, checks the media, then publishes it.',
    number: '3',
    title: 'Submit for review',
  },
] as const;

export function getRentableCityScreenSlots() {
  return getExpoScreenInventorySlots().filter((slot) => slot.scope === 'city');
}

export function getCityScreenMapCoordinate(slot: ExpoScreenInventorySlot): CityScreenMapCoordinate {
  const coordinates: Record<string, CityScreenMapCoordinate> = {
    'city-center-spine-hero-wall': {
      mapXPercent: 50,
      mapYPercent: 26,
      routeHint: 'Main city spine, directly on the arrival walking line.',
      viewHint: 'Best for first-impression campaigns visitors see while entering the sponsor boulevard.',
    },
    'city-left-marquee-hero': {
      mapXPercent: 24,
      mapYPercent: 48,
      routeHint: 'Left sponsor district, beside the district marquee route.',
      viewHint: 'Best for district takeovers, product launches, and side-route discovery.',
    },
    'city-right-marquee-hero': {
      mapXPercent: 76,
      mapYPercent: 48,
      routeHint: 'Right sponsor district, near the high-traffic sponsor route.',
      viewHint: 'Best for sponsor campaigns that need strong side-district visibility.',
    },
    'city-sponsor-boulevard-right-screen': {
      mapXPercent: 64,
      mapYPercent: 72,
      routeHint: 'Sponsor boulevard, close to booth traffic and visitor decisions.',
      viewHint: 'Best for reinforcing a booth offer or driving visitors toward a sponsor profile.',
    },
  };

  return coordinates[slot.id] ?? {
    mapXPercent: slot.operatorZoneId.includes('left') ? 25 : slot.operatorZoneId.includes('right') ? 75 : 50,
    mapYPercent: slot.valueTier === 'landmark' ? 28 : slot.valueTier === 'hero' ? 48 : 70,
    routeHint: 'Visible from the sponsor boulevard walking route.',
    viewHint: 'Best for a clear sponsor message, offer, or campaign reminder.',
  };
}

export function getCityScreenVisualGuide(slot: ExpoScreenInventorySlot) {
  const coordinate = getCityScreenMapCoordinate(slot);
  return {
    ...coordinate,
    locationLabel: getCityScreenLocationLabel(slot),
    placementLabel: getCityScreenPlacementLabel(slot),
    runtimeSurfaceLabel: slot.runtimeSurfaceId || slot.runtimeAssignmentId || slot.id,
  };
}

export function getCityScreenMapPins() {
  return getRentableCityScreenSlots().map((slot) => ({
    id: slot.id,
    label: slot.label,
    monthlyPriceHintEur: slot.monthlyPriceHintEur,
    valueTier: slot.valueTier,
    visibilityRank: slot.visibilityRank,
    ...getCityScreenVisualGuide(slot),
  }));
}

export function getCityScreenBuyerSteps() {
  return CITY_SCREEN_BUYER_STEPS.map((step) => ({ ...step }));
}

export function buildCityScreenAdminPath(slotId: string) {
  const slot = getExpoScreenSlotById(slotId);
  if (!slot || slot.scope !== 'city') {
    return '/expo/admin?task=city-screen';
  }

  const params = new URLSearchParams({
    screen: slot.id,
    task: 'city-screen',
  });
  return `/expo/admin?${params.toString()}`;
}

export function getCityScreenAvailabilityLabel(slot: ExpoScreenInventorySlot) {
  if (slot.status === 'available') {
    return 'Available';
  }

  if (slot.status === 'reserved') {
    return 'Reserved';
  }

  return 'Preview only';
}

export function getCityScreenLocationLabel(slot: ExpoScreenInventorySlot) {
  const labels: Record<string, string> = {
    'center-spine': 'Center boulevard',
    'left-marquee': 'Left sponsor district',
    'right-marquee': 'Right sponsor district',
    'sponsor-boulevard-right': 'Sponsor boulevard',
  };

  return labels[slot.operatorZoneId] || 'Sponsor boulevard';
}

export function getCityScreenPlacementLabel(slot: ExpoScreenInventorySlot) {
  if (slot.valueTier === 'landmark') {
    return 'Landmark placement';
  }

  if (slot.valueTier === 'hero') {
    return 'High-visibility placement';
  }

  return 'Featured placement';
}
