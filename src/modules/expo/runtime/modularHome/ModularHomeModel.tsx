import { Html } from '@react-three/drei';
import type { Vector3Tuple } from 'three';
import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  getModularHomeConfigSummary,
  MODULAR_HOME_FACADE_BOARD_ORIENTATION_VISUALS,
  MODULAR_HOME_FACADE_BOARD_WIDTH_VISUALS,
  MODULAR_HOME_FACADE_VISUALS,
  MODULAR_HOME_FINISH_LEVEL_VISUALS,
  MODULAR_HOME_FLOOR_FINISH_VISUALS,
  MODULAR_HOME_FURNITURE_PACKAGE_VISUALS,
  MODULAR_HOME_INTERIOR_WALL_FINISH_VISUALS,
  MODULAR_HOME_DOOR_PACKAGE_VISUALS,
  MODULAR_HOME_DOOR_PLACEMENT_VISUALS,
  MODULAR_HOME_ROOF_EDGE_COLOR_VISUALS,
  MODULAR_HOME_ROOF_VISUALS,
  MODULAR_HOME_TERRACE_VISUALS,
  MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS,
  MODULAR_HOME_WINDOW_PACKAGE_VISUALS,
  MODULAR_HOME_WINDOW_PLACEMENT_VISUALS,
  type ModularHomeDoorPackageVisual,
  type ModularHomeDoorPlacementVisual,
  type ModularHomeConfiguratorState,
  type ModularHomeFacadeBoardOrientationVisual,
  type ModularHomeFacadeBoardWidthVisual,
  type ModularHomeFinishLevelOption,
  type ModularHomeFurnitureToggleKey,
  type ModularHomeViewModeOption,
  type ModularHomeWindowPackageVisual,
  type ModularHomeWindowPlacementVisual,
  useModularHomeConfigurator,
  useModularHomeViewMode,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';
import {
  getModularHomeProductForConfig,
  getModularHomeLayoutVariantForConfig,
  getModulesForConfig,
  type ModularHomeLayoutVariant,
  type ModularHomeModule,
  type ModularHomeModuleId,
  type ModularHomeProduct,
} from './modularHomeProducts';

const DECK_COLOR = '#8b5a2b';
const FOUNDATION_COLOR = '#7c8591';
const BATHROOM_CORE_MARKER_COLOR = '#38bdf8';
const FACADE_BOARD_LINE_COLOR = '#2a1d14';
const FLOORPLAN_BOUNDARY_COLOR = '#e0f2fe';
const FLOORPLAN_DIMENSION_COLOR = '#fbbf24';
const FLOORPLAN_DOOR_MARKER_COLOR = '#f59e0b';
const FLOORPLAN_WINDOW_MARKER_COLOR = '#38bdf8';
const INTERIOR_FINISH_LINE_COLOR = '#8a5f33';
const KITCHEN_MARKER_COLOR = '#fbbf24';
const PANEL_SEAM_COLOR = '#1f2937';
const SEAM_COLOR = '#0f172a';
const TERRACE_BOARD_GAP_COLOR = '#3f2616';
const MODULE_UNIT_SCALE = 8;

const MODULE_COLORS = {
  bathroomCore: '#bfdbfe',
  bedroom: '#fde68a',
  living: '#8eead2',
  sauna: '#fbbf24',
  technical: '#c4b5fd',
} as const;

const INTERIOR_ZONE_COLORS = {
  bathroom: '#bae6fd',
  bedroom: '#fde68a',
  changing: '#f9a8d4',
  entrance: '#fdba74',
  living: '#86efac',
  sauna: '#fbbf24',
  storage: '#c4b5fd',
  terrace: '#bbf7d0',
} as const;

const FURNITURE_COLORS = {
  bathroomBlock: '#e0f2fe',
  bed: '#fef3c7',
  kitchen: '#cbd5e1',
  premiumAccent: '#fbbf24',
  saunaBench: '#d97706',
  sofa: '#0f766e',
  table: '#7c2d12',
} as const;

type ModularHomeInteriorPackage =
  | 'emptyShell'
  | 'standardFurnishedPreview'
  | 'premiumInteriorPreview';

const INTERIOR_PACKAGE_BY_FINISH_LEVEL = {
  premium: 'premiumInteriorPreview',
  shell: 'emptyShell',
  standard: 'standardFurnishedPreview',
} as const satisfies Record<ModularHomeFinishLevelOption, ModularHomeInteriorPackage>;

type ModuleLayoutBlock = {
  depth: number;
  label: string;
  module: ModularHomeModule;
  moduleInstanceId: string;
  tone: string;
  width: number;
  x: number;
  z: number;
};

type FootprintBounds = {
  centerX: number;
  centerZ: number;
  depth: number;
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
  width: number;
};

type InteriorPlanZone = {
  areaM2: number;
  depth: number;
  label: string;
  tone: string;
  width: number;
  x: number;
  z: number;
  zoneId: string;
};

type InteriorWallSegment = {
  depth: number;
  height: number;
  wallId: string;
  width: number;
  x: number;
  z: number;
};

type InteriorPlan = {
  walls: readonly InteriorWallSegment[];
  zones: readonly InteriorPlanZone[];
};

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatFloorplanArea(areaM2: number): string {
  const rounded = roundOneDecimal(areaM2);
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} m²`;
}

function formatFloorplanDimension(lengthM: number): string {
  const rounded = roundOneDecimal(lengthM);
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} m`;
}

function formatFloorplanDimensionPair(width: number, depth: number): string {
  return `${formatFloorplanDimension(width / MODULE_UNIT_SCALE)} × ${formatFloorplanDimension(depth / MODULE_UNIT_SCALE)}`;
}

function getModuleSize(module: ModularHomeModule) {
  return {
    depth: module.dimensions.lengthM * MODULE_UNIT_SCALE,
    width: module.dimensions.widthM * MODULE_UNIT_SCALE,
  };
}

function getModule(modules: readonly ModularHomeModule[], id: ModularHomeModuleId): ModularHomeModule | undefined {
  return modules.find((module) => module.id === id);
}

function compactLabel(module: ModularHomeModule, fallback: string): string {
  if (module.type === 'bathroomCore') {
    return 'Bathroom core';
  }
  if (module.type === 'living') {
    return fallback.includes('Sauna') ? 'Sauna core' : 'Living module';
  }
  if (module.type === 'bedroom') {
    return fallback;
  }
  return fallback;
}

function createModuleLayout(product: ModularHomeProduct, modules: readonly ModularHomeModule[]): readonly ModuleLayoutBlock[] {
  const blocks: ModuleLayoutBlock[] = [];
  const addBlock = (id: ModularHomeModuleId, moduleInstanceId: string, label: string, x: number, z: number, tone: string) => {
    const module = getModule(modules, id);
    if (!module) {
      return;
    }
    const size = getModuleSize(module);
    blocks.push({
      depth: size.depth,
      label: compactLabel(module, label),
      module,
      moduleInstanceId,
      tone,
      width: size.width,
      x,
      z,
    });
  };

  if (product.id === 'family-timber-80') {
    addBlock('family-living-module', 'family-living-module-main', 'Living module', 0, 4, MODULE_COLORS.living);
    addBlock('family-bedroom-module', 'family-bedroom-module-left', 'Bedroom module A', -21, -36, MODULE_COLORS.bedroom);
    addBlock('family-bedroom-module', 'family-bedroom-module-right', 'Bedroom module B', 13, -36, MODULE_COLORS.bedroom);
    addBlock('bathroom-core-module', 'bathroom-core-module-family', 'Bathroom core', 38, -36, MODULE_COLORS.bathroomCore);
    return blocks;
  }

  if (product.id === 'sauna-cabin-25') {
    addBlock('sauna-core-module', 'sauna-core-module-main', 'Sauna core', -8, 2, MODULE_COLORS.sauna);
    addBlock('bathroom-core-module', 'bathroom-core-module-sauna', 'Service core', 19, -16, MODULE_COLORS.bathroomCore);
    return blocks;
  }

  addBlock('compact-living-module', 'compact-living-module-main', 'Living module', -7, 4, MODULE_COLORS.living);
  addBlock('compact-bedroom-module', 'compact-bedroom-module-main', 'Bedroom module', -16, -28, MODULE_COLORS.bedroom);
  addBlock('bathroom-core-module', 'bathroom-core-module-compact', 'Bathroom core', 17, -28, MODULE_COLORS.bathroomCore);
  return blocks;
}

function getBlockByInstance(
  blocks: readonly ModuleLayoutBlock[],
  moduleInstanceId: string,
): ModuleLayoutBlock | undefined {
  return blocks.find((block) => block.moduleInstanceId === moduleInstanceId);
}

function createZoneInBlock(
  block: ModuleLayoutBlock,
  zoneId: string,
  label: string,
  tone: string,
  relativeX: number,
  relativeZ: number,
  widthScale: number,
  depthScale: number,
): InteriorPlanZone {
  const width = block.width * widthScale;
  const depth = block.depth * depthScale;
  return {
    areaM2: roundOneDecimal((width / MODULE_UNIT_SCALE) * (depth / MODULE_UNIT_SCALE)),
    depth,
    label,
    tone,
    width,
    x: block.x + block.width * relativeX,
    z: block.z + block.depth * relativeZ,
    zoneId,
  };
}

function createWall(
  wallId: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  height = 2.35,
): InteriorWallSegment {
  return {
    depth,
    height,
    wallId,
    width,
    x,
    z,
  };
}

function getInteriorZoneLabel(
  layoutVariant: ModularHomeLayoutVariant | null,
  zoneKey: string,
  fallback: string,
): string {
  if (!layoutVariant) {
    return fallback;
  }

  const labelsByVariant: Partial<Record<string, Record<string, string>>> = {
    guestCabin: {
      saunaPrimary: 'Guest rest area',
      saunaSecondary: 'Compact kitchenette',
      saunaService: 'Washroom / service',
    },
    largeLiving: {
      familyBedroomA: 'Bedroom suite',
      familyBedroomB: 'Guest room',
      familyLiving: 'Large living / kitchen',
      familyStorage: 'Utility storage',
    },
    officeCabin: {
      compactBedroom: 'Office / guest room',
      compactLiving: 'Living / work lounge',
      compactStorage: 'Entry storage',
    },
    openStudio: {
      compactBedroom: 'Sleeping nook',
      compactLiving: 'Studio living / sleep',
      compactStorage: 'Entry storage',
    },
    saunaOnly: {
      saunaPrimary: 'Sauna room',
      saunaSecondary: 'Changing zone',
      saunaService: 'Shower / service core',
    },
    saunaRestRoom: {
      saunaPrimary: 'Sauna / rest area',
      saunaSecondary: 'Changing zone',
      saunaService: 'Service core',
    },
    threeBedroomCompact: {
      familyBedroomA: 'Bedroom 1',
      familyBedroomB: 'Bedroom 2',
      familyLiving: 'Compact living / kitchen',
      familyStorage: 'Compact bedroom / office',
    },
    twoBedroom: {
      familyBedroomA: 'Bedroom 1',
      familyBedroomB: 'Bedroom 2',
      familyLiving: 'Living / kitchen',
      familyStorage: 'Technical / storage',
    },
  };

  return labelsByVariant[layoutVariant.id]?.[zoneKey] ?? fallback;
}

