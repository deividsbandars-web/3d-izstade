import type { ThreeEvent } from '@react-three/fiber';
import {
  toggleGalaDoorState,
  type GalaDoorState,
} from '../GalaDoorState';
import { useGalaDoorStates } from '../GalaHouseState';
import { resolveGalaOpeningVisual, type GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GALA_CONSTRUCTION_LEVELS,
  constructionAxisCenter,
  type GalaConstructionOpening,
  type GalaConstructionWallSegment,
} from './GalaConstructionModel';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from './GalaConstructionPbrTextures';
import { resolveGalaWallSkin } from './GalaWallSkinModel';

type GalaOpeningAssemblyProps = {
  onEntryDoorOpen?: () => void;
  opening: GalaConstructionOpening;
  visualConfig?: GalaHouseVisualConfig;
  wall: GalaConstructionWallSegment;
};

const FRAME_WIDTH = 0.105;
const CASING_OVERLAP = 0.13;
const CASING_DEPTH = 0.075;
const CASING_FACE_CLEARANCE = 0.026;
const JAMB_WALL_CELL_OVERLAP = 0.003;
const GLASS_DEPTH = 0.032;
const DOOR_LEAF_DEPTH = 0.056;
const WINDOW_GLASS_INSET_M = 0.022;
const DOOR_HANDLE_COLOR = '#1a1817';
const DOOR_HANDLE_PLATE_W = 0.038;
const DOOR_HANDLE_PLATE_H = 0.165;
const DOOR_HANDLE_PLATE_D = 0.011;
const DOOR_HANDLE_GRIP_SECTION = 0.016;
const DOOR_HANDLE_GRIP_REACH = 0.065;
const DOOR_HANDLE_RETURN_HEIGHT_M = 0.04;
const WINDOW_PULL_COLOR = '#1a1817';
const WINDOW_PULL_LENGTH = 0.09;
const WINDOW_PULL_SECTION = 0.014;

function wallPosition(wall: GalaConstructionWallSegment, axis: number, y: number, faceOffset = 0): [number, number, number] {
  const offsetX = wall.normal[0] * faceOffset;
  const offsetZ = wall.normal[1] * faceOffset;
  if (wall.axis === 'x') {
    return [axis + offsetX, y, (wall.zM ?? 0) + offsetZ];
  }
  return [(wall.xM ?? 0) + offsetX, y, axis + offsetZ];
}

function sizeAlongWall(wall: GalaConstructionWallSegment, axisSize: number, ySize: number, depth: number): [number, number, number] {
  return wall.axis === 'x'
    ? [axisSize, ySize, depth]
    : [depth, ySize, axisSize];
}

function sizeAcrossWall(wall: GalaConstructionWallSegment, jambWidth: number, ySize: number, revealDepth: number): [number, number, number] {
  return wall.axis === 'x'
    ? [jambWidth, ySize, revealDepth]
    : [revealDepth, ySize, jambWidth];
}

