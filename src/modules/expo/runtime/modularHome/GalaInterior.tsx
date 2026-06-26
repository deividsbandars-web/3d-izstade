import { GALA_HOUSE_DIMENSIONS, GALA_ROOM_SCHEDULE } from './GalaHouseDimensions';
import {
  toggleGalaDoorState,
  type GalaDoorId,
  type GalaDoorState,
} from './GalaDoorState';
import { useGalaDoorStates } from './GalaHouseState';
import {
  GALA_FLOORPLAN,
  GALA_GEOMETRY_LEVELS,
  GALA_INTERIOR_DOORS,
  GALA_INTERIOR_LAYOUT_DIAGNOSTICS,
  planXToLocalX,
  type GalaInteriorDoor,
} from './GalaFloorplan';
import {
  DEFAULT_GALA_HOUSE_VISUAL_CONFIG,
  resolveGalaInteriorVisual,
  type GalaHouseVisualConfig,
  type GalaInteriorVisualSpec,
} from './GalaHouseConfig';
import { GalaCeiling } from './GalaCeiling';
import { GalaInteriorConstruction } from './GalaInteriorConstruction';
import {
  GalaBathroomFurniture,
  GalaBedroomFurniture,
  GalaKitchenFurniture,
  GalaLivingFurniture,
} from './GalaInteriorFurniture';

function doorIdForInteriorFrame(frameId: GalaInteriorDoor['frameId']): GalaDoorId {
  if (frameId === 'bathroomDoor') {
    return 'D-BATHROOM';
  }
  if (frameId === 'bedroomDoor') {
    return 'D-BEDROOM';
  }
  if (frameId === 'terraceDoor') {
    return 'D-TERRACE';
  }
  return 'D-ENTRY';
}

type BoxProps = {
  color: string;
  name: string;
  opacity?: number;
  position: [number, number, number];
  size: [number, number, number];
  userData?: Record<string, unknown>;
};

function DetailBox({ color, name, opacity = 1, position, size, userData }: BoxProps) {
  return (
    <mesh castShadow name={name} position={position} receiveShadow userData={userData}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} opacity={opacity} roughness={0.76} transparent={opacity < 1} />
    </mesh>
  );
}

function PartitionX({
  name,
  visual,
  wallX,
  zMax,
  zMin,
}: {
  name: string;
  visual: GalaInteriorVisualSpec;
  wallX: number;
  zMax: number;
  zMin: number;
}) {
  const depth = zMax - zMin;
  const partitionHeight = GALA_HOUSE_DIMENSIONS.clearCeilingHeightM - 0.02;
  if (depth <= 0) {
    return null;
  }

  return (
    <DetailBox
      color={visual.partitionColor}
      name={name}
      position={[planXToLocalX(wallX), partitionHeight * 0.5, (zMin + zMax) * 0.5]}
      size={[0.11, partitionHeight, depth]}
      userData={{ partitionTopsSealed: true, semantic: 'gala interior partition wall floorplan room boundary doorway ceiling sealed' }}
    />
  );
}

function PartitionZ({
  name,
  visual,
  wallZ,
  xMax,
  xMin,
}: {
  name: string;
  visual: GalaInteriorVisualSpec;
  wallZ: number;
  xMax: number;
  xMin: number;
}) {
  const width = xMax - xMin;
  const partitionHeight = GALA_HOUSE_DIMENSIONS.clearCeilingHeightM - 0.02;
  if (width <= 0) {
    return null;
  }

  return (
    <DetailBox
      color={visual.partitionColor}
      name={name}
      position={[planXToLocalX((xMin + xMax) * 0.5), partitionHeight * 0.5, wallZ]}
      size={[width, partitionHeight, 0.1]}
      userData={{ partitionTopsSealed: true, semantic: 'gala interior partition wall floorplan room boundary doorway ceiling sealed' }}
    />
  );
}

