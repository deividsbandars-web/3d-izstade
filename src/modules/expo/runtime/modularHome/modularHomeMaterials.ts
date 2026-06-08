import type {
  ModularHomeFacadeOption,
  ModularHomeFinishLevelOption,
  ModularHomeRoofOption,
} from './modularHomeConfigurator';

export type ModularHomeMaterialId =
  | 'natural-timber-siding'
  | 'dark-thermo-wood'
  | 'light-painted-facade'
  | 'metal-roof'
  | 'green-roof-placeholder'
  | 'interior-plywood'
  | 'bathroom-wet-core';

export type ModularHomeMaterialGroup =
  | 'facade'
  | 'roof'
  | 'interior'
  | 'wetCore';

export type ModularHomeMaterial = {
  id: ModularHomeMaterialId;
  label: string;
  group: ModularHomeMaterialGroup;
  baseColor: string;
  secondaryColor: string;
  accentColor: string;
  roughness: number;
  metalness: number;
  futureTextureNote: string;
  notes: string;
};

export const MODULAR_HOME_MATERIALS = [
  {
    id: 'natural-timber-siding',
    label: 'Natural timber siding',
    group: 'facade',
    baseColor: '#b98245',
    secondaryColor: '#9a6a3c',
    accentColor: '#f6d7a7',
    roughness: 0.84,
    metalness: 0.02,
    futureTextureNote: 'Future texture: vertical timber siding albedo/normal map.',
    notes: 'Baseline exterior package for timber modular homes.',
  },
  {
    id: 'dark-thermo-wood',
    label: 'Dark thermo wood',
    group: 'facade',
    baseColor: '#3b2a1d',
    secondaryColor: '#271a12',
    accentColor: '#d8b17c',
    roughness: 0.88,
    metalness: 0.02,
    futureTextureNote: 'Future texture: dark thermo wood siding with subtle grain.',
    notes: 'Premium darker exterior finish for stronger contrast in the city preview.',
  },
  {
    id: 'light-painted-facade',
    label: 'Light painted facade',
    group: 'facade',
    baseColor: '#eadcc8',
    secondaryColor: '#c9b79e',
    accentColor: '#7c4f2d',
    roughness: 0.82,
    metalness: 0.01,
    futureTextureNote: 'Future texture: painted timber cladding with low-contrast seams.',
    notes: 'Residential-friendly light exterior finish.',
  },
  {
    id: 'metal-roof',
    label: 'Metal roof',
    group: 'roof',
    baseColor: '#273449',
    secondaryColor: '#243246',
    accentColor: '#1e293b',
    roughness: 0.74,
    metalness: 0.08,
    futureTextureNote: 'Future texture: standing-seam metal roof map.',
    notes: 'Default low-maintenance roof material for flat and pitched roof previews.',
  },
  {
    id: 'green-roof-placeholder',
    label: 'Green roof placeholder',
    group: 'roof',
    baseColor: '#2f5137',
    secondaryColor: '#244229',
    accentColor: '#7bbf58',
    roughness: 0.86,
    metalness: 0.01,
    futureTextureNote: 'Future texture: sedum/green roof placeholder with drainage layer.',
    notes: 'Concept-only green roof material requiring engineering review.',
  },
  {
    id: 'interior-plywood',
    label: 'Interior plywood',
    group: 'interior',
    baseColor: '#d6b98b',
    secondaryColor: '#f8e6c7',
    accentColor: '#b88750',
    roughness: 0.82,
    metalness: 0.02,
    futureTextureNote: 'Future texture: light plywood wall/floor finish.',
    notes: 'Simple interior material for shell, standard and premium preview finishes.',
  },
  {
    id: 'bathroom-wet-core',
    label: 'Bathroom wet core',
    group: 'wetCore',
    baseColor: '#bae6fd',
    secondaryColor: '#dbeafe',
    accentColor: '#38bdf8',
    roughness: 0.68,
    metalness: 0.02,
    futureTextureNote: 'Future texture: wet-room panel and waterproof core finish.',
    notes: 'Bathroom/service core preview material.',
  },
] as const satisfies readonly ModularHomeMaterial[];

export const MODULAR_HOME_FACADE_MATERIAL_BY_OPTION = {
  naturalTimber: 'natural-timber-siding',
  darkThermoWood: 'dark-thermo-wood',
  lightPainted: 'light-painted-facade',
} as const satisfies Record<ModularHomeFacadeOption, ModularHomeMaterialId>;

export const MODULAR_HOME_ROOF_MATERIAL_BY_OPTION = {
  flat: 'metal-roof',
  pitched: 'metal-roof',
  greenRoofPlaceholder: 'green-roof-placeholder',
} as const satisfies Record<ModularHomeRoofOption, ModularHomeMaterialId>;

export const MODULAR_HOME_FINISH_MATERIALS_BY_OPTION = {
  shell: ['interior-plywood'],
  standard: ['interior-plywood', 'bathroom-wet-core'],
  premium: ['interior-plywood', 'bathroom-wet-core'],
} as const satisfies Record<ModularHomeFinishLevelOption, readonly ModularHomeMaterialId[]>;

export function getModularHomeMaterials(): readonly ModularHomeMaterial[] {
  return MODULAR_HOME_MATERIALS;
}

export function getModularHomeMaterial(id: string): ModularHomeMaterial | undefined {
  return MODULAR_HOME_MATERIALS.find((material) => material.id === id);
}

export function getModularHomeMaterialsByGroup(group: ModularHomeMaterialGroup): readonly ModularHomeMaterial[] {
  return MODULAR_HOME_MATERIALS.filter((material) => material.group === group);
}

export function getModularHomeFacadeMaterial(option: ModularHomeFacadeOption): ModularHomeMaterial {
  return getModularHomeMaterial(MODULAR_HOME_FACADE_MATERIAL_BY_OPTION[option]) ?? MODULAR_HOME_MATERIALS[0];
}

export function getModularHomeRoofMaterial(option: ModularHomeRoofOption): ModularHomeMaterial {
  return getModularHomeMaterial(MODULAR_HOME_ROOF_MATERIAL_BY_OPTION[option]) ?? MODULAR_HOME_MATERIALS[3];
}

export function getModularHomeFinishMaterials(option: ModularHomeFinishLevelOption): readonly ModularHomeMaterial[] {
  return MODULAR_HOME_FINISH_MATERIALS_BY_OPTION[option]
    .map((materialId) => getModularHomeMaterial(materialId))
    .filter((material): material is ModularHomeMaterial => Boolean(material));
}
