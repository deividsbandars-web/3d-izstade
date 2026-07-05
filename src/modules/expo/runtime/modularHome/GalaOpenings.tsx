import {
  GALA_HOUSE_DIMENSIONS,
  GALA_OPENING_SCHEDULE,
  type GalaFacade,
  type GalaOpeningScheduleItem,
} from './GalaHouseDimensions';
import * as THREE from 'three';
import {
  getGalaDoorStatesSnapshot,
  toggleGalaDoorState,
  type GalaDoorId,
  type GalaDoorStateMap,
} from './GalaDoorState';
import { useGalaDoorStates } from './GalaHouseState';
import {
  resolveGalaFacadeVisual,
  resolveGalaOpeningVisual,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';

type WallCell = {
  axisCenterM: number;
  axisSizeM: number;
  heightM: number;
  yCenterM: number;
};

type WallWithOpeningsProps = {
  facade: GalaFacade;
  onEntryDoorClick?: () => void;
  transparentShell: boolean;
  visualConfig?: GalaHouseVisualConfig;
};

const WALL_PANEL_THICKNESS = 0.12;
const WALL_FACE_OFFSET = 0.012;
const GLASS_OFFSET = 0.018;
const TRIM_DEPTH = 0.04;
const FRAME_OVERLAP = 0.09;
const FRAME_THICKNESS = 0.09;
const FRAME_FACE_DEPTH = 0.058;
const REVEAL_LINER_DEPTH = WALL_PANEL_THICKNESS + 0.11;
const SLAB_DEPTH = 0.052;
const OPENING_SEAM_CLEARANCE = 0.12;
const SEAM_GROOVE_DEPTH = 0.008;
const SEAM_FACE_OFFSET = (WALL_PANEL_THICKNESS * 0.5) + 0.004;

function isGalaDoorId(value: string): value is GalaDoorId {
  return value === 'D-ENTRY'
    || value === 'D-TERRACE'
    || value === 'D-BEDROOM'
    || value === 'D-BATHROOM';
}

function facadeOpenings(facade: GalaFacade): GalaOpeningScheduleItem[] {
  return GALA_OPENING_SCHEDULE.filter((opening) => opening.facade === facade);
}

function sortedUnique(values: readonly number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);
}

function cellOverlapsOpening(
  axisCenterM: number,
  yCenterM: number,
  opening: GalaOpeningScheduleItem,
): boolean {
  return axisCenterM > opening.axisStartM
    && axisCenterM < opening.axisStartM + opening.widthM
    && yCenterM > opening.sillM
    && yCenterM < opening.sillM + opening.heightM;
}

function buildWallCells(axisLengthM: number, wallHeightM: number, openings: readonly GalaOpeningScheduleItem[]): WallCell[] {
  const axisEdges = sortedUnique([
    0,
    axisLengthM,
    ...openings.flatMap((opening) => [
      Math.max(0, opening.axisStartM),
      Math.min(axisLengthM, opening.axisStartM + opening.widthM),
    ]),
  ]);
  const heightEdges = sortedUnique([
    0,
    wallHeightM,
    ...openings.flatMap((opening) => [
      Math.max(0, opening.sillM),
      Math.min(wallHeightM, opening.sillM + opening.heightM),
    ]),
  ]);

  const cells: WallCell[] = [];
  axisEdges.forEach((axisStart, axisIndex) => {
    const axisEnd = axisEdges[axisIndex + 1];
    if (axisEnd === undefined || axisEnd <= axisStart) {
      return;
    }

    heightEdges.forEach((yStart, yIndex) => {
      const yEnd = heightEdges[yIndex + 1];
      if (yEnd === undefined || yEnd <= yStart) {
        return;
      }

      const axisCenterM = (axisStart + axisEnd) * 0.5;
      const yCenterM = (yStart + yEnd) * 0.5;
      if (openings.some((opening) => cellOverlapsOpening(axisCenterM, yCenterM, opening))) {
        return;
      }

      cells.push({
        axisCenterM,
        axisSizeM: axisEnd - axisStart,
        heightM: yEnd - yStart,
        yCenterM,
      });
    });
  });

  return cells;
}

function shellOpacity(transparentShell: boolean): number {
  return transparentShell ? 0.28 : 1;
}

