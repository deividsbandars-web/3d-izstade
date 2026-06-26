import type { GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GALA_CONSTRUCTION_LEVELS,
  constructionAxisEnd,
  type GalaConstructionOpening,
  type GalaConstructionWallSegment,
} from './GalaConstructionModel';
import { GalaCladdingAssembly } from './GalaCladdingAssembly';
import { GalaOpeningAssembly } from './GalaOpeningAssembly';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import {
  resolveGalaInteriorBoardColor,
  resolveGalaWallSkin,
} from './GalaWallSkinModel';

type WallCell = {
  axisCenterM: number;
  axisSizeM: number;
  heightM: number;
  yCenterM: number;
};

type GalaWallAssemblyProps = {
  onEntryDoorOpen?: () => void;
  visualConfig?: GalaHouseVisualConfig;
  wall: GalaConstructionWallSegment;
};

type InteriorBoardInstanceGroup = {
  color: string;
  faceLabel: string;
  instances: GalaConstructionBoxInstance[];
};

function sortedUnique(values: readonly number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);
}

function cellOverlapsOpening(axisCenterM: number, yCenterM: number, opening: GalaConstructionOpening): boolean {
  return axisCenterM > opening.axisStartM
    && axisCenterM < constructionAxisEnd(opening)
    && yCenterM > opening.sillM
    && yCenterM < opening.sillM + opening.heightM;
}

