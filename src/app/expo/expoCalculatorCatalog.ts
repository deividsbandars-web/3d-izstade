import type {
  BoothSlotAvailabilityRecord,
  BoothSlotBand,
  BoothSlotKind,
} from './boothSlotAvailability';

export type ExpoCalculatorIndustry =
  | 'building-shell'
  | 'building-systems'
  | 'interior'
  | 'outdoor'
  | 'visual-sales';

export type ExpoCalculatorCatalogItem = {
  accent: string;
  boothFit: {
    bands: BoothSlotBand[];
    kinds?: BoothSlotKind[];
    screenClasses?: BoothSlotAvailabilityRecord['screenClass'][];
  };
  cityZoneLabel: string;
  id: string;
  industry: ExpoCalculatorIndustry;
  kioskPosition: [number, number, number];
  kioskRotationY: number;
  route: string;
  shortTitle: string;
  summary: string;
  title: string;
};

export type ExpoCalculatorMapPin = {
  accent: string;
  id: string;
  mapXPercent: number;
  mapYPercent: number;
  position: [number, number, number];
  route: string;
  shortTitle: string;
  title: string;
  zoneLabel: string;
};

const EXPO_CALCULATOR_CATALOG: ExpoCalculatorCatalogItem[] = [
  {
    accent: '#38bdf8',
    boothFit: {
      bands: ['arrival', 'showcase'],
      kinds: ['hero', 'endcap'],
      screenClasses: ['landmark', 'large-format'],
    },
    cityZoneLabel: 'Arrival build lane',
    id: 'roof',
    industry: 'building-shell',
    kioskPosition: [-112, 0, -72],
    kioskRotationY: 0.62,
    route: '/roof-cost-calculator',
    shortTitle: 'Roof',
    summary: 'Roof material, structure, drainage and labor budget for construction sponsors.',
    title: 'Roof estimate',
  },
  {
    accent: '#f97316',
    boothFit: {
      bands: ['showcase', 'discovery'],
      kinds: ['standard', 'endcap'],
      screenClasses: ['presentation', 'large-format'],
    },
    cityZoneLabel: 'Systems court',
    id: 'heating',
    industry: 'building-systems',
    kioskPosition: [-62, 0, -118],
    kioskRotationY: 0.28,
    route: '/heating-cost-calculator',
    shortTitle: 'Heating',
    summary: 'Heating systems, radiators, heat pumps and automation as a booth lead hook.',
    title: 'Heating systems',
  },
  {
    accent: '#22c55e',
    boothFit: {
      bands: ['showcase', 'discovery'],
      kinds: ['hero', 'standard'],
      screenClasses: ['presentation', 'support'],
    },
    cityZoneLabel: 'Construction core',
    id: 'foundation',
    industry: 'building-shell',
    kioskPosition: [-16, 0, -156],
    kioskRotationY: 0,
    route: '/foundation-cost-calculator',
    shortTitle: 'Foundation',
    summary: 'Concrete, reinforcement and excavation estimates for early-stage project demand.',
    title: 'Foundation estimate',
  },
  {
    accent: '#0ea5e9',
    boothFit: {
      bands: ['arrival', 'media'],
      kinds: ['endcap', 'standard'],
      screenClasses: ['presentation', 'large-format'],
    },
    cityZoneLabel: 'Facade route',
    id: 'windows',
    industry: 'building-shell',
    kioskPosition: [56, 0, -96],
    kioskRotationY: -0.34,
    route: '/windows-calculator',
    shortTitle: 'Windows',
    summary: 'Window, balcony door and mounting estimates that fit renovation sponsor booths.',
    title: 'Windows and doors',
  },
  {
    accent: '#14b8a6',
    boothFit: {
      bands: ['media', 'showcase'],
      kinds: ['hero', 'endcap'],
      screenClasses: ['landmark', 'large-format'],
    },
    cityZoneLabel: 'Facade route',
    id: 'facade',
    industry: 'building-shell',
    kioskPosition: [118, 0, -132],
    kioskRotationY: -0.56,
    route: '/facade-calculator',
    shortTitle: 'Facade',
    summary: 'Insulation, finishing, scaffold and facade renewal calculator for visible booths.',
    title: 'Facade and insulation',
  },
  {
    accent: '#06b6d4',
    boothFit: {
      bands: ['discovery', 'showcase'],
      kinds: ['standard', 'endcap'],
      screenClasses: ['support', 'presentation'],
    },
    cityZoneLabel: 'Service lane',
    id: 'plumbing',
    industry: 'building-systems',
    kioskPosition: [24, 0, -194],
    kioskRotationY: -0.12,
    route: '/plumbing-calculator',
    shortTitle: 'Plumbing',
    summary: 'Bathroom, kitchen and utility connection estimates for service sponsor leads.',
    title: 'Plumbing estimate',
  },
  {
    accent: '#a78bfa',
    boothFit: {
      bands: ['media', 'discovery'],
      kinds: ['standard', 'hero'],
      screenClasses: ['presentation', 'support'],
    },
    cityZoneLabel: 'Interior court',
    id: 'interior',
    industry: 'interior',
    kioskPosition: [-126, 0, -172],
    kioskRotationY: 0.72,
    route: '/renovation-cost-calculator',
    shortTitle: 'Interior',
    summary: 'Room renovation estimates for booths selling fit-out, floors, walls and project work.',
    title: 'Interior renovation',
  },
  {
    accent: '#6366f1',
    boothFit: {
      bands: ['arrival', 'media'],
      kinds: ['hero', 'endcap'],
      screenClasses: ['landmark', 'large-format', 'presentation'],
    },
    cityZoneLabel: 'Web3D demo plaza',
    id: 'visuals',
    industry: 'visual-sales',
    kioskPosition: [0, 0, -52],
    kioskRotationY: 0,
    route: '/visuals-calculator',
    shortTitle: '3D demo',
    summary: '3D render, Web3D prototype and expo booth estimate for visual sales teams.',
    title: '3D and Web3D demo',
  },
  {
    accent: '#f59e0b',
    boothFit: {
      bands: ['discovery', 'arrival'],
      kinds: ['standard', 'endcap'],
      screenClasses: ['support', 'presentation'],
    },
    cityZoneLabel: 'Outdoor works',
    id: 'paving',
    industry: 'outdoor',
    kioskPosition: [132, 0, -190],
    kioskRotationY: -0.78,
    route: '/paving-calculator',
    shortTitle: 'Paving',
    summary: 'Yard, driveway and commercial paving estimates for outdoor service booths.',
    title: 'Paving and yard',
  },
  {
    accent: '#64748b',
    boothFit: {
      bands: ['discovery'],
      kinds: ['standard'],
      screenClasses: ['support', 'presentation'],
    },
    cityZoneLabel: 'Outdoor works',
    id: 'fence',
    industry: 'outdoor',
    kioskPosition: [-86, 0, -226],
    kioskRotationY: 0.42,
    route: '/fence-calculator',
    shortTitle: 'Fence',
    summary: 'Fence, gate and site boundary estimates for practical lead qualification.',
    title: 'Fence and gates',
  },
];

