import type { GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GALA_CONSTRUCTION_LEVELS,
  GALA_CONSTRUCTION_ROOMS,
  GALA_CONSTRUCTION_WALLS,
  type GalaConstructionOpening,
} from './GalaConstructionModel';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from './GalaConstructionPbrTextures';
import { resolveGalaWallSkin } from './GalaWallSkinModel';

type GalaFloorCeilingAssemblyProps = {
  visualConfig?: GalaHouseVisualConfig;
};

type TrimRun = {
  axis: 'x' | 'z';
  end: number;
  id: string;
  side: 'north' | 'south' | 'east' | 'west';
  start: number;
  x?: number;
  z?: number;
};

const trimRunByInteriorDoorId: Partial<Record<string, 'bathroom-north' | 'bedroom-west'>> = {
  'D-BATHROOM': 'bathroom-north',
  'D-BEDROOM': 'bedroom-west',
};

const interiorDoorTrimInterruptions: Array<GalaConstructionOpening & { roomSide: 'bathroom-north' | 'bedroom-west' }> = GALA_CONSTRUCTION_WALLS
  .flatMap((wall) => wall.openings)
  .flatMap((opening) => {
    const roomSide = trimRunByInteriorDoorId[opening.id];
    return roomSide && opening.source === 'floorplan-interior-door'
      ? [{ ...opening, roomSide }]
      : [];
  });

function subtractDoorFromRun(run: TrimRun): TrimRun[] {
  const matchingDoor = interiorDoorTrimInterruptions.find((door) => (
    (run.id === 'bathroom-north' && door.roomSide === 'bathroom-north')
    || (run.id === 'bedroom-west' && door.roomSide === 'bedroom-west')
  ));
  if (!matchingDoor) {
    return [run];
  }

  const cutStart = matchingDoor.axisStartM - 0.08;
  const cutEnd = matchingDoor.axisStartM + matchingDoor.widthM + 0.08;
  if (cutEnd <= run.start || cutStart >= run.end) {
    return [run];
  }

  const runs: TrimRun[] = [];
  if (cutStart - run.start > 0.16) {
    runs.push({ ...run, end: cutStart, id: `${run.id}-left-of-door` });
  }
  if (run.end - cutEnd > 0.16) {
    runs.push({ ...run, id: `${run.id}-right-of-door`, start: cutEnd });
  }
  return runs;
}

function baseRunPosition(run: TrimRun, y: number): [number, number, number] {
  if (run.axis === 'x') {
    return [(run.start + run.end) * 0.5, y, run.z ?? 0];
  }
  return [run.x ?? 0, y, (run.start + run.end) * 0.5];
}

function runSize(run: TrimRun, height: number, depth: number): [number, number, number] {
  const length = run.end - run.start;
  return run.axis === 'x' ? [length, height, depth] : [depth, height, length];
}

function roomTrimRuns(): TrimRun[] {
  const rooms = Object.values(GALA_CONSTRUCTION_ROOMS);
  return rooms.flatMap((room) => ([
    { axis: 'x' as const, end: room.xMax, id: `${room.id}-south`, side: 'south' as const, start: room.xMin, z: room.zMin + 0.035 },
    { axis: 'x' as const, end: room.xMax, id: room.id === 'bathroom' ? 'bathroom-north' : `${room.id}-north`, side: 'north' as const, start: room.xMin, z: room.zMax - 0.035 },
    { axis: 'z' as const, end: room.zMax, id: room.id === 'bedroom' ? 'bedroom-west' : `${room.id}-west`, side: 'west' as const, start: room.zMin, x: room.xMin + 0.035 },
    { axis: 'z' as const, end: room.zMax, id: `${room.id}-east`, side: 'east' as const, start: room.zMin, x: room.xMax - 0.035 },
  ]));
}

