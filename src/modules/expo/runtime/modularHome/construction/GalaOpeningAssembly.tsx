import { useEffect, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import {
  DEFAULT_GALA_DOOR_STATES,
  GALA_DOOR_STATE_EVENT,
  getGalaDoorStatesSnapshot,
  installGalaDoorRuntime,
  toggleGalaDoorState,
  type GalaDoorState,
  type GalaDoorStateMap,
} from '../GalaDoorState';
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
const GLASS_DEPTH = 0.055;
const DOOR_LEAF_DEPTH = 0.07;

function useGalaDoorStates(): GalaDoorStateMap {
  const [doorStates, setDoorStates] = useState<GalaDoorStateMap>(() => (
    typeof window === 'undefined' ? { ...DEFAULT_GALA_DOOR_STATES } : installGalaDoorRuntime()
  ));

  useEffect(() => {
    installGalaDoorRuntime();

    const handleDoorStateChange = () => {
      setDoorStates(getGalaDoorStatesSnapshot());
    };

    window.addEventListener(GALA_DOOR_STATE_EVENT, handleDoorStateChange);
    return () => window.removeEventListener(GALA_DOOR_STATE_EVENT, handleDoorStateChange);
  }, []);

  return doorStates;
}

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
  const axisCenter = constructionAxisCenter(opening.axisStartM, opening.widthM);
  const yCenter = opening.sillM + opening.heightM * 0.5;
  const openingEnd = opening.axisStartM + opening.widthM;
  const isDoor = opening.kind === 'door';
  const doorState: GalaDoorState = opening.doorId ? doorStates[opening.doorId] : 'closed';
  const faceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.018;
  const revealDepth = GALA_CONSTRUCTION_LEVELS.revealDepthM;
  const casingFaceOffsets = wall.kind === 'exterior' ? [faceOffset, -faceOffset] : [faceOffset, -faceOffset];
  const casingColor = wall.kind === 'exterior' ? wallSkin.exterior.trimColor : visual.trimColor;
  const revealColor = wall.kind === 'exterior' ? wallSkin.exterior.openingRevealColor : wallSkin.interior.panelRevealColor;
  const thresholdColor = wall.kind === 'exterior' ? wallSkin.exterior.thresholdColor : wallSkin.interior.panelRevealColor;
  const glassColor = visual.glassColor;
  const glassOpacity = 0.46;
  const doorColor = visual.doorColor;
  const slabWidth = Math.max(0.16, opening.widthM - 0.04);
  const slabHeight = Math.max(0.18, opening.heightM - 0.05);
  const slabDepth = isDoor ? DOOR_LEAF_DEPTH : GLASS_DEPTH;
  const headerY = opening.sillM + opening.heightM + FRAME_WIDTH * 0.5;
  const bottomY = opening.sillM <= 0.02 ? FRAME_WIDTH * 0.5 : opening.sillM - FRAME_WIDTH * 0.5;
  const leftAxis = opening.axisStartM - FRAME_WIDTH * 0.5;
  const rightAxis = openingEnd + FRAME_WIDTH * 0.5;
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

  const openLeafPosition = wall.axis === 'x'
    ? wallPosition(wall, opening.axisStartM + FRAME_WIDTH * 0.8, yCenter, -Math.sign(wall.normal[1] || 1) * Math.max(0.34, slabWidth * 0.48))
    : wallPosition(wall, opening.axisStartM + FRAME_WIDTH * 0.8, yCenter, -Math.sign(wall.normal[0] || 1) * Math.max(0.34, slabWidth * 0.48));
  const openLeafSize = wall.axis === 'x'
    ? [DOOR_LEAF_DEPTH, slabHeight, slabWidth * 0.92] as [number, number, number]
    : [slabWidth * 0.92, slabHeight, DOOR_LEAF_DEPTH] as [number, number, number];
  const jambLinerInstances: GalaConstructionBoxInstance[] = [leftAxis, rightAxis].map((axis) => ({
    position: wallPosition(wall, axis, yCenter, 0),
    size: sizeAcrossWall(wall, FRAME_WIDTH, opening.heightM + CASING_OVERLAP, revealDepth),
  }));
  const headerSillLinerInstances: GalaConstructionBoxInstance[] = [bottomY, headerY].map((y) => ({
    position: wallPosition(wall, axisCenter, y, 0),
    size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP, FRAME_WIDTH, revealDepth),
  }));
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
    {
      position: wallPosition(wall, axisCenter, bottomY, offset),
      size: sizeAlongWall(wall, opening.widthM + CASING_OVERLAP * 2, FRAME_WIDTH, CASING_DEPTH),
    },
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
        color={revealColor}
        instances={jambLinerInstances}
        name={`gala-construction-${opening.id}-wall-thickness-jamb-liner`}
        userData={{
          ...commonUserData,
          noVisibleSlitBetweenJambAndWall: true,
        }}
      />

      <GalaConstructionInstancedBoxes
        color={revealColor}
        instances={headerSillLinerInstances}
        name={`gala-construction-${opening.id}-wall-thickness-header-sill-liner`}
        userData={{
          ...commonUserData,
          doorHeadersNoVisibleGap: true,
        }}
      />

      <GalaConstructionInstancedBoxes
        color={casingColor}
        instances={casingInstances}
        name={`gala-construction-${opening.id}-two-sided-casing`}
        userData={{
          ...commonUserData,
          doorHeadersNoVisibleGap: true,
          twoSidedCasingInstanceCount: casingInstances.length,
        }}
      />

      {isDoor && doorState === 'open' ? (
        <GalaConstructionBox
          color={doorColor}
          name={`gala-construction-${opening.id}-open-door-leaf-clear-passage`}
          onClick={handleDoorClick}
          position={openLeafPosition}
          roughness={0.68}
          size={openLeafSize}
          userData={{
            ...commonUserData,
            doorState: 'open',
            openDoorsArePassable: true,
            openDoorLooksPassable: true,
          }}
        />
      ) : (
        <GalaConstructionBox
          color={isDoor ? doorColor : glassColor}
          metalness={isDoor ? 0.08 : 0.18}
          name={isDoor
            ? `gala-construction-${opening.id}-closed-opaque-door-slab-blocks-passage`
            : `gala-construction-${opening.id}-transparent-window-glass-panel`}
          opacity={isDoor ? 1 : glassOpacity}
          onClick={isDoor ? handleDoorClick : undefined}
          position={wallPosition(wall, axisCenter, yCenter, isDoor ? 0 : faceOffset + 0.012)}
          roughness={isDoor ? 0.68 : 0.28}
          size={sizeAlongWall(wall, slabWidth, slabHeight, slabDepth)}
          userData={{
            ...commonUserData,
            closedDoorsBlockPlayer: isDoor,
            doorState,
            glassPanelsFillFrame: !isDoor,
            windowGlassOpacity: isDoor ? null : glassOpacity,
            windowGlassTransparent: !isDoor,
            windowsDoNotReadAsVoid: !isDoor,
            windowsStillSealed: !isDoor,
          }}
        />
      )}

      <GalaConstructionBox
        color={thresholdColor}
        name={`gala-construction-${opening.id}-controlled-y-threshold-sill`}
        position={wallPosition(wall, axisCenter, GALA_CONSTRUCTION_LEVELS.thresholdHeightM * 0.5 + 0.012, 0)}
        size={sizeAlongWall(wall, opening.widthM + 0.16, GALA_CONSTRUCTION_LEVELS.thresholdHeightM, revealDepth + 0.08)}
        userData={{
          ...commonUserData,
          thresholdsDoNotZFight: true,
        }}
      />
    </group>
  );
}