function clampPercent(value: number) {
  return Math.min(Math.max(Math.round(value), 5), 95);
}

function calculateRecommendationScore(item: ExpoCalculatorCatalogItem, slot: BoothSlotAvailabilityRecord) {
  let score = 0;

  if (item.boothFit.bands.includes(slot.band)) {
    score += 5;
  }
  if (item.boothFit.kinds?.includes(slot.kind)) {
    score += 2;
  }
  if (item.boothFit.screenClasses?.includes(slot.screenClass)) {
    score += 2;
  }
  if (slot.tier === 'hero' && (item.industry === 'visual-sales' || item.boothFit.kinds?.includes('hero'))) {
    score += 2;
  }
  if (slot.lane === 'center' && item.industry === 'visual-sales') {
    score += 1;
  }

  return score;
}

export function getExpoCalculatorCatalog() {
  return EXPO_CALCULATOR_CATALOG;
}

export function getRecommendedExpoCalculatorsForBooth(slot: BoothSlotAvailabilityRecord) {
  const scored = EXPO_CALCULATOR_CATALOG
    .map((item) => ({ item, score: calculateRecommendationScore(item, slot) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title));

  return (scored.length > 0 ? scored.map((entry) => entry.item) : EXPO_CALCULATOR_CATALOG).slice(0, 5);
}

export function getExpoCalculatorMapPins(): ExpoCalculatorMapPin[] {
  return EXPO_CALCULATOR_CATALOG.map((item) => ({
    accent: item.accent,
    id: item.id,
    mapXPercent: clampPercent(50 + (item.kioskPosition[0] / 150) * 28),
    mapYPercent: clampPercent(50 + (item.kioskPosition[2] / 240) * 42),
    position: item.kioskPosition,
    route: item.route,
    shortTitle: item.shortTitle,
    title: item.title,
    zoneLabel: item.cityZoneLabel,
  }));
}