export function GalaOpeningAssembly({ onEntryDoorOpen, opening, visualConfig, wall }: GalaOpeningAssemblyProps) {
  const visual = resolveGalaOpeningVisual(visualConfig);
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const doorStates = useGalaDoorStates();
  const doorPbrTextures = useGalaConstructionPbrTextures('door');
  const trimPbrTextures = useGalaConstructionPbrTextures('trim');
  const axisCenter = constructionAxisCenter(opening.axisStartM, opening.widthM);
  const sillY = GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + opening.sillM;
  const yCenter = sillY + opening.heightM * 0.5;
  const openingEnd = opening.axisStartM + opening.widthM;
  const isDoor = opening.kind === 'door';
  const isExteriorDoor = isDoor && opening.source === 'opening-schedule';
  const doorState: GalaDoorState = opening.doorId ? doorStates[opening.doorId] : 'closed';
  const faceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.018;
  const revealDepth = GALA_CONSTRUCTION_LEVELS.revealDepthM;
  const casingFaceOffsets = [faceOffset + CASING_FACE_CLEARANCE, -faceOffset - CASING_FACE_CLEARANCE];
  const casingColor = visual.trimColor;
  const revealColor = wall.kind === 'exterior' ? wallSkin.exterior.openingRevealColor : wallSkin.interior.panelRevealColor;
  const thresholdColor = wall.kind === 'exterior' ? wallSkin.exterior.thresholdColor : wallSkin.interior.panelRevealColor;
  const showThreshold = isDoor && opening.source === 'opening-schedule';
  const revealMaterial = wall.kind === 'exterior'
    ? wallSkin.exterior.materials.reveal
    : wallSkin.interior.materials.panel;
  const trimMaterial = wall.kind === 'exterior'
    ? wallSkin.exterior.materials.trim
    : wallSkin.interior.materials.trim;
  const glassColor = visual.glassColor;
  const glassOpacity = 0.66;
  const doorColor = visual.doorColor;
  const slabWidth = Math.max(0.16, opening.widthM - 0.04);
  const slabHeight = Math.max(0.18, opening.heightM - 0.05);
  const visiblePanelWidth = isDoor ? slabWidth : Math.max(0.16, opening.widthM - WINDOW_GLASS_INSET_M);
  const visiblePanelHeight = isDoor ? slabHeight : Math.max(0.18, opening.heightM - WINDOW_GLASS_INSET_M);
  const slabDepth = isDoor ? DOOR_LEAF_DEPTH : GLASS_DEPTH;
  const headerY = sillY + opening.heightM + FRAME_WIDTH * 0.5 - JAMB_WALL_CELL_OVERLAP;
  const bottomY = opening.sillM <= 0.02
    ? GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + FRAME_WIDTH * 0.5
    : sillY - FRAME_WIDTH * 0.5 + JAMB_WALL_CELL_OVERLAP;
  const leftAxis = opening.axisStartM - FRAME_WIDTH * 0.5 + JAMB_WALL_CELL_OVERLAP;
  const rightAxis = openingEnd + FRAME_WIDTH * 0.5 - JAMB_WALL_CELL_OVERLAP;
  const commonUserData = {
    assembly: 'GalaOpeningAssembly',
    componentHint: 'construction/GalaOpeningAssembly.tsx',
    openingAssemblyOwnsDoorWindowRevealsCasing: true,
    openingId: opening.id,
    wallSkinModelOwner: 'GalaWallSkinModel',
    wallId: wall.id,
  };
  const handleDoorClick = (event: ThreeEvent<MouseEvent>) => {
    if (!opening.doorId) {
      return;
    }

    event.stopPropagation();
    const nextStates = toggleGalaDoorState(opening.doorId);
    if (opening.doorId === 'D-ENTRY' && nextStates[opening.doorId] === 'open') {
      onEntryDoorOpen?.();
    }
  };

  const openLeafFaceOffset = isExteriorDoor
    ? Math.max(0.42, slabWidth * 0.52)
    : wall.axis === 'x'
      ? -Math.sign(wall.normal[1] || 1) * Math.max(0.34, slabWidth * 0.42)
      : -Math.sign(wall.normal[0] || 1) * Math.max(0.34, slabWidth * 0.42);
  const openLeafPosition = wallPosition(wall, opening.axisStartM + FRAME_WIDTH * 0.82, yCenter, openLeafFaceOffset);
  const openLeafSize = wall.axis === 'x'
    ? [DOOR_LEAF_DEPTH, slabHeight, slabWidth * 0.78] as [number, number, number]
    : [slabWidth * 0.78, slabHeight, DOOR_LEAF_DEPTH] as [number, number, number];
  const doorHandleAxis = opening.axisStartM + opening.widthM - 0.07;
  const doorHandleY = sillY + 0.92;
  const doorHandleFaceSigns = [1, -1] as const;
  const doorFaceHalf = DOOR_LEAF_DEPTH * 0.5;
  const openLeafLatchOffset = Math.sign(openLeafFaceOffset || 1) * Math.max(0, (slabWidth * 0.78) * 0.5 - 0.07);
  const openLeafFaceAxis: [number, number] = wall.axis === 'x' ? [1, 0] : [0, 1];
  const doorHardwareParts = isDoor ? doorHandleFaceSigns.flatMap((faceSign) => {
    const isOpenDoor = doorState === 'open';
    const plateOffset = faceSign * (doorFaceHalf + DOOR_HANDLE_PLATE_D * 0.5);
    const gripOffset = faceSign * (doorFaceHalf + DOOR_HANDLE_PLATE_D + DOOR_HANDLE_GRIP_REACH * 0.5);
    const openLeafLatchPosition: [number, number, number] = [
      openLeafPosition[0] + wall.normal[0] * openLeafLatchOffset,
      doorHandleY,
      openLeafPosition[2] + wall.normal[1] * openLeafLatchOffset,
    ];
    const platePosition: [number, number, number] = isOpenDoor
      ? [
          openLeafLatchPosition[0] + openLeafFaceAxis[0] * plateOffset,
          doorHandleY,
          openLeafLatchPosition[2] + openLeafFaceAxis[1] * plateOffset,
        ]
      : wallPosition(wall, doorHandleAxis, doorHandleY, plateOffset);
    const gripPosition: [number, number, number] = isOpenDoor
      ? [
          openLeafLatchPosition[0] + openLeafFaceAxis[0] * gripOffset,
          doorHandleY,
          openLeafLatchPosition[2] + openLeafFaceAxis[1] * gripOffset,
        ]
      : wallPosition(wall, doorHandleAxis, doorHandleY, gripOffset);
    const plateSize = isOpenDoor
      ? sizeAlongWall(wall, DOOR_HANDLE_PLATE_D, DOOR_HANDLE_PLATE_H, DOOR_HANDLE_PLATE_W)
      : sizeAlongWall(wall, DOOR_HANDLE_PLATE_W, DOOR_HANDLE_PLATE_H, DOOR_HANDLE_PLATE_D);
    const gripSize = isOpenDoor
      ? sizeAlongWall(wall, DOOR_HANDLE_GRIP_REACH, DOOR_HANDLE_GRIP_SECTION, DOOR_HANDLE_PLATE_W * 0.5)
      : sizeAlongWall(wall, DOOR_HANDLE_PLATE_W * 0.5, DOOR_HANDLE_GRIP_SECTION, DOOR_HANDLE_GRIP_REACH);
    const returnFaceOffset = faceSign * (doorFaceHalf + DOOR_HANDLE_PLATE_D + DOOR_HANDLE_GRIP_REACH - DOOR_HANDLE_GRIP_SECTION * 0.5);
    const returnY = doorHandleY - DOOR_HANDLE_GRIP_SECTION * 0.5 - DOOR_HANDLE_RETURN_HEIGHT_M * 0.5;
    const returnPosition: [number, number, number] = isOpenDoor
      ? [
          openLeafLatchPosition[0] + openLeafFaceAxis[0] * returnFaceOffset,
          returnY,
          openLeafLatchPosition[2] + openLeafFaceAxis[1] * returnFaceOffset,
        ]
      : wallPosition(wall, doorHandleAxis, returnY, returnFaceOffset);
    const returnSize = isOpenDoor
      ? sizeAlongWall(wall, DOOR_HANDLE_GRIP_SECTION, DOOR_HANDLE_RETURN_HEIGHT_M, DOOR_HANDLE_PLATE_W * 0.5)
      : sizeAlongWall(wall, DOOR_HANDLE_PLATE_W * 0.5, DOOR_HANDLE_RETURN_HEIGHT_M, DOOR_HANDLE_GRIP_SECTION);

    return [
      {
        color: DOOR_HANDLE_COLOR,
        key: `face-${faceSign}-plate`,
        name: `gala-construction-${opening.id}-door-handle-plate`,
        position: platePosition,
        size: plateSize,
        userData: {
          ...commonUserData,
          doorHardwarePart: 'plate',
          doorState,
        },
      },
      {
        color: DOOR_HANDLE_COLOR,
        key: `face-${faceSign}-grip`,
        name: `gala-construction-${opening.id}-door-handle-grip-bar`,
        position: gripPosition,
        size: gripSize,
        userData: {
          ...commonUserData,
          doorHardwarePart: 'grip',
          doorState,
        },
      },
      {
        color: DOOR_HANDLE_COLOR,
        key: `face-${faceSign}-return`,
        name: `gala-construction-${opening.id}-door-handle-lever-return-tip`,
        position: returnPosition,
        size: returnSize,
        userData: {
          ...commonUserData,
          doorHardwarePart: 'return',
          doorState,
        },
      },
    ];
  }) : [];
  const glassFaceInterior = -(GLASS_DEPTH * 0.5);
  const windowPullY = sillY + opening.heightM * 0.38;
  const windowPullSize = sizeAlongWall(wall, WINDOW_PULL_LENGTH, WINDOW_PULL_SECTION, WINDOW_PULL_SECTION);
  const windowPullPosition = wallPosition(
    wall,
    axisCenter,
    windowPullY,
    glassFaceInterior - WINDOW_PULL_SECTION * 0.5 - 0.004,
  );
  const jambLinerInstances: GalaConstructionBoxInstance[] = [leftAxis, rightAxis].map((axis) => ({
    position: wallPosition(wall, axis, yCenter, 0),
    size: sizeAcrossWall(wall, FRAME_WIDTH, opening.heightM + CASING_OVERLAP, revealDepth),
  }));
  const headerSillLinerInstances: GalaConstructionBoxInstance[] = [
    {
      position: wallPosition(wall, axisCenter, headerY, 0),
      size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP, FRAME_WIDTH, revealDepth),
    },
    ...(!isDoor ? [{
      position: wallPosition(wall, axisCenter, bottomY, 0),
      size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP, FRAME_WIDTH, revealDepth),
    }] : []),
  ];
  const casingInstances: GalaConstructionBoxInstance[] = casingFaceOffsets.flatMap((offset) => ([
    {
      position: wallPosition(wall, leftAxis, yCenter, offset),
      size: sizeAcrossWall(wall, FRAME_WIDTH * 1.2, opening.heightM + CASING_OVERLAP * 1.8, CASING_DEPTH),
    },
    {
      position: wallPosition(wall, rightAxis, yCenter, offset),
      size: sizeAcrossWall(wall, FRAME_WIDTH * 1.2, opening.heightM + CASING_OVERLAP * 1.8, CASING_DEPTH),
    },
    {
      position: wallPosition(wall, axisCenter, headerY, offset),
      size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP * 2, FRAME_WIDTH * 1.2, CASING_DEPTH),
    },
    ...(!isDoor ? [{
      position: wallPosition(wall, axisCenter, bottomY, offset),
      size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP * 2, FRAME_WIDTH, CASING_DEPTH),
    }] : []),
  ]));

  return (
    <group
      name={`gala-construction-opening-assembly-${opening.id}`}
      userData={{
        ...commonUserData,
        closedDoorsAreNotPassThrough: true,
        passableDoorsLookOpen: true,
        windowsAreSealed: opening.kind === 'window',
      }}
    >
      <GalaConstructionInstancedBoxes
        {...revealMaterial}
        {...trimPbrTextures}
        color={revealColor}
        instances={jambLinerInstances}
        name={`gala-construction-${opening.id}-wall-thickness-jamb-liner`}
        userData={{
          ...commonUserData,
          openingTrimUsesPbrTextureMaps: true,
          pbrTextureKind: 'trim',
          noVisibleSlitBetweenJambAndWall: true,
        }}
      />

      <GalaConstructionInstancedBoxes
        {...revealMaterial}
        {...trimPbrTextures}
        color={revealColor}
        instances={headerSillLinerInstances}
        name={`gala-construction-${opening.id}-wall-thickness-header-sill-liner`}
        userData={{
          ...commonUserData,
          openingTrimUsesPbrTextureMaps: true,
          pbrTextureKind: 'trim',
          doorHeadersNoVisibleGap: true,
        }}
      />

      <GalaConstructionInstancedBoxes
        {...trimMaterial}
        {...trimPbrTextures}
        color={casingColor}
        instances={casingInstances}
        name={`gala-construction-${opening.id}-two-sided-casing`}
        userData={{
          ...commonUserData,
          doorHeadersNoVisibleGap: true,
          openingTrimUsesPbrTextureMaps: true,
          pbrTextureKind: 'trim',
          twoSidedCasingInstanceCount: casingInstances.length,
        }}
      />

      {isDoor && doorState === 'open' ? (
        <GalaConstructionBox
          {...doorPbrTextures}
          color={doorColor}
          name={`gala-construction-${opening.id}-open-door-leaf-clear-passage`}
          onClick={handleDoorClick}
          position={openLeafPosition}
          roughness={0.68}
          size={openLeafSize}
          userData={{
            ...commonUserData,
            doorLeafUsesPbrTextureMaps: true,
            doorState: 'open',
            openDoorsArePassable: true,
            openDoorLooksPassable: true,
            pbrTextureKind: 'door',
          }}
        />
      ) : (
        <GalaConstructionBox
          {...(isDoor ? doorPbrTextures : {})}
          color={isDoor ? doorColor : glassColor}
          metalness={isDoor ? 0.08 : 0.18}
          name={isDoor
            ? `gala-construction-${opening.id}-closed-opaque-door-slab-blocks-passage`
            : `gala-construction-${opening.id}-transparent-window-glass-panel`}
          opacity={isDoor ? 1 : glassOpacity}
          onClick={isDoor ? handleDoorClick : undefined}
          position={wallPosition(wall, axisCenter, yCenter, isDoor ? 0 : 0)}
          renderOrder={isDoor ? undefined : 4}
          roughness={isDoor ? 0.68 : 0.28}
          size={sizeAlongWall(wall, visiblePanelWidth, visiblePanelHeight, slabDepth)}
          depthWrite={isDoor ? undefined : false}
          userData={{
            ...commonUserData,
            closedDoorsBlockPlayer: isDoor,
            doorLeafUsesPbrTextureMaps: isDoor,
            doorState,
            glassPanelsFillFrame: !isDoor,
            pbrTextureKind: isDoor ? 'door' : null,
            windowGlassOpacity: isDoor ? null : glassOpacity,
            windowGlassTransparent: !isDoor,
            windowsDoNotReadAsVoid: !isDoor,
            windowsStillSealed: !isDoor,
          }}
        />
      )}

      {doorHardwareParts.map((part) => (
        <GalaConstructionBox
          key={part.key}
          color={part.color}
          metalness={0.45}
          name={part.name}
          position={part.position}
          roughness={0.54}
          size={part.size}
          userData={part.userData}
        />
      ))}

      {!isDoor ? (
        <GalaConstructionBox
          color={WINDOW_PULL_COLOR}
          metalness={0.42}
          name={`gala-construction-${opening.id}-interior-window-pull-bar`}
          position={windowPullPosition}
          roughness={0.56}
          size={windowPullSize}
          userData={{
            ...commonUserData,
            windowHardwareInteriorOnly: true,
            windowHardwarePart: 'pull-bar',
          }}
        />
      ) : null}

      {showThreshold ? (
        <GalaConstructionBox
          {...trimMaterial}
          {...trimPbrTextures}
          color={thresholdColor}
          name={`gala-construction-${opening.id}-controlled-y-threshold-sill`}
          position={wallPosition(
            wall,
            axisCenter,
            GALA_CONSTRUCTION_LEVELS.thresholdTopY - (GALA_CONSTRUCTION_LEVELS.thresholdHeightM * 0.5),
            0,
          )}
          size={sizeAlongWall(wall, opening.widthM + 0.16, GALA_CONSTRUCTION_LEVELS.thresholdHeightM, revealDepth + 0.08)}
          userData={{
            ...commonUserData,
            finishedFloorTopY: GALA_CONSTRUCTION_LEVELS.finishedFloorTopY,
            openingTrimUsesPbrTextureMaps: true,
            pbrTextureKind: 'trim',
            thresholdTopY: GALA_CONSTRUCTION_LEVELS.thresholdTopY,
            thresholdsDoNotZFight: true,
          }}
        />
      ) : null}
    </group>
  );
}