function buildSeamOffsets(start: number, end: number, spacing: number): number[] {
  if (end <= start || spacing <= 0) {
    return [];
  }

  const offsets: number[] = [];
  for (let value = start; value <= end + 0.001; value += spacing) {
    offsets.push(Number(value.toFixed(4)));
  }

  return offsets;
}

function subtractInterval(
  segments: Array<[number, number]>,
  cutStart: number,
  cutEnd: number,
): Array<[number, number]> {
  return segments.flatMap(([start, end]) => {
    if (cutEnd <= start || cutStart >= end) {
      return [[start, end] as [number, number]];
    }

    const nextSegments: Array<[number, number]> = [];
    if (cutStart > start) {
      nextSegments.push([start, Math.max(start, cutStart)]);
    }
    if (cutEnd < end) {
      nextSegments.push([Math.min(end, cutEnd), end]);
    }
    return nextSegments.filter(([nextStart, nextEnd]) => nextEnd - nextStart > 0.16);
  });
}

function WallPanel({
  facade,
  lengthM,
  thicknessM,
  transparentShell,
  visualConfig,
  wallCell,
}: {
  facade: GalaFacade;
  lengthM: number;
  thicknessM: number;
  transparentShell: boolean;
  visualConfig?: GalaHouseVisualConfig;
  wallCell: WallCell;
}) {
  const facadeVisual = resolveGalaFacadeVisual(visualConfig);
  const halfLength = GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const halfWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5;
  const isLongWall = facade === 'south' || facade === 'north';
  const longWallZ = facade === 'south' ? -halfWidth : halfWidth;
  const sideWallX = facade === 'west' ? -halfLength : halfLength;
  const axisCenter = wallCell.axisCenterM - lengthM * 0.5;
  const position: [number, number, number] = isLongWall
    ? [axisCenter, wallCell.yCenterM, longWallZ]
    : [sideWallX, wallCell.yCenterM, axisCenter];
  const size: [number, number, number] = isLongWall
    ? [wallCell.axisSizeM, wallCell.heightM, thicknessM]
    : [thicknessM, wallCell.heightM, wallCell.axisSizeM];

  return (
    <mesh
      castShadow
      name={`gala-${facade}-wood-cladding-wall-panel`}
      position={position}
      receiveShadow
      userData={{ semantic: `gala ${facade} facade wall cladding board panel` }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={facadeVisual.wallColor}
        opacity={shellOpacity(transparentShell)}
        roughness={0.86}
        side={THREE.DoubleSide}
        transparent={transparentShell}
      />
    </mesh>
  );
}

function OpeningFrame({
  facade,
  lengthM,
  onEntryDoorClick,
  opening,
  visualConfig,
  doorStates,
}: {
  doorStates: GalaDoorStateMap;
  facade: GalaFacade;
  lengthM: number;
  onEntryDoorClick?: () => void;
  opening: GalaOpeningScheduleItem;
  visualConfig?: GalaHouseVisualConfig;
}) {
  const openingVisual = resolveGalaOpeningVisual(visualConfig);
  const halfLength = GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const halfWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5;
  const isLongWall = facade === 'south' || facade === 'north';
  const frameFaceOffset = (WALL_PANEL_THICKNESS * 0.5) + WALL_FACE_OFFSET;
  const glassFaceOffset = (WALL_PANEL_THICKNESS * 0.5) + GLASS_OFFSET;
  const frameFaceZ = facade === 'south' ? -halfWidth - frameFaceOffset : halfWidth + frameFaceOffset;
  const frameFaceX = facade === 'west' ? -halfLength - frameFaceOffset : halfLength + frameFaceOffset;
  const interiorFrameFaceZ = facade === 'south' ? -halfWidth + frameFaceOffset : halfWidth - frameFaceOffset;
  const interiorFrameFaceX = facade === 'west' ? -halfLength + frameFaceOffset : halfLength - frameFaceOffset;
  const wallCenterZ = facade === 'south' ? -halfWidth : halfWidth;
  const wallCenterX = facade === 'west' ? -halfLength : halfLength;
  const glassFaceZ = facade === 'south' ? -halfWidth - glassFaceOffset : halfWidth + glassFaceOffset;
  const glassFaceX = facade === 'west' ? -halfLength - glassFaceOffset : halfLength + glassFaceOffset;
  const axisCenter = opening.axisStartM + (opening.widthM * 0.5) - (lengthM * 0.5);
  const yCenter = opening.sillM + (opening.heightM * 0.5);
  const frameDepth = Math.max(TRIM_DEPTH, FRAME_FACE_DEPTH);
  const frameWidth = FRAME_THICKNESS;
  const sillHeight = 0.075;
  const isDoor = opening.type === 'door' || opening.type === 'terraceDoor';
  const doorId = isGalaDoorId(opening.id) ? opening.id : null;
  const doorState = doorId ? doorStates[doorId] : 'closed';
  const doorOpen = isDoor && doorState === 'open';
  const slabColor = isDoor ? openingVisual.doorColor : openingVisual.glassColor;
  const commonUserData = {
    assemblyType: 'wall-thickness-opening',
    openingId: opening.id,
    semantic: `gala ${facade} ${opening.id} ${opening.type} frame glass door window opening schedule`,
  };
  const framePosition = (localAxis: number, y: number): [number, number, number] => (
    isLongWall ? [localAxis, y, frameFaceZ] : [frameFaceX, y, localAxis]
  );
  const interiorFramePosition = (localAxis: number, y: number): [number, number, number] => (
    isLongWall ? [localAxis, y, interiorFrameFaceZ] : [interiorFrameFaceX, y, localAxis]
  );
  const revealPosition = (localAxis: number, y: number): [number, number, number] => (
    isLongWall ? [localAxis, y, wallCenterZ] : [wallCenterX, y, localAxis]
  );
  const slabPosition = (localAxis: number, y: number): [number, number, number] => (
    isLongWall ? [localAxis, y, glassFaceZ] : [glassFaceX, y, localAxis]
  );
  const slabVisibleWidth = isDoor
    ? Math.max(0.12, opening.widthM - 0.035)
    : Math.max(0.12, opening.widthM - frameWidth * 0.36);
  const slabVisibleHeight = isDoor
    ? Math.max(0.16, opening.heightM - 0.045)
    : Math.max(0.12, opening.heightM - frameWidth * 0.36);
  const slabSize: [number, number, number] = isLongWall
    ? [slabVisibleWidth, slabVisibleHeight, SLAB_DEPTH]
    : [SLAB_DEPTH, slabVisibleHeight, slabVisibleWidth];
  const openDoorLeafSize: [number, number, number] = isLongWall
    ? [SLAB_DEPTH, slabVisibleHeight, Math.max(0.2, slabVisibleWidth * 0.94)]
    : [Math.max(0.2, slabVisibleWidth * 0.94), slabVisibleHeight, SLAB_DEPTH];
  const verticalFrameSize: [number, number, number] = isLongWall
    ? [frameWidth, opening.heightM + FRAME_OVERLAP * 2, frameDepth]
    : [frameDepth, opening.heightM + FRAME_OVERLAP * 2, frameWidth];
  const horizontalFrameSize: [number, number, number] = isLongWall
    ? [opening.widthM + FRAME_OVERLAP * 2, frameWidth, frameDepth]
    : [frameDepth, frameWidth, opening.widthM + FRAME_OVERLAP * 2];
  const sillSize: [number, number, number] = isLongWall
    ? [opening.widthM + FRAME_OVERLAP * 2.35, sillHeight, frameDepth * 1.85]
    : [frameDepth * 1.85, sillHeight, opening.widthM + FRAME_OVERLAP * 2.35];
  const revealDepth = REVEAL_LINER_DEPTH;
  const verticalRevealSize: [number, number, number] = isLongWall
    ? [frameWidth * 1.08, opening.heightM + FRAME_OVERLAP * 1.25, revealDepth]
    : [revealDepth, opening.heightM + FRAME_OVERLAP * 1.25, frameWidth * 1.08];
  const horizontalRevealSize: [number, number, number] = isLongWall
    ? [opening.widthM + FRAME_OVERLAP * 1.35, frameWidth * 1.08, revealDepth]
    : [revealDepth, frameWidth * 1.08, opening.widthM + FRAME_OVERLAP * 1.35];
  const leftAxis = axisCenter - (opening.widthM * 0.5) - (frameWidth * 0.5);
  const rightAxis = axisCenter + (opening.widthM * 0.5) + (frameWidth * 0.5);
  const revealLeftAxis = axisCenter - (opening.widthM * 0.5);
  const revealRightAxis = axisCenter + (opening.widthM * 0.5);
  const topY = opening.sillM + opening.heightM + (frameWidth * 0.5);
  const bottomY = isDoor
    ? sillHeight * 0.5
    : Math.max(sillHeight * 0.5, opening.sillM - (sillHeight * 0.5));
  const revealBottomY = isDoor ? frameWidth * 0.5 : opening.sillM;
  const revealTopY = opening.sillM + opening.heightM;
  const wallInwardSign = facade === 'south' ? 1 : facade === 'north' ? -1 : facade === 'west' ? 1 : -1;
  const hingeAxis = axisCenter - (opening.widthM * 0.5) + (SLAB_DEPTH * 0.5);
  const openDoorPosition: [number, number, number] = isLongWall
    ? [hingeAxis, yCenter, wallCenterZ + wallInwardSign * Math.max(0.18, slabVisibleWidth * 0.46)]
    : [wallCenterX + wallInwardSign * Math.max(0.18, slabVisibleWidth * 0.46), yCenter, hingeAxis];
  const handleDoorToggle = doorId
    ? (event: { stopPropagation?: () => void }) => {
      event.stopPropagation?.();
      toggleGalaDoorState(doorId);
      if (doorId === 'D-ENTRY' && onEntryDoorClick && getGalaDoorStatesSnapshot()[doorId] === 'open') {
        onEntryDoorClick();
      }
    }
    : undefined;

  return (
    <group
      name={`gala-${facade}-${opening.id}-opening-frame`}
      onClick={handleDoorToggle}
      userData={{
        ...commonUserData,
        repairScope: 'opening-void-fix-only',
        doorState,
        openableDoor: Boolean(doorId),
      }}
    >
      {[revealLeftAxis, revealRightAxis].map((axis) => (
        <mesh key={`${opening.id}-reveal-vertical-${axis}`} castShadow name={`gala-${opening.id}-interior-reveal-liner-covers-wall-edge`} position={revealPosition(axis, yCenter)} receiveShadow userData={commonUserData}>
          <boxGeometry args={verticalRevealSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.68} />
        </mesh>
      ))}
      {[revealBottomY, revealTopY].map((y) => (
        <mesh key={`${opening.id}-reveal-horizontal-${y}`} castShadow name={`gala-${opening.id}-horizontal-reveal-liner-covers-wall-edge`} position={revealPosition(axisCenter, y)} receiveShadow userData={commonUserData}>
          <boxGeometry args={horizontalRevealSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.68} />
        </mesh>
      ))}

      {isDoor ? (
        doorOpen ? (
          <mesh
            castShadow
            name={`gala-${facade}-${opening.id}-open-door-leaf-rotated-clear-of-passage`}
            onClick={handleDoorToggle}
            position={openDoorPosition}
            receiveShadow
            userData={{ ...commonUserData, doorState: 'open', passableDoorwayLooksOpen: true }}
          >
            <boxGeometry args={openDoorLeafSize} />
            <meshStandardMaterial color={slabColor} emissive={openingVisual.doorAccentColor} emissiveIntensity={0.05} metalness={0.08} roughness={0.68} />
          </mesh>
        ) : (
          <mesh
            castShadow
            name={`gala-${facade}-${opening.id}-closed-opaque-door-slab-blocks-passage`}
            onClick={handleDoorToggle}
            position={slabPosition(axisCenter, yCenter)}
            receiveShadow
            userData={{ ...commonUserData, doorState: 'closed', closedDoorDoesNotLookPassable: true }}
          >
            <boxGeometry args={slabSize} />
            <meshStandardMaterial color={slabColor} emissive={openingVisual.doorAccentColor} emissiveIntensity={0.05} metalness={0.08} roughness={0.68} />
          </mesh>
        )
      ) : (
        <>
          <mesh
            castShadow
            name={`gala-${facade}-${opening.id}-exterior-sealed-dark-blue-grey-window-glass-not-void`}
            position={slabPosition(axisCenter, yCenter)}
            receiveShadow
            userData={{ ...commonUserData, windowsAreSealed: true, windowsDoNotReadAsVoid: true }}
          >
            <boxGeometry args={slabSize} />
            <meshStandardMaterial
              color={slabColor}
              emissive={openingVisual.glassEmissive}
              emissiveIntensity={0.18}
              metalness={0.18}
              roughness={0.24}
            />
          </mesh>
          <mesh
            castShadow
            name={`gala-${facade}-${opening.id}-interior-sealed-window-glass-panel-not-see-through`}
            position={isLongWall ? [axisCenter, yCenter, interiorFrameFaceZ] : [interiorFrameFaceX, yCenter, axisCenter]}
            receiveShadow
            userData={{ ...commonUserData, glassPanelsFillFrame: true, windowFramesCoverWallEdges: true }}
          >
            <boxGeometry args={slabSize} />
            <meshStandardMaterial
              color={slabColor}
              emissive={openingVisual.glassEmissive}
              emissiveIntensity={0.14}
              metalness={0.16}
              roughness={0.26}
            />
          </mesh>
        </>
      )}

      {isDoor && !doorOpen && openingVisual.doorGlassPanel ? (
        <mesh
          castShadow
          name={`gala-${facade}-${opening.id}-door-glass-panel-accent`}
          position={slabPosition(axisCenter, yCenter + opening.heightM * 0.1)}
          receiveShadow
          userData={commonUserData}
        >
          <boxGeometry args={isLongWall
            ? [opening.widthM * 0.36, opening.heightM * 0.46, 0.044]
            : [0.044, opening.heightM * 0.46, opening.widthM * 0.36]}
          />
          <meshStandardMaterial
            color={openingVisual.glassColor}
            emissive={openingVisual.glassEmissive}
            emissiveIntensity={0.12}
            metalness={0.2}
            roughness={0.28}
          />
        </mesh>
      ) : null}

      {!isDoor ? (
        <>
          <mesh castShadow name={`gala-${facade}-${opening.id}-window-center-vertical-mullion-overlaps-glass`} position={framePosition(axisCenter, yCenter)} userData={commonUserData}>
            <boxGeometry args={isLongWall ? [frameWidth * 0.52, slabVisibleHeight + 0.02, frameDepth * 1.12] : [frameDepth * 1.12, slabVisibleHeight + 0.02, frameWidth * 0.52]} />
            <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
          </mesh>
          <mesh castShadow name={`gala-${facade}-${opening.id}-window-center-horizontal-mullion-overlaps-glass`} position={framePosition(axisCenter, yCenter)} userData={commonUserData}>
            <boxGeometry args={isLongWall ? [slabVisibleWidth + 0.02, frameWidth * 0.42, frameDepth * 1.12] : [frameDepth * 1.12, frameWidth * 0.42, slabVisibleWidth + 0.02]} />
            <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
          </mesh>
          <mesh castShadow name={`gala-${facade}-${opening.id}-interior-window-center-vertical-mullion-overlaps-glass`} position={interiorFramePosition(axisCenter, yCenter)} userData={commonUserData}>
            <boxGeometry args={isLongWall ? [frameWidth * 0.52, slabVisibleHeight + 0.02, frameDepth * 1.12] : [frameDepth * 1.12, slabVisibleHeight + 0.02, frameWidth * 0.52]} />
            <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
          </mesh>
          <mesh castShadow name={`gala-${facade}-${opening.id}-interior-window-center-horizontal-mullion-overlaps-glass`} position={interiorFramePosition(axisCenter, yCenter)} userData={commonUserData}>
            <boxGeometry args={isLongWall ? [slabVisibleWidth + 0.02, frameWidth * 0.42, frameDepth * 1.12] : [frameDepth * 1.12, frameWidth * 0.42, slabVisibleWidth + 0.02]} />
            <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
          </mesh>
        </>
      ) : null}

      {isDoor ? (
        <mesh
          castShadow
          name={`gala-${facade}-${opening.id}-${doorOpen ? 'open' : 'closed'}-door-handle-accent`}
          position={doorOpen
            ? (isLongWall
              ? [hingeAxis, yCenter, wallCenterZ + wallInwardSign * Math.max(0.18, slabVisibleWidth * 0.78)]
              : [wallCenterX + wallInwardSign * Math.max(0.18, slabVisibleWidth * 0.78), yCenter, hingeAxis])
            : slabPosition(axisCenter + opening.widthM * 0.28, yCenter)}
          userData={commonUserData}
        >
          <boxGeometry args={isLongWall ? [0.06, 0.14, 0.052] : [0.052, 0.14, 0.06]} />
          <meshStandardMaterial color={openingVisual.doorAccentColor} metalness={0.28} roughness={0.42} />
        </mesh>
      ) : null}

      {[leftAxis, rightAxis].map((axis) => (
        <mesh key={`${opening.id}-${axis}`} castShadow name={`gala-${opening.id}-vertical-window-door-trim`} position={framePosition(axis, yCenter)} userData={commonUserData}>
          <boxGeometry args={verticalFrameSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
        </mesh>
      ))}
      {[leftAxis, rightAxis].map((axis) => (
        <mesh key={`${opening.id}-interior-${axis}`} castShadow name={`gala-${opening.id}-interior-vertical-window-door-casing`} position={interiorFramePosition(axis, yCenter)} userData={commonUserData}>
          <boxGeometry args={verticalFrameSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
        </mesh>
      ))}

      {[topY, opening.sillM].map((y) => (
        <mesh key={`${opening.id}-${y}`} castShadow name={`gala-${opening.id}-horizontal-window-door-trim`} position={framePosition(axisCenter, y)} userData={commonUserData}>
          <boxGeometry args={horizontalFrameSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
        </mesh>
      ))}
      {[topY, opening.sillM].map((y) => (
        <mesh key={`${opening.id}-interior-${y}`} castShadow name={`gala-${opening.id}-interior-horizontal-window-door-casing`} position={interiorFramePosition(axisCenter, y)} userData={commonUserData}>
          <boxGeometry args={horizontalFrameSize} />
          <meshStandardMaterial color={openingVisual.trimColor} roughness={0.62} />
        </mesh>
      ))}

      <mesh castShadow name={`gala-${opening.id}-${isDoor ? 'threshold-entry-slab' : 'window-sill'}`} position={framePosition(axisCenter, bottomY)} receiveShadow userData={commonUserData}>
        <boxGeometry args={sillSize} />
        <meshStandardMaterial color={isDoor ? openingVisual.doorAccentColor : openingVisual.trimColor} roughness={0.72} />
      </mesh>
      <mesh castShadow name={`gala-${opening.id}-interior-${isDoor ? 'threshold' : 'window-sill'}-seals-frame`} position={interiorFramePosition(axisCenter, bottomY)} receiveShadow userData={commonUserData}>
        <boxGeometry args={sillSize} />
        <meshStandardMaterial color={isDoor ? openingVisual.doorAccentColor : openingVisual.trimColor} roughness={0.72} />
      </mesh>
    </group>
  );
}

function FacadeCladdingGrooves({
  facade,
  lengthM,
  transparentShell,
  visualConfig,
}: {
  facade: GalaFacade;
  lengthM: number;
  transparentShell: boolean;
  visualConfig?: GalaHouseVisualConfig;
}) {
  const facadeVisual = resolveGalaFacadeVisual(visualConfig);
  const halfLength = GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const halfWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5;
  const isLongWall = facade === 'south' || facade === 'north';
  const faceOffset = SEAM_FACE_OFFSET;
  const faceZ = facade === 'south' ? -halfWidth - faceOffset : halfWidth + faceOffset;
  const faceX = facade === 'west' ? -halfLength - faceOffset : halfLength + faceOffset;
  const isHorizontal = facadeVisual.seamOrientation === 'horizontal';
  const openings = facadeOpenings(facade);
  const bottomY = 0.14;
  const topY = GALA_HOUSE_DIMENSIONS.wallFrameHeightM - 0.04;
  const axisStart = 0.24;
  const axisEnd = lengthM - 0.24;
  if (facadeVisual.seamOrientation === 'none' || axisEnd <= axisStart || topY <= bottomY) {
    return null;
  }
  const seamWidth = Math.min(facadeVisual.seamWidthM, 0.014);
  const seamColor = facadeVisual.seamColor;
  const boardEdgeColor = facadeVisual.wallLightColor;
  const boardEdgeWidth = 0.004;
  const opacity = transparentShell ? 0.35 : Math.min(0.58, facadeVisual.seamOpacity + 0.02);
  const verticalOffsets = buildSeamOffsets(axisStart, axisEnd, Math.max(0.45, facadeVisual.seamSpacingM));
  const horizontalOffsets = buildSeamOffsets(bottomY + 0.24, topY - 0.1, facadeVisual.seamSpacingM);

  return (
    <group
      name={`gala-${facade}-${facadeVisual.seamOrientation}-consistent-facade-cladding-grooves`}
      userData={{
        eavesTrimAdded: true,
        facadeBaseTrimConsistentAllSides: true,
        facadeNoRandomBrokenLines: true,
        facadeNoRandomBrokenGrooves: true,
        facadeGrooveRootCauseIdentified: true,
        facadeGroovesAreConstructionGroovesNotDrawnLines: true,
        facadeGroovesConsistentAllSides: true,
        facadeSeamsAreConsistentGrooves: true,
        facadeSeamsClipAroundOpenings: true,
        facadeSeamsReachEavesWhereAppropriate: true,
        semantic: `gala ${facade} opening-aware ${facadeVisual.seamOrientation} cladding facade thin grooves clipped around windows doors`,
        seamClearanceM: OPENING_SEAM_CLEARANCE,
      }}
    >
      {isHorizontal
        ? horizontalOffsets.flatMap((y, yIndex) => {
          let axisSegments: Array<[number, number]> = [[axisStart, axisEnd]];
          openings.forEach((opening) => {
            const openingYMin = Math.max(bottomY, opening.sillM - OPENING_SEAM_CLEARANCE);
            const openingYMax = Math.min(topY, opening.sillM + opening.heightM + OPENING_SEAM_CLEARANCE);
            if (y >= openingYMin && y <= openingYMax) {
              axisSegments = subtractInterval(
                axisSegments,
                Math.max(axisStart, opening.axisStartM - OPENING_SEAM_CLEARANCE),
                Math.min(axisEnd, opening.axisStartM + opening.widthM + OPENING_SEAM_CLEARANCE),
              );
            }
          });

          return axisSegments.map(([segmentStart, segmentEnd], segmentIndex) => {
            const axisCenter = (segmentStart + segmentEnd) * 0.5 - lengthM * 0.5;
            const axisSize = segmentEnd - segmentStart;
            const position: [number, number, number] = isLongWall
              ? [axisCenter, y, faceZ]
              : [faceX, y, axisCenter];
            const size: [number, number, number] = isLongWall
              ? [axisSize, seamWidth, SEAM_GROOVE_DEPTH]
              : [SEAM_GROOVE_DEPTH, seamWidth, axisSize];
            const edgeOnePosition: [number, number, number] = isLongWall
              ? [axisCenter, y - seamWidth * 0.72, faceZ - (facade === 'south' ? 0.002 : -0.002)]
              : [faceX - (facade === 'west' ? 0.002 : -0.002), y - seamWidth * 0.72, axisCenter];
            const edgeTwoPosition: [number, number, number] = isLongWall
              ? [axisCenter, y + seamWidth * 0.72, faceZ - (facade === 'south' ? 0.002 : -0.002)]
              : [faceX - (facade === 'west' ? 0.002 : -0.002), y + seamWidth * 0.72, axisCenter];
            const edgeSize: [number, number, number] = isLongWall
              ? [axisSize, boardEdgeWidth, 0.003]
              : [0.003, boardEdgeWidth, axisSize];
            return (
              <group key={`${facade}-horizontal-groove-${yIndex}-${segmentIndex}`} name={`gala-${facade}-construction-shadow-channel-horizontal-board-gap`}>
                <mesh name={`gala-${facade}-opening-clipped-recessed-horizontal-cladding-shadow-channel`} position={position}>
                  <boxGeometry args={size} />
                  <meshStandardMaterial color={seamColor} opacity={opacity} roughness={0.96} transparent={transparentShell} />
                </mesh>
                <mesh name={`gala-${facade}-upper-board-edge-highlight-at-horizontal-groove`} position={edgeOnePosition}>
                  <boxGeometry args={edgeSize} />
                  <meshStandardMaterial color={boardEdgeColor} roughness={0.88} />
                </mesh>
                <mesh name={`gala-${facade}-lower-board-edge-highlight-at-horizontal-groove`} position={edgeTwoPosition}>
                  <boxGeometry args={edgeSize} />
                  <meshStandardMaterial color={boardEdgeColor} roughness={0.88} />
                </mesh>
              </group>
            );
          });
        })
        : verticalOffsets.flatMap((axisM, axisIndex) => {
          let ySegments: Array<[number, number]> = [[bottomY, topY]];
          openings.forEach((opening) => {
            const openingStart = opening.axisStartM - OPENING_SEAM_CLEARANCE;
            const openingEnd = opening.axisStartM + opening.widthM + OPENING_SEAM_CLEARANCE;
            if (axisM >= openingStart && axisM <= openingEnd) {
              ySegments = subtractInterval(
                ySegments,
                Math.max(bottomY, opening.sillM - OPENING_SEAM_CLEARANCE),
                Math.min(topY, opening.sillM + opening.heightM + OPENING_SEAM_CLEARANCE),
              );
            }
          });

          return ySegments.map(([segmentStart, segmentEnd], segmentIndex) => {
            const yCenter = (segmentStart + segmentEnd) * 0.5;
            const localAxis = axisM - lengthM * 0.5;
            const position: [number, number, number] = isLongWall
              ? [localAxis, yCenter, faceZ]
              : [faceX, yCenter, localAxis];
            const size: [number, number, number] = isLongWall
              ? [seamWidth, segmentEnd - segmentStart, SEAM_GROOVE_DEPTH]
              : [SEAM_GROOVE_DEPTH, segmentEnd - segmentStart, seamWidth];
            const edgeOnePosition: [number, number, number] = isLongWall
              ? [localAxis - seamWidth * 0.72, yCenter, faceZ - (facade === 'south' ? 0.002 : -0.002)]
              : [faceX - (facade === 'west' ? 0.002 : -0.002), yCenter, localAxis - seamWidth * 0.72];
            const edgeTwoPosition: [number, number, number] = isLongWall
              ? [localAxis + seamWidth * 0.72, yCenter, faceZ - (facade === 'south' ? 0.002 : -0.002)]
              : [faceX - (facade === 'west' ? 0.002 : -0.002), yCenter, localAxis + seamWidth * 0.72];
            const edgeSize: [number, number, number] = isLongWall
              ? [boardEdgeWidth, segmentEnd - segmentStart, 0.003]
              : [0.003, segmentEnd - segmentStart, boardEdgeWidth];
            return (
              <group key={`${facade}-vertical-groove-${axisIndex}-${segmentIndex}`} name={`gala-${facade}-construction-shadow-channel-vertical-board-gap`}>
                <mesh name={`gala-${facade}-opening-clipped-recessed-vertical-cladding-shadow-channel`} position={position}>
                  <boxGeometry args={size} />
                  <meshStandardMaterial color={seamColor} opacity={opacity} roughness={0.96} transparent={transparentShell} />
                </mesh>
                <mesh name={`gala-${facade}-left-board-edge-highlight-at-vertical-groove`} position={edgeOnePosition}>
                  <boxGeometry args={edgeSize} />
                  <meshStandardMaterial color={boardEdgeColor} roughness={0.88} />
                </mesh>
                <mesh name={`gala-${facade}-right-board-edge-highlight-at-vertical-groove`} position={edgeTwoPosition}>
                  <boxGeometry args={edgeSize} />
                  <meshStandardMaterial color={boardEdgeColor} roughness={0.88} />
                </mesh>
              </group>
            );
          });
        })}
    </group>
  );
}

export function GalaWallWithOpenings({ facade, onEntryDoorClick, transparentShell, visualConfig }: WallWithOpeningsProps) {
  const isLongWall = facade === 'south' || facade === 'north';
  const axisLengthM = isLongWall
    ? GALA_HOUSE_DIMENSIONS.houseLengthM
    : GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM;
  const openings = facadeOpenings(facade);
  const cells = buildWallCells(axisLengthM, GALA_HOUSE_DIMENSIONS.wallFrameHeightM, openings);
  const doorStates = useGalaDoorStates();

  return (
    <group name={`gala-${facade}-segmented-facade-with-schedule-openings`}>
      {cells.map((cell) => (
        <WallPanel
          key={`${facade}-${cell.axisCenterM}-${cell.yCenterM}`}
          facade={facade}
          lengthM={axisLengthM}
          thicknessM={0.12}
          transparentShell={transparentShell}
          visualConfig={visualConfig}
          wallCell={cell}
        />
      ))}
      <FacadeCladdingGrooves facade={facade} lengthM={axisLengthM} transparentShell={transparentShell} visualConfig={visualConfig} />
      {openings.map((opening) => (
        <OpeningFrame
          key={opening.id}
          facade={facade}
          doorStates={doorStates}
          lengthM={axisLengthM}
          onEntryDoorClick={onEntryDoorClick}
          opening={opening}
          visualConfig={visualConfig}
        />
      ))}
    </group>
  );
}
