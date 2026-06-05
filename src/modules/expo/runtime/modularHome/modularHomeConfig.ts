import type { Vector3Tuple } from 'three';

export type ModularHomeTemplateId = 'compactTimber40' | 'familyTimber80' | 'saunaCabin25';

export type ModularHomePreviewConfig = {
  basePriceLabel: string;
  basePrice: number;
  bathroomLabel: string;
  bedroomLabel: string;
  description: string;
  facts: readonly string[];
  id: string;
  interiorLabels: readonly string[];
  livingLabel: string;
  moduleScale: Vector3Tuple;
  name: string;
  position: Vector3Tuple;
  rotationY: number;
  shortLabel: string;
  sizeLabel: string;
  templateId: ModularHomeTemplateId;
};

export const DEFAULT_MODULAR_HOME_TEMPLATE_ID: ModularHomeTemplateId = 'compactTimber40';

export const MODULAR_HOME_TEMPLATES: Record<ModularHomeTemplateId, ModularHomePreviewConfig> = {
  compactTimber40: {
    basePrice: 38000,
    basePriceLabel: 'Base shell',
    bathroomLabel: '1 bathroom',
    bedroomLabel: '1 bedroom',
    description: 'A modular timber home concept for fast build and flexible layouts.',
    facts: ['40 m\u00b2', '1 bedroom', '1 bathroom', 'terrace-ready', 'configurable finish level'],
    id: 'timber-compact-40',
    interiorLabels: ['Living area', 'Bedroom module', 'Bathroom core', 'Terrace option'],
    livingLabel: 'living zone',
    moduleScale: [1.05, 2.4, 1.05],
    name: 'Compact Timber 40',
    position: [72, 0, 64],
    rotationY: -0.08,
    shortLabel: 'Compact',
    sizeLabel: '40 m\u00b2',
    templateId: 'compactTimber40',
  },
  familyTimber80: {
    basePrice: 72000,
    basePriceLabel: 'Base family shell',
    bathroomLabel: '1 bathroom',
    bedroomLabel: '2 bedrooms',
    description: 'A larger family timber module with two bedrooms and a more open living area.',
    facts: ['80 m\u00b2', '2 bedrooms', '1 bathroom', 'larger living area', 'family-ready layout'],
    id: 'timber-family-80',
    interiorLabels: ['Large living area', 'Bedroom 1', 'Bedroom 2', 'Bathroom core'],
    livingLabel: 'larger living area',
    moduleScale: [1.34, 2.4, 1.12],
    name: 'Family Timber 80',
    position: [72, 0, 64],
    rotationY: -0.08,
    shortLabel: 'Family',
    sizeLabel: '80 m\u00b2',
    templateId: 'familyTimber80',
  },
  saunaCabin25: {
    basePrice: 26000,
    basePriceLabel: 'Base cabin shell',
    bathroomLabel: 'service core',
    bedroomLabel: 'guest module',
    description: 'A compact sauna and guest cabin concept with terrace-ready outdoor use.',
    facts: ['25 m\u00b2', 'sauna/guest module', 'service core', 'terrace-ready', 'compact retreat'],
    id: 'sauna-cabin-25',
    interiorLabels: ['Sauna core', 'Guest lounge', 'Service zone', 'Terrace option'],
    livingLabel: 'guest lounge',
    moduleScale: [0.86, 2.25, 0.88],
    name: 'Sauna Cabin 25',
    position: [72, 0, 64],
    rotationY: -0.08,
    shortLabel: 'Sauna',
    sizeLabel: '25 m\u00b2',
    templateId: 'saunaCabin25',
  },
} as const;

export const MODULAR_HOME_TEMPLATE_OPTIONS = [
  { key: 'compactTimber40', label: 'Compact Timber 40' },
  { key: 'familyTimber80', label: 'Family Timber 80' },
  { key: 'saunaCabin25', label: 'Sauna Cabin 25' },
] as const satisfies readonly { key: ModularHomeTemplateId; label: string }[];

export const MODULAR_HOME_PREVIEW_CONFIG = MODULAR_HOME_TEMPLATES[DEFAULT_MODULAR_HOME_TEMPLATE_ID];

export function getModularHomeTemplate(templateId: ModularHomeTemplateId): ModularHomePreviewConfig {
  return MODULAR_HOME_TEMPLATES[templateId] ?? MODULAR_HOME_PREVIEW_CONFIG;
}