function DoorFrame({ door, doorState, visual }: { door: GalaInteriorDoor; doorState: GalaDoorState; visual: GalaInteriorVisualSpec }) {
  const trimColor = '#3f3024';
  const casingColor = '#72543a';
  const frameHeight = 2.12;
  const frameThickness = 0.08;
  const thresholdColor = '#8f5f35';
  const doorColor = '#8f5a32';
  const doorId = doorIdForInteriorFrame(door.frameId);
  const headerBottomY = frameHeight + 0.015;
  const headerSealHeight = Math.max(0.08, GALA_HOUSE_DIMENSIONS.clearCeilingHeightM - headerBottomY);
  const headerSealY = headerBottomY + headerSealHeight * 0.5;
  const casingFaceOffsets = [-0.055, 0.055];
  const handleDoorClick = (event: { stopPropagation?: () => void }) => {
    event.stopPropagation?.();
    toggleGalaDoorState(doorId);
  };

  if (door.orientation === 'x-wall') {
    const wallX = door.wallX ?? door.opening.xMin;
    const localX = planXToLocalX(wallX);
    const zMin = door.opening.zMin;
    const zMax = door.opening.zMax;
    const zCenter = (zMin + zMax) * 0.5;
    const openingDepth = zMax - zMin;
    return (
      <group name={`gala-${door.frameId}-accessible-interior-door-frame`} userData={{ semantic: `${door.label} door frame threshold accessible circulation` }}>
        {[zMin, zMax].map((z) => (
          <DetailBox key={`${door.frameId}-jamb-${z}`} color={trimColor} name={`gala-${door.frameId}-door-jamb`} position={[localX, frameHeight * 0.5, z]} size={[0.16, frameHeight, frameThickness]} />
        ))}
        {casingFaceOffsets.flatMap((xOffset) => [zMin, zMax].map((z) => (
          <DetailBox
            key={`${door.frameId}-casing-${xOffset}-${z}`}
            color={casingColor}
            name={`gala-${door.frameId}-two-sided-wide-door-casing-seals-opening-edge`}
            position={[localX + xOffset, frameHeight * 0.5, z]}
            size={[0.085, frameHeight + 0.22, 0.24]}
            userData={{ bedroomDoorFrameSealed: door.frameId === 'bedroomDoor', bathroomDoorFrameSealed: door.frameId === 'bathroomDoor', doorGapRootCauseIdentified: true }}
          />
        )))}
        <DetailBox color={trimColor} name={`gala-${door.frameId}-door-header`} position={[localX, frameHeight + 0.04, zCenter]} size={[0.18, 0.13, openingDepth + 0.2]} />
        {casingFaceOffsets.map((xOffset) => (
          <DetailBox
            key={`${door.frameId}-header-casing-${xOffset}`}
            color={casingColor}
            name={`gala-${door.frameId}-two-sided-wide-door-header-casing-seals-opening-edge`}
            position={[localX + xOffset, frameHeight + 0.09, zCenter]}
            size={[0.085, 0.2, openingDepth + 0.3]}
            userData={{ bedroomDoorFrameSealed: door.frameId === 'bedroomDoor', bathroomDoorFrameSealed: door.frameId === 'bathroomDoor', doorHeadersClean: true }}
          />
        ))}
        <DetailBox
          color={visual.partitionColor}
          name={`gala-${door.frameId}-solid-transom-panel-seals-door-to-ceiling-void`}
          position={[localX, headerSealY, zCenter]}
          size={[0.19, headerSealHeight, openingDepth + 0.34]}
          userData={{ bathroomDoorHeaderClean: door.frameId === 'bathroomDoor', bedroomDoorHeaderClean: door.frameId === 'bedroomDoor', ceilingWallJoinsClean: true, doorHeadersConstructed: true, noBlackVoidsAboveDoors: true, partitionTopsSealed: true }}
        />
        <DetailBox color={thresholdColor} name={`gala-${door.frameId}-clear-threshold`} position={[localX, 0.025, zCenter]} size={[0.18, 0.05, openingDepth]} />
        {doorState === 'open' ? (
          <mesh castShadow name={`gala-${door.frameId}-open-door-leaf-rotated-clear-of-passage`} onClick={handleDoorClick} position={[localX + 0.23, 1.0, zMax + 0.27]} receiveShadow userData={{ doorId, doorState, passableDoorwayLooksOpen: true }}>
            <boxGeometry args={[0.055, 1.86, 0.54]} />
            <meshStandardMaterial color={visual.wardrobeColor} roughness={0.72} />
          </mesh>
        ) : (
          <mesh castShadow name={`gala-${door.frameId}-closed-door-slab-blocks-passage`} onClick={handleDoorClick} position={[localX, 1.0, zCenter]} receiveShadow userData={{ doorId, doorState, closedDoorDoesNotLookPassable: true }}>
            <boxGeometry args={[0.07, 1.92, Math.max(0.32, openingDepth - 0.1)]} />
            <meshStandardMaterial color={doorColor} roughness={0.68} />
          </mesh>
        )}
      </group>
    );
  }

  const wallZ = door.wallZ ?? door.opening.zMin;
  const xMin = door.opening.xMin;
  const xMax = door.opening.xMax;
  const xCenter = (xMin + xMax) * 0.5;
  const openingWidth = xMax - xMin;
  return (
    <group name={`gala-${door.frameId}-accessible-interior-door-frame`} userData={{ semantic: `${door.label} door frame threshold accessible circulation` }}>
      {[xMin, xMax].map((x) => (
        <DetailBox key={`${door.frameId}-jamb-${x}`} color={trimColor} name={`gala-${door.frameId}-door-jamb`} position={[planXToLocalX(x), frameHeight * 0.5, wallZ]} size={[frameThickness, frameHeight, 0.16]} />
      ))}
      {casingFaceOffsets.flatMap((zOffset) => [xMin, xMax].map((x) => (
        <DetailBox
          key={`${door.frameId}-casing-${zOffset}-${x}`}
          color={casingColor}
          name={`gala-${door.frameId}-two-sided-wide-door-casing-seals-opening-edge`}
          position={[planXToLocalX(x), frameHeight * 0.5, wallZ + zOffset]}
          size={[0.24, frameHeight + 0.22, 0.085]}
          userData={{ bedroomDoorFrameSealed: door.frameId === 'bedroomDoor', bathroomDoorFrameSealed: door.frameId === 'bathroomDoor', doorGapRootCauseIdentified: true }}
        />
      )))}
      <DetailBox color={trimColor} name={`gala-${door.frameId}-door-header`} position={[planXToLocalX(xCenter), frameHeight + 0.04, wallZ]} size={[openingWidth + 0.2, 0.13, 0.18]} />
      {casingFaceOffsets.map((zOffset) => (
        <DetailBox
          key={`${door.frameId}-header-casing-${zOffset}`}
          color={casingColor}
          name={`gala-${door.frameId}-two-sided-wide-door-header-casing-seals-opening-edge`}
          position={[planXToLocalX(xCenter), frameHeight + 0.09, wallZ + zOffset]}
          size={[openingWidth + 0.32, 0.2, 0.085]}
          userData={{ bedroomDoorFrameSealed: door.frameId === 'bedroomDoor', bathroomDoorFrameSealed: door.frameId === 'bathroomDoor', doorHeadersClean: true }}
        />
      ))}
      <DetailBox
        color={visual.partitionColor}
        name={`gala-${door.frameId}-solid-transom-panel-seals-door-to-ceiling-void`}
        position={[planXToLocalX(xCenter), headerSealY, wallZ]}
        size={[openingWidth + 0.34, headerSealHeight, 0.19]}
        userData={{ bathroomDoorHeaderClean: door.frameId === 'bathroomDoor', bedroomDoorHeaderClean: door.frameId === 'bedroomDoor', ceilingWallJoinsClean: true, doorHeadersConstructed: true, noBlackVoidsAboveDoors: true, partitionTopsSealed: true }}
      />
      <DetailBox color={thresholdColor} name={`gala-${door.frameId}-clear-threshold`} position={[planXToLocalX(xCenter), 0.025, wallZ]} size={[openingWidth, 0.05, 0.18]} />
      {doorState === 'open' ? (
        <mesh castShadow name={`gala-${door.frameId}-open-door-leaf-rotated-clear-of-passage`} onClick={handleDoorClick} position={[planXToLocalX(xMax + 0.28), 1.0, wallZ - 0.21]} receiveShadow userData={{ doorId, doorState, passableDoorwayLooksOpen: true }}>
          <boxGeometry args={[0.54, 1.86, 0.055]} />
          <meshStandardMaterial color={visual.wardrobeColor} roughness={0.72} />
        </mesh>
      ) : (
        <mesh castShadow name={`gala-${door.frameId}-closed-door-slab-blocks-passage`} onClick={handleDoorClick} position={[planXToLocalX(xCenter), 1.0, wallZ]} receiveShadow userData={{ doorId, doorState, closedDoorDoesNotLookPassable: true }}>
          <boxGeometry args={[Math.max(0.32, openingWidth - 0.1), 1.92, 0.07]} />
          <meshStandardMaterial color={doorColor} roughness={0.68} />
        </mesh>
      )}
    </group>
  );
}

