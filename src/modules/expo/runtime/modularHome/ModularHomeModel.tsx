import { Html } from '@react-three/drei';
import type { Vector3Tuple } from 'three';
import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  getModularHomeConfigSummary,
  MODULAR_HOME_FACADE_VISUALS,
  MODULAR_HOME_ROOF_VISUALS,
  MODULAR_HOME_TERRACE_VISUALS,
  useModularHomeConfigurator,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';
import {
  getModularHomeProductForConfig,
  getModulesForConfig,
  type ModularHomeModule,
  type ModularHomeModuleId,
  type ModularHomeProduct,
} from './modularHomeProducts';

const GLASS_COLOR = '#7dd3fc';
const DECK_COLOR = '#8b5a2b';
const INTERIOR_FLOOR_COLOR = '#d6b98b';
const SEAM_COLOR = '#0f172a';
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
  return {
    depth: block.depth * depthScale,
    label,
    tone,
    width: block.width * widthScale,
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

function createInteriorPlan(
  product: ModularHomeProduct,
  blocks: readonly ModuleLayoutBlock[],
  bounds: FootprintBounds,
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
      zones.push(createZoneInBlock(living, 'family-living-kitchen', 'Living / kitchen', INTERIOR_ZONE_COLORS.living, -0.08, 0.03, 0.78, 0.66));
      zones.push(createZoneInBlock(living, 'family-technical-storage', 'Technical / storage', INTERIOR_ZONE_COLORS.storage, 0.34, -0.32, 0.28, 0.24));
      walls.push(createWall('family-storage-side-wall', living.x + living.width * 0.2, living.z - living.depth * 0.29, 0.64, living.depth * 0.33));
      walls.push(createWall('family-storage-front-wall', living.x + living.width * 0.34, living.z - living.depth * 0.15, living.width * 0.28, 0.64));
    }

    if (bedroomA) {
      zones.push(createZoneInBlock(bedroomA, 'family-bedroom-1', 'Bedroom 1', INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
    }

    if (bedroomB) {
      zones.push(createZoneInBlock(bedroomB, 'family-bedroom-2', 'Bedroom 2', INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
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
      zones.push(createZoneInBlock(sauna, 'sauna-rest-area', 'Sauna / rest area', INTERIOR_ZONE_COLORS.sauna, -0.12, -0.1, 0.66, 0.56));
      zones.push(createZoneInBlock(sauna, 'sauna-changing-zone', 'Changing zone', INTERIOR_ZONE_COLORS.changing, 0.22, 0.32, 0.36, 0.26));
      walls.push(createWall('sauna-changing-divider', sauna.x + sauna.width * 0.08, sauna.z + sauna.depth * 0.18, 0.64, sauna.depth * 0.42));
      walls.push(createWall('sauna-rest-divider', sauna.x - sauna.width * 0.18, sauna.z + sauna.depth * 0.12, sauna.width * 0.28, 0.64));
    }

    if (service) {
      zones.push(createZoneInBlock(service, 'sauna-service-core', 'Service core', INTERIOR_ZONE_COLORS.bathroom, 0, 0, 0.66, 0.64));
    }

    if (terraceEnabled) {
      zones.push({
        depth: Math.max(10, terraceDepth * 0.55),
        label: 'Terrace',
        tone: INTERIOR_ZONE_COLORS.terrace,
        width: Math.min(bounds.width, 44),
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
    zones.push(createZoneInBlock(living, 'compact-living-kitchen', 'Living / kitchen', INTERIOR_ZONE_COLORS.living, -0.1, -0.06, 0.72, 0.62));
    zones.push(createZoneInBlock(living, 'compact-entrance-storage', 'Entrance / storage', INTERIOR_ZONE_COLORS.entrance, 0.28, 0.32, 0.34, 0.26));
    walls.push(createWall('compact-entry-storage-wall', living.x + living.width * 0.1, living.z + living.depth * 0.23, 0.64, living.depth * 0.36));
    walls.push(createWall('compact-entry-back-wall', living.x + living.width * 0.28, living.z + living.depth * 0.18, living.width * 0.26, 0.64));
  }

  if (bedroom) {
    zones.push(createZoneInBlock(bedroom, 'compact-bedroom', 'Bedroom', INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.7, 0.66));
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

function Window({ position, scale, trimColor }: { position: Vector3Tuple; scale: Vector3Tuple; trimColor: string }) {
  return (
    <group position={position}>
      <mesh scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={GLASS_COLOR} emissive={GLASS_COLOR} emissiveIntensity={0.14} roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.045]} scale={[scale[0] + 0.08, 0.045, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0, 0.05]} scale={[0.04, scale[1] + 0.09, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
    </group>
  );
}

function InteriorZoneLabel({ label, position, tone, zoneId }: {
  label: string;
  position: Vector3Tuple;
  tone: string;
  zoneId: string;
}) {
  return (
    <Html position={position} center distanceFactor={46} occlude={false} pointerEvents="none">
      <div
        data-home-demo-interior-zone={zoneId}
        data-home-demo-interior-zone-label={label}
        style={{
          background: 'rgba(2, 6, 23, 0.76)',
          border: `1px solid ${tone}`,
          borderRadius: '999px',
          color: '#fff7ed',
          fontFamily: 'inherit',
          fontSize: '0.56rem',
          fontWeight: 920,
          letterSpacing: '0.06em',
          padding: '3px 6px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function InteriorZoneSurface({ zone }: { zone: InteriorPlanZone }) {
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
      <InteriorZoneLabel label={zone.label} position={[0, 4.65, 0]} tone={zone.tone} zoneId={zone.zoneId} />
    </group>
  );
}

function InteriorWall({ segment }: { segment: InteriorWallSegment }) {
  return (
    <mesh
      name={`interior-wall-${segment.wallId}`}
      position={[segment.x, 1.72, segment.z]}
      scale={[segment.width, segment.height, segment.depth]}
      userData={{
        homeInteriorWall: true,
        wallId: segment.wallId,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f8e6c7" roughness={0.82} metalness={0.02} />
    </mesh>
  );
}

function InteriorPlanOverlay({ plan }: { plan: InteriorPlan }) {
  return (
    <group name="modular-home-interior-plan-overlay" userData={{ homeInteriorPlan: true }}>
      {plan.zones.map((zone) => (
        <InteriorZoneSurface key={zone.zoneId} zone={zone} />
      ))}
      {plan.walls.map((segment) => (
        <InteriorWall key={segment.wallId} segment={segment} />
      ))}
    </group>
  );
}

function ModuleLabel({ label, moduleId, position, tone }: { label: string; moduleId: string; position: Vector3Tuple; tone: string }) {
  return (
    <Html position={position} center distanceFactor={52} occlude={false} pointerEvents="none">
      <div
        data-home-demo-module-label={label}
        data-home-demo-module-id={moduleId}
        style={{
          background: 'rgba(15, 23, 42, 0.78)',
          border: `1px solid ${tone}`,
          borderRadius: '999px',
          color: '#fff7ed',
          fontFamily: 'inherit',
          fontSize: '0.52rem',
          fontWeight: 920,
          letterSpacing: '0.08em',
          padding: '4px 7px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function ModuleBlock({ block, facadeColor, sideColor, trimColor }: {
  block: ModuleLayoutBlock;
  facadeColor: string;
  sideColor: string;
  trimColor: string;
}) {
  const wallHeight = block.module.type === 'bathroomCore' ? 4.4 : 4.8;
  const halfWidth = block.width / 2;
  const halfDepth = block.depth / 2;
  const labelY = wallHeight + 1.35;

  return (
    <group
      name={`modular-home-block-${block.moduleInstanceId}`}
      position={[block.x, 0, block.z]}
      userData={{
        moduleId: block.module.id,
        moduleInstanceId: block.moduleInstanceId,
        moduleType: block.module.type,
        source: 'module-based-modular-home-preview',
      }}
    >
      <mesh position={[0, 0.46, 0]} scale={[block.width, 0.42, block.depth]} name={`${block.moduleInstanceId}-floor`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={INTERIOR_FLOOR_COLOR} roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.74, 0]} scale={[block.width - 1.6, 0.08, block.depth - 1.6]} name={`${block.moduleInstanceId}-zone-fill`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={block.tone} emissive={block.tone} emissiveIntensity={0.035} roughness={0.78} />
      </mesh>

      <mesh position={[0, 2.92, -halfDepth]} scale={[block.width, wallHeight, 0.7]} name={`${block.moduleInstanceId}-back-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[-halfWidth, 2.92, 0]} scale={[0.7, wallHeight, block.depth]} name={`${block.moduleInstanceId}-left-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sideColor} roughness={0.86} metalness={0.02} />
      </mesh>
      <mesh position={[halfWidth, 2.92, 0]} scale={[0.7, wallHeight, block.depth]} name={`${block.moduleInstanceId}-right-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sideColor} roughness={0.86} metalness={0.02} />
      </mesh>
      <mesh position={[-halfWidth * 0.58, 2.92, halfDepth]} scale={[block.width * 0.34, wallHeight, 0.7]} name={`${block.moduleInstanceId}-front-left-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[halfWidth * 0.58, 2.92, halfDepth]} scale={[block.width * 0.34, wallHeight, 0.7]} name={`${block.moduleInstanceId}-front-right-wall`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, wallHeight + 0.62, halfDepth]} scale={[block.width * 0.24, 0.54, 0.7]} name={`${block.moduleInstanceId}-front-header`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={facadeColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, wallHeight + 0.98, halfDepth + 0.42]} scale={[block.width - 4, 0.32, 0.22]} name={`${block.moduleInstanceId}-module-accent-band`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={block.tone} emissive={block.tone} emissiveIntensity={0.1} roughness={0.7} />
      </mesh>

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

      <Window position={[-halfWidth * 0.46, 3.45, halfDepth + 0.38]} scale={[Math.max(4.8, block.width * 0.19), 1.9, 0.08]} trimColor={trimColor} />
      <Window position={[halfWidth + 0.38, 3.2, -halfDepth * 0.2]} scale={[0.08, 1.85, Math.max(5.2, block.depth * 0.28)]} trimColor={trimColor} />

      <mesh position={[0, 1.03, halfDepth + 3]} scale={[Math.min(12, block.width * 0.32), 0.3, 5.5]} name={`${block.moduleInstanceId}-entry-threshold`}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5a371d" roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[Math.min(4, block.width * 0.18), 2.16, halfDepth + 0.44]} scale={[0.42, 0.42, 0.18]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.13} roughness={0.45} />
      </mesh>

      <ModuleLabel label={block.label} moduleId={block.moduleInstanceId} position={[0, labelY, 0]} tone={block.tone} />
    </group>
  );
}

function RoofAssembly({ bounds, roofColor, accentColor, roofType }: {
  accentColor: string;
  bounds: FootprintBounds;
  roofColor: string;
  roofType: string;
}) {
  const isPitched = roofType === 'pitched';
  const isGreenRoof = roofType === 'greenRoofPlaceholder';

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
    </group>
  );
}

function TerraceModule({ bounds, depth, trimColor, width }: {
  bounds: FootprintBounds;
  depth: number;
  trimColor: string;
  width: number;
}) {
  const z = bounds.maxZ + depth / 2 + 4;
  const frontZ = bounds.maxZ + depth + 4;
  const railCount = Math.max(4, Math.round(width / 12));
  const railXs = Array.from({ length: railCount }, (_, index) => (
    -width / 2 + 4 + index * ((width - 8) / Math.max(1, railCount - 1))
  ));

  return (
    <group name="modular-home-terrace-module" userData={{ moduleInstanceId: 'terrace-module' }}>
      <mesh position={[bounds.centerX, 0.72, z]} scale={[width, 1.04, depth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={DECK_COLOR} roughness={0.84} metalness={0.01} />
      </mesh>
      <mesh position={[bounds.centerX, 0.98, bounds.maxZ + 3.6]} scale={[Math.min(width, bounds.width), 0.22, 0.9]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={SEAM_COLOR} roughness={0.9} />
      </mesh>
      {railXs.map((x) => (
        <mesh key={x} position={[bounds.centerX + x, 1.55, frontZ]} scale={[1.4, 2.1, 1.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={trimColor} roughness={0.72} />
        </mesh>
      ))}
      <mesh position={[bounds.centerX, 2.72, frontZ]} scale={[width - 8, 1.0, 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.72} />
      </mesh>
      <ModuleLabel label="Terrace module" moduleId="terrace-module" position={[bounds.centerX, 4.4, z]} tone="rgba(34, 197, 94, 0.86)" />
    </group>
  );
}

export function ModularHomeModel() {
  const { config: homeConfig } = useModularHomeConfigurator();

  if (!isHomeDemoEnabled()) {
    return null;
  }

  const config = getModularHomeTemplate(homeConfig.template);
  const product = getModularHomeProductForConfig(homeConfig);
  const modules = getModulesForConfig(homeConfig);
  const facadeVisual = MODULAR_HOME_FACADE_VISUALS[homeConfig.facade];
  const roofVisual = MODULAR_HOME_ROOF_VISUALS[homeConfig.roof];
  const terraceVisual = MODULAR_HOME_TERRACE_VISUALS[homeConfig.terrace];
  const configSummary = getModularHomeConfigSummary(homeConfig);

  if (!product) {
    return null;
  }

  const moduleBlocks = createModuleLayout(product, modules);
  const bounds = getFootprintBounds(moduleBlocks);
  const terraceModule = modules.find((module) => module.type === 'terrace');
  const terraceWidth = terraceModule ? terraceModule.dimensions.widthM * MODULE_UNIT_SCALE : terraceVisual.deckWidth;
  const terraceDepth = terraceModule ? terraceModule.dimensions.lengthM * MODULE_UNIT_SCALE : terraceVisual.deckDepth;
  const interiorPlan = createInteriorPlan(product, moduleBlocks, bounds, terraceDepth, terraceVisual.enabled);

  return (
    <group
      name="modular-home-preview-district"
      position={config.position}
      rotation={[0, config.rotationY, 0]}
      userData={{
        homeDemoConfig: homeConfig,
        homeDemoPreview: true,
        modularHomeId: product.id,
        modularHomeModuleIds: modules.map((module) => module.id),
        modularHomeName: product.name,
        moduleBasedGeometry: true,
        source: 'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
      }}
    >
      <group
        name={`${product.id}-module-based-model`}
        scale={config.moduleScale}
        userData={{ moduleLayoutProductId: product.id }}
      >
        <mesh position={[bounds.centerX, 0.12, bounds.centerZ]} scale={[bounds.width + 18, 0.24, bounds.depth + 30]} receiveShadow={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3d2d1f" roughness={0.88} metalness={0.02} />
        </mesh>

        {moduleBlocks.map((block) => (
          <ModuleBlock
            key={block.moduleInstanceId}
            block={block}
            facadeColor={facadeVisual.wallColor}
            sideColor={facadeVisual.sideColor}
            trimColor={facadeVisual.trimColor}
          />
        ))}

        <InteriorPlanOverlay plan={interiorPlan} />

        <RoofAssembly
          accentColor={roofVisual.accentColor}
          bounds={bounds}
          roofColor={roofVisual.roofColor}
          roofType={homeConfig.roof}
        />

        {terraceVisual.enabled ? (
          <TerraceModule
            bounds={bounds}
            depth={terraceDepth}
            trimColor={facadeVisual.trimColor}
            width={terraceWidth}
          />
        ) : null}

        <mesh position={[bounds.centerX, 0.18, bounds.maxZ + terraceDepth + 25]} scale={[Math.min(52, bounds.width + 10), 0.18, 12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
        </mesh>
        <mesh position={[bounds.centerX, 0.29, bounds.maxZ + terraceDepth + 33]} scale={[Math.min(58, bounds.width + 16), 0.14, 1.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.12} roughness={0.76} />
        </mesh>
      </group>

      <Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
        <div
          data-home-demo-model-label="true"
          data-home-config-model-summary={`${homeConfig.template}:${homeConfig.facade}:${homeConfig.roof}:${homeConfig.terrace}:${homeConfig.finishLevel}`}
          data-home-demo-model-template={config.templateId}
          data-home-demo-module-count={moduleBlocks.length + (terraceVisual.enabled ? 1 : 0) + 1}
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
            {moduleBlocks.length} room modules / {configSummary.roof} / {configSummary.terrace}
          </div>
        </div>
      </Html>
    </group>
  );
}