function buildWallCells(wall: GalaConstructionWallSegment): WallCell[] {
  const axisEdges = sortedUnique([
    wall.axisStartM,
    wall.axisEndM,
    ...wall.openings.flatMap((opening) => [
      Math.max(wall.axisStartM, opening.axisStartM),
      Math.min(wall.axisEndM, constructionAxisEnd(opening)),
    ]),
  ]);
  const heightEdges = sortedUnique([
    0,
    GALA_CONSTRUCTION_LEVELS.wallHeightM,
    ...wall.openings.flatMap((opening) => [
      Math.max(0, opening.sillM),
      Math.min(GALA_CONSTRUCTION_LEVELS.wallHeightM, opening.sillM + opening.heightM),
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
      if (wall.openings.some((opening) => cellOverlapsOpening(axisCenterM, yCenterM, opening))) {
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

function wallPosition(wall: GalaConstructionWallSegment, axis: number, y: number, faceOffset = 0): [number, number, number] {
  const xOffset = wall.normal[0] * faceOffset;
  const zOffset = wall.normal[1] * faceOffset;
  if (wall.axis === 'x') {
    return [axis + xOffset, y, (wall.zM ?? 0) + zOffset];
  }
  return [(wall.xM ?? 0) + xOffset, y, axis + zOffset];
}

function wallSize(wall: GalaConstructionWallSegment, axisSize: number, height: number, depth: number): [number, number, number] {
  return wall.axis === 'x'
    ? [axisSize, height, depth]
    : [depth, height, axisSize];
}

function collectInteriorBoardInstances(
  groups: Record<string, InteriorBoardInstanceGroup>,
  wall: GalaConstructionWallSegment,
  cell: WallCell,
  faceOffset: number,
  faceLabel: string,
  boardDepthM: number,
  boardWidthM: number,
  gapWidthM: number,
  palette: readonly string[],
) {
  if (cell.axisSizeM < 0.08 || cell.heightM < 0.22) {
    return;
  }

  const axisMin = cell.axisCenterM - cell.axisSizeM * 0.5;
  const axisMax = cell.axisCenterM + cell.axisSizeM * 0.5;
  const yMin = cell.yCenterM - cell.heightM * 0.5;
  const yMax = cell.yCenterM + cell.heightM * 0.5;
  const lowerPadding = yMin < 0.14 ? 0.12 : 0.035;
  const upperPadding = yMax > GALA_CONSTRUCTION_LEVELS.wallHeightM - 0.1 ? 0.08 : 0.035;
  const boardHeight = Math.max(0.08, cell.heightM - lowerPadding - upperPadding);
  const boardY = yMin + lowerPadding + boardHeight * 0.5;
  const moduleWidth = boardWidthM + gapWidthM;
  const reliefOffset = faceOffset + Math.sign(faceOffset || 1) * (boardDepthM * 0.72);

  let localIndex = 0;
  for (let axisStart = axisMin; axisStart < axisMax - 0.035; axisStart += moduleWidth) {
    const nextBoardWidth = Math.min(boardWidthM, axisMax - axisStart);
    if (nextBoardWidth < 0.045) {
      continue;
    }

    const axisCenter = axisStart + nextBoardWidth * 0.5;
    const globalIndex = Math.max(0, Math.floor((axisCenter - wall.axisStartM) / moduleWidth)) + localIndex;
    const color = resolveGalaInteriorBoardColor(palette, globalIndex);
    const key = `${faceLabel}-${color}`;
    groups[key] ??= { color, faceLabel, instances: [] };
    groups[key].instances.push({
      position: wallPosition(wall, axisCenter, boardY, reliefOffset),
      size: wallSize(wall, nextBoardWidth, boardHeight, boardDepthM),
    });
    localIndex += 1;
  }
}

export function GalaWallAssembly({ onEntryDoorOpen, visualConfig, wall }: GalaWallAssemblyProps) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const wallCells = buildWallCells(wall);
  const wallColor = wall.kind === 'exterior'
    ? wallSkin.exterior.backingWallColor
    : wallSkin.interior.partitionCoreColor;
  const interiorFaceColor = wallSkin.interior.panelRevealColor;
  const faceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.009;
  const interiorBoardInstancesByColor = (wall.kind === 'exterior' ? [-faceOffset] : [-faceOffset, faceOffset])
    .reduce<Record<string, InteriorBoardInstanceGroup>>((groups, offset) => {
      wallCells.forEach((cell) => collectInteriorBoardInstances(
        groups,
        wall,
        cell,
        offset,
        offset < 0 ? 'negative-normal-face' : 'positive-normal-face',
        wallSkin.interior.boardDepthM,
        wallSkin.interior.boardWidthM,
        wallSkin.interior.gapWidthM,
        wallSkin.interior.boardPalette,
      ));
      return groups;
    }, {});
  const exteriorInteriorFaceInstances: GalaConstructionBoxInstance[] = wall.kind === 'exterior'
    ? wallCells.map((cell) => ({
      position: wallPosition(wall, cell.axisCenterM, cell.yCenterM, -faceOffset),
      size: wallSize(wall, cell.axisSizeM, cell.heightM, 0.022),
    }))
    : [];
  const partitionFaceInstances: GalaConstructionBoxInstance[] = wall.kind === 'partition'
    ? [-faceOffset, faceOffset].flatMap((offset) => wallCells.map((cell) => ({
      position: wallPosition(wall, cell.axisCenterM, cell.yCenterM, offset),
      size: wallSize(wall, cell.axisSizeM, cell.heightM, 0.02),
    })))
    : [];

  return (
    <group
      name={`gala-construction-wall-assembly-${wall.id}`}
      userData={{
        assembly: 'GalaWallAssembly',
        componentHint: 'construction/GalaWallAssembly.tsx',
        wallAssemblyOwnsCoreFacesRevealsTrim: true,
        wallId: wall.id,
        wallKind: wall.kind,
        wallSkinModelOwner: 'GalaWallSkinModel',
      }}
    >
      {wallCells.map((cell) => (
        <GalaConstructionBox
          key={`${wall.id}-core-${cell.axisCenterM}-${cell.yCenterM}`}
          color={wallColor}
          name={`gala-construction-${wall.id}-wall-core-cell-opening-aware`}
          position={wallPosition(wall, cell.axisCenterM, cell.yCenterM)}
          roughness={0.88}
          size={wallSize(wall, cell.axisSizeM, cell.heightM, GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM)}
          userData={{
            componentHint: 'construction/GalaWallAssembly.tsx',
            plainWallFallbackNeutralizedByWallSkin: wall.kind === 'exterior',
            wallAssemblyOwnsCoreFacesRevealsTrim: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ))}

      {wall.kind === 'exterior' ? (
        <GalaConstructionInstancedBoxes
          castShadow={false}
          color={interiorFaceColor}
          instances={exteriorInteriorFaceInstances}
          name={`gala-construction-${wall.id}-flat-finished-interior-wall-face`}
          roughness={0.86}
          userData={{
            interiorBoardModuleMatchesExterior: true,
            interiorFaceInstanceCount: exteriorInteriorFaceInstances.length,
            interiorMaterialPaletteCoherentWithExterior: true,
            interiorPanelModuleConsistent: true,
            interiorUsesSameWallSkinSystem: true,
            interiorWallAssemblyCoherent: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ) : (
        <GalaConstructionInstancedBoxes
          castShadow={false}
          color={interiorFaceColor}
          instances={partitionFaceInstances}
          name={`gala-construction-${wall.id}-finished-partition-face`}
          roughness={0.86}
          userData={{
            interiorBoardModuleMatchesExterior: true,
            interiorFaceInstanceCount: partitionFaceInstances.length,
            interiorMaterialPaletteCoherentWithExterior: true,
            interiorPanelModuleConsistent: true,
            interiorUsesSameWallSkinSystem: true,
            interiorWallAssemblyCoherent: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      )}

      {Object.entries(interiorBoardInstancesByColor).map(([key, group]) => (
        <GalaConstructionInstancedBoxes
          key={`${wall.id}-${key}`}
          color={group.color}
          instances={group.instances}
          name={`gala-construction-${wall.id}-${group.faceLabel}-interior-vertical-timber-board-panel-instanced`}
          roughness={0.88}
          userData={{
            interiorBoardGapM: wallSkin.interior.gapWidthM,
            interiorBoardInstanceCount: group.instances.length,
            interiorBoardModuleMatchesExterior: true,
            interiorUsesExactExteriorBoardModule: true,
            interiorUsesSameWoodTone: true,
            interiorBoardToGapRatio: Number((wallSkin.interior.boardWidthM / wallSkin.interior.gapWidthM).toFixed(2)),
            interiorBoardWidthM: wallSkin.interior.boardWidthM,
            interiorMaterialPaletteCoherentWithExterior: true,
            interiorPanelModuleConsistent: true,
            interiorUsesSameWallSkinSystem: true,
            interiorWallAssemblyCoherent: true,
            wallFace: group.faceLabel,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ))}

      <GalaCladdingAssembly visualConfig={visualConfig} wall={wall} />

      {wall.openings.map((opening) => (
        <GalaOpeningAssembly
          key={`${wall.id}-${opening.id}`}
          onEntryDoorOpen={onEntryDoorOpen}
          opening={opening}
          visualConfig={visualConfig}
          wall={wall}
        />
      ))}

      {wall.kind === 'exterior' ? (
        <GalaConstructionBox
          color={wallSkin.exterior.trimColor}
          name={`gala-construction-${wall.id}-continuous-top-eaves-trim`}
          position={wallPosition(wall, (wall.axisStartM + wall.axisEndM) * 0.5, GALA_CONSTRUCTION_LEVELS.wallHeightM + 0.035, GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.035)}
          size={wallSize(wall, wall.axisEndM - wall.axisStartM + 0.04, 0.09, 0.07)}
          userData={{
            facadeGroovesReachEavesWhereAppropriate: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ) : null}
    </group>
  );
}