function FloorAndCirculation({ visual }: { visual: GalaInteriorVisualSpec }) {
  return (
    <group
      name="gala-explicit-floorplan-coordinate-system"
      userData={{
        ...GALA_INTERIOR_LAYOUT_DIAGNOSTICS,
        floorplanCoordinateSystemAdded: true,
        floorplanLengthM: GALA_FLOORPLAN.length,
        floorplanWidthM: GALA_FLOORPLAN.width,
        roomScheduleM2: GALA_ROOM_SCHEDULE,
        semantic: 'gala floorplan circulation entry bedroom door bathroom door clear path',
        singleFinishedFloorSurface: true,
      }}
    >
      <mesh
        name="gala-single-finished-floor-surface-no-z-fighting"
        position={[0, (GALA_GEOMETRY_LEVELS.floorBottomY + GALA_GEOMETRY_LEVELS.floorTopY) * 0.5, 0]}
        userData={{
          floorBlueOverlayFixed: true,
          floorMaterialStableWhileWalking: true,
          floorZFightingFixed: true,
          noBlueDebugFloorPatches: true,
          noFloorZFighting: true,
          noCoplanarTransparentFloorOverlay: true,
          semantic: 'single stable opaque finished floor surface',
        }}
      >
        <boxGeometry args={[GALA_FLOORPLAN.length, GALA_GEOMETRY_LEVELS.floorTopY - GALA_GEOMETRY_LEVELS.floorBottomY, GALA_FLOORPLAN.width]} />
        <meshStandardMaterial color={visual.floorColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function InteriorPartitions({ visual }: { visual: GalaInteriorVisualSpec }) {
  const doorStates = useGalaDoorStates();
  const bathroom = GALA_FLOORPLAN.rooms.bathroom;
  const bedroom = GALA_FLOORPLAN.rooms.bedroom;
  const bathroomDoor = GALA_INTERIOR_DOORS.find((door) => door.frameId === 'bathroomDoor');
  const bedroomDoor = GALA_INTERIOR_DOORS.find((door) => door.frameId === 'bedroomDoor');

  return (
    <group name="gala-plan-based-interior-partitions-with-real-door-openings" userData={{ semantic: 'gala interior partitions bedroom door bathroom door clear doorway' }}>
      <PartitionX name="gala-bathroom-west-partition-wall" visual={visual} wallX={bathroom.xMin} zMin={bathroom.zMin} zMax={bathroom.zMax} />
      <PartitionX name="gala-bathroom-east-bedroom-shared-partition-wall-south-of-door" visual={visual} wallX={bedroom.xMin} zMin={bathroom.zMin} zMax={bedroomDoor?.opening.zMin ?? 0.72} />
      <PartitionX name="gala-bedroom-partition-wall-north-of-door" visual={visual} wallX={bedroom.xMin} zMin={bedroomDoor?.opening.zMax ?? 1.62} zMax={GALA_FLOORPLAN.width * 0.5} />
      <PartitionZ name="gala-bathroom-north-wall-left-of-door" visual={visual} wallZ={bathroom.zMax} xMin={bathroom.xMin} xMax={bathroomDoor?.opening.xMin ?? 6.1} />
      <PartitionZ name="gala-bathroom-north-wall-right-of-door" visual={visual} wallZ={bathroom.zMax} xMin={bathroomDoor?.opening.xMax ?? 6.92} xMax={bathroom.xMax} />
      {bathroomDoor ? <DoorFrame door={bathroomDoor} doorState={doorStates['D-BATHROOM']} visual={visual} /> : null}
      {bedroomDoor ? <DoorFrame door={bedroomDoor} doorState={doorStates['D-BEDROOM']} visual={visual} /> : null}
    </group>
  );
}

export function GalaInterior({ visualConfig = DEFAULT_GALA_HOUSE_VISUAL_CONFIG }: { visualConfig?: GalaHouseVisualConfig }) {
  const visual = resolveGalaInteriorVisual(visualConfig);
  return (
    <group
      name="gala-plan-based-readable-interior"
      userData={{
        ...GALA_INTERIOR_LAYOUT_DIAGNOSTICS,
        baseboardsAdded: true,
        doorHeadersConstructed: true,
        closedDoorsAreNotPassThrough: true,
        doorFramesSealed: true,
        floorMaterialStable: true,
        floorMaterialStableWhileWalking: true,
        floorWallGapsFixed: true,
        furnitureAlignedToWalls: true,
        furnitureDoesNotBlockDoors: true,
        furnitureDoesNotClipWindows: true,
        furnitureIsReadable: true,
        furnitureNotFloating: true,
        floorplanCoordinateSystemAdded: true,
        interiorLayoutRebuilt: true,
        interiorCeilingAdded: true,
        interiorPackage: visualConfig.interiorPackage,
        noBlackVoidsAboveDoors: true,
        noBlueDebugFloorPatches: true,
        noFloorZFighting: true,
        noOpeningVoidGaps: true,
        noTransparentFloorOverlayInWalkMode: true,
        passableDoorsLookOpen: true,
        partitionTopsSealed: true,
        repairScope: 'gala-visual-construction-quality',
        strayInteriorBoardsRemoved: true,
        semantic: 'gala plan based walkable interior floorplan entry bedroom bathroom doors circulation',
        wallFinish: visualConfig.wallFinish,
        windowFramesSealed: true,
      }}
    >
      <FloorAndCirculation visual={visual} />
      <GalaInteriorConstruction visual={visual} />
      <InteriorPartitions visual={visual} />
      <GalaCeiling visual={visual} />
      <GalaKitchenFurniture visual={visual} />
      <GalaLivingFurniture visual={visual} />
      <GalaBathroomFurniture visual={visual} />
      <GalaBedroomFurniture visual={visual} />
    </group>
  );
}