export function GalaFloorCeilingAssembly({ visualConfig }: GalaFloorCeilingAssemblyProps) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const floorPbrTextures = useGalaConstructionPbrTextures('floor');
  const { interior } = wallSkin;
  const floorY = -GALA_CONSTRUCTION_LEVELS.finishedFloorThicknessM * 0.5;
  const floorSize: [number, number, number] = [10.2, GALA_CONSTRUCTION_LEVELS.finishedFloorThicknessM, 5.0];
  const ceilingY = GALA_CONSTRUCTION_LEVELS.ceilingHeightM + 0.018;
  const floorSeamY = GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + 0.006;
  const ceilingSeamY = ceilingY - 0.034;
  const trimRuns = roomTrimRuns().flatMap(subtractDoorFromRun);
  const floorPlankSeams = Array.from({ length: 9 }, (_, index) => -2.0 + index * interior.floorPlankSpacingM);
  const floorButtJoints: Array<{ x: number; z: number }> = [
    { x: -3.6, z: -1.75 },
    { x: -1.2, z: -1.25 },
    { x: 1.15, z: -0.75 },
    { x: 3.35, z: -0.25 },
    { x: -2.45, z: 0.75 },
    { x: 2.2, z: 1.25 },
  ];
  const ceilingLongSeams = [-3.36, -1.68, 0, 1.68, 3.36];
  const ceilingCrossSeams = [-1.2, 1.2];
  const floorPlankSeamInstances: GalaConstructionBoxInstance[] = floorPlankSeams.map((z) => ({
    position: [0, floorSeamY, z],
    size: [9.96, 0.012, 0.012],
  }));
  const floorButtJointInstances: GalaConstructionBoxInstance[] = floorButtJoints.map((joint) => ({
    position: [joint.x, floorSeamY + 0.001, joint.z],
    size: [0.018, 0.012, 0.42],
  }));
  const ceilingLongSeamInstances: GalaConstructionBoxInstance[] = ceilingLongSeams.map((x) => ({
    position: [x, ceilingSeamY, 0],
    size: [0.014, 0.012, 4.72],
  }));
  const ceilingCrossSeamInstances: GalaConstructionBoxInstance[] = ceilingCrossSeams.map((z) => ({
    position: [0, ceilingSeamY + 0.001, z],
    size: [9.84, 0.012, 0.014],
  }));
  const baseboardTrimInstances: GalaConstructionBoxInstance[] = trimRuns.map((run) => ({
    position: baseRunPosition(run, GALA_CONSTRUCTION_LEVELS.baseboardHeightM * 0.5 + 0.006),
    size: runSize(run, GALA_CONSTRUCTION_LEVELS.baseboardHeightM, GALA_CONSTRUCTION_LEVELS.baseboardDepthM),
  }));
  const crownTrimInstances: GalaConstructionBoxInstance[] = trimRuns.map((run) => ({
    position: baseRunPosition(run, GALA_CONSTRUCTION_LEVELS.ceilingHeightM - GALA_CONSTRUCTION_LEVELS.crownHeightM * 0.45),
    size: runSize(run, GALA_CONSTRUCTION_LEVELS.crownHeightM, GALA_CONSTRUCTION_LEVELS.crownDepthM),
  }));

  return (
    <group
      name="gala-construction-floor-ceiling-assembly-single-stack"
      userData={{
        assembly: 'GalaFloorCeilingAssembly',
        ceilingTrimGeneratedFromRoomPerimeters: true,
        componentHint: 'construction/GalaFloorCeilingAssembly.tsx',
        floorStackHasNoCoplanarOverlays: true,
      }}
    >
      <GalaConstructionBox
        {...floorPbrTextures}
        color="#ffffff"
        name="gala-construction-single-finished-floor-no-overlays"
        position={[0, floorY, 0]}
        roughness={0.9}
        size={floorSize}
        userData={{
          floorColorStableNearAndFar: true,
          floorStackHasNoCoplanarOverlays: true,
          interiorExteriorMaterialSystemCoherent: true,
          noBlueFloorOverlay: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        castShadow={false}
        color={interior.floorSeamColor}
        instances={floorPlankSeamInstances}
        name="gala-construction-finished-floor-plank-recessed-seam"
        roughness={0.94}
        userData={{
          floorMaterialReadsAsFinishedPlanks: true,
          floorStackHasNoCoplanarOverlays: true,
          noFloorZFighting: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        castShadow={false}
        color={interior.floorSeamColor}
        instances={floorButtJointInstances}
        name="gala-construction-finished-floor-short-board-butt-joint"
        roughness={0.94}
        userData={{
          floorMaterialReadsAsFinishedPlanks: true,
          floorStackHasNoCoplanarOverlays: true,
          noFloorZFighting: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionBox
        color={interior.ceilingColor}
        name="gala-construction-continuous-flat-ceiling-plane"
        position={[0, ceilingY, 0]}
        roughness={0.88}
        size={[10.08, 0.05, 4.88]}
        userData={{
          ceilingTrimContinuous: true,
          ceilingTrimGeneratedFromRoomPerimeters: true,
          interiorExteriorMaterialSystemCoherent: true,
          partitionTopsSealed: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        castShadow={false}
        color={interior.panelRevealColor}
        instances={ceilingLongSeamInstances}
        name="gala-construction-ceiling-panel-longitudinal-seam"
        roughness={0.92}
        userData={{
          ceilingPanelReliefAdded: true,
          ceilingTrimContinuous: true,
          noCeilingZFighting: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        castShadow={false}
        color={interior.panelRevealColor}
        instances={ceilingCrossSeamInstances}
        name="gala-construction-ceiling-panel-cross-seam"
        roughness={0.92}
        userData={{
          ceilingPanelReliefAdded: true,
          ceilingTrimContinuous: true,
          noCeilingZFighting: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        color={interior.boardColor}
        instances={baseboardTrimInstances}
        name="gala-construction-room-perimeter-baseboard-trim"
        userData={{
          baseboardGeneratedFromRoomPerimeter: true,
          documentedStructuralTrim: true,
          floorWallGapsFixed: true,
          roomTrimInstanceCount: baseboardTrimInstances.length,
          unwantedInteriorHorizontalBandsPresent: false,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <GalaConstructionInstancedBoxes
        color={interior.boardColor}
        instances={crownTrimInstances}
        name="gala-construction-room-perimeter-continuous-crown-trim"
        userData={{
          ceilingTrimContinuous: true,
          ceilingTrimGeneratedFromRoomPerimeters: true,
          documentedStructuralTrim: true,
          noFloatingTrimFragments: true,
          roomTrimInstanceCount: crownTrimInstances.length,
          unwantedInteriorHorizontalBandsPresent: false,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />
    </group>
  );
}
