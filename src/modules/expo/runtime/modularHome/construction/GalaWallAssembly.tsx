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
  shouldRenderGalaExteriorCladding,
  shouldRenderGalaExteriorInteriorFace,
  type GalaConstructionRenderDetailLevel,
  type GalaConstructionRenderViewMode,
} from './GalaConstructionDetailPolicy';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from './GalaConstructionPbrTextures';
import {
  resolveGalaWallSkin,
} from './GalaWallSkinModel';

type WallCell = {
  axisCenterM: number;
  axisEndM: number;
  axisSizeM: number;
  axisStartM: number;
  heightM: number;
  yCenterM: number;
};



type GalaWallAssemblyProps = {
  onEntryDoorOpen?: () => void;
  renderDetailLevel: GalaConstructionRenderDetailLevel;
  visualConfig?: GalaHouseVisualConfig;
  viewMode: GalaConstructionRenderViewMode;
  wall: GalaConstructionWallSegment;
};

function sortedUnique(values: readonly number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);
}

function openingSillY(opening: GalaConstructionOpening): number {
  return GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + opening.sillM;
}

function openingHeadY(opening: GalaConstructionOpening): number {
  return openingSillY(opening) + opening.heightM;
}

function cellOverlapsOpening(axisCenterM: number, yCenterM: number, opening: GalaConstructionOpening): boolean {
  return axisCenterM > opening.axisStartM
    && axisCenterM < constructionAxisEnd(opening)
    && yCenterM > openingSillY(opening)
    && yCenterM < openingHeadY(opening);
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
      Math.max(0, openingSillY(opening)),
      Math.min(GALA_CONSTRUCTION_LEVELS.wallHeightM, openingHeadY(opening)),
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
        axisEndM: axisEnd,
        axisSizeM: axisEnd - axisStart,
        axisStartM: axisStart,
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

function buildPartitionFacePanels({
  cells,
  faceOffset,
  wall,
}: {
  cells: readonly WallCell[];
  faceOffset: number;
  wall: GalaConstructionWallSegment;
}): GalaConstructionBoxInstance[] {
  if (wall.kind !== 'partition') {
    return [];
  }

  return [-faceOffset, faceOffset].flatMap((offset) => (
    cells.map((cell) => ({
      position: wallPosition(wall, cell.axisCenterM, cell.yCenterM, offset),
      size: wallSize(wall, cell.axisSizeM, cell.heightM, 0.02),
    }))
  ));
}

export function GalaWallAssembly({
  onEntryDoorOpen,
  renderDetailLevel,
  visualConfig,
  viewMode,
  wall,
}: GalaWallAssemblyProps) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const interiorWallPbrTextures = useGalaConstructionPbrTextures('interiorWall', wallSkin.interior.wallTextureVariant);
  const wallCells = buildWallCells(wall);
  const coreMaterial = wall.kind === 'exterior'
    ? wallSkin.exterior.materials.reveal
    : wallSkin.interior.materials.panel;
  const coreColor = wall.kind === 'exterior'
    ? wallSkin.exterior.openingRevealColor
    : wallSkin.interior.partitionCoreColor;
  const faceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.009;
  const wallCoreInstances: GalaConstructionBoxInstance[] = wallCells.map((cell) => ({
    position: wallPosition(wall, cell.axisCenterM, cell.yCenterM),
    size: wallSize(wall, cell.axisSizeM, cell.heightM, GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM),
  }));
  const exteriorInteriorFaceInstances: GalaConstructionBoxInstance[] = wall.kind === 'exterior'
    ? wallCells.map((cell) => ({
      position: wallPosition(wall, cell.axisCenterM, cell.yCenterM, -faceOffset),
      size: wallSize(wall, cell.axisSizeM, cell.heightM, 0.022),
    }))
    : [];
  const partitionFacePanels = buildPartitionFacePanels({
    cells: wallCells,
    faceOffset,
    wall,
  });
  const reducedDetail = renderDetailLevel === 'reduced';
  const renderExteriorInteriorFace = shouldRenderGalaExteriorInteriorFace({
    viewMode,
    wallKind: wall.kind,
  });
  const renderExteriorCladding = shouldRenderGalaExteriorCladding({
    renderDetailLevel,
    viewMode,
  });

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
      <GalaConstructionInstancedBoxes
        {...coreMaterial}
        castShadow={!reducedDetail}
        color={coreColor}
        instances={wallCoreInstances}
        name={`gala-construction-${wall.id}-wall-core-cell-opening-aware-instanced`}
        receiveShadow={!reducedDetail}
        userData={{
          componentHint: 'construction/GalaWallAssembly.tsx',
          neutralStructuralWallCoreMaterial: true,
          openingAwareWallCoreCellCount: wallCoreInstances.length,
          plainWallFallbackNeutralizedByWallSkin: wall.kind === 'exterior',
          wallAssemblyOwnsCoreFacesRevealsTrim: true,
          wallCoreSeparatedFromFinishedInteriorMaterial: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
          wallId: wall.id,
        }}
      />

      {renderExteriorInteriorFace ? (
        <GalaConstructionInstancedBoxes
          {...wallSkin.interior.materials.panel}
          {...(reducedDetail ? {} : interiorWallPbrTextures)}
          castShadow={false}
          color={wallSkin.interior.wallPanelColor}
          instances={exteriorInteriorFaceInstances}
          name={`gala-construction-${wall.id}-flat-finished-interior-wall-face`}
          userData={{
            cleanInteriorWallMaterialNotExteriorCladding: true,
            interiorBoardModuleMatchesExterior: true,
            interiorFaceInstanceCount: exteriorInteriorFaceInstances.length,
            interiorMaterialPaletteCoherentWithExterior: true,
            interiorPanelModuleConsistent: true,
            interiorWallPbrTextureKind: 'interiorWall',
            interiorWallPbrTextureVariant: wallSkin.interior.wallTextureVariant,
            interiorReliefGeometryRemovedForCleanCeilingLine: true,
            interiorUsesExactExteriorBoardModule: true,
            interiorUsesSameWallSkinSystem: true,
            interiorUsesSameWoodTone: true,
            interiorWallAssemblyCoherent: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ) : wall.kind === 'partition' ? (
        <GalaConstructionInstancedBoxes
          {...wallSkin.interior.materials.panel}
          {...(reducedDetail ? {} : interiorWallPbrTextures)}
          castShadow={false}
          color={wallSkin.interior.wallPanelColor}
          instances={partitionFacePanels}
          name={`gala-construction-${wall.id}-flat-finished-partition-face-panel`}
          userData={{
            cleanInteriorWallMaterialNotExteriorCladding: true,
            interiorFaceInstanceCount: partitionFacePanels.length,
            interiorMaterialPaletteCoherentWithExterior: true,
            interiorPanelModuleConsistent: true,
            interiorPartitionFacesPanelizedForNearViewReadability: false,
            interiorWallPbrTextureKind: 'interiorWall',
            interiorWallPbrTextureVariant: wallSkin.interior.wallTextureVariant,
            interiorReliefGeometryRemovedForCleanCeilingLine: true,
            interiorUsesExactExteriorBoardModule: true,
            interiorUsesSameWallSkinSystem: true,
            interiorUsesSameWoodTone: true,
            interiorWallAssemblyCoherent: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
          }}
        />
      ) : null}

      {renderExteriorCladding ? (
        <GalaCladdingAssembly
          renderDetailLevel={renderDetailLevel}
          visualConfig={visualConfig}
          wall={wall}
        />
      ) : null}

      {wall.openings.map((opening) => (
        <GalaOpeningAssembly
          key={`${wall.id}-${opening.id}`}
          onEntryDoorOpen={onEntryDoorOpen}
          opening={opening}
          renderDetailLevel={renderDetailLevel}
          visualConfig={visualConfig}
          wall={wall}
        />
      ))}

      {wall.kind === 'exterior' ? (
        <GalaConstructionBox
          {...wallSkin.exterior.materials.trim}
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
