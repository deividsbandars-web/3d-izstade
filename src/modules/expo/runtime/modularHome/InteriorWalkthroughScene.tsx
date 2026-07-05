import { Html } from '@react-three/drei';
import type { Vector3Tuple } from 'three';
import {
  MODULAR_HOME_INTERIOR_FLOOR_STYLE_VISUALS,
  MODULAR_HOME_DOOR_PACKAGE_VISUALS,
  MODULAR_HOME_DOOR_PLACEMENT_VISUALS,
  MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS,
  MODULAR_HOME_WINDOW_FRAME_TYPE_VISUALS,
  MODULAR_HOME_WINDOW_PACKAGE_VISUALS,
  MODULAR_HOME_WALL_PANEL_STYLE_VISUALS,
  type ModularHomeConfiguratorState,
  type ModularHomeViewModeOption,
} from './modularHomeConfigurator';
const FLOORPLAN_BOUNDARY_COLOR = '#e0f2fe', INTERIOR_FINISH_LINE_COLOR = '#8a5f33', SEAM_COLOR = '#0f172a';
export type FootprintBounds = { centerX: number; centerZ: number; depth: number; maxX: number; maxZ: number; minX: number; minZ: number; width: number; };
export type InteriorPlanZone = { areaM2: number; depth: number; label: string; tone: string; width: number; x: number; z: number; zoneId: string; };
export type InteriorWallSegment = { depth: number; height: number; wallId: string; width: number; x: number; z: number; };
export type InteriorPlan = { walls: readonly InteriorWallSegment[]; zones: readonly InteriorPlanZone[]; };
function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
function formatFloorplanArea(areaM2: number): string {
  const rounded = roundOneDecimal(areaM2);
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} m²`;
}
function InteriorZoneLabel({ areaM2, isFloorplan, label, position, tone, zoneId }: {
  areaM2: number;
  isFloorplan: boolean;
  label: string;
  position: Vector3Tuple;
  tone: string;
  zoneId: string;
}) {
  if (!isFloorplan) {
    return null;
  }
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
  const isLongRun = segment.width >= segment.depth;
  const seamOffsets = getEvenlySpacedPanelOffsets(isLongRun ? Math.max(2, segment.width - 1) : Math.max(2, segment.depth - 1), 8.5);
  return (
    <group
      name={`interior-wall-${segment.wallId}`}
      position={[segment.x, wallY, segment.z]}
      userData={{
        componentCategory: 'interiorFinish',
        homeInteriorWall: true,
        wallId: segment.wallId,
      }}
    >
      <mesh scale={[segment.width, wallHeight, segment.depth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.82} metalness={0.02} />
      </mesh>
      {seamOffsets.map((offset) => (
        <mesh
          key={`${segment.wallId}-panel-seam-${offset}`}
          position={isLongRun ? [offset, 0, segment.depth / 2 + 0.04] : [segment.width / 2 + 0.04, 0, offset]}
          scale={isLongRun ? [0.08, wallHeight + 0.04, 0.04] : [0.04, wallHeight + 0.04, 0.08]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_FINISH_LINE_COLOR} opacity={isFloorplan ? 0.56 : 0.42} roughness={0.9} transparent />
        </mesh>
      ))}
      {!isFloorplan ? (
        <mesh position={[0, wallHeight / 2 - 0.18, 0]} scale={[segment.width + 0.04, 0.05, segment.depth + 0.04]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_FINISH_LINE_COLOR} opacity={0.26} roughness={0.92} transparent />
        </mesh>
      ) : null}
    </group>
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
function InteriorDividerPanel({
  color,
  name,
  opacity,
  position,
  scale,
}: {
  color: string;
  name: string;
  opacity: number;
  position: Vector3Tuple;
  scale: Vector3Tuple;
}) {
  return (
    <mesh name={name} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} opacity={opacity} roughness={0.84} transparent />
    </mesh>
  );
}
function getInteriorFocusLabel(focus: ModularHomeConfiguratorState['interiorZoneFocus']): string {
  switch (focus) {
    case 'living':
      return 'Living';
    case 'kitchen':
      return 'Kitchen';
    case 'sleeping':
      return 'Sleeping';
    case 'bathroom':
      return 'Bathroom';
    default:
      return 'Overview';
  }
}
function findInteriorFocusZone(plan: InteriorPlan, focus: ModularHomeConfiguratorState['interiorZoneFocus']): InteriorPlanZone | null {
  const focusNeedle = focus === 'overview'
    ? ''
    : focus === 'sleeping'
      ? 'bed'
      : focus;
  const zone = plan.zones.find((entry) => (
    focusNeedle.length === 0
      ? false
      : entry.zoneId.toLowerCase().includes(focusNeedle)
      || entry.label.toLowerCase().includes(focusNeedle)
  ));
  return zone ?? plan.zones[0] ?? null;
}
function getInteriorShellPalette(config: ModularHomeConfiguratorState) {
  const kitchenPalette = {
    dark: {
      backsplash: '#0f172a',
      cabinet: '#1f2937',
      counter: '#475569',
      detail: '#fbbf24',
    },
    white: {
      backsplash: '#e2e8f0',
      cabinet: '#f8fafc',
      counter: '#cbd5e1',
      detail: '#64748b',
    },
    wood: {
      backsplash: '#d6b98b',
      cabinet: '#8b5a2b',
      counter: '#b7791f',
      detail: '#fef3c7',
    },
  }[config.kitchenFinish];
  const furniturePalette = {
    minimal: {
      accent: '#93c5fd',
      bench: '#cbd5e1',
      dark: '#475569',
      lounge: '#94a3b8',
      soft: '#dbeafe',
    },
    premiumCompact: {
      accent: '#fbbf24',
      bench: '#78350f',
      dark: '#1f2937',
      lounge: '#0f766e',
      soft: '#fef3c7',
    },
    warm: {
      accent: '#fbbf24',
      bench: '#8b5a2b',
      dark: '#334155',
      lounge: '#0f766e',
      soft: '#fef3c7',
    },
  }[config.furnitureMood];
  return {
    kitchenPalette,
    furniturePalette,
  };
}
function InteriorWalkthroughFurniture({
  bounds,
  config,
  focusZone,
}: {
  bounds: FootprintBounds;
  config: ModularHomeConfiguratorState;
  focusZone: InteriorPlanZone | null;
}) {
  const { furniturePalette, kitchenPalette } = getInteriorShellPalette(config);
  const livingX = focusZone?.x ?? bounds.centerX - bounds.width * 0.1;
  const livingZ = focusZone?.z ?? bounds.centerZ + bounds.depth * 0.08;
  const kitchenX = bounds.centerX + bounds.width * 0.08;
  const kitchenZ = bounds.minZ + bounds.depth * 0.18;
  const sleepingX = bounds.centerX - bounds.width * 0.04;
  const sleepingZ = bounds.minZ + bounds.depth * 0.28;
  const bathroomX = bounds.maxX - bounds.width * 0.05;
  const bathroomZ = bounds.maxZ - bounds.depth * 0.08;
  return (
    <group name="modular-home-interior-furniture" userData={{ homeInteriorFurniture: true, furnitureMood: config.furnitureMood, kitchenFinish: config.kitchenFinish }}>
      <group name="living-zone-furniture">
        <FurnitureBox color={furniturePalette.lounge} furnitureType="sofa" name="living-sofa-seat" position={[livingX - 1.1, 1.26, livingZ + 0.42]} scale={[14.8, 1.16, 4.8]} />
        <FurnitureBox color={furniturePalette.dark} furnitureType="sofa" name="living-sofa-back" position={[livingX - 1.1, 2.1, livingZ - 0.76]} scale={[15.0, 2.02, 0.96]} />
        <FurnitureBox color={furniturePalette.soft} furnitureType="table" name="living-rug" position={[livingX - 0.08, 0.58, livingZ + 0.16]} scale={[19.0, 0.12, 12.6]} />
        <FurnitureBox color={furniturePalette.bench} furnitureType="table" name="living-coffee-table" position={[livingX - 0.12, 1.06, livingZ + 0.02]} scale={[6.2, 0.38, 3.8]} />
        <FurnitureBox color={furniturePalette.accent} furnitureType="shelf" name="living-wall-shelf" position={[livingX + 3.2, 2.34, livingZ - 1.48]} scale={[7.0, 0.8, 0.56]} />
        <FurnitureBox color="#d1fae5" furnitureType="decorative-block" name="living-plant" position={[livingX + 1.0, 1.24, livingZ + 2.0]} scale={[1.3, 2.3, 1.3]} />
        <FurnitureBox color="#cbd5e1" furnitureType="decorative-block" name="living-storage-panel" position={[livingX + 5.0, 1.96, livingZ + 0.1]} scale={[3.8, 4.0, 0.64]} />
        <FurnitureBox color="#1e293b" furnitureType="decorative-block" name="living-media-panel" position={[livingX + 4.0, 2.0, livingZ - 2.0]} scale={[5.0, 3.2, 0.26]} />
        <FurnitureBox color="#f59e0b" furnitureType="decorative-block" name="living-lamp" position={[livingX + 2.4, 2.2, livingZ + 2.6]} scale={[0.6, 3.2, 0.6]} />
        <FurnitureBox color="#e2e8f0" furnitureType="decorative-block" name="living-wall-art" position={[livingX - 4.4, 2.9, livingZ - 1.9]} scale={[2.0, 1.5, 0.12]} />
      </group>
      <group name="kitchen-zone-furniture">
        <FurnitureBox color={kitchenPalette.cabinet} furnitureType="kitchen-line" name="kitchen-base-cabinet" position={[kitchenX - 0.1, 1.34, kitchenZ + 0.18]} scale={[14.0, 1.68, 2.18]} />
        <FurnitureBox color={kitchenPalette.counter} furnitureType="kitchen-line" name="kitchen-counter" position={[kitchenX - 0.1, 2.2, kitchenZ + 0.18]} scale={[14.2, 0.28, 2.36]} />
        <FurnitureBox color={kitchenPalette.backsplash} furnitureType="kitchen-backsplash" name="kitchen-backsplash" position={[kitchenX - 0.1, 2.84, kitchenZ - 0.74]} scale={[13.8, 1.34, 0.22]} />
        <FurnitureBox color={kitchenPalette.detail} furnitureType="kitchen-sink" name="kitchen-sink-block" position={[kitchenX - 2.8, 2.12, kitchenZ + 0.28]} scale={[2.1, 0.24, 1.16]} />
        <FurnitureBox color={kitchenPalette.detail} furnitureType="kitchen-appliance" name="kitchen-appliance-block" position={[kitchenX + 3.2, 2.08, kitchenZ + 0.26]} scale={[1.58, 2.2, 1.38]} />
        <FurnitureBox color={kitchenPalette.cabinet} furnitureType="kitchen-appliance" name="kitchen-fridge-block" position={[kitchenX + 5.0, 2.16, kitchenZ + 0.5]} scale={[2.08, 3.52, 1.68]} />
        <FurnitureBox color={kitchenPalette.detail} furnitureType="kitchen-line" name="kitchen-island" position={[kitchenX + 0.18, 1.44, kitchenZ + 2.22]} scale={[7.4, 1.28, 2.72]} />
        <FurnitureBox color="#0f172a" furnitureType="kitchen-line" name="kitchen-range-hood" position={[kitchenX + 0.92, 3.1, kitchenZ - 0.46]} scale={[1.96, 0.84, 0.56]} />
        <FurnitureBox color={kitchenPalette.detail} furnitureType="kitchen-line" name="kitchen-open-shelf" position={[kitchenX - 4.8, 3.02, kitchenZ + 1.64]} scale={[2.9, 0.8, 0.46]} />
      </group>
      <group name="sleeping-zone-furniture">
        <FurnitureBox color={furniturePalette.soft} furnitureType="bed" name="sleeping-bed-base" position={[sleepingX + 1.0, 1.2, sleepingZ - 0.02]} scale={[13.0, 1.08, 6.4]} />
        <FurnitureBox color={furniturePalette.accent} furnitureType="bed" name="sleeping-bed-cover" position={[sleepingX + 1.0, 1.78, sleepingZ + 0.06]} scale={[12.2, 0.42, 5.9]} />
        <FurnitureBox color="#fff7ed" furnitureType="bed" name="sleeping-pillow" position={[sleepingX + 1.0, 2.1, sleepingZ - 2.18]} scale={[6.8, 0.38, 1.18]} />
        <FurnitureBox color={furniturePalette.bench} furnitureType="bedside-table" name="sleeping-bedside-table" position={[sleepingX + 4.2, 1.04, sleepingZ + 1.8]} scale={[2.0, 1.18, 1.9]} />
        <FurnitureBox color={furniturePalette.dark} furnitureType="wardrobe-placeholder" name="sleeping-wardrobe" position={[sleepingX - 2.6, 2.18, sleepingZ - 1.06]} scale={[4.5, 3.8, 1.36]} />
        <FurnitureBox color="#c4b5fd" furnitureType="bed" name="sleeping-foldout-chair" position={[sleepingX + 3.4, 1.1, sleepingZ - 2.12]} scale={[2.6, 2.0, 1.52]} />
        <FurnitureBox color="#d8b4fe" furnitureType="bed" name="sleeping-headboard" position={[sleepingX + 0.18, 2.22, sleepingZ - 3.0]} scale={[9.4, 1.12, 0.34]} />
        <FurnitureBox color="#fde68a" furnitureType="bed" name="sleeping-reading-light" position={[sleepingX + 4.6, 2.74, sleepingZ - 0.66]} scale={[0.4, 1.84, 0.4]} />
      </group>
      <group name="bathroom-zone-furniture">
        <FurnitureBox color="#dbeafe" furnitureType="bathroom-block" name="bathroom-vanity" position={[bathroomX - 0.1, 1.18, bathroomZ + 0.4]} scale={[4.6, 1.2, 2.04]} />
        <FurnitureBox color="#bae6fd" furnitureType="bathroom-block" name="bathroom-shower" position={[bathroomX - 2.8, 1.74, bathroomZ - 1.0]} scale={[4.8, 2.6, 3.5]} />
        <FurnitureBox color={furniturePalette.accent} furnitureType="bathroom-door" name="bathroom-door-placeholder" position={[bathroomX + 0.92, 2.1, bathroomZ - 1.86]} scale={[1.44, 2.6, 0.24]} />
        <FurnitureBox color="#f8fafc" furnitureType="bathroom-block" name="bathroom-vent-block" position={[bathroomX + 1.78, 2.64, bathroomZ + 0.82]} scale={[1.0, 1.04, 0.28]} />
        <FurnitureBox color="#94a3b8" furnitureType="bathroom-block" name="bathroom-mirror" position={[bathroomX - 0.08, 2.58, bathroomZ + 1.04]} scale={[1.9, 0.26, 0.12]} />
        <FurnitureBox color="#e2e8f0" furnitureType="bathroom-block" name="bathroom-toilet-placeholder" position={[bathroomX + 1.9, 1.18, bathroomZ - 0.58]} scale={[1.54, 1.52, 1.14]} />
        <FurnitureBox color="#cbd5e1" furnitureType="bathroom-block" name="bathroom-towel-shelf" position={[bathroomX - 3.2, 2.62, bathroomZ + 0.44]} scale={[1.34, 1.18, 0.28]} />
        <FurnitureBox color="#cbd5e1" furnitureType="bathroom-block" name="bathroom-partition-panel" position={[bathroomX - 1.2, 1.68, bathroomZ - 1.62]} scale={[0.36, 2.32, 2.42]} />
      </group>
    </group>
  );
}
export function InteriorWalkthroughScene({
  bounds,
  config,
  interiorFloorColor,
  interiorWallColor,
  plan,
}: {
  bounds: FootprintBounds;
  config: ModularHomeConfiguratorState;
  interiorFloorColor: string;
  interiorWallColor: string;
  plan: InteriorPlan;
}) {
  const roomWidth = Math.max(bounds.width + 2.8, 30);
  const roomDepth = Math.max(bounds.depth + 4.4, 27);
  const wallHeight = 3.08;
  const halfWidth = roomWidth / 2;
  const halfDepth = roomDepth / 2;
  const floorStyleVisual = MODULAR_HOME_INTERIOR_FLOOR_STYLE_VISUALS[config.interiorFloorStyle];
  const wallPanelVisual = MODULAR_HOME_WALL_PANEL_STYLE_VISUALS[config.wallPanelStyle];
  const windowFrameColor = MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS[config.windowFrameColor].color;
  const windowFrameTypeVisual = MODULAR_HOME_WINDOW_FRAME_TYPE_VISUALS[config.windowFrameType];
  const windowVisual = MODULAR_HOME_WINDOW_PACKAGE_VISUALS[config.windowPackage] ?? MODULAR_HOME_WINDOW_PACKAGE_VISUALS.standardWindows;
  const doorVisual = MODULAR_HOME_DOOR_PACKAGE_VISUALS[config.doorPackage] ?? MODULAR_HOME_DOOR_PACKAGE_VISUALS.standardEntry;
  const doorPlacementVisual = MODULAR_HOME_DOOR_PLACEMENT_VISUALS[config.doorPlacement] ?? MODULAR_HOME_DOOR_PLACEMENT_VISUALS.frontEntry;
  const terraceEnabled = config.terrace !== 'none';
  const focusZone = findInteriorFocusZone(plan, config.interiorZoneFocus);
  const floorSeamOffsetsX = getEvenlySpacedPanelOffsets(roomWidth - 2, Math.max(5.2, floorStyleVisual.lineSpacing));
  const floorSeamOffsetsZ = getEvenlySpacedPanelOffsets(roomDepth - 2, Math.max(4.8, floorStyleVisual.lineSpacing * 0.9));
  const roomAccentColor = getInteriorShellPalette(config).furniturePalette.accent;
  const shellTrimColor = MODULAR_HOME_WINDOW_FRAME_COLOR_VISUALS[config.windowFrameColor].color;
  const accentWallColor = config.wallPanelStyle === 'ribbedPanel'
    ? '#d9b16c'
    : config.wallPanelStyle === 'paintReadyBoard'
      ? '#dbeafe'
      : '#e7c892';
  const exitDoorX = doorPlacementVisual.placement === 'side'
    ? halfWidth - 2.6
    : doorPlacementVisual.placement === 'terrace'
      ? -halfWidth + 2.4
      : 0;
  const exitDoorZ = doorPlacementVisual.placement === 'front'
    ? halfDepth - 0.28
    : doorPlacementVisual.placement === 'terrace'
      ? -halfDepth + 0.26
      : 0;
  const interiorWindowScale: Vector3Tuple = [
    3.2 * windowVisual.widthMultiplier,
    1.7 * windowVisual.heightMultiplier,
    0.08,
  ];
  const interiorWindowFrameThickness = 0.045 * windowFrameTypeVisual.frameScale;
  const interiorWindowMullionThickness = 0.04 * windowFrameTypeVisual.mullionScale;
  const interiorWindowRevealDepth = windowFrameTypeVisual.revealDepth;
  const interiorWindowSillColor = '#5a371d';
  const interiorBackWindows: readonly { moduleId: string; position: Vector3Tuple }[] = [
    {
      moduleId: 'interior-back-window-left',
      position: [-roomWidth * 0.26, 2.9, -halfDepth + 0.28],
    },
    {
      moduleId: 'interior-back-window-right',
      position: [roomWidth * 0.26, 2.9, -halfDepth + 0.28],
    },
  ];
  return (
    <group name="modular-home-interior-walkthrough" userData={{ homeInteriorScene: true, homeInteriorZoneFocus: config.interiorZoneFocus }}>
      <ambientLight intensity={1.28} />
      <hemisphereLight color="#fff7ed" groundColor={interiorFloorColor} intensity={0.84} />
      <directionalLight color="#fff7ed" intensity={1.5} position={[-6, 16, 12]} />
      <directionalLight color="#bfdbfe" intensity={0.52} position={[10, 10, -8]} />
      <spotLight angle={0.72} color="#fff7ed" distance={80} intensity={1.7} penumbra={0.58} position={[0, 16, 0]} />
      <mesh position={[0, 0.12, 0]} receiveShadow scale={[roomWidth, 0.16, roomDepth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorFloorColor} roughness={0.86} metalness={0.02} />
      </mesh>
      {floorSeamOffsetsX.map((x) => (
        <mesh key={`interior-floor-seam-x-${x}`} position={[x, 0.22, 0]} scale={[0.08, 0.06, roomDepth - 1.6]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={floorStyleVisual.lineColor} opacity={0.58} roughness={0.9} transparent />
        </mesh>
      ))}
      {floorSeamOffsetsZ.map((z) => (
        <mesh key={`interior-floor-seam-z-${z}`} position={[0, 0.22, z]} scale={[roomWidth - 1.6, 0.06, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={floorStyleVisual.lineColor} opacity={0.5} roughness={0.9} transparent />
        </mesh>
      ))}
      <mesh position={[0, wallHeight / 2 + 0.16, -halfDepth]} scale={[roomWidth, wallHeight, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[-halfWidth, wallHeight / 2 + 0.16, 0]} scale={[0.6, wallHeight, roomDepth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[halfWidth, wallHeight / 2 + 0.16, 0]} scale={[0.6, wallHeight, roomDepth]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, wallHeight / 2 + 0.16, halfDepth]} scale={[roomWidth * 0.34, wallHeight, 0.56]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[roomWidth * 0.34, wallHeight / 2 + 0.16, halfDepth]} scale={[roomWidth * 0.34, wallHeight, 0.56]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[-roomWidth * 0.34, wallHeight / 2 + 0.16, halfDepth]} scale={[roomWidth * 0.34, wallHeight, 0.56]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={interiorWallColor} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.22, -halfDepth + 0.2]} scale={[roomWidth - 1.2, 0.14, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.22, halfDepth - 0.2]} scale={[roomWidth - 1.2, 0.14, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[-halfWidth + 0.2, 0.22, 0]} scale={[0.18, 0.14, roomDepth - 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[halfWidth - 0.2, 0.22, 0]} scale={[0.18, 0.14, roomDepth - 1.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[0, wallHeight + 0.04, -halfDepth + 0.34]} scale={[roomWidth - 2.2, 0.08, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} emissive={shellTrimColor} emissiveIntensity={0.1} roughness={0.64} />
      </mesh>
      <mesh position={[-halfWidth + 0.34, wallHeight + 0.04, 0]} scale={[0.22, 0.08, roomDepth - 2.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} emissive={shellTrimColor} emissiveIntensity={0.08} roughness={0.64} />
      </mesh>
      <mesh position={[halfWidth - 0.34, wallHeight + 0.04, 0]} scale={[0.22, 0.08, roomDepth - 2.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} emissive={shellTrimColor} emissiveIntensity={0.08} roughness={0.64} />
      </mesh>
      <mesh position={[0, wallHeight + 0.08, 0]} scale={[roomWidth - 3.6, 0.06, roomDepth - 3.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fef3c7" opacity={0.12} transparent roughness={0.94} />
      </mesh>
      <mesh position={[0, 1.08, -halfDepth + 0.92]} scale={[roomWidth * 0.54, 0.08, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accentWallColor} opacity={0.72} transparent roughness={0.86} />
      </mesh>
      <mesh position={[-halfWidth + 0.7, 1.92, -roomDepth * 0.06]} scale={[0.16, 2.18, roomDepth * 0.56]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accentWallColor} opacity={0.34} transparent roughness={0.82} />
      </mesh>
      <mesh position={[roomWidth * 0.24, 0.96, -halfDepth + 0.42]} scale={[roomWidth * 0.08, 0.06, 0.32]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.26} roughness={0.72} />
      </mesh>
      <mesh position={[-roomWidth * 0.24, 0.96, -halfDepth + 0.42]} scale={[roomWidth * 0.08, 0.06, 0.32]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.26} roughness={0.72} />
      </mesh>
      <mesh position={[roomWidth * 0.24, 2.74, -halfDepth + 0.42]} scale={[roomWidth * 0.08, 0.12, 0.42]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.18} roughness={0.68} />
      </mesh>
      <mesh position={[-roomWidth * 0.24, 2.74, -halfDepth + 0.42]} scale={[roomWidth * 0.08, 0.12, 0.42]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.18} roughness={0.68} />
      </mesh>
      <mesh position={[0, wallHeight + 0.08, 0]} scale={[roomWidth + 0.4, 0.08, roomDepth + 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={wallPanelVisual.color} opacity={0.62} transparent roughness={0.9} />
      </mesh>
      <mesh position={[0, wallHeight + 0.12, 0]} scale={[roomWidth - 1.6, 0.06, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={wallPanelVisual.seamColor} opacity={0.36} transparent roughness={0.92} />
      </mesh>
      <mesh position={[0, wallHeight + 0.18, 0]} scale={[0.16, 0.06, roomDepth - 1.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={wallPanelVisual.seamColor} opacity={0.3} transparent roughness={0.92} />
      </mesh>
      <InteriorDividerPanel
        color="#334155"
        name="interior-living-kitchen-divider"
        opacity={0.28}
        position={[0, 1.7, -roomDepth * 0.06]}
        scale={[0.2, 2.8, roomDepth * 0.42]}
      />
      <InteriorDividerPanel
        color="#475569"
        name="interior-sleeping-bath-divider"
        opacity={0.24}
        position={[roomWidth * 0.18, 1.6, roomDepth * 0.18]}
        scale={[0.18, 2.5, roomDepth * 0.3]}
      />
      <mesh position={[exitDoorX, 2.18, exitDoorZ]} scale={[3.4 * doorVisual.widthMultiplier, 2.8, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={doorVisual.doorColor} roughness={0.8} />
      </mesh>
      <mesh position={[exitDoorX, 2.18, exitDoorZ + 0.08]} scale={[3.72 * doorVisual.widthMultiplier, 3.02, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.68} />
      </mesh>
      <mesh position={[exitDoorX, 2.42, exitDoorZ + 0.38]} scale={[3.8 * doorVisual.widthMultiplier, 0.12, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={windowFrameColor} roughness={0.72} />
      </mesh>
      <mesh position={[exitDoorX, 3.46, exitDoorZ + 0.1]} scale={[3.88 * doorVisual.widthMultiplier, 0.16, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={shellTrimColor} roughness={0.68} />
      </mesh>
      <Html position={[exitDoorX, 3.88, exitDoorZ + 1.5]} center distanceFactor={38} occlude={false} pointerEvents="none">
        <div style={{ background: 'rgba(2, 6, 23, 0.76)', border: '1px solid rgba(34, 197, 94, 0.22)', borderRadius: '999px', color: '#f8fafc', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', padding: '5px 8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Exit back outside
        </div>
      </Html>
      {interiorBackWindows.map(({ moduleId, position }) => (
        <group
          key={moduleId}
          name={`window-module-${moduleId}`}
          position={position}
          userData={{
            componentCategory: 'windowUnit',
            homeConstructionElement: 'window-module',
            moduleId,
          }}
        >
          <mesh name={`${moduleId}-inner-reveal`} position={[0, 0, -0.04]} scale={[interiorWindowScale[0] + 0.18, interiorWindowScale[1] + 0.18, 0.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#020617" opacity={0.32} roughness={0.94} transparent />
          </mesh>
          <mesh name={`${moduleId}-glass-panel`} scale={interiorWindowScale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.14} roughness={0.25} metalness={0.05} />
          </mesh>
          <mesh name={`${moduleId}-top-bottom-frame`} position={[0, 0, 0.045 + interiorWindowRevealDepth * 0.12]} scale={[interiorWindowScale[0] + 0.08, interiorWindowFrameThickness, 0.02 + interiorWindowRevealDepth * 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-top-drip-cap`} position={[0, interiorWindowScale[1] / 2 + 0.11, 0.075 + interiorWindowRevealDepth * 0.24]} scale={[interiorWindowScale[0] + 0.52, 0.12 * windowFrameTypeVisual.frameScale, 0.16 + interiorWindowRevealDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.64} />
          </mesh>
          <mesh name={`${moduleId}-bottom-sill`} position={[0, -interiorWindowScale[1] / 2 - 0.12, 0.105 + interiorWindowRevealDepth * 0.18]} scale={[interiorWindowScale[0] + 0.72, 0.14 * windowFrameTypeVisual.frameScale, 0.24 + interiorWindowRevealDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={interiorWindowSillColor} roughness={0.82} />
          </mesh>
          <mesh name={`${moduleId}-bottom-apron-trim`} position={[0, -interiorWindowScale[1] / 2 - 0.26, 0.08 + interiorWindowRevealDepth * 0.14]} scale={[interiorWindowScale[0] + 0.46, 0.08 * windowFrameTypeVisual.frameScale, 0.14 + interiorWindowRevealDepth * 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={interiorWindowSillColor} roughness={0.84} />
          </mesh>
          <mesh name={`${moduleId}-vertical-mullion`} position={[0, 0, 0.05 + interiorWindowRevealDepth * 0.1]} scale={[interiorWindowMullionThickness, interiorWindowScale[1] + 0.09, 0.02 + interiorWindowRevealDepth * 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-horizontal-mullion`} position={[0, 0.02, 0.052 + interiorWindowRevealDepth * 0.1]} scale={[interiorWindowScale[0] + 0.08, 0.035 * windowFrameTypeVisual.mullionScale, 0.02 + interiorWindowRevealDepth * 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-left-frame`} position={[-interiorWindowScale[0] / 2, 0, 0.055 + interiorWindowRevealDepth * 0.14]} scale={[interiorWindowFrameThickness, interiorWindowScale[1] + 0.12, 0.02 + interiorWindowRevealDepth * 0.16]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-right-frame`} position={[interiorWindowScale[0] / 2, 0, 0.055 + interiorWindowRevealDepth * 0.14]} scale={[interiorWindowFrameThickness, interiorWindowScale[1] + 0.12, 0.02 + interiorWindowRevealDepth * 0.16]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-outer-head-trim`} position={[0, interiorWindowScale[1] / 2 + 0.22, 0.12 + interiorWindowRevealDepth * 0.24]} scale={[interiorWindowScale[0] + 0.84, 0.14 * windowFrameTypeVisual.frameScale, 0.22 + interiorWindowRevealDepth]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.66} />
          </mesh>
          <mesh name={`${moduleId}-outer-left-trim`} position={[-interiorWindowScale[0] / 2 - 0.18, 0, 0.11 + interiorWindowRevealDepth * 0.16]} scale={[0.14 * windowFrameTypeVisual.frameScale, interiorWindowScale[1] + 0.54, 0.18 + interiorWindowRevealDepth * 0.24]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-outer-right-trim`} position={[interiorWindowScale[0] / 2 + 0.18, 0, 0.11 + interiorWindowRevealDepth * 0.16]} scale={[0.14 * windowFrameTypeVisual.frameScale, interiorWindowScale[1] + 0.54, 0.18 + interiorWindowRevealDepth * 0.24]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={windowFrameColor} roughness={0.68} />
          </mesh>
          <mesh name={`${moduleId}-shadow-gap`} position={[0, 0, -0.02]} scale={[interiorWindowScale[0] + 0.32, interiorWindowScale[1] + 0.28, 0.035]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#020617" opacity={0.22} roughness={0.9} transparent />
          </mesh>
        </group>
      ))}
      <mesh position={[halfWidth - 0.28, 2.9, -roomDepth * 0.1]} scale={[0.08, 1.6 * windowVisual.heightMultiplier, 3.0 * windowVisual.sideDepthMultiplier]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.16} roughness={0.24} />
      </mesh>
      <mesh position={[-halfWidth + 0.52, 2.9, -halfDepth + 0.46]} scale={[0.18, 1.84 * windowVisual.heightMultiplier, 3.54 * windowVisual.sideDepthMultiplier]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={windowVisual.glassColor} emissive={windowVisual.glassColor} emissiveIntensity={0.12} roughness={0.24} />
      </mesh>
      <mesh position={[0, 2.56, -halfDepth + 0.42]} scale={[roomWidth * 0.46, 0.08, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={windowFrameColor} emissive={windowFrameColor} emissiveIntensity={0.08} roughness={0.72} />
      </mesh>
      <InteriorPlanOverlay interiorWallColor={interiorWallColor} plan={plan} viewMode="interior" />
      <InteriorWalkthroughFurniture bounds={bounds} config={config} focusZone={focusZone} />
      <mesh position={[0, 0.3, -halfDepth + (terraceEnabled ? 3.4 : 2.8)]} scale={[roomWidth - 6, 0.1, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.12} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.38, halfDepth - (terraceEnabled ? 3.0 : 2.4)]} scale={[roomWidth - 8, 0.08, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={roomAccentColor} emissive={roomAccentColor} emissiveIntensity={0.08} roughness={0.74} />
      </mesh>
      <Html position={[-halfWidth + 2.2, 4.2, -halfDepth + 1.2]} center distanceFactor={82} occlude={false} pointerEvents="none">
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.68)',
            border: '1px solid rgba(125, 211, 252, 0.16)',
            borderRadius: '11px',
            boxShadow: '0 10px 22px rgba(2, 6, 23, 0.22)',
            color: '#f8fafc',
            display: 'grid',
            gap: '2px',
            maxWidth: '112px',
            padding: '4px 6px',
            textAlign: 'left',
            whiteSpace: 'normal',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.36rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Interior focus
          </div>
          <div style={{ fontSize: '0.48rem', fontWeight: 950 }}>{getInteriorFocusLabel(config.interiorZoneFocus)} preset</div>
        </div>
      </Html>
    </group>
  );
}
function getEvenlySpacedPanelOffsets(span: number, maxPanelWidth = 10) {
  const panelCount = Math.max(2, Math.ceil(span / maxPanelWidth));
  const step = span / panelCount;
  return Array.from({ length: panelCount - 1 }, (_, index) => -span / 2 + step * (index + 1));
}
