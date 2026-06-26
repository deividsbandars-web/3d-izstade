import { useMemo } from 'react';
import * as THREE from 'three';
import { GALA_HOUSE_DIMENSIONS } from '../GalaHouseDimensions';
import {
  resolveGalaTerraceVisual,
  type GalaHouseVisualConfig,
} from '../GalaHouseConfig';
import { GalaRoof } from '../GalaRoof';
import {
  GALA_CONSTRUCTION_LEVELS,
  GALA_CONSTRUCTION_MODEL,
  GALA_CONSTRUCTION_WALLS,
} from './GalaConstructionModel';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import { GalaFloorCeilingAssembly } from './GalaFloorCeilingAssembly';
import { GalaRoomAssembly } from './GalaRoomAssembly';
import { GalaWallAssembly } from './GalaWallAssembly';
import {
  resolveGalaExteriorBoardColor,
  resolveGalaWallSkin,
} from './GalaWallSkinModel';

type GalaConstructionRendererProps = {
  onEntryDoorOpen?: () => void;
  transparentCutaway?: boolean;
  visualConfig?: GalaHouseVisualConfig;
};

function opacityForCutaway(transparentCutaway: boolean | undefined): number {
  return transparentCutaway ? 0.34 : 1;
}

function FoundationAndBaseTrim({ visualConfig }: { visualConfig?: GalaHouseVisualConfig }) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const length = GALA_HOUSE_DIMENSIONS.houseLengthM;
  const width = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM;
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;

  return (
    <group
      name="gala-construction-foundation-and-consistent-base-trim"
      userData={{
        assembly: 'GalaConstructionRenderer/FoundationAndBaseTrim',
        facadeBaseTrimConsistentAllSides: true,
      }}
    >
      <GalaConstructionBox
        color="#8b8f94"
        name="gala-construction-low-foundation-slab-below-single-finished-floor"
        position={[0, -0.18, 0]}
        receiveShadow
        size={[length + 0.24, 0.16, width + 0.24]}
        userData={{ floorStackHasNoCoplanarOverlays: true }}
      />
      {[
        { name: 'south-base', position: [0, 0.075, -halfWidth - 0.075] as [number, number, number], size: [length + 0.16, 0.15, 0.085] as [number, number, number] },
        { name: 'north-base', position: [0, 0.075, halfWidth + 0.075] as [number, number, number], size: [length + 0.16, 0.15, 0.085] as [number, number, number] },
        { name: 'west-base', position: [-halfLength - 0.075, 0.075, 0] as [number, number, number], size: [0.085, 0.15, width + 0.16] as [number, number, number] },
        { name: 'east-base', position: [halfLength + 0.075, 0.075, 0] as [number, number, number], size: [0.085, 0.15, width + 0.16] as [number, number, number] },
      ].map((trim) => (
        <GalaConstructionBox
          key={trim.name}
          color={wallSkin.exterior.trimColor}
          name={`gala-construction-${trim.name}-continuous-base-trim`}
          position={trim.position}
          size={trim.size}
          userData={{
            facadeBaseTrimConsistentAllSides: true,
            facadeCladdingIsBoardSystemNotDrawnLines: true,
            wallSkinModelOwner: 'GalaWallSkinModel',
          }}
        />
      ))}
    </group>
  );
}

function CornerBoards({ visualConfig }: { visualConfig?: GalaHouseVisualConfig }) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const halfLength = GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const halfWidth = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5;

  return (
    <group
      name="gala-construction-consistent-corner-board-system"
      userData={{ cornerTrimAdded: true, facadeGroovesConsistentAllSides: true }}
    >
      {[-halfLength, halfLength].flatMap((x) => (
        [-halfWidth, halfWidth].map((z) => (
          <GalaConstructionBox
            key={`${x}-${z}`}
            color={wallSkin.exterior.trimColor}
            name="gala-construction-full-height-corner-board-ties-wall-assemblies"
            position={[x + Math.sign(x) * 0.075, GALA_CONSTRUCTION_LEVELS.wallHeightM * 0.5, z + Math.sign(z) * 0.075]}
            size={[0.15, GALA_CONSTRUCTION_LEVELS.wallHeightM, 0.15]}
            userData={{
              cornerTrimAdded: true,
              interiorWallAssemblyCoherent: true,
              wallSkinModelOwner: 'GalaWallSkinModel',
            }}
          />
        ))
      ))}
    </group>
  );
}

