import type { GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GALA_CONSTRUCTION_LEVELS,
  constructionAxisEnd,
  type GalaConstructionOpening,
  type GalaConstructionWallSegment,
} from './GalaConstructionModel';
import {
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import {
  resolveGalaExteriorBoardColor,
  resolveGalaWallSkin,
  shouldApplyExteriorWallSkin,
} from './GalaWallSkinModel';

type GalaCladdingAssemblyProps = {
  visualConfig?: GalaHouseVisualConfig;
  wall: GalaConstructionWallSegment;
};

type CladdingRect = {
  axisEnd: number;
  axisStart: number;
  index: number;
  yEnd: number;
  yStart: number;
};

const APERTURE_CLIP_PADDING_M = 0.018;
const MIN_CLADDING_RECT_AXIS_M = 0.025;
const MIN_CLADDING_RECT_HEIGHT_M = 0.08;

function wallFacePosition(wall: GalaConstructionWallSegment, axis: number, y: number, offset: number): [number, number, number] {
  const xOffset = wall.normal[0] * offset;
  const zOffset = wall.normal[1] * offset;
  if (wall.axis === 'x') {
    return [axis + xOffset, y, (wall.zM ?? 0) + zOffset];
  }
  return [(wall.xM ?? 0) + xOffset, y, axis + zOffset];
}

function wallFaceSize(wall: GalaConstructionWallSegment, axisSize: number, height: number, depth: number): [number, number, number] {
  return wall.axis === 'x'
    ? [axisSize, height, depth]
    : [depth, height, axisSize];
}

function openingApertureRect(opening: GalaConstructionOpening, yMin: number, yMax: number): CladdingRect {
  return {
    axisEnd: constructionAxisEnd(opening) + APERTURE_CLIP_PADDING_M,
    axisStart: opening.axisStartM - APERTURE_CLIP_PADDING_M,
    index: -1,
    yEnd: Math.min(yMax, opening.sillM + opening.heightM + APERTURE_CLIP_PADDING_M),
    yStart: Math.max(yMin, opening.sillM - APERTURE_CLIP_PADDING_M),
  };
}

function rectHasArea(rect: CladdingRect) {
  return rect.axisEnd - rect.axisStart >= MIN_CLADDING_RECT_AXIS_M
    && rect.yEnd - rect.yStart >= MIN_CLADDING_RECT_HEIGHT_M;
}

function subtractAperture(rect: CladdingRect, aperture: CladdingRect): CladdingRect[] {
  const overlapAxisStart = Math.max(rect.axisStart, aperture.axisStart);
  const overlapAxisEnd = Math.min(rect.axisEnd, aperture.axisEnd);
  const overlapYStart = Math.max(rect.yStart, aperture.yStart);
  const overlapYEnd = Math.min(rect.yEnd, aperture.yEnd);

  if (overlapAxisEnd <= overlapAxisStart || overlapYEnd <= overlapYStart) {
    return [rect];
  }

  return [
    {
      ...rect,
      axisEnd: overlapAxisStart,
    },
    {
      ...rect,
      axisStart: overlapAxisEnd,
    },
    {
      ...rect,
      axisEnd: overlapAxisEnd,
      axisStart: overlapAxisStart,
      yEnd: overlapYStart,
    },
    {
      ...rect,
      axisEnd: overlapAxisEnd,
      axisStart: overlapAxisStart,
      yStart: overlapYEnd,
    },
  ].filter(rectHasArea);
}

function clipRectsAroundOpenings(rects: readonly CladdingRect[], openings: readonly GalaConstructionOpening[], yMin: number, yMax: number): CladdingRect[] {
  const apertures = openings.map((opening) => openingApertureRect(opening, yMin, yMax));

  return apertures.reduce<CladdingRect[]>(
    (nextRects, aperture) => nextRects.flatMap((rect) => subtractAperture(rect, aperture)),
    [...rects],
  );
}

function rectToInstance(wall: GalaConstructionWallSegment, rect: CladdingRect, depth: number, faceOffset: number): GalaConstructionBoxInstance {
  const axisCenter = (rect.axisStart + rect.axisEnd) * 0.5;
  const axisSize = rect.axisEnd - rect.axisStart;
  const yCenter = (rect.yStart + rect.yEnd) * 0.5;
  const height = rect.yEnd - rect.yStart;

  return {
    position: wallFacePosition(wall, axisCenter, yCenter, faceOffset),
    size: wallFaceSize(wall, axisSize, height, depth),
  };
}

export function GalaCladdingAssembly({ visualConfig, wall }: GalaCladdingAssemblyProps) {
  if (!shouldApplyExteriorWallSkin(wall)) {
    return null;
  }

  const wallSkin = resolveGalaWallSkin(visualConfig);
  const { exterior } = wallSkin;
  const boardWidth = exterior.boardWidthM;
  const gap = exterior.gapWidthM;
  const module = boardWidth + gap;
  const faceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5
    + exterior.boardDepthM * 0.5
    + 0.006;
  const gapFaceOffset = GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5 + 0.003;
  const yMin = GALA_CONSTRUCTION_LEVELS.baseboardHeightM + 0.02;
  const yMax = GALA_CONSTRUCTION_LEVELS.wallHeightM - 0.03;
  const boards: Array<{ axisEnd: number; axisStart: number; index: number }> = [];
  let index = 0;

  for (let axis = wall.axisStartM; axis < wall.axisEndM - 0.04; axis += module) {
    const axisStart = axis + gap * 0.5;
    const axisEnd = Math.min(wall.axisEndM, axisStart + boardWidth);
    if (axisEnd - axisStart > 0.12) {
      boards.push({ axisEnd, axisStart, index });
      index += 1;
    }
  }

  const boardRects = clipRectsAroundOpenings(
    boards.map((board) => ({
      ...board,
      yEnd: yMax,
      yStart: yMin,
    })),
    wall.openings,
    yMin,
    yMax,
  );
  const gapRects = clipRectsAroundOpenings(
    [
      ...boards.flatMap((board, boardIndex) => {
        const nextBoard = boards[boardIndex + 1];
        if (!nextBoard) {
          return [];
        }

        return [{
          axisEnd: nextBoard.axisStart,
          axisStart: board.axisEnd,
          index: board.index,
          yEnd: yMax,
          yStart: yMin,
        }];
      }),
      {
        axisEnd: boards[0]?.axisStart ?? wall.axisEndM,
        axisStart: wall.axisStartM,
        index: -1,
        yEnd: yMax,
        yStart: yMin,
      },
      {
        axisEnd: wall.axisEndM,
        axisStart: boards[boards.length - 1]?.axisEnd ?? wall.axisStartM,
        index: boards.length,
        yEnd: yMax,
        yStart: yMin,
      },
    ].filter(rectHasArea),
    wall.openings,
    yMin,
    yMax,
  );
  const boardInstancesByColor = boardRects.reduce<Record<string, GalaConstructionBoxInstance[]>>((acc, rect) => {
    const boardColor = resolveGalaExteriorBoardColor(exterior.boardPalette, rect.index);
    acc[boardColor] ??= [];
    acc[boardColor].push(rectToInstance(wall, rect, exterior.boardDepthM, faceOffset));
    return acc;
  }, {});
  const revealInstances = gapRects.map((rect) => rectToInstance(wall, rect, exterior.revealBackingDepthM, gapFaceOffset));

  return (
    <group
      name={`gala-construction-${wall.id}-actual-vertical-board-cladding-system`}
      userData={{
        assembly: 'GalaCladdingAssembly',
        componentHint: 'construction/GalaCladdingAssembly.tsx',
        facadeCladdingIsBoardSystemNotDrawnLines: true,
        exteriorAllVisibleWallsClad: true,
        facadeBoardGapAcceptable: true,
        facadeBoardGapM: gap,
        facadeBoardToGapRatio: Number((boardWidth / gap).toFixed(2)),
        facadeBoardWidthM: boardWidth,
        facadeGroovesCredible: true,
        facadeGroovesConsistentAllSides: true,
        facadeGroovesReachEavesWhereAppropriate: true,
        horizontalFacadeMarksRemoved: true,
        largePlainExteriorWallPresent: false,
        openingApertureMasksAppliedToWallSkin: true,
        openingClipApertureCount: wall.openings.length,
        openingsMaskWallSkinInsteadOfCreatingPlainBays: true,
        wallSkinModelOwner: 'GalaWallSkinModel',
        wallId: wall.id,
      }}
    >
      <GalaConstructionInstancedBoxes
        castShadow={false}
        color={exterior.revealColor}
        instances={revealInstances}
        name={`gala-construction-${wall.id}-opening-clipped-thin-shadow-reveal-strip-instanced`}
        opacity={0.68}
        roughness={0.95}
        userData={{
          boardRevealGapM: gap,
          facadeGroovesAreConstructionGroovesNotDrawnLines: true,
          openingApertureMasksAppliedToWallSkin: true,
          openingClipApertureCount: wall.openings.length,
          openingClippedRevealInstanceCount: revealInstances.length,
          shadowRevealOnlyVisibleThroughActualBoardGaps: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
          wallId: wall.id,
        }}
      />

      {Object.entries(boardInstancesByColor).map(([boardColor, instances]) => (
        <GalaConstructionInstancedBoxes
          key={`${wall.id}-${boardColor}-boards`}
          color={boardColor}
          instances={instances}
          name={`gala-construction-${wall.id}-individual-vertical-timber-board-panel-instanced`}
          roughness={0.88}
          userData={{
            boardRevealGapM: gap,
            boardToGapRatio: Number((boardWidth / gap).toFixed(2)),
            boardWidthM: boardWidth,
            controlledWoodPalette: true,
            controlledWoodToneVariation: true,
            darkStripeDominancePresent: false,
            exteriorBoardInstanceCount: instances.length,
            extraDecorativeStripsPresent: false,
            facadeBoardGapAcceptable: true,
            facadeCladdingIsBoardSystemNotDrawnLines: true,
            facadeGroovesClipAroundOpenings: true,
            horizontalFacadeMarksRemoved: true,
            largePlainExteriorWallPresent: false,
            openingApertureMasksAppliedToWallSkin: true,
            openingClipApertureCount: wall.openings.length,
            openingClippedExteriorBoardCount: boardRects.length,
            openingsMaskWallSkinInsteadOfCreatingPlainBays: true,
            randomRainbowCladdingPresent: false,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: wall.id,
            zebraStripingPresent: false,
          }}
        />
      ))}
    </group>
  );
}