function createInteriorPlan(
  product: ModularHomeProduct,
  blocks: readonly ModuleLayoutBlock[],
  bounds: FootprintBounds,
  layoutVariant: ModularHomeLayoutVariant | null,
  terraceDepth: number,
  terraceEnabled: boolean,
): InteriorPlan {
  const zones: InteriorPlanZone[] = [];
  const walls: InteriorWallSegment[] = [];

  if (product.id === 'family-timber-80') {
    const living = getBlockByInstance(blocks, 'family-living-module-main');
    const bedroomA = getBlockByInstance(blocks, 'family-bedroom-module-left');
    const bedroomB = getBlockByInstance(blocks, 'family-bedroom-module-right');
    const bathroom = getBlockByInstance(blocks, 'bathroom-core-module-family');

    if (living) {
      zones.push(createZoneInBlock(living, 'family-living-kitchen', getInteriorZoneLabel(layoutVariant, 'familyLiving', 'Living / kitchen'), INTERIOR_ZONE_COLORS.living, -0.08, 0.03, 0.78, 0.66));
      zones.push(createZoneInBlock(living, 'family-technical-storage', getInteriorZoneLabel(layoutVariant, 'familyStorage', 'Technical / storage'), INTERIOR_ZONE_COLORS.storage, 0.34, -0.32, 0.28, 0.24));
      walls.push(createWall('family-storage-side-wall', living.x + living.width * 0.2, living.z - living.depth * 0.29, 0.64, living.depth * 0.33));
      walls.push(createWall('family-storage-front-wall', living.x + living.width * 0.34, living.z - living.depth * 0.15, living.width * 0.28, 0.64));
    }

    if (bedroomA) {
      zones.push(createZoneInBlock(bedroomA, 'family-bedroom-1', getInteriorZoneLabel(layoutVariant, 'familyBedroomA', 'Bedroom 1'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
    }

    if (bedroomB) {
      zones.push(createZoneInBlock(bedroomB, 'family-bedroom-2', getInteriorZoneLabel(layoutVariant, 'familyBedroomB', 'Bedroom 2'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
    }

    if (bathroom) {
      zones.push(createZoneInBlock(bathroom, 'family-bathroom-core', 'Bathroom core', INTERIOR_ZONE_COLORS.bathroom, 0, 0, 0.7, 0.7));
    }

    return { walls, zones };
  }

  if (product.id === 'sauna-cabin-25') {
    const sauna = getBlockByInstance(blocks, 'sauna-core-module-main');
    const service = getBlockByInstance(blocks, 'bathroom-core-module-sauna');

    if (sauna) {
      zones.push(createZoneInBlock(sauna, 'sauna-rest-area', getInteriorZoneLabel(layoutVariant, 'saunaPrimary', 'Sauna / rest area'), INTERIOR_ZONE_COLORS.sauna, -0.12, -0.1, 0.66, 0.56));
      zones.push(createZoneInBlock(sauna, 'sauna-changing-zone', getInteriorZoneLabel(layoutVariant, 'saunaSecondary', 'Changing zone'), INTERIOR_ZONE_COLORS.changing, 0.22, 0.32, 0.36, 0.26));
      walls.push(createWall('sauna-changing-divider', sauna.x + sauna.width * 0.08, sauna.z + sauna.depth * 0.18, 0.64, sauna.depth * 0.42));
      walls.push(createWall('sauna-rest-divider', sauna.x - sauna.width * 0.18, sauna.z + sauna.depth * 0.12, sauna.width * 0.28, 0.64));
    }

    if (service) {
      zones.push(createZoneInBlock(service, 'sauna-service-core', getInteriorZoneLabel(layoutVariant, 'saunaService', 'Service core'), INTERIOR_ZONE_COLORS.bathroom, 0, 0, 0.66, 0.64));
    }

    if (terraceEnabled) {
      const width = Math.min(bounds.width, 44);
      const depth = Math.max(10, terraceDepth * 0.55);
      zones.push({
        areaM2: roundOneDecimal((width / MODULE_UNIT_SCALE) * (depth / MODULE_UNIT_SCALE)),
        depth,
        label: 'Terrace',
        tone: INTERIOR_ZONE_COLORS.terrace,
        width,
        x: bounds.centerX,
        z: bounds.maxZ + Math.max(10, terraceDepth * 0.35),
        zoneId: 'sauna-terrace',
      });
    }

    return { walls, zones };
  }

  const living = getBlockByInstance(blocks, 'compact-living-module-main');
  const bedroom = getBlockByInstance(blocks, 'compact-bedroom-module-main');
  const bathroom = getBlockByInstance(blocks, 'bathroom-core-module-compact');

  if (living) {
    zones.push(createZoneInBlock(living, 'compact-living-kitchen', getInteriorZoneLabel(layoutVariant, 'compactLiving', 'Living / kitchen'), INTERIOR_ZONE_COLORS.living, -0.1, -0.06, 0.72, 0.62));
    zones.push(createZoneInBlock(living, 'compact-entrance-storage', getInteriorZoneLabel(layoutVariant, 'compactStorage', 'Entrance / storage'), INTERIOR_ZONE_COLORS.entrance, 0.28, 0.32, 0.34, 0.26));
    walls.push(createWall('compact-entry-storage-wall', living.x + living.width * 0.1, living.z + living.depth * 0.23, 0.64, living.depth * 0.36));
    walls.push(createWall('compact-entry-back-wall', living.x + living.width * 0.28, living.z + living.depth * 0.18, living.width * 0.26, 0.64));
  }

  if (bedroom) {
    zones.push(createZoneInBlock(bedroom, 'compact-bedroom', getInteriorZoneLabel(layoutVariant, 'compactBedroom', 'Bedroom'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.7, 0.66));
  }

  if (bathroom) {
    zones.push(createZoneInBlock(bathroom, 'compact-bathroom-core', 'Bathroom core', INTERIOR_ZONE_COLORS.bathroom, 0, 0, 0.66, 0.66));
  }

  return { walls, zones };
}

function getFootprintBounds(blocks: readonly ModuleLayoutBlock[]): FootprintBounds {
  const minX = Math.min(...blocks.map((block) => block.x - block.width / 2));
  const maxX = Math.max(...blocks.map((block) => block.x + block.width / 2));
  const minZ = Math.min(...blocks.map((block) => block.z - block.depth / 2));
  const maxZ = Math.max(...blocks.map((block) => block.z + block.depth / 2));

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    depth: maxZ - minZ,
    maxX,
    maxZ,
    minX,
    minZ,
    width: maxX - minX,
  };
}

function WindowModule({
  glassColor,
  moduleId,
  position,
  scale,
  trimColor,
}: {
  glassColor: string;
  moduleId: string;
  position: Vector3Tuple;
  scale: Vector3Tuple;
  trimColor: string;
}) {
  const isSideWindow = scale[2] > scale[0] * 2;

  return (
    <group
      name={`window-module-${moduleId}`}
      position={position}
      userData={{
        homeConstructionElement: 'window-module',
        moduleId,
      }}
    >
      <mesh name={`${moduleId}-glass-panel`} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={glassColor} emissive={glassColor} emissiveIntensity={0.14} roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh name={`${moduleId}-top-bottom-frame`} position={[0, 0, 0.045]} scale={[scale[0] + 0.08, 0.045, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh name={`${moduleId}-top-drip-cap`} position={[0, scale[1] / 2 + 0.11, 0.075]} scale={[scale[0] + 0.52, 0.12, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.64} />
      </mesh>
      <mesh name={`${moduleId}-bottom-sill`} position={[0, -scale[1] / 2 - 0.12, 0.105]} scale={[scale[0] + 0.72, 0.14, 0.24]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5a371d" roughness={0.82} />
      </mesh>
      <mesh name={`${moduleId}-vertical-mullion`} position={[0, 0, 0.05]} scale={[0.04, scale[1] + 0.09, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh name={`${moduleId}-horizontal-mullion`} position={[0, 0.02, 0.052]} scale={[scale[0] + 0.08, 0.035, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh name={`${moduleId}-left-frame`} position={[-scale[0] / 2, 0, 0.055]} scale={[0.045, scale[1] + 0.12, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh name={`${moduleId}-right-frame`} position={[scale[0] / 2, 0, 0.055]} scale={[0.045, scale[1] + 0.12, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      {isSideWindow ? (
        <>
          <mesh name={`${moduleId}-side-front-return`} position={[0, 0, scale[2] / 2]} scale={[0.16, scale[1] + 0.1, 0.055]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={trimColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-side-back-return`} position={[0, 0, -scale[2] / 2]} scale={[0.16, scale[1] + 0.1, 0.055]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={trimColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-side-sill`} position={[0, -scale[1] / 2 - 0.12, 0]} scale={[0.18, 0.14, scale[2] + 0.64]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#5a371d" roughness={0.82} />
          </mesh>
        </>
      ) : null}
      <mesh name={`${moduleId}-shadow-gap`} position={[0, 0, -0.02]} scale={[scale[0] + 0.32, scale[1] + 0.28, 0.035]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#020617" opacity={0.22} roughness={0.9} transparent />
      </mesh>
    </group>
  );
}

function DoorModule({
  doorVisual,
  moduleId,
  position,
  rotationY = 0,
  trimColor,
}: {
  doorVisual: ModularHomeDoorPackageVisual;
  moduleId: string;
  position: Vector3Tuple;
  rotationY?: number;
  trimColor: string;
}) {
  const doorWidth = 3.8 * doorVisual.widthMultiplier;
  const frameOffset = doorWidth / 2 + 0.25;

  return (
    <group
      name={`door-module-${moduleId}`}
      position={position}
      rotation={[0, rotationY, 0]}
      userData={{
        homeConstructionElement: 'door-module',
        moduleId,
      }}
    >
      <mesh name={`${moduleId}-door-leaf`} position={[0, 0.7, 0]} scale={[doorWidth, 3.9, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={doorVisual.doorColor} roughness={0.78} metalness={0.03} />
      </mesh>
      {doorVisual.hasGlassPanel ? (
        <mesh name={`${moduleId}-door-glass-panel`} position={[0, 1.12, 0.13]} scale={[doorWidth * 0.42, 2.4, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={doorVisual.glassColor} emissive={doorVisual.glassColor} emissiveIntensity={0.12} roughness={0.24} metalness={0.05} />
        </mesh>
      ) : null}
      <mesh name={`${moduleId}-door-left-jamb`} position={[-frameOffset, 0.76, 0.08]} scale={[0.28, 4.15, 0.32]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.7} />
      </mesh>
      <mesh name={`${moduleId}-door-right-jamb`} position={[frameOffset, 0.76, 0.08]} scale={[0.28, 4.15, 0.32]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.7} />
      </mesh>
      <mesh name={`${moduleId}-door-header`} position={[0, 2.88, 0.08]} scale={[doorWidth + 0.8, 0.32, 0.34]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.7} />
      </mesh>
      <mesh name={`${moduleId}-door-overhead-drip-edge`} position={[0, 3.16, 0.24]} scale={[doorWidth + 1.2, 0.16, 0.42]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh name={`${moduleId}-door-inner-panel`} position={[0, 0.72, 0.12]} scale={[Math.max(0.8, doorWidth - 0.62), 2.8, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1f2937" opacity={0.18} roughness={0.86} transparent />
      </mesh>
      {[0.05, 0.7, 1.35].map((y) => (
        <mesh key={`${moduleId}-hinge-${y}`} name={`${moduleId}-hinge-${y}`} position={[-frameOffset + 0.28, y, 0.27]} scale={[0.14, 0.28, 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#facc15" roughness={0.45} metalness={0.14} />
        </mesh>
      ))}
      <mesh name={`${moduleId}-door-handle`} position={[Math.min(doorWidth / 2 - 0.72, 1.45), 1.05, 0.24]} scale={[0.28, 0.28, 0.18]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.13} roughness={0.45} />
      </mesh>
      <mesh name={`${moduleId}-entry-sill`} position={[0, -1.28, 0.62]} scale={[doorWidth + 1.6, 0.28, 1.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5a371d" roughness={0.84} metalness={0.02} />
      </mesh>
    </group>
  );
}

function InteriorZoneLabel({ areaM2, isFloorplan, label, position, tone, zoneId }: {
  areaM2: number;
  isFloorplan: boolean;
  label: string;
  position: Vector3Tuple;
  tone: string;
  zoneId: string;
}) {
  return (
    <Html position={position} center distanceFactor={46} occlude={false} pointerEvents="none">
      <div
        data-home-demo-interior-zone={zoneId}
        data-home-demo-interior-zone-area={areaM2}
        data-home-demo-interior-zone-label={label}
        data-home-demo-floorplan-room-label={isFloorplan ? label : undefined}
        style={{
          background: isFloorplan ? 'rgba(2, 6, 23, 0.88)' : 'rgba(2, 6, 23, 0.76)',
          border: `1px solid ${isFloorplan ? FLOORPLAN_BOUNDARY_COLOR : tone}`,
          borderRadius: isFloorplan ? '10px' : '999px',
          color: '#fff7ed',
          fontFamily: 'inherit',
          fontSize: isFloorplan ? '0.6rem' : '0.56rem',
          fontWeight: 920,
          letterSpacing: isFloorplan ? '0.04em' : '0.06em',
          lineHeight: 1.08,
          minWidth: isFloorplan ? '82px' : undefined,
          padding: isFloorplan ? '5px 7px' : '3px 6px',
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <div>{label}</div>
        {isFloorplan ? (
          <div style={{ color: '#fde68a', fontSize: '0.52rem', fontWeight: 860, letterSpacing: '0.02em', marginTop: '2px', textTransform: 'none' }}>
            est. {formatFloorplanArea(areaM2)}
          </div>
        ) : null}
      </div>
    </Html>
  );
}

function InteriorZoneSurface({ isFloorplan, zone }: { isFloorplan: boolean; zone: InteriorPlanZone }) {
  const labelY = isFloorplan ? 2.38 : 4.65;
  const finishLineOffsets = getEvenlySpacedPanelOffsets(zone.width - 1.2, isFloorplan ? 7 : 5.5);

  return (
    <group
      name={`interior-zone-${zone.zoneId}`}
      position={[zone.x, 0, zone.z]}
      userData={{
        homeInteriorZone: true,
        label: zone.label,
        zoneId: zone.zoneId,
      }}
    >
      <mesh position={[0, 1.02, 0]} scale={[zone.width, 0.13, zone.depth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={zone.tone} emissive={zone.tone} emissiveIntensity={0.14} roughness={0.7} />
      </mesh>
      {finishLineOffsets.map((x) => (
        <mesh key={`interior-finish-line-${zone.zoneId}-${x}`} position={[x, 1.14, 0]} scale={[0.08, 0.05, zone.depth - 0.7]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_FINISH_LINE_COLOR} opacity={isFloorplan ? 0.28 : 0.42} roughness={0.86} transparent />
        </mesh>
      ))}
      <mesh position={[0, 1.04, -zone.depth / 2]} scale={[zone.width + 0.7, 0.08, 0.28]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.04, zone.depth / 2]} scale={[zone.width + 0.7, 0.08, 0.28]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[-zone.width / 2, 1.04, 0]} scale={[0.28, 0.08, zone.depth + 0.7]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[zone.width / 2, 1.04, 0]} scale={[0.28, 0.08, zone.depth + 0.7]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <InteriorZoneLabel areaM2={zone.areaM2} isFloorplan={isFloorplan} label={zone.label} position={[0, labelY, 0]} tone={zone.tone} zoneId={zone.zoneId} />
    </group>
  );
}

function InteriorWall({ interiorWallColor, isFloorplan, segment }: {
  interiorWallColor: string;
  isFloorplan: boolean;
  segment: InteriorWallSegment;
}) {
  const wallHeight = isFloorplan ? 0.68 : segment.height;
  const wallY = isFloorplan ? 1.28 : 1.72;

  return (
    <mesh
      name={`interior-wall-${segment.wallId}`}
      position={[segment.x, wallY, segment.z]}
      scale={[segment.width, wallHeight, segment.depth]}
      userData={{
        homeInteriorWall: true,
        wallId: segment.wallId,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={interiorWallColor} roughness={0.82} metalness={0.02} />
    </mesh>
  );
}

function InteriorPlanOverlay({ interiorWallColor, plan, viewMode }: {
  interiorWallColor: string;
  plan: InteriorPlan;
  viewMode: ModularHomeViewModeOption;
}) {
  const isFloorplan = viewMode === 'floorplan';

  return (
    <group name={`modular-home-interior-plan-overlay-${viewMode}`} userData={{ homeInteriorPlan: true, homeViewMode: viewMode }}>
      {plan.zones.map((zone) => (
        <InteriorZoneSurface key={zone.zoneId} isFloorplan={isFloorplan} zone={zone} />
      ))}
      {plan.walls.map((segment) => (
        <InteriorWall key={segment.wallId} interiorWallColor={interiorWallColor} isFloorplan={isFloorplan} segment={segment} />
      ))}
    </group>
  );
}

function FurnitureBox({
  color,
  furnitureType,
  name,
  position,
  scale,
}: {
  color: string;
  furnitureType: string;
  name: string;
  position: Vector3Tuple;
  scale: Vector3Tuple;
}) {
  return (
    <mesh
      name={name}
      position={position}
      scale={scale}
      userData={{
        furnitureType,
        homeFurniturePlaceholder: true,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.78} metalness={0.02} />
    </mesh>
  );
}

function SofaPlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x - block.width * 0.22;
  const z = block.z + block.depth * 0.08;
  const sofaColor = isPremium ? '#0f766e' : FURNITURE_COLORS.sofa;

  return (
    <group name={`${block.moduleInstanceId}-sofa-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'sofa' }}>
      <FurnitureBox color={sofaColor} furnitureType="sofa" name={`${block.moduleInstanceId}-sofa-seat`} position={[x, 1.25, z]} scale={[9.2, 0.95, 3.4]} />
      <FurnitureBox color={sofaColor} furnitureType="sofa" name={`${block.moduleInstanceId}-sofa-back`} position={[x, 2.0, z - 1.55]} scale={[9.6, 1.8, 0.72]} />
      <FurnitureBox color={sofaColor} furnitureType="sofa" name={`${block.moduleInstanceId}-sofa-left-arm`} position={[x - 5.0, 1.8, z]} scale={[0.72, 1.7, 3.8]} />
      <FurnitureBox color={sofaColor} furnitureType="sofa" name={`${block.moduleInstanceId}-sofa-right-arm`} position={[x + 5.0, 1.8, z]} scale={[0.72, 1.7, 3.8]} />
    </group>
  );
}

function TablePlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x + block.width * 0.08;
  const z = block.z + block.depth * 0.14;
  const tableColor = isPremium ? '#92400e' : FURNITURE_COLORS.table;

  return (
    <group name={`${block.moduleInstanceId}-table-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'table' }}>
      <FurnitureBox color={tableColor} furnitureType="table" name={`${block.moduleInstanceId}-table-top`} position={[x, 1.48, z]} scale={[4.4, 0.36, 2.8]} />
      <FurnitureBox color={tableColor} furnitureType="table" name={`${block.moduleInstanceId}-table-leg-a`} position={[x - 1.8, 0.94, z - 1.05]} scale={[0.34, 1.1, 0.34]} />
      <FurnitureBox color={tableColor} furnitureType="table" name={`${block.moduleInstanceId}-table-leg-b`} position={[x + 1.8, 0.94, z - 1.05]} scale={[0.34, 1.1, 0.34]} />
      <FurnitureBox color={tableColor} furnitureType="table" name={`${block.moduleInstanceId}-table-leg-c`} position={[x - 1.8, 0.94, z + 1.05]} scale={[0.34, 1.1, 0.34]} />
      <FurnitureBox color={tableColor} furnitureType="table" name={`${block.moduleInstanceId}-table-leg-d`} position={[x + 1.8, 0.94, z + 1.05]} scale={[0.34, 1.1, 0.34]} />
    </group>
  );
}

function KitchenLinePlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x + block.width * 0.2;
  const z = block.z - block.depth * 0.32;

  return (
    <group name={`${block.moduleInstanceId}-kitchen-line-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'kitchen-line' }}>
      <FurnitureBox color={FURNITURE_COLORS.kitchen} furnitureType="kitchen-line" name={`${block.moduleInstanceId}-kitchen-base`} position={[x, 1.32, z]} scale={[10.6, 1.48, 1.45]} />
      <FurnitureBox color="#94a3b8" furnitureType="kitchen-line" name={`${block.moduleInstanceId}-kitchen-counter`} position={[x, 2.16, z]} scale={[11.0, 0.24, 1.7]} />
      <FurnitureBox color={isPremium ? FURNITURE_COLORS.premiumAccent : '#64748b'} furnitureType="kitchen-line" name={`${block.moduleInstanceId}-kitchen-upper`} position={[x, 3.18, z - 0.22]} scale={[8.6, 1.05, 0.82]} />
      <FurnitureBox color={KITCHEN_MARKER_COLOR} furnitureType="kitchen-line-marker" name={`${block.moduleInstanceId}-kitchen-service-marker`} position={[x - 4.2, 2.42, z + 0.86]} scale={[1.2, 0.18, 0.26]} />
      <FurnitureBox color="#475569" furnitureType="kitchen-backsplash" name={`${block.moduleInstanceId}-kitchen-backsplash`} position={[x, 2.55, z - 0.96]} scale={[10.8, 0.9, 0.16]} />
    </group>
  );
}

function BedPlaceholder({ block, bedIndex, isPremium }: {
  bedIndex: number;
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x;
  const z = block.z + (bedIndex % 2 === 0 ? 0 : block.depth * 0.08);

  return (
    <group name={`${block.moduleInstanceId}-bed-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'bed' }}>
      <FurnitureBox color={FURNITURE_COLORS.bed} furnitureType="bed" name={`${block.moduleInstanceId}-bed-base`} position={[x, 1.22, z]} scale={[7.0, 0.9, 5.2]} />
      <FurnitureBox color={isPremium ? '#fef9c3' : '#fcd34d'} furnitureType="bed" name={`${block.moduleInstanceId}-bed-cover`} position={[x, 1.78, z + 0.18]} scale={[6.5, 0.34, 4.65]} />
      <FurnitureBox color="#fff7ed" furnitureType="bed" name={`${block.moduleInstanceId}-bed-pillow`} position={[x, 2.04, z - 2.0]} scale={[5.3, 0.36, 1.0]} />
    </group>
  );
}

function WardrobePlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x - block.width * 0.28;
  const z = block.z - block.depth * 0.22;

  return (
    <group name={`${block.moduleInstanceId}-wardrobe-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'wardrobe-placeholder' }}>
      <FurnitureBox color={isPremium ? '#78350f' : '#92400e'} furnitureType="wardrobe-placeholder" name={`${block.moduleInstanceId}-wardrobe-carcass`} position={[x, 2.0, z]} scale={[2.6, 3.2, 1.05]} />
      <FurnitureBox color={isPremium ? '#fbbf24' : '#d6b98b'} furnitureType="wardrobe-placeholder" name={`${block.moduleInstanceId}-wardrobe-door-a`} position={[x - 0.66, 2.04, z + 0.56]} scale={[1.18, 2.72, 0.14]} />
      <FurnitureBox color={isPremium ? '#fbbf24' : '#d6b98b'} furnitureType="wardrobe-placeholder" name={`${block.moduleInstanceId}-wardrobe-door-b`} position={[x + 0.66, 2.04, z + 0.56]} scale={[1.18, 2.72, 0.14]} />
    </group>
  );
}

function BathroomBlockPlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const x = block.x;
  const z = block.z;

  return (
    <group name={`${block.moduleInstanceId}-bathroom-block-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'bathroom-block' }}>
      <FurnitureBox color={FURNITURE_COLORS.bathroomBlock} furnitureType="bathroom-block" name={`${block.moduleInstanceId}-wet-core-shower`} position={[x - block.width * 0.18, 1.72, z - block.depth * 0.14]} scale={[3.4, 2.2, 3.0]} />
      <FurnitureBox color="#dbeafe" furnitureType="bathroom-block" name={`${block.moduleInstanceId}-wet-core-vanity`} position={[x + block.width * 0.18, 1.18, z + block.depth * 0.16]} scale={[3.3, 1.1, 1.55]} />
      <FurnitureBox color={BATHROOM_CORE_MARKER_COLOR} furnitureType="bathroom-core-marker" name={`${block.moduleInstanceId}-wet-core-vertical-marker`} position={[x, 2.55, z - block.depth * 0.36]} scale={[block.width * 0.48, 0.2, 0.28]} />
      <FurnitureBox color="#0ea5e9" furnitureType="bathroom-core-marker" name={`${block.moduleInstanceId}-wet-core-service-riser`} position={[x + block.width * 0.32, 2.0, z - block.depth * 0.2]} scale={[0.44, 2.2, 0.44]} />
      {isPremium ? (
        <FurnitureBox color={FURNITURE_COLORS.premiumAccent} furnitureType="bathroom-block" name={`${block.moduleInstanceId}-wet-core-premium-strip`} position={[x, 2.92, z - block.depth * 0.14]} scale={[6.3, 0.24, 0.3]} />
      ) : null}
    </group>
  );
}

function SaunaBenchPlaceholder({ block, isPremium }: {
  block: ModuleLayoutBlock;
  isPremium: boolean;
}) {
  const z = block.z - block.depth * 0.12;

  return (
    <group name={`${block.moduleInstanceId}-sauna-bench-placeholder`} userData={{ homeFurniturePlaceholder: true, packageItem: 'sauna-bench' }}>
      <FurnitureBox color={FURNITURE_COLORS.saunaBench} furnitureType="sauna-bench" name={`${block.moduleInstanceId}-sauna-bench-lower`} position={[block.x - block.width * 0.18, 1.18, z]} scale={[8.0, 0.7, 2.2]} />
      <FurnitureBox color={FURNITURE_COLORS.saunaBench} furnitureType="sauna-bench" name={`${block.moduleInstanceId}-sauna-bench-upper`} position={[block.x - block.width * 0.2, 2.28, z - 1.85]} scale={[8.2, 0.65, 1.9]} />
      <FurnitureBox color={isPremium ? FURNITURE_COLORS.premiumAccent : '#78350f'} furnitureType="sauna-bench" name={`${block.moduleInstanceId}-sauna-heater-placeholder`} position={[block.x + block.width * 0.22, 1.35, block.z + block.depth * 0.16]} scale={[2.4, 1.45, 2.4]} />
    </group>
  );
}

function InteriorFurniturePreview({ blocks, config, product }: {
  blocks: readonly ModuleLayoutBlock[];
  config: ModularHomeConfiguratorState;
  product: ModularHomeProduct;
}) {
  const packageVisual = MODULAR_HOME_FURNITURE_PACKAGE_VISUALS[config.furniturePackage];
  const packageItems = new Set<ModularHomeFurnitureToggleKey>(packageVisual.includedItems);
  const isItemEnabled = (item: ModularHomeFurnitureToggleKey) => (
    packageItems.has(item) && config[item] === 'enabled'
  );
  const hasBathroomPackage = config.furniturePackage === 'standardFurniture'
    || config.furniturePackage === 'premiumFurniture'
    || config.furniturePackage === 'bathroomPackage'
    || config.furniturePackage === 'saunaPackage';
  const hasSaunaPackage = config.furniturePackage === 'saunaPackage';

  if (config.furniturePackage === 'emptyShell') {
    return null;
  }

  const isPremium = packageVisual.isPremium;
  const isSauna = product.id === 'sauna-cabin-25';
  const livingBlocks = blocks.filter((block) => block.module.type === 'living' && block.module.id !== 'sauna-core-module');
  const bedroomBlocks = blocks.filter((block) => block.module.type === 'bedroom');
  const bathroomBlocks = blocks.filter((block) => block.module.type === 'bathroomCore');
  const saunaBlocks = blocks.filter((block) => block.module.id === 'sauna-core-module');

  return (
    <group
      name={`modular-home-furniture-package-${config.furniturePackage}`}
      userData={{
        homeFurniturePackage: config.furniturePackage,
        homeInteriorPlaceholder: true,
        kitchenLineEnabled: isItemEnabled('kitchenLine'),
        sofaEnabled: isItemEnabled('sofa'),
        tableEnabled: isItemEnabled('table'),
        bedEnabled: isItemEnabled('bed'),
        wardrobePlaceholderEnabled: isItemEnabled('wardrobePlaceholder'),
      }}
    >
      {livingBlocks.map((block) => (
        <group key={block.moduleInstanceId}>
          {isItemEnabled('sofa') ? <SofaPlaceholder block={block} isPremium={isPremium} /> : null}
          {isItemEnabled('table') ? <TablePlaceholder block={block} isPremium={isPremium} /> : null}
          {isItemEnabled('kitchenLine') ? <KitchenLinePlaceholder block={block} isPremium={isPremium} /> : null}
          {isPremium ? (
            <FurnitureBox color={FURNITURE_COLORS.premiumAccent} furnitureType="premium-accent" name={`${block.moduleInstanceId}-premium-accent-console`} position={[block.x - block.width * 0.02, 2.05, block.z - block.depth * 0.12]} scale={[5.4, 0.32, 0.42]} />
          ) : null}
        </group>
      ))}
      {bedroomBlocks.map((block, index) => (
        <group key={block.moduleInstanceId}>
          {isItemEnabled('bed') ? <BedPlaceholder bedIndex={index} block={block} isPremium={isPremium} /> : null}
          {isItemEnabled('wardrobePlaceholder') ? <WardrobePlaceholder block={block} isPremium={isPremium} /> : null}
        </group>
      ))}
      {hasBathroomPackage ? bathroomBlocks.map((block) => (
        <BathroomBlockPlaceholder key={block.moduleInstanceId} block={block} isPremium={isPremium} />
      )) : null}
      {isSauna && hasSaunaPackage ? (
        saunaBlocks.map((block) => (
          <SaunaBenchPlaceholder key={block.moduleInstanceId} block={block} isPremium={isPremium} />
        ))
      ) : null}
    </group>
  );
}

function FloorplanMarker({ color, detail, label, markerType, position }: {
  color: string;
  detail?: string;
  label: string;
  markerType: 'door' | 'dimension' | 'module' | 'terrace' | 'window';
  position: Vector3Tuple;
}) {
  return (
    <Html position={position} center distanceFactor={48} occlude={false} pointerEvents="none">
      <div
        data-home-demo-floorplan-marker={markerType}
        data-home-demo-floorplan-marker-detail={detail}
        data-home-demo-floorplan-marker-label={label}
        style={{
          alignItems: 'center',
          background: 'rgba(2, 6, 23, 0.86)',
          border: `1px solid ${color}`,
          borderRadius: detail ? '9px' : '999px',
          boxShadow: '0 8px 20px rgba(2, 6, 23, 0.28)',
          color: '#fff7ed',
          display: 'inline-flex',
          flexDirection: detail ? 'column' : 'row',
          fontFamily: 'inherit',
          fontSize: detail ? '0.52rem' : '0.6rem',
          fontWeight: 940,
          gap: '2px',
          justifyContent: 'center',
          letterSpacing: '0.06em',
          lineHeight: 1.05,
          minHeight: detail ? '32px' : '22px',
          minWidth: detail ? '72px' : '24px',
          padding: detail ? '4px 6px' : '3px 6px',
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color }}>{label}</span>
        {detail ? (
          <span style={{ color: '#cbd5e1', fontSize: '0.46rem', fontWeight: 780, letterSpacing: '0.02em', textTransform: 'none' }}>
            {detail}
          </span>
        ) : null}
      </div>
    </Html>
  );
}

function ModuleLabel({ detail, label, moduleId, position, tone }: {
  detail?: string;
  label: string;
  moduleId: string;
  position: Vector3Tuple;
  tone: string;
}) {
  return (
    <Html position={position} center distanceFactor={52} occlude={false} pointerEvents="none">
      <div
        data-home-demo-module-detail={detail}
        data-home-demo-module-label={label}
        data-home-demo-module-id={moduleId}
        style={{
          background: 'rgba(15, 23, 42, 0.78)',
          border: `1px solid ${tone}`,
          borderRadius: detail ? '10px' : '999px',
          color: '#fff7ed',
          fontFamily: 'inherit',
          fontSize: '0.52rem',
          fontWeight: 920,
          lineHeight: 1.08,
          letterSpacing: '0.08em',
          padding: detail ? '5px 8px' : '4px 7px',
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <div>{label}</div>
        {detail ? (
          <div style={{ color: '#bae6fd', fontSize: '0.46rem', fontWeight: 820, letterSpacing: '0.02em', marginTop: '2px', textTransform: 'none' }}>
            {detail}
          </div>
        ) : null}
      </div>
    </Html>
  );
}

function FloorplanModuleBoundary({ block }: {
  block: ModuleLayoutBlock;
}) {
  const halfDepth = block.depth / 2;
  const halfWidth = block.width / 2;
  const moduleAreaM2 = (block.module.dimensions.widthM * block.module.dimensions.lengthM);
  const detail = `${formatFloorplanDimensionPair(block.width, block.depth)} · ${formatFloorplanArea(moduleAreaM2)}`;

  return (
    <group
      name={`${block.moduleInstanceId}-floorplan-professional-boundary`}
      userData={{
        floorplanModuleBoundary: true,
        moduleAreaM2,
        moduleInstanceId: block.moduleInstanceId,
      }}
    >
      <mesh position={[0, 1.72, -halfDepth - 0.85]} scale={[block.width + 1.8, 0.12, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_BOUNDARY_COLOR} emissive={FLOORPLAN_BOUNDARY_COLOR} emissiveIntensity={0.12} opacity={0.72} transparent roughness={0.76} />
      </mesh>
      <mesh position={[0, 1.72, halfDepth + 0.85]} scale={[block.width + 1.8, 0.12, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_BOUNDARY_COLOR} emissive={FLOORPLAN_BOUNDARY_COLOR} emissiveIntensity={0.12} opacity={0.72} transparent roughness={0.76} />
      </mesh>
      <mesh position={[-halfWidth - 0.85, 1.72, 0]} scale={[0.22, 0.12, block.depth + 1.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_BOUNDARY_COLOR} emissive={FLOORPLAN_BOUNDARY_COLOR} emissiveIntensity={0.12} opacity={0.72} transparent roughness={0.76} />
      </mesh>
      <mesh position={[halfWidth + 0.85, 1.72, 0]} scale={[0.22, 0.12, block.depth + 1.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_BOUNDARY_COLOR} emissive={FLOORPLAN_BOUNDARY_COLOR} emissiveIntensity={0.12} opacity={0.72} transparent roughness={0.76} />
      </mesh>
      <FloorplanMarker color={FLOORPLAN_BOUNDARY_COLOR} detail={detail} label="Module" markerType="module" position={[0, 2.62, -halfDepth - 3.2]} />
    </group>
  );
}

function getEvenlySpacedPanelOffsets(span: number, maxPanelWidth = 10) {
  const panelCount = Math.max(2, Math.ceil(span / maxPanelWidth));
  const step = span / panelCount;

  return Array.from({ length: panelCount - 1 }, (_, index) => -span / 2 + step * (index + 1));
}

function FacadeBoardingDetail({ block, boardOrientationVisual, boardWidthVisual, isFloorplan, wallHeight }: {
  block: ModuleLayoutBlock;
  boardOrientationVisual: ModularHomeFacadeBoardOrientationVisual;
  boardWidthVisual: ModularHomeFacadeBoardWidthVisual;
  isFloorplan: boolean;
  wallHeight: number;
}) {
  if (isFloorplan) {
    return null;
  }

  const halfDepth = block.depth / 2;
  const halfWidth = block.width / 2;
  const verticalBoardXs = getEvenlySpacedPanelOffsets(block.width - 2.4, boardWidthVisual.maxPanelSpacing);
  const verticalBoardZs = getEvenlySpacedPanelOffsets(block.depth - 2.4, boardWidthVisual.maxPanelSpacing);
  const boardYs = getEvenlySpacedPanelOffsets(
    Math.max(2.4, wallHeight - 1.1),
    boardWidthVisual.maxPanelSpacing / 4.2,
  );
  const lineHeight = Math.max(2.8, wallHeight - 1.0);
  const isVertical = boardOrientationVisual.orientation === 'vertical';

  return (
    <group
      name={`${block.moduleInstanceId}-facade-boarding-detail`}
      userData={{
        facadeBoardDirection: boardOrientationVisual.orientation,
        facadeBoardWidth: boardWidthVisual.label,
        homeConstructionElement: 'facade-boarding-detail',
        moduleInstanceId: block.moduleInstanceId,
      }}
    >
      {isVertical ? verticalBoardXs.map((x) => (
        <group key={`facade-vertical-board-${x}`}>
          <mesh position={[x, 3.0, halfDepth + 0.72]} scale={[0.08, lineHeight, 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.58} roughness={0.92} transparent />
          </mesh>
          <mesh position={[x, 3.0, -halfDepth - 0.72]} scale={[0.08, lineHeight, 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.46} roughness={0.92} transparent />
          </mesh>
        </group>
      )) : boardYs.map((yOffset) => {
        const y = 1.35 + yOffset;
        return (
          <group key={`facade-horizontal-front-board-${yOffset}`}>
            <mesh position={[0, y, halfDepth + 0.72]} scale={[block.width - 1.2, 0.055, 0.12]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.48} roughness={0.92} transparent />
            </mesh>
            <mesh position={[0, y, -halfDepth - 0.72]} scale={[block.width - 1.2, 0.055, 0.12]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.42} roughness={0.92} transparent />
            </mesh>
          </group>
        );
      })}
      {isVertical ? verticalBoardZs.map((z) => (
        <group key={`side-vertical-board-${z}`}>
          <mesh position={[-halfWidth - 0.72, 3.0, z]} scale={[0.12, lineHeight * 0.9, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.42} roughness={0.92} transparent />
          </mesh>
          <mesh position={[halfWidth + 0.72, 3.0, z]} scale={[0.12, lineHeight * 0.9, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.42} roughness={0.92} transparent />
          </mesh>
        </group>
      )) : boardYs.map((yOffset) => {
        const y = 1.35 + yOffset;
        return (
          <group key={`facade-horizontal-side-board-${yOffset}`}>
            <mesh position={[-halfWidth - 0.72, y, 0]} scale={[0.12, 0.055, block.depth - 1.2]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.44} roughness={0.92} transparent />
            </mesh>
            <mesh position={[halfWidth + 0.72, y, 0]} scale={[0.12, 0.055, block.depth - 1.2]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={FACADE_BOARD_LINE_COLOR} opacity={0.44} roughness={0.92} transparent />
            </mesh>
          </group>
        );
      })}
      {verticalBoardZs.map((z) => (
        <group key={`side-panel-joint-${z}`}>
          <mesh position={[-halfWidth - 0.78, 3.0, z]} scale={[0.13, lineHeight * 0.86, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} opacity={0.38} roughness={0.92} transparent />
          </mesh>
          <mesh position={[halfWidth + 0.78, 3.0, z]} scale={[0.13, lineHeight * 0.86, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} opacity={0.38} roughness={0.92} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WallPanelSeams({ block, isFloorplan, wallHeight }: {
  block: ModuleLayoutBlock;
  isFloorplan: boolean;
  wallHeight: number;
}) {
  const frontBackXs = getEvenlySpacedPanelOffsets(block.width - 1.2);
  const sideZs = getEvenlySpacedPanelOffsets(block.depth - 1.2);
  const halfDepth = block.depth / 2;
  const halfWidth = block.width / 2;
  const seamY = isFloorplan ? 1.3 : 2.95;
  const seamHeight = isFloorplan ? Math.max(0.74, wallHeight - 0.18) : Math.max(3.5, wallHeight - 0.6);

  return (
    <group
      name={`${block.moduleInstanceId}-wall-panel-seams`}
      userData={{
        homeConstructionElement: 'wall-panel-seams',
        moduleInstanceId: block.moduleInstanceId,
      }}
    >
      {frontBackXs.map((x) => (
        <group key={`front-back-${x}`}>
          <mesh position={[x, seamY, halfDepth + 0.48]} scale={[0.18, seamHeight, 0.16]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[x, seamY, -halfDepth - 0.48]} scale={[0.18, seamHeight, 0.16]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {sideZs.map((z) => (
        <group key={`side-${z}`}>
          <mesh position={[-halfWidth - 0.48, seamY, z]} scale={[0.16, seamHeight, 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[halfWidth + 0.48, seamY, z]} scale={[0.16, seamHeight, 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.55, halfDepth + 0.5]} scale={[block.width + 0.4, 0.16, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.55, halfDepth + 0.5]} scale={[block.width + 0.4, 0.16, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.55, -halfDepth - 0.5]} scale={[block.width + 0.4, 0.16, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.55, -halfDepth - 0.5]} scale={[block.width + 0.4, 0.16, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PANEL_SEAM_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
}

function getFrontWindowOffsets(
  halfWidth: number,
  windowPlacementVisual: ModularHomeWindowPlacementVisual,
): readonly number[] {
  if (windowPlacementVisual.frontWindowCount === 2) {
    return [-halfWidth * 0.42, halfWidth * 0.34];
  }

  return [halfWidth * windowPlacementVisual.frontOffsetMultiplier];
}

function getDoorOpeningTransform(input: {
  doorPlacementVisual: ModularHomeDoorPlacementVisual;
  halfDepth: number;
  halfWidth: number;
  terracePlacement: 'none' | 'front' | 'side';
}): {
  position: Vector3Tuple;
  rotationY: number;
} {
  if (input.doorPlacementVisual.placement === 'side') {
    return {
      position: [input.halfWidth + 0.52, 2.32, 0],
      rotationY: Math.PI / 2,
    };
  }

  if (input.doorPlacementVisual.placement === 'terrace' && input.terracePlacement === 'side') {
    return {
      position: [input.halfWidth + 0.52, 2.32, input.halfDepth * 0.18],
      rotationY: Math.PI / 2,
    };
  }

  return {
    position: [0, 2.32, input.halfDepth + 0.52],
    rotationY: 0,
  };
}

function ModuleBlock({ bathroomCoreColor, block, boardOrientationVisual, boardWidthVisual, doorPlacementVisual, doorVisual, facadeColor, interiorFloorColor, sideColor, terracePlacement, trimColor, viewMode, windowFrameColor, windowPlacementVisual, windowVisual }: {
  bathroomCoreColor: string;
  block: ModuleLayoutBlock;
  boardOrientationVisual: ModularHomeFacadeBoardOrientationVisual;
  boardWidthVisual: ModularHomeFacadeBoardWidthVisual;
  doorPlacementVisual: ModularHomeDoorPlacementVisual;
  doorVisual: ModularHomeDoorPackageVisual;
  facadeColor: string;
  interiorFloorColor: string;
  sideColor: string;
  terracePlacement: 'none' | 'front' | 'side';
  trimColor: string;
  viewMode: ModularHomeViewModeOption;
  windowFrameColor: string;
  windowPlacementVisual: ModularHomeWindowPlacementVisual;
  windowVisual: ModularHomeWindowPackageVisual;
}) {
  const isFloorplan = viewMode === 'floorplan';
  const isInterior = viewMode === 'interior';
  const wallHeight = isFloorplan ? 1.1 : isInterior ? block.module.type === 'bathroomCore' ? 3.25 : 3.45 : block.module.type === 'bathroomCore' ? 4.4 : 4.8;
  const wallCenterY = isFloorplan ? 1.34 : isInterior ? 2.16 : 2.92;
  const halfWidth = block.width / 2;
  const halfDepth = block.depth / 2;
  const labelY = isFloorplan ? 2.42 : wallHeight + (isInterior ? 0.98 : 1.35);
  const sideShellOpacity = isInterior ? 0.36 : 1;
  const backShellOpacity = isInterior ? 0.42 : 1;
  const frontShellOpacity = isInterior ? 0.2 : 1;
  const shellTransparent = isInterior;
  const doorWidth = 3.8 * doorVisual.widthMultiplier;
  const windowWidth = Math.min(block.width * 0.48, Math.max(4.8, block.width * 0.19) * windowVisual.widthMultiplier);
  const sideWindowDepth = Math.min(block.depth * 0.48, Math.max(5.2, block.depth * 0.28) * windowVisual.sideDepthMultiplier * windowPlacementVisual.sideWindowScaleMultiplier);
  const sideWindowX = halfWidth * windowPlacementVisual.sideWindowXSign;
  const sideWindowOuterX = sideWindowX + 0.38 * windowPlacementVisual.sideWindowXSign;
  const frontWindowOffsets = getFrontWindowOffsets(halfWidth, windowPlacementVisual);
  const doorOpening = getDoorOpeningTransform({
    doorPlacementVisual,
    halfDepth,
    halfWidth,
    terracePlacement,
  });

  return (
    <group
      name={`modular-home-block-${block.moduleInstanceId}`}
      position={[block.x, 0, block.z]}
      userData={{
        materialRole: block.module.type === 'bathroomCore' ? 'bathroom-wet-core' : 'interior-plywood',
        moduleId: block.module.id,
        moduleInstanceId: block.moduleInstanceId,
        moduleType: block.module.type,
        source: 'module-based-modular-home-preview',
      }}
    >
      <mesh position={[0, 0.46, 0]} scale={[block.width, 0.42, block.depth]} name={`${block.moduleInstanceId}-floor`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorFloorColor} roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.74, 0]} scale={[block.width - 1.6, 0.08, block.depth - 1.6]} name={`${block.moduleInstanceId}-zone-fill`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={block.module.type === 'bathroomCore' ? bathroomCoreColor : block.tone} emissive={block.tone} emissiveIntensity={0.035} roughness={0.78} />
      </mesh>

      <mesh position={[0, wallCenterY, -halfDepth]} scale={[block.width, wallHeight, 0.7]} name={`${block.moduleInstanceId}-back-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} opacity={backShellOpacity} roughness={0.84} metalness={0.02} transparent={shellTransparent} />
      </mesh>
      <mesh position={[-halfWidth, wallCenterY, 0]} scale={[0.7, wallHeight, block.depth]} name={`${block.moduleInstanceId}-left-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sideColor} opacity={sideShellOpacity} roughness={0.86} metalness={0.02} transparent={shellTransparent} />
      </mesh>
      <mesh position={[halfWidth, wallCenterY, 0]} scale={[0.7, wallHeight, block.depth]} name={`${block.moduleInstanceId}-right-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sideColor} opacity={sideShellOpacity} roughness={0.86} metalness={0.02} transparent={shellTransparent} />
      </mesh>
      <mesh position={[-halfWidth * 0.58, wallCenterY, halfDepth]} scale={[block.width * 0.34, wallHeight, 0.7]} name={`${block.moduleInstanceId}-front-left-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} opacity={frontShellOpacity} roughness={0.84} metalness={0.02} transparent={shellTransparent} />
      </mesh>
      <mesh position={[halfWidth * 0.58, wallCenterY, halfDepth]} scale={[block.width * 0.34, wallHeight, 0.7]} name={`${block.moduleInstanceId}-front-right-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} opacity={frontShellOpacity} roughness={0.84} metalness={0.02} transparent={shellTransparent} />
      </mesh>
      {!isFloorplan && !isInterior ? (
        <>
          <mesh position={[0, wallHeight + 0.62, halfDepth]} scale={[block.width * 0.24, 0.54, 0.7]} name={`${block.moduleInstanceId}-front-header`}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={facadeColor} roughness={0.84} metalness={0.02} />
          </mesh>
          <mesh position={[0, wallHeight + 0.98, halfDepth + 0.42]} scale={[block.width - 4, 0.32, 0.22]} name={`${block.moduleInstanceId}-module-accent-band`}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={block.tone} emissive={block.tone} emissiveIntensity={0.1} roughness={0.7} />
          </mesh>
        </>
      ) : null}

      <WallPanelSeams block={block} isFloorplan={isFloorplan} wallHeight={wallHeight} />
      <FacadeBoardingDetail
        block={block}
        boardOrientationVisual={boardOrientationVisual}
        boardWidthVisual={boardWidthVisual}
        isFloorplan={isFloorplan}
        wallHeight={wallHeight}
      />
      {isFloorplan ? (
        <FloorplanModuleBoundary block={block} />
      ) : null}

      <mesh position={[0, 0.92, -halfDepth - 0.18]} scale={[block.width + 1.4, 0.16, 0.42]} name={`${block.moduleInstanceId}-rear-seam`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.93, halfDepth + 0.18]} scale={[block.width + 1.4, 0.16, 0.42]} name={`${block.moduleInstanceId}-front-seam`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[-halfWidth - 0.18, 0.94, 0]} scale={[0.42, 0.16, block.depth + 1.4]} name={`${block.moduleInstanceId}-left-seam`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[halfWidth + 0.18, 0.94, 0]} scale={[0.42, 0.16, block.depth + 1.4]} name={`${block.moduleInstanceId}-right-seam`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>

      {!isFloorplan ? (
        <>
          {frontWindowOffsets.map((offset, index) => (
            <WindowModule
              key={`${block.moduleInstanceId}-front-window-${index}`}
              glassColor={windowVisual.glassColor}
              moduleId={`${block.moduleInstanceId}-front-window-${index}`}
              position={[offset, 3.45, halfDepth + 0.38]}
              scale={[
                windowWidth,
                1.9 * windowVisual.heightMultiplier,
                0.08,
              ]}
              trimColor={windowFrameColor || windowVisual.trimColor || trimColor}
            />
          ))}
          <WindowModule
            glassColor={windowVisual.glassColor}
            moduleId={`${block.moduleInstanceId}-side-window`}
            position={[sideWindowOuterX, 3.2, -halfDepth * 0.2]}
            scale={[
              0.08,
              1.85 * windowVisual.heightMultiplier,
              sideWindowDepth,
            ]}
            trimColor={windowFrameColor || windowVisual.trimColor || trimColor}
          />
          {windowPlacementVisual.hasCornerFeature ? (
            <mesh position={[halfWidth + 0.45, 3.42, halfDepth * 0.3]} scale={[0.36, 2.25 * windowVisual.heightMultiplier, Math.min(halfDepth * 0.56, sideWindowDepth * 0.82)]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.2} roughness={0.26} metalness={0.05} />
            </mesh>
          ) : null}
          <DoorModule doorVisual={doorVisual} moduleId={`${block.moduleInstanceId}-entry`} position={doorOpening.position} rotationY={doorOpening.rotationY} trimColor={trimColor} />
        </>
      ) : (
        <group name={`${block.moduleInstanceId}-floorplan-openings`} userData={{ floorplanOpenings: true, moduleInstanceId: block.moduleInstanceId }}>
          {frontWindowOffsets.map((offset, index) => (
            <group key={`${block.moduleInstanceId}-floorplan-front-opening-${index}`}>
              <mesh position={[offset, 1.18, halfDepth + 0.46]} scale={[windowWidth, 0.16, 0.5]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.16} roughness={0.42} />
              </mesh>
              <FloorplanMarker
                color={FLOORPLAN_WINDOW_MARKER_COLOR}
                detail="front opening"
                label="W"
                markerType="window"
                position={[offset, 2.28, halfDepth + 2.6]}
              />
            </group>
          ))}
          <mesh position={[sideWindowOuterX + 0.08 * windowPlacementVisual.sideWindowXSign, 1.18, -halfDepth * 0.2]} scale={[0.5, 0.16, sideWindowDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.16} roughness={0.42} />
          </mesh>
          <FloorplanMarker
            color={FLOORPLAN_WINDOW_MARKER_COLOR}
            detail={windowPlacementVisual.label}
            label="W"
            markerType="window"
            position={[sideWindowOuterX + 2.5 * windowPlacementVisual.sideWindowXSign, 2.28, -halfDepth * 0.2]}
          />
          {windowPlacementVisual.hasCornerFeature ? (
            <FloorplanMarker
              color={FLOORPLAN_WINDOW_MARKER_COLOR}
              detail="corner glazing"
              label="W"
              markerType="window"
              position={[halfWidth + 2.8, 2.28, halfDepth * 0.32]}
            />
          ) : null}
          <mesh position={[doorOpening.position[0], 1.2, doorOpening.position[2] + (doorOpening.rotationY === 0 ? 0.18 : 0)]} rotation={[0, doorOpening.rotationY, 0]} scale={[doorWidth, 0.18, 1.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.14} roughness={0.62} />
          </mesh>
          <FloorplanMarker
            color={FLOORPLAN_DOOR_MARKER_COLOR}
            detail={doorPlacementVisual.label}
            label="D"
            markerType="door"
            position={[
              doorOpening.position[0] + (doorOpening.rotationY === 0 ? 0 : 2.6),
              2.3,
              doorOpening.position[2] + (doorOpening.rotationY === 0 ? 3.1 : 0),
            ]}
          />
        </group>
      )}

      <ModuleLabel
        detail={isFloorplan ? formatFloorplanDimensionPair(block.width, block.depth) : undefined}
        label={block.label}
        moduleId={block.moduleInstanceId}
        position={[0, labelY, 0]}
        tone={block.tone}
      />
    </group>
  );
}

function RoofGutterDetail({ bounds, edgeColor, y }: {
  bounds: FootprintBounds;
  edgeColor: string;
  y: number;
}) {
  const downspoutX = bounds.maxX + 3.4;
  const downspoutZs = [bounds.minZ - 2.9, bounds.maxZ + 2.9];

  return (
    <group
      name="modular-home-roof-edge-gutter-placeholder"
      userData={{
        homeConstructionElement: 'roof-gutter-placeholder',
      }}
    >
      <mesh position={[bounds.centerX, y, bounds.minZ - 3.0]} scale={[bounds.width + 6.8, 0.22, 0.34]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={edgeColor} roughness={0.62} metalness={0.16} />
      </mesh>
      <mesh position={[bounds.centerX, y, bounds.maxZ + 3.0]} scale={[bounds.width + 6.8, 0.22, 0.34]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={edgeColor} roughness={0.62} metalness={0.16} />
      </mesh>
      {downspoutZs.map((z) => (
        <mesh key={`downspout-${z}`} position={[downspoutX, y - 2.2, z]} scale={[0.34, 4.1, 0.34]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={edgeColor} roughness={0.64} metalness={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function RoofAssembly({ bounds, roofColor, accentColor, edgeColor, roofType }: {
  accentColor: string;
  bounds: FootprintBounds;
  edgeColor: string;
  roofColor: string;
  roofType: string;
}) {
  const isPitched = roofType === 'pitched';
  const isGreenRoof = roofType === 'greenRoofPlaceholder';
  const roofPanelXs = getEvenlySpacedPanelOffsets(bounds.width + 2, 13);

  if (!isPitched) {
    return (
      <group name={`modular-home-roof-${roofType}`} userData={{ moduleInstanceId: `roof:${roofType}` }}>
        <mesh position={[bounds.centerX, 6.45, bounds.centerZ]} scale={[bounds.width + 5.6, 0.82, bounds.depth + 5.6]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={roofColor} opacity={0.55} roughness={0.74} metalness={0.04} transparent />
        </mesh>
        {isGreenRoof ? (
          <mesh position={[bounds.centerX, 7.0, bounds.centerZ]} scale={[bounds.width, 0.16, bounds.depth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={accentColor} emissive="#3f6212" emissiveIntensity={0.05} opacity={0.55} roughness={0.86} transparent />
          </mesh>
        ) : null}
        {roofPanelXs.map((x) => (
          <mesh key={x} position={[bounds.centerX + x, 6.95, bounds.centerZ]} scale={[0.22, 0.18, bounds.depth + 6.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={accentColor} opacity={0.58} roughness={0.78} transparent />
          </mesh>
        ))}
        <mesh position={[bounds.centerX, 6.98, bounds.centerZ - bounds.depth / 2 - 2.8]} scale={[bounds.width + 6.4, 0.26, 0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={accentColor} roughness={0.72} />
        </mesh>
        <mesh position={[bounds.centerX, 6.98, bounds.centerZ + bounds.depth / 2 + 2.8]} scale={[bounds.width + 6.4, 0.26, 0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={accentColor} roughness={0.72} />
        </mesh>
        <RoofGutterDetail bounds={bounds} edgeColor={edgeColor} y={6.72} />
      </group>
    );
  }

  return (
    <group name="modular-home-roof-pitched" userData={{ moduleInstanceId: 'roof:pitched' }}>
      <mesh position={[bounds.centerX, 6.7, bounds.centerZ - bounds.depth * 0.16]} rotation={[0.34, 0, 0]} scale={[bounds.width + 7, 0.92, bounds.depth * 0.62]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roofColor} opacity={0.55} roughness={0.74} metalness={0.04} transparent />
      </mesh>
      <mesh position={[bounds.centerX, 6.7, bounds.centerZ + bounds.depth * 0.17]} rotation={[-0.34, 0, 0]} scale={[bounds.width + 7, 0.92, bounds.depth * 0.62]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roofColor} opacity={0.55} roughness={0.74} metalness={0.04} transparent />
      </mesh>
      <mesh position={[bounds.centerX, 8.2, bounds.centerZ]} scale={[bounds.width + 8, 0.42, 1.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accentColor} roughness={0.72} />
      </mesh>
      {roofPanelXs.map((x) => (
        <group key={x}>
          <mesh position={[bounds.centerX + x, 7.05, bounds.centerZ - bounds.depth * 0.18]} rotation={[0.34, 0, 0]} scale={[0.22, 0.2, bounds.depth * 0.6]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={accentColor} opacity={0.52} roughness={0.78} transparent />
          </mesh>
          <mesh position={[bounds.centerX + x, 7.05, bounds.centerZ + bounds.depth * 0.18]} rotation={[-0.34, 0, 0]} scale={[0.22, 0.2, bounds.depth * 0.6]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={accentColor} opacity={0.52} roughness={0.78} transparent />
          </mesh>
        </group>
      ))}
      <RoofGutterDetail bounds={bounds} edgeColor={edgeColor} y={6.18} />
    </group>
  );
}

function TerraceModule({ bounds, depth, isCovered, placement, trimColor, viewMode, width }: {
  bounds: FootprintBounds;
  depth: number;
  isCovered: boolean;
  placement: 'front' | 'side';
  trimColor: string;
  viewMode: ModularHomeViewModeOption;
  width: number;
}) {
  const isSide = placement === 'side';
  const showCoveredStructure = isCovered && viewMode === 'exterior';
  const x = isSide ? bounds.maxX + depth / 2 + 4 : bounds.centerX;
  const z = isSide ? bounds.centerZ : bounds.maxZ + depth / 2 + 4;
  const frontZ = bounds.maxZ + depth + 4;
  const sideX = bounds.maxX + depth + 4;
  const deckScale: Vector3Tuple = isSide ? [depth, 1.04, width] : [width, 1.04, depth];
  const deckAreaM2 = roundOneDecimal((width / MODULE_UNIT_SCALE) * (depth / MODULE_UNIT_SCALE));
  const railCount = Math.max(4, Math.round(width / 12));
  const railXs = Array.from({ length: railCount }, (_, index) => (
    -width / 2 + 4 + index * ((width - 8) / Math.max(1, railCount - 1))
  ));
  const plankXs = getEvenlySpacedPanelOffsets(width, 7);
  const plankCrossOffsets = getEvenlySpacedPanelOffsets(depth, 6.5);

  return (
    <group name={`modular-home-terrace-module-${placement}${isCovered ? '-covered' : ''}`} userData={{ moduleInstanceId: `terrace-module:${placement}${isCovered ? ':covered' : ''}` }}>
      <mesh position={[x, 0.72, z]} scale={deckScale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={DECK_COLOR} roughness={0.84} metalness={0.01} />
      </mesh>
      {plankXs.map((x) => (
        <mesh
          key={x}
          position={isSide ? [sideX - depth / 2 - 4, 1.28, bounds.centerZ + x] : [bounds.centerX + x, 1.28, z]}
          scale={isSide ? [depth - 1.2, 0.12, 0.18] : [0.18, 0.12, depth - 1.2]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={TERRACE_BOARD_GAP_COLOR} roughness={0.9} />
        </mesh>
      ))}
      {plankCrossOffsets.map((offset) => (
        <mesh
          key={`cross-gap-${offset}`}
          position={isSide ? [bounds.maxX + depth / 2 + 4 + offset, 1.31, bounds.centerZ] : [bounds.centerX, 1.31, bounds.maxZ + depth / 2 + 4 + offset]}
          scale={isSide ? [0.18, 0.1, width - 1.4] : [width - 1.4, 0.1, 0.18]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#5a371d" opacity={0.64} roughness={0.9} transparent />
        </mesh>
      ))}
      <mesh
        position={isSide ? [bounds.maxX + depth / 2 + 4, 1.36, bounds.centerZ - width / 2] : [bounds.centerX - width / 2, 1.36, bounds.maxZ + depth / 2 + 4]}
        scale={isSide ? [depth, 0.18, 0.34] : [0.34, 0.18, depth]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.86} />
      </mesh>
      <mesh
        position={isSide ? [bounds.maxX + depth / 2 + 4, 1.36, bounds.centerZ + width / 2] : [bounds.centerX + width / 2, 1.36, bounds.maxZ + depth / 2 + 4]}
        scale={isSide ? [depth, 0.18, 0.34] : [0.34, 0.18, depth]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.86} />
      </mesh>
      <mesh
        position={isSide ? [bounds.maxX + 3.6, 0.98, bounds.centerZ] : [bounds.centerX, 0.98, bounds.maxZ + 3.6]}
        scale={isSide ? [0.9, 0.22, Math.min(width, bounds.depth)] : [Math.min(width, bounds.width), 0.22, 0.9]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      {railXs.map((x) => (
        <mesh key={x} position={isSide ? [sideX, 1.55, bounds.centerZ + x] : [bounds.centerX + x, 1.55, frontZ]} scale={[1.4, 2.1, 1.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={trimColor} roughness={0.72} />
        </mesh>
      ))}
      <mesh position={isSide ? [sideX, 2.72, bounds.centerZ] : [bounds.centerX, 2.72, frontZ]} scale={isSide ? [1.2, 1.0, width - 8] : [width - 8, 1.0, 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.72} />
      </mesh>
      {showCoveredStructure ? (
        <group name="covered-terrace-placeholder">
          <mesh position={[x, 5.45, z]} scale={isSide ? [depth + 5, 0.42, width + 4] : [width + 5, 0.42, depth + 4]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#475569" opacity={0.72} roughness={0.74} transparent />
          </mesh>
          {[-1, 1].map((sign) => (
            <mesh
              key={sign}
              position={isSide ? [sideX, 3.25, bounds.centerZ + sign * (width / 2 - 5)] : [bounds.centerX + sign * (width / 2 - 5), 3.25, frontZ]}
              scale={[1.2, 4.2, 1.2]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={trimColor} roughness={0.72} />
            </mesh>
          ))}
        </group>
      ) : null}
      {viewMode === 'floorplan' ? (
        <group name={`floorplan-terrace-outline-${placement}`} userData={{ floorplanTerraceOutline: true, terraceAreaM2: deckAreaM2 }}>
          <mesh position={isSide ? [bounds.maxX + depth / 2 + 4, 1.5, bounds.centerZ - width / 2] : [bounds.centerX, 1.5, bounds.maxZ + 4]} scale={isSide ? [depth + 1.2, 0.12, 0.28] : [width + 1.2, 0.12, 0.28]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.12} opacity={0.78} transparent roughness={0.72} />
          </mesh>
          <mesh position={isSide ? [bounds.maxX + depth / 2 + 4, 1.5, bounds.centerZ + width / 2] : [bounds.centerX, 1.5, bounds.maxZ + depth + 4]} scale={isSide ? [depth + 1.2, 0.12, 0.28] : [width + 1.2, 0.12, 0.28]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.12} opacity={0.78} transparent roughness={0.72} />
          </mesh>
          <mesh position={isSide ? [bounds.maxX + 4, 1.5, bounds.centerZ] : [bounds.centerX - width / 2, 1.5, bounds.maxZ + depth / 2 + 4]} scale={isSide ? [0.28, 0.12, width + 1.2] : [0.28, 0.12, depth + 1.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.12} opacity={0.78} transparent roughness={0.72} />
          </mesh>
          <mesh position={isSide ? [bounds.maxX + depth + 4, 1.5, bounds.centerZ] : [bounds.centerX + width / 2, 1.5, bounds.maxZ + depth / 2 + 4]} scale={isSide ? [0.28, 0.12, width + 1.2] : [0.28, 0.12, depth + 1.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.12} opacity={0.78} transparent roughness={0.72} />
          </mesh>
          <FloorplanMarker color="#bbf7d0" detail={formatFloorplanArea(deckAreaM2)} label={isCovered ? 'Covered terrace' : placement === 'side' ? 'Side terrace' : 'Front deck'} markerType="terrace" position={[x, 3.0, z]} />
        </group>
      ) : null}
      <ModuleLabel
        detail={viewMode === 'floorplan' ? formatFloorplanArea(deckAreaM2) : undefined}
        label={isCovered ? 'Covered terrace' : placement === 'side' ? 'Side terrace' : 'Front deck'}
        moduleId="terrace-module"
        position={[x, viewMode === 'floorplan' ? 2.42 : 4.4, z]}
        tone="rgba(34, 197, 94, 0.86)"
      />
    </group>
  );
}

function FoundationPlaceholder({ bounds, terraceDepth, terracePlacement }: {
  bounds: FootprintBounds;
  terraceDepth: number;
  terracePlacement: 'none' | 'front' | 'side';
}) {
  const padPositions = [
    [bounds.minX + 6, bounds.minZ + 6],
    [bounds.maxX - 6, bounds.minZ + 6],
    [bounds.minX + 6, bounds.maxZ - 6],
    [bounds.maxX - 6, bounds.maxZ - 6],
    [bounds.centerX, bounds.centerZ],
  ] as const;

  return (
    <group
      name="modular-home-foundation-placeholder"
      userData={{
        homeConstructionElement: 'foundation-placeholder',
      }}
    >
      <mesh position={[bounds.centerX, 0.05, bounds.centerZ]} scale={[bounds.width + 18, 0.18, bounds.depth + 30]} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3d2d1f" roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh position={[bounds.centerX, 0.34, bounds.minZ - 1.4]} scale={[bounds.width + 12, 0.46, 2.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FOUNDATION_COLOR} roughness={0.82} />
      </mesh>
      <mesh position={[bounds.centerX, 0.34, bounds.maxZ + 1.4]} scale={[bounds.width + 12, 0.46, 2.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FOUNDATION_COLOR} roughness={0.82} />
      </mesh>
      <mesh position={[bounds.minX - 1.4, 0.34, bounds.centerZ]} scale={[2.2, 0.46, bounds.depth + 12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FOUNDATION_COLOR} roughness={0.82} />
      </mesh>
      <mesh position={[bounds.maxX + 1.4, 0.34, bounds.centerZ]} scale={[2.2, 0.46, bounds.depth + 12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FOUNDATION_COLOR} roughness={0.82} />
      </mesh>
      {padPositions.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.62, z]} scale={[4.2, 0.44, 4.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#a1aab5" roughness={0.8} />
        </mesh>
      ))}
      {terraceDepth > 0 && terracePlacement === 'front' ? (
        <mesh position={[bounds.centerX, 0.28, bounds.maxZ + terraceDepth / 2 + 4]} scale={[Math.min(bounds.width + 14, 72), 0.34, terraceDepth + 8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#565f6b" opacity={0.72} roughness={0.84} transparent />
        </mesh>
      ) : null}
      {terraceDepth > 0 && terracePlacement === 'side' ? (
        <mesh position={[bounds.maxX + terraceDepth / 2 + 4, 0.28, bounds.centerZ]} scale={[terraceDepth + 8, 0.34, Math.min(bounds.depth + 14, 72)]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#565f6b" opacity={0.72} roughness={0.84} transparent />
        </mesh>
      ) : null}
    </group>
  );
}

function FloorplanMeasurementLine({ axis, bounds, label, offset }: {
  axis: 'depth' | 'width';
  bounds: FootprintBounds;
  label: string;
  offset: number;
}) {
  const isWidth = axis === 'width';
  const centerX = isWidth ? bounds.centerX : bounds.minX - offset;
  const centerZ = isWidth ? bounds.minZ - offset : bounds.centerZ;
  const length = isWidth ? bounds.width : bounds.depth;
  const markerPosition: Vector3Tuple = isWidth
    ? [bounds.centerX, 2.6, bounds.minZ - offset - 3.2]
    : [bounds.minX - offset - 4.4, 2.6, bounds.centerZ];

  return (
    <group
      name={`floorplan-measurement-${axis}`}
      userData={{
        floorplanMeasurement: axis,
        label,
      }}
    >
      <mesh position={[centerX, 1.04, centerZ]} scale={isWidth ? [length, 0.12, 0.18] : [0.18, 0.12, length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_DIMENSION_COLOR} emissive={FLOORPLAN_DIMENSION_COLOR} emissiveIntensity={0.16} roughness={0.7} />
      </mesh>
      <mesh position={isWidth ? [bounds.minX, 1.08, centerZ] : [centerX, 1.08, bounds.minZ]} scale={isWidth ? [0.22, 0.16, 3.6] : [3.6, 0.16, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_DIMENSION_COLOR} emissive={FLOORPLAN_DIMENSION_COLOR} emissiveIntensity={0.16} roughness={0.7} />
      </mesh>
      <mesh position={isWidth ? [bounds.maxX, 1.08, centerZ] : [centerX, 1.08, bounds.maxZ]} scale={isWidth ? [0.22, 0.16, 3.6] : [3.6, 0.16, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={FLOORPLAN_DIMENSION_COLOR} emissive={FLOORPLAN_DIMENSION_COLOR} emissiveIntensity={0.16} roughness={0.7} />
      </mesh>
      <FloorplanMarker color={FLOORPLAN_DIMENSION_COLOR} detail={isWidth ? 'overall width' : 'overall depth'} label={label} markerType="dimension" position={markerPosition} />
    </group>
  );
}

function FloorplanViewGuide({ bounds, product }: {
  bounds: FootprintBounds;
  product: ModularHomeProduct;
}) {
  const gridXs = getEvenlySpacedPanelOffsets(bounds.width + 18, 8);
  const gridZs = getEvenlySpacedPanelOffsets(bounds.depth + 18, 8);
  const measuredWidth = formatFloorplanDimension(bounds.width / MODULE_UNIT_SCALE);
  const measuredDepth = formatFloorplanDimension(bounds.depth / MODULE_UNIT_SCALE);
  const catalogueWidth = formatFloorplanDimension(product.footprint.widthM);
  const catalogueDepth = formatFloorplanDimension(product.footprint.lengthM);
  const ceilingHeight = formatFloorplanDimension(product.ceilingHeightM);
  const floorArea = formatFloorplanArea(product.floorAreaM2);

  return (
    <group
      name="modular-home-floorplan-view-guide"
      userData={{
        homeFloorplanView: true,
        productFloorAreaM2: product.floorAreaM2,
        productFootprint: `${product.footprint.widthM}x${product.footprint.lengthM}`,
        productName: product.name,
      }}
    >
      <mesh position={[bounds.centerX, 0.08, bounds.centerZ]} scale={[bounds.width + 20, 0.08, bounds.depth + 20]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0f172a" opacity={0.2} roughness={0.9} transparent />
      </mesh>
      {gridXs.map((offset) => (
        <mesh key={`floorplan-grid-x-${offset}`} position={[bounds.centerX + offset, 0.18, bounds.centerZ]} scale={[0.08, 0.06, bounds.depth + 20]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#38bdf8" opacity={0.18} roughness={0.8} transparent />
        </mesh>
      ))}
      {gridZs.map((offset) => (
        <mesh key={`floorplan-grid-z-${offset}`} position={[bounds.centerX, 0.19, bounds.centerZ + offset]} scale={[bounds.width + 20, 0.06, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#38bdf8" opacity={0.18} roughness={0.8} transparent />
        </mesh>
      ))}
      <FloorplanMeasurementLine axis="width" bounds={bounds} label={measuredWidth} offset={12} />
      <FloorplanMeasurementLine axis="depth" bounds={bounds} label={measuredDepth} offset={12} />
      <Html position={[bounds.centerX, 4.1, bounds.minZ - 19]} center distanceFactor={58} occlude={false} pointerEvents="none">
        <div
          data-home-demo-floorplan-label="true"
          data-home-demo-floorplan-overall-dimensions={`${measuredWidth} x ${measuredDepth}`}
          data-home-demo-floorplan-product-footprint={`${catalogueWidth} x ${catalogueDepth}`}
          data-home-demo-floorplan-room-count={product.moduleCount}
          style={{
            background: 'rgba(2, 6, 23, 0.9)',
            border: '1px solid rgba(251, 191, 36, 0.62)',
            borderRadius: '14px',
            boxShadow: '0 14px 34px rgba(2, 6, 23, 0.32)',
            color: '#fff7ed',
            fontFamily: 'inherit',
            minWidth: '260px',
            padding: '8px 10px',
            textAlign: 'left',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Professional floorplan preview
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 950, marginTop: '4px' }}>{product.name}</div>
          <div style={{ color: '#e0f2fe', fontSize: '0.52rem', fontWeight: 820, marginTop: '5px' }}>
            {floorArea} · catalogue {catalogueWidth} × {catalogueDepth} · ceiling {ceilingHeight}
          </div>
          <div style={{ color: '#bbf7d0', fontSize: '0.5rem', fontWeight: 800, marginTop: '3px' }}>
            Preview measured plan: {measuredWidth} × {measuredDepth} · module boundaries and openings shown.
          </div>
        </div>
      </Html>
    </group>
  );
}

export function ModularHomeModel() {
  const { config: homeConfig } = useModularHomeConfigurator();
  const { viewMode } = useModularHomeViewMode();

  if (!isHomeDemoEnabled()) {
    return null;
  }

  const config = getModularHomeTemplate(homeConfig.template);
  const product = getModularHomeProductForConfig(homeConfig);
  const modules = getModulesForConfig(homeConfig);
  const layoutVariant = getModularHomeLayoutVariantForConfig(homeConfig);
  const facadeVisual = MODULAR_HOME_FACADE_VISUALS[homeConfig.facade];
  const facadeBoardOrientationVisual = MODULAR_HOME_FACADE_BOARD_ORIENTATION_VISUALS[homeConfig.facadeBoardOrientation];
  const facadeBoardWidthVisual = MODULAR_HOME_FACADE_BOARD_WIDTH_VISUALS[homeConfig.facadeBoardWidth];
  const finishVisual = MODULAR_HOME_FINISH_LEVEL_VISUALS[homeConfig.finishLevel];
  const floorFinishVisual = MODULAR_HOME_FLOOR_FINISH_VISUALS[homeConfig.floorFinish];
  const interiorWallFinishVisual = MODULAR_HOME_INTERIOR_WALL_FINISH_VISUALS[homeConfig.interiorWallFinish];
  const interiorPackage = INTERIOR_PACKAGE_BY_FINISH_LEVEL[homeConfig.finishLevel];
  const roofVisual = MODULAR_HOME_ROOF_VISUALS[homeConfig.roof];
  const roofEdgeColorVisual = MODULAR_HOME_ROOF_EDGE_COLOR_VISUALS[homeConfig.roofEdgeColor];
  const terraceVisual = MODULAR_HOME_TERRACE_VISUALS[homeConfig.terrace];
  const windowFrameColorVisual = MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS[homeConfig.windowFrameColor];
  const windowVisual = MODULAR_HOME_WINDOW_PACKAGE_VISUALS[homeConfig.windowPackage] ?? MODULAR_HOME_WINDOW_PACKAGE_VISUALS.standardWindows;
  const windowPlacementVisual = MODULAR_HOME_WINDOW_PLACEMENT_VISUALS[homeConfig.windowPlacement] ?? MODULAR_HOME_WINDOW_PLACEMENT_VISUALS.balanced;
  const doorVisual = MODULAR_HOME_DOOR_PACKAGE_VISUALS[homeConfig.doorPackage] ?? MODULAR_HOME_DOOR_PACKAGE_VISUALS.standardEntry;
  const doorPlacementVisual = MODULAR_HOME_DOOR_PLACEMENT_VISUALS[homeConfig.doorPlacement] ?? MODULAR_HOME_DOOR_PLACEMENT_VISUALS.frontEntry;
  const configSummary = getModularHomeConfigSummary(homeConfig);

  if (!product) {
    return null;
  }

  const moduleBlocks = createModuleLayout(product, modules);
  const bounds = getFootprintBounds(moduleBlocks);
  const terraceModule = modules.find((module) => module.type === 'terrace');
  const terraceWidth = terraceModule ? terraceModule.dimensions.widthM * MODULE_UNIT_SCALE : terraceVisual.deckWidth;
  const terraceDepth = terraceModule ? terraceModule.dimensions.lengthM * MODULE_UNIT_SCALE : terraceVisual.deckDepth;
  const frontClearanceDepth = terraceVisual.enabled && terraceVisual.placement === 'front' ? terraceDepth : 0;
  const interiorPlan = createInteriorPlan(product, moduleBlocks, bounds, layoutVariant, terraceDepth, terraceVisual.enabled);
  const isExteriorMode = viewMode === 'exterior';
  const isFloorplanMode = viewMode === 'floorplan';

  return (
    <group
      name="modular-home-preview-district"
      position={config.position}
      rotation={[0, config.rotationY, 0]}
      userData={{
        homeDemoConfig: homeConfig,
        homeDemoLayoutVariant: layoutVariant?.id ?? homeConfig.layoutVariant,
        homeDemoPreview: true,
        homeDemoViewMode: viewMode,
        modularHomeFurniturePackage: homeConfig.furniturePackage,
        modularHomeInteriorPackage: interiorPackage,
        modularHomeFurnitureToggles: `${homeConfig.sofa}:${homeConfig.table}:${homeConfig.bed}:${homeConfig.kitchenLine}:${homeConfig.wardrobePlaceholder}`,
        modularHomeFacadeMaterialId: facadeVisual.materialId,
        modularHomeFacadeBoardOrientation: homeConfig.facadeBoardOrientation,
        modularHomeFacadeBoardWidth: homeConfig.facadeBoardWidth,
        modularHomeFinishMaterialIds: finishVisual.materialIds,
        modularHomeFloorFinish: homeConfig.floorFinish,
        modularHomeInteriorWallFinish: homeConfig.interiorWallFinish,
        modularHomeId: product.id,
        modularHomeModuleIds: modules.map((module) => module.id),
        modularHomeName: product.name,
        modularHomeRoofEdgeColor: homeConfig.roofEdgeColor,
        modularHomeRoofMaterialId: roofVisual.materialId,
        modularHomeWindowFrameColor: homeConfig.windowFrameColor,
        moduleBasedGeometry: true,
        source: 'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
      }}
    >
      <group
        name={`${product.id}-module-based-model`}
        scale={config.moduleScale}
        userData={{ moduleLayoutProductId: product.id }}
      >
        {isFloorplanMode ? (
          <FloorplanViewGuide bounds={bounds} product={product} />
        ) : null}

        <FoundationPlaceholder bounds={bounds} terraceDepth={terraceVisual.enabled ? terraceDepth : 0} terracePlacement={terraceVisual.enabled ? terraceVisual.placement : 'none'} />

        {moduleBlocks.map((block) => (
          <ModuleBlock
            key={block.moduleInstanceId}
            bathroomCoreColor={finishVisual.bathroomCoreColor}
            block={block}
            boardOrientationVisual={facadeBoardOrientationVisual}
            boardWidthVisual={facadeBoardWidthVisual}
            doorPlacementVisual={doorPlacementVisual}
            doorVisual={doorVisual}
            facadeColor={facadeVisual.wallColor}
            interiorFloorColor={floorFinishVisual.color || finishVisual.interiorFloorColor}
            sideColor={facadeVisual.sideColor}
            terracePlacement={terraceVisual.enabled ? terraceVisual.placement : 'none'}
            trimColor={facadeVisual.trimColor}
            viewMode={viewMode}
            windowFrameColor={windowFrameColorVisual.color}
            windowPlacementVisual={windowPlacementVisual}
            windowVisual={windowVisual}
          />
        ))}

        <InteriorPlanOverlay interiorWallColor={interiorWallFinishVisual.color || finishVisual.interiorWallColor} plan={interiorPlan} viewMode={viewMode} />

        <InteriorFurniturePreview blocks={moduleBlocks} config={homeConfig} product={product} />

        {isExteriorMode ? (
          <RoofAssembly
            accentColor={roofVisual.accentColor}
            bounds={bounds}
            edgeColor={roofEdgeColorVisual.color}
            roofColor={roofVisual.roofColor}
            roofType={homeConfig.roof}
          />
        ) : null}

        {terraceVisual.enabled ? (
          <TerraceModule
            bounds={bounds}
            depth={terraceDepth}
            isCovered={terraceVisual.isCovered}
            placement={terraceVisual.placement === 'side' ? 'side' : 'front'}
            trimColor={facadeVisual.trimColor}
            viewMode={viewMode}
            width={terraceWidth}
          />
        ) : null}

        <mesh position={[bounds.centerX, 0.18, bounds.maxZ + frontClearanceDepth + 25]} scale={[Math.min(52, bounds.width + 10), 0.18, 12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
        </mesh>
        <mesh position={[bounds.centerX, 0.29, bounds.maxZ + frontClearanceDepth + 33]} scale={[Math.min(58, bounds.width + 16), 0.14, 1.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.12} roughness={0.76} />
        </mesh>
      </group>

      <Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
        <div
          data-home-demo-model-label="true"
          data-home-config-model-summary={`${homeConfig.template}:${homeConfig.layoutVariant}:${homeConfig.facade}:${homeConfig.roof}:${homeConfig.terrace}:${homeConfig.finishLevel}:${homeConfig.windowPlacement}:${homeConfig.doorPlacement}:${homeConfig.facadeBoardOrientation}:${homeConfig.facadeBoardWidth}:${homeConfig.roofEdgeColor}:${homeConfig.windowFrameColor}:${homeConfig.interiorWallFinish}:${homeConfig.floorFinish}:${homeConfig.furniturePackage}:${homeConfig.sofa}:${homeConfig.table}:${homeConfig.bed}:${homeConfig.kitchenLine}:${homeConfig.wardrobePlaceholder}`}
          data-home-demo-facade-board-orientation={homeConfig.facadeBoardOrientation}
          data-home-demo-facade-board-width={homeConfig.facadeBoardWidth}
          data-home-demo-floor-finish={homeConfig.floorFinish}
          data-home-demo-interior-wall-finish={homeConfig.interiorWallFinish}
          data-home-demo-layout-variant={layoutVariant?.id ?? homeConfig.layoutVariant}
          data-home-demo-interior-package={interiorPackage}
          data-home-demo-furniture-package={homeConfig.furniturePackage}
          data-home-demo-sofa={homeConfig.sofa}
          data-home-demo-table={homeConfig.table}
          data-home-demo-bed={homeConfig.bed}
          data-home-demo-kitchen-line={homeConfig.kitchenLine}
          data-home-demo-wardrobe-placeholder={homeConfig.wardrobePlaceholder}
          data-home-demo-model-template={config.templateId}
          data-home-demo-module-count={moduleBlocks.length + (terraceVisual.enabled ? 1 : 0) + 1}
          data-home-demo-roof-edge-color={homeConfig.roofEdgeColor}
          data-home-demo-view-mode={viewMode}
          data-home-demo-window-frame-color={homeConfig.windowFrameColor}
          style={{
            background: 'rgba(15, 23, 42, 0.84)',
            border: '1px solid rgba(251, 191, 36, 0.38)',
            borderRadius: '14px',
            boxShadow: '0 12px 34px rgba(2, 6, 23, 0.35)',
            color: '#fff7ed',
            fontFamily: 'inherit',
            lineHeight: 1.1,
            padding: '8px 10px',
            textAlign: 'center',
            transform: 'translateY(-10px)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {config.sizeLabel} modular layout
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 950, marginTop: '3px' }}>{product.name}</div>
          <div style={{ color: '#bbf7d0', fontSize: '0.54rem', fontWeight: 850, marginTop: '4px' }}>
            {moduleBlocks.length} room modules / {configSummary.layoutVariant} / {configSummary.roof} / {configSummary.windowPlacement} / {configSummary.doorPlacement} / {viewMode}
          </div>
        </div>
      </Html>
    </group>
  );
}