function ResidentialTerrace({ visualConfig }: { visualConfig?: GalaHouseVisualConfig }) {
  const terraceVisual = resolveGalaTerraceVisual(visualConfig);
  const terraceDoor = GALA_CONSTRUCTION_MODEL.openings.find((opening) => opening.id === 'D-TERRACE');
  const terraceCenterX = terraceDoor
    ? terraceDoor.axisStartM + terraceDoor.widthM * 0.5
    : -0.7;
  const deckZ = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5 + GALA_HOUSE_DIMENSIONS.terraceDepthM * 0.5;
  const deckFrontZ = deckZ + GALA_HOUSE_DIMENSIONS.terraceDepthM * 0.5;

  return (
    <group
      name="gala-construction-residential-terrace-integrated-low-deck"
      userData={{
        assembly: 'GalaConstructionRenderer/ResidentialTerrace',
        terraceResidentialNotFortress: true,
      }}
    >
      <GalaConstructionBox
        color={terraceVisual.deckColor}
        name="gala-construction-terrace-low-timber-deck-2400x2100"
        position={[terraceCenterX, 0.105, deckZ]}
        size={[GALA_HOUSE_DIMENSIONS.terraceLengthM, 0.15, GALA_HOUSE_DIMENSIONS.terraceDepthM]}
        userData={{ terraceResidentialNotFortress: true }}
      />
      {Array.from({ length: 12 }).map((_, index) => {
        const z = deckZ - GALA_HOUSE_DIMENSIONS.terraceDepthM * 0.5 + ((index + 0.5) * GALA_HOUSE_DIMENSIONS.terraceDepthM / 12);
        return (
          <GalaConstructionBox
            key={`deck-gap-${index}`}
            color={terraceVisual.deckDarkColor}
            name="gala-construction-terrace-recessed-board-gap"
            position={[terraceCenterX, 0.188, z]}
            size={[GALA_HOUSE_DIMENSIONS.terraceLengthM + 0.03, 0.012, 0.018]}
            userData={{ terraceResidentialNotFortress: true }}
          />
        );
      })}
      <GalaConstructionBox
        color={terraceVisual.deckDarkColor}
        name="gala-construction-terrace-low-front-edge-trim-not-barrier"
        position={[terraceCenterX, 0.165, deckFrontZ]}
        size={[GALA_HOUSE_DIMENSIONS.terraceLengthM + 0.04, terraceVisual.edgeTrimHeightM, terraceVisual.edgeTrimDepthM]}
        userData={{ terraceResidentialNotFortress: true }}
      />
      {terraceVisual.showSteps ? Array.from({ length: terraceVisual.stepCount }).map((_, index) => (
        <GalaConstructionBox
          key={`terrace-step-${index}`}
          color={terraceVisual.deckColor}
          name="gala-construction-terrace-residential-shallow-step"
          position={[terraceCenterX, (index === 0 ? 0.105 : 0.075) * 0.5, deckFrontZ + 0.23 + (index * 0.34)]}
          size={[1.54 + index * 0.22, index === 0 ? 0.105 : 0.075, 0.32]}
          userData={{ terraceResidentialNotFortress: true }}
        />
      )) : null}
    </group>
  );
}

