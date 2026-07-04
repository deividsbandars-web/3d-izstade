import { Html } from '@react-three/drei';
import { InteriorWalkthroughScene, type FootprintBounds, type InteriorPlan, type InteriorPlanZone, type InteriorWallSegment } from './InteriorWalkthroughScene';
import { useCallback } from 'react';
import type { Vector3Tuple } from 'three';
import { isHomeDemoEnabled, isHomeStudioEnabled } from './homeDemoFlags';
import {
  getModularHomeConfigSummary,
  MODULAR_HOME_FACADE_VISUALS,
  MODULAR_HOME_FINISH_LEVEL_VISUALS,
  MODULAR_HOME_ROOF_VISUALS,
  MODULAR_HOME_TERRACE_VISUALS,
  type ModularHomeFinishLevelOption,
  useModularHomeConfigurator,
  useModularHomeViewMode,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';
import {
  getModularHomeRoomUseProfileForConfig,
  getModularHomeProductForConfig,
  getModularHomeLayoutVariantForConfig,
  getModulesForConfig,
  type ModularHomeLayoutVariant,
  type ModularHomeModule,
  type ModularHomeModuleId,
  type ModularHomeProduct,
} from './modularHomeProducts';
import { GalaHouseShell } from './GalaHouseShell';
import { resolveGalaHouseVisualConfigFromModularHomeConfig } from './GalaHouseState';

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

type ModularHomeInteriorPackage =
  | 'emptyShell'
  | 'standardFurnishedPreview'
  | 'premiumInteriorPreview';

export type ModularHomeRenderDetailLevel = 'full' | 'reduced';

const ACTIVE_MODULAR_HOME_RENDER_DETAIL_LEVEL: ModularHomeRenderDetailLevel = 'full';

type ModularHomeModelProps = {
  renderDetailLevel?: ModularHomeRenderDetailLevel;
};

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

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function shouldShowFloatingHomeDemoModelLabel(homeStudioEnabled: boolean): boolean {
  // Keep the summary pill for non-studio demo captures, but never mount it in
  // the real-user modular home studio where it can block the product view.
  return !homeStudioEnabled;
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
  roomUseProfileId: string | undefined,
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

  const label = labelsByVariant[layoutVariant.id]?.[zoneKey] ?? fallback;

  if (zoneKey === 'compactBedroom') {
    if (roomUseProfileId === 'office') return 'Office';
    if (roomUseProfileId === 'guestRoom') return 'Guest room';
    if (roomUseProfileId === 'storage') return 'Storage room';
    if (roomUseProfileId === 'bedroom') return 'Bedroom';
  }

  if (zoneKey === 'compactLiving' && roomUseProfileId === 'largerLiving') {
    return 'Larger living / lounge';
  }

  if (zoneKey === 'familyBedroomB') {
    if (roomUseProfileId === 'office') return 'Office';
    if (roomUseProfileId === 'guestRoom') return 'Guest room';
    if (roomUseProfileId === 'storage') return 'Storage / utility room';
    if (roomUseProfileId === 'bedroom') return 'Bedroom 2';
  }

  if (zoneKey === 'familyStorage') {
    if (roomUseProfileId === 'office') return 'Office / utility';
    if (roomUseProfileId === 'guestRoom') return 'Guest room / storage';
    if (roomUseProfileId === 'storage') return 'Utility storage';
    if (roomUseProfileId === 'largerLiving') return 'Service / storage wall';
  }

  if (zoneKey === 'familyLiving' && roomUseProfileId === 'largerLiving') {
    return 'Larger living / kitchen';
  }

  if (zoneKey === 'saunaPrimary') {
    if (roomUseProfileId === 'guestRoom') return 'Guest room / rest area';
    if (roomUseProfileId === 'storage') return 'Storage / support room';
    if (roomUseProfileId === 'saunaRestRoom') return 'Sauna rest room';
  }

  return label;
}

function createInteriorPlan(
  product: ModularHomeProduct,
  blocks: readonly ModuleLayoutBlock[],
  bounds: FootprintBounds,
  layoutVariant: ModularHomeLayoutVariant | null,
  roomUseProfileId: string | undefined,
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
      zones.push(createZoneInBlock(living, 'family-living-kitchen', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'familyLiving', 'Living / kitchen'), INTERIOR_ZONE_COLORS.living, -0.08, 0.03, 0.78, 0.66));
      zones.push(createZoneInBlock(living, 'family-technical-storage', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'familyStorage', 'Technical / storage'), INTERIOR_ZONE_COLORS.storage, 0.34, -0.32, 0.28, 0.24));
      walls.push(createWall('family-storage-side-wall', living.x + living.width * 0.2, living.z - living.depth * 0.29, 0.64, living.depth * 0.33));
      walls.push(createWall('family-storage-front-wall', living.x + living.width * 0.34, living.z - living.depth * 0.15, living.width * 0.28, 0.64));
    }

    if (bedroomA) {
      zones.push(createZoneInBlock(bedroomA, 'family-bedroom-1', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'familyBedroomA', 'Bedroom 1'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
    }

    if (bedroomB) {
      zones.push(createZoneInBlock(bedroomB, 'family-bedroom-2', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'familyBedroomB', 'Bedroom 2'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.72, 0.68));
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
      zones.push(createZoneInBlock(sauna, 'sauna-rest-area', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'saunaPrimary', 'Sauna / rest area'), INTERIOR_ZONE_COLORS.sauna, -0.12, -0.1, 0.66, 0.56));
      zones.push(createZoneInBlock(sauna, 'sauna-changing-zone', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'saunaSecondary', 'Changing zone'), INTERIOR_ZONE_COLORS.changing, 0.22, 0.32, 0.36, 0.26));
      walls.push(createWall('sauna-changing-divider', sauna.x + sauna.width * 0.08, sauna.z + sauna.depth * 0.18, 0.64, sauna.depth * 0.42));
      walls.push(createWall('sauna-rest-divider', sauna.x - sauna.width * 0.18, sauna.z + sauna.depth * 0.12, sauna.width * 0.28, 0.64));
    }

    if (service) {
      zones.push(createZoneInBlock(service, 'sauna-service-core', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'saunaService', 'Service core'), INTERIOR_ZONE_COLORS.bathroom, 0, 0, 0.66, 0.64));
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
    zones.push(createZoneInBlock(living, 'compact-living-kitchen', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'compactLiving', 'Living / kitchen'), INTERIOR_ZONE_COLORS.living, -0.1, -0.06, 0.72, 0.62));
    zones.push(createZoneInBlock(living, 'compact-entrance-storage', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'compactStorage', 'Entrance / storage'), INTERIOR_ZONE_COLORS.entrance, 0.28, 0.32, 0.34, 0.26));
    walls.push(createWall('compact-entry-storage-wall', living.x + living.width * 0.1, living.z + living.depth * 0.23, 0.64, living.depth * 0.36));
    walls.push(createWall('compact-entry-back-wall', living.x + living.width * 0.28, living.z + living.depth * 0.18, living.width * 0.26, 0.64));
  }

  if (bedroom) {
    zones.push(createZoneInBlock(bedroom, 'compact-bedroom', getInteriorZoneLabel(layoutVariant, roomUseProfileId, 'compactBedroom', 'Bedroom'), INTERIOR_ZONE_COLORS.bedroom, 0, 0, 0.7, 0.66));
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

void createInteriorPlan;
void getFootprintBounds;
void InteriorWalkthroughScene;

export function ModularHomeModel({ renderDetailLevel = 'full' }: ModularHomeModelProps = {}) {
  const { config: homeConfig } = useModularHomeConfigurator();
  const { setViewMode, viewMode } = useModularHomeViewMode();
  const homeStudioEnabled = isHomeStudioEnabled();
  const enterInterior = useCallback(() => {
    setViewMode('interior');
  }, [setViewMode]);

  if (!homeStudioEnabled && !isHomeDemoEnabled()) {
    return null;
  }

  const config = getModularHomeTemplate(homeConfig.template);
  const product = getModularHomeProductForConfig(homeConfig);
  const modules = getModulesForConfig(homeConfig);
  const layoutVariant = getModularHomeLayoutVariantForConfig(homeConfig);
  const roomUseProfile = getModularHomeRoomUseProfileForConfig(homeConfig);
  const facadeVisual = MODULAR_HOME_FACADE_VISUALS[homeConfig.facade];
  const finishVisual = MODULAR_HOME_FINISH_LEVEL_VISUALS[homeConfig.finishLevel];
  const interiorPackage = INTERIOR_PACKAGE_BY_FINISH_LEVEL[homeConfig.finishLevel];
  const roofVisual = MODULAR_HOME_ROOF_VISUALS[homeConfig.roof];
  const terraceVisual = MODULAR_HOME_TERRACE_VISUALS[homeConfig.terrace];
  const configSummary = getModularHomeConfigSummary(homeConfig);
  const galaVisualConfig = resolveGalaHouseVisualConfigFromModularHomeConfig(homeConfig);

  if (!product) {
    return null;
  }

  const moduleBlocks = createModuleLayout(product, modules);
  const studioOrigin: Vector3Tuple = homeStudioEnabled ? [0, 0, 0] : config.position;
  const showFloatingHomeDemoModelLabel = shouldShowFloatingHomeDemoModelLabel(homeStudioEnabled);

  return (
    <group
      name="modular-home-preview-district"
      position={studioOrigin}
      rotation={[0, config.rotationY, 0]}
      userData={{
        homeDemoConfig: homeConfig,
        homeDemoLayoutVariant: layoutVariant?.id ?? homeConfig.layoutVariant,
        homeDemoRoomUseProfile: roomUseProfile?.id ?? homeConfig.roomUseProfile,
        homeDemoPreview: true,
        homeDemoViewMode: viewMode,
        modularHomeFurniturePackage: homeConfig.furniturePackage,
        modularHomeInteriorPackage: interiorPackage,
        modularHomeFurnitureToggles: `${homeConfig.sofa}:${homeConfig.table}:${homeConfig.bed}:${homeConfig.kitchenLine}:${homeConfig.wardrobePlaceholder}`,
        modularHomeFacadeMaterialId: facadeVisual.materialId,
        modularHomeFacadeBoardOrientation: homeConfig.facadeBoardOrientation,
        modularHomeFacadeBoardProfile: homeConfig.facadeBoardProfile,
        modularHomeFacadeBoardSpacing: homeConfig.facadeBoardSpacing,
        modularHomeFacadeBoardWidth: homeConfig.facadeBoardWidth,
        modularHomeFinishMaterialIds: finishVisual.materialIds,
        modularHomeFloorFinish: homeConfig.floorFinish,
        modularHomeInteriorFloorStyle: homeConfig.interiorFloorStyle,
        modularHomeInteriorWallFinish: homeConfig.interiorWallFinish,
        modularHomeWallPanelStyle: homeConfig.wallPanelStyle,
        modularHomeId: product.id,
        modularHomeModuleIds: modules.map((module) => module.id),
        modularHomeName: product.name,
        modularHomeRoofEdgeColor: homeConfig.roofEdgeColor,
        modularHomeRoofGutterStyle: homeConfig.roofGutterStyle,
        modularHomeRoofMaterialId: roofVisual.materialId,
        modularHomeRenderDetailLevel: ACTIVE_MODULAR_HOME_RENDER_DETAIL_LEVEL,
        modularHomeRenderDetailLockedFull: true,
        modularHomeRequestedRenderDetailLevel: renderDetailLevel,
        modularHomeTrimColor: homeConfig.trimColor,
        modularHomeWindowFrameColor: homeConfig.windowFrameColor,
        modularHomeWindowFrameType: homeConfig.windowFrameType,
        modularHomeGalaVisualConfig: galaVisualConfig,
        moduleBasedGeometry: true,
        source: 'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
      }}
    >
      <group
        name={`${product.id}-gala-30deg-model`}
        userData={{
          gala30DegPlanBasedModel: true,
          moduleLayoutProductId: product.id,
          referencePackageUsed: 'Koka_maja_GALA_30deg_pilns_komplekts',
        }}
      >
        <GalaHouseShell
          onEnterInterior={enterInterior}
          renderDetailLevel={ACTIVE_MODULAR_HOME_RENDER_DETAIL_LEVEL}
          viewMode={viewMode}
          visualConfig={galaVisualConfig}
        />
      </group>

      {showFloatingHomeDemoModelLabel ? (
        <Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
          <div
            data-home-demo-model-label="true"
            data-home-config-model-summary={`${homeConfig.template}:${homeConfig.layoutVariant}:${homeConfig.roomUseProfile}:${homeConfig.facade}:${homeConfig.roof}:${homeConfig.terrace}:${homeConfig.finishLevel}:${homeConfig.windowPlacement}:${homeConfig.doorPlacement}:${homeConfig.facadeBoardOrientation}:${homeConfig.facadeBoardWidth}:${homeConfig.facadeBoardProfile}:${homeConfig.facadeBoardSpacing}:${homeConfig.trimColor}:${homeConfig.roofEdgeColor}:${homeConfig.roofGutterStyle}:${homeConfig.windowFrameColor}:${homeConfig.windowFrameType}:${homeConfig.interiorWallFinish}:${homeConfig.floorFinish}:${homeConfig.interiorFloorStyle}:${homeConfig.wallPanelStyle}:${homeConfig.kitchenFinish}:${homeConfig.furnitureMood}:${homeConfig.interiorZoneFocus}:${homeConfig.furniturePackage}:${homeConfig.sofa}:${homeConfig.table}:${homeConfig.bed}:${homeConfig.kitchenLine}:${homeConfig.wardrobePlaceholder}`}
            data-home-demo-facade-board-orientation={homeConfig.facadeBoardOrientation}
            data-home-demo-facade-board-profile={homeConfig.facadeBoardProfile}
            data-home-demo-facade-board-spacing={homeConfig.facadeBoardSpacing}
            data-home-demo-facade-board-width={homeConfig.facadeBoardWidth}
            data-home-demo-floor-finish={homeConfig.floorFinish}
            data-home-demo-interior-floor-style={homeConfig.interiorFloorStyle}
            data-home-demo-interior-wall-finish={homeConfig.interiorWallFinish}
            data-home-demo-kitchen-finish={homeConfig.kitchenFinish}
            data-home-demo-layout-variant={layoutVariant?.id ?? homeConfig.layoutVariant}
            data-home-demo-furniture-mood={homeConfig.furnitureMood}
            data-home-demo-interior-zone-focus={homeConfig.interiorZoneFocus}
            data-home-demo-room-use-profile={roomUseProfile?.id ?? homeConfig.roomUseProfile}
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
            data-home-demo-roof-gutter-style={homeConfig.roofGutterStyle}
            data-home-demo-trim-color={homeConfig.trimColor}
            data-home-demo-view-mode={viewMode}
            data-home-demo-window-frame-color={homeConfig.windowFrameColor}
            data-home-demo-window-frame-type={homeConfig.windowFrameType}
            data-home-demo-wall-panel-style={homeConfig.wallPanelStyle}
            style={{
              background: 'rgba(15, 23, 42, 0.72)',
              border: '1px solid rgba(251, 191, 36, 0.26)',
              borderRadius: '999px',
              boxShadow: '0 12px 34px rgba(2, 6, 23, 0.35)',
              color: '#fff7ed',
              fontFamily: 'inherit',
              lineHeight: 1.1,
              padding: '6px 9px',
              textAlign: 'center',
              transform: 'translateY(-18px)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ color: '#fbbf24', fontSize: '0.48rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {config.sizeLabel} modular layout
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 950, marginTop: '2px' }}>{product.name}</div>
            <div style={{ color: '#bbf7d0', fontSize: '0.46rem', fontWeight: 850, marginTop: '3px' }}>
              {configSummary.layoutVariant} / {configSummary.kitchenFinish} / {configSummary.furnitureMood} / {configSummary.interiorZoneFocus}
            </div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