function GableBoardCladding({
  side,
  transparentCutaway,
  visualConfig,
}: {
  side: 'east' | 'west';
  transparentCutaway?: boolean;
  visualConfig?: GalaHouseVisualConfig;
}) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const { exterior } = wallSkin;
  const shape = useMemo(() => {
    const nextShape = new THREE.Shape();
    const halfRoofWidth = GALA_HOUSE_DIMENSIONS.roofWidthM * 0.5;
    nextShape.moveTo(-halfRoofWidth, 0);
    nextShape.lineTo(halfRoofWidth, 0);
    nextShape.lineTo(0, GALA_HOUSE_DIMENSIONS.roofRiseM);
    nextShape.lineTo(-halfRoofWidth, 0);
    return nextShape;
  }, []);
  const x = side === 'west'
    ? -GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5
    : GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const rotationY = side === 'west' ? Math.PI * 0.5 : -Math.PI * 0.5;
  const faceX = x + (side === 'west' ? -0.09 : 0.09);
  const halfRoofWidth = GALA_HOUSE_DIMENSIONS.roofWidthM * 0.5;
  const wallTopY = GALA_CONSTRUCTION_LEVELS.wallHeightM;
  const boards = useMemo(() => {
    const module = exterior.boardWidthM + exterior.gapWidthM;
    const nextBoards: Array<{ height: number; index: number; z: number }> = [];
    let index = 0;
    for (let z = -halfRoofWidth + module * 0.5; z < halfRoofWidth; z += module) {
      const roofHeight = GALA_HOUSE_DIMENSIONS.roofRiseM * Math.max(0, 1 - (Math.abs(z) / halfRoofWidth));
      if (roofHeight > 0.18) {
        nextBoards.push({ height: roofHeight, index, z });
      }
      index += 1;
    }
    return nextBoards;
  }, [exterior.boardWidthM, exterior.gapWidthM, halfRoofWidth]);
  const gableBoardInstancesByColor = useMemo(() => boards.reduce<Record<string, GalaConstructionBoxInstance[]>>((acc, board) => {
    const boardColor = resolveGalaExteriorBoardColor(exterior.boardPalette, board.index);
    acc[boardColor] ??= [];
    acc[boardColor].push({
      position: [faceX, wallTopY + board.height * 0.5, board.z],
      size: [
        exterior.boardDepthM,
        board.height,
        exterior.boardWidthM,
      ],
    });
    return acc;
  }, {}), [boards, exterior.boardDepthM, exterior.boardPalette, exterior.boardWidthM, faceX, wallTopY]);

  return (
    <group
      name={`gala-construction-${side}-gable-board-cladding-assembly`}
      userData={{
        assembly: 'GalaConstructionRenderer/GableBoardCladding',
        facadeBoardGapAcceptable: true,
        facadeBoardGapM: exterior.gapWidthM,
        facadeBoardToGapRatio: Number((exterior.boardWidthM / exterior.gapWidthM).toFixed(2)),
        facadeBoardWidthM: exterior.boardWidthM,
        facadeCladdingIsBoardSystemNotDrawnLines: true,
        facadeGroovesReachEavesWhereAppropriate: true,
        wallSkinModelOwner: 'GalaWallSkinModel',
      }}
    >
      <mesh
        castShadow
        name={`gala-construction-${side}-gable-opaque-wall-core`}
        position={[x, wallTopY, 0]}
        receiveShadow
        rotation={[0, rotationY, 0]}
        userData={{
          componentHint: 'construction/GalaConstructionRenderer.tsx',
          facadeCladdingIsBoardSystemNotDrawnLines: true,
        }}
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={exterior.revealColor}
          opacity={opacityForCutaway(transparentCutaway)}
          roughness={0.9}
          side={THREE.DoubleSide}
          transparent={Boolean(transparentCutaway)}
        />
      </mesh>
      {Object.entries(gableBoardInstancesByColor).map(([boardColor, instances]) => (
        <GalaConstructionInstancedBoxes
          key={`${side}-gable-${boardColor}-boards`}
          color={boardColor}
          instances={instances}
          name={`gala-construction-${side}-gable-individual-vertical-timber-board-panel-instanced`}
          opacity={opacityForCutaway(transparentCutaway)}
          roughness={0.88}
          userData={{
            boardRevealGapM: exterior.gapWidthM,
            boardToGapRatio: Number((exterior.boardWidthM / exterior.gapWidthM).toFixed(2)),
            boardWidthM: exterior.boardWidthM,
            controlledWoodPalette: true,
            controlledWoodToneVariation: true,
            darkStripeDominancePresent: false,
            exteriorBoardInstanceCount: instances.length,
            extraDecorativeStripsPresent: false,
            facadeBoardGapAcceptable: true,
            facadeCladdingIsBoardSystemNotDrawnLines: true,
            facadeGroovesCredible: true,
            facadeGroovesReachEavesWhereAppropriate: true,
            randomRainbowCladdingPresent: false,
            wallSkinModelOwner: 'GalaWallSkinModel',
            wallId: `${side}-gable`,
            zebraStripingPresent: false,
          }}
        />
      ))}
    </group>
  );
}

export function GalaConstructionRenderer({
  onEntryDoorOpen,
  transparentCutaway = false,
  visualConfig,
}: GalaConstructionRendererProps) {
  return (
    <group
      name="gala-construction-renderer-ownership-contracted-assembly"
      userData={{
        constructionModel: GALA_CONSTRUCTION_MODEL,
        constructionModelIsAdapter: true,
        fragmentedPrimitivePatchLoopStopped: true,
        productVisualAccepted: false,
        rendererOwnershipContract: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
        roofOwnershipDocumented: true,
        singleSourceRendererProven: false,
        stagingDeployPerformed: false,
      }}
    >
      <group
        name="gala-construction-roof-adapter-mounted-inside-construction-renderer"
        userData={{
          adapterFor: 'GalaRoof',
          authoritativeDataSource: 'GALA_HOUSE_DIMENSIONS + GalaHouseVisualConfig',
          ownerDocument: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
          roofOwnershipDocumented: true,
        }}
      >
        <GalaRoof transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
      </group>
      <group
        name="gala-construction-owned-floor-wall-opening-room-assemblies"
        userData={{
          constructionModelIsAdapter: true,
          rendererOwnershipContract: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
          singleSourceRendererProven: false,
        }}
      >
        <FoundationAndBaseTrim visualConfig={visualConfig} />
        <GalaFloorCeilingAssembly visualConfig={visualConfig} />
        {GALA_CONSTRUCTION_WALLS.map((wall) => (
          <GalaWallAssembly
            key={wall.id}
            onEntryDoorOpen={onEntryDoorOpen}
            visualConfig={visualConfig}
            wall={wall}
          />
        ))}
        <GableBoardCladding side="west" transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
        <GableBoardCladding side="east" transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
        <CornerBoards visualConfig={visualConfig} />
        <ResidentialTerrace visualConfig={visualConfig} />
        <GalaRoomAssembly visualConfig={visualConfig} />
      </group>
    </group>
  );
}
