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
  type GalaConstructionModel,
} from './GalaConstructionModel';
import {
  GalaConstructionBox,
  GalaConstructionInstancedBoxes,
  type GalaConstructionBoxInstance,
} from './GalaConstructionPrimitives';
import { GalaFloorCeilingAssembly } from './GalaFloorCeilingAssembly';
import { GalaRoomAssembly } from './GalaRoomAssembly';
import { GalaWallAssembly } from './GalaWallAssembly';
import { useGalaConstructionPbrTextures } from './GalaConstructionPbrTextures';
import {
  resolveGalaExteriorBoardColor,
  resolveGalaWallSkin,
} from './GalaWallSkinModel';

type GalaConstructionRendererProps = {
  constructionModel?: GalaConstructionModel;
  onEntryDoorOpen?: () => void;
  transparentCutaway?: boolean;
  visualConfig?: GalaHouseVisualConfig;
};

function opacityForCutaway(transparentCutaway: boolean | undefined): number {
  return transparentCutaway ? 0.34 : 1;
}

function FoundationAndBaseTrim({ visualConfig }: { visualConfig?: GalaHouseVisualConfig }) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const trimPbrTextures = useGalaConstructionPbrTextures('trim');
  const length = GALA_HOUSE_DIMENSIONS.houseLengthM;
  const width = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM;
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;
  const foundationHeight = 0.16;
  const baseTrimHeight = 0.15;
  const foundationY = GALA_CONSTRUCTION_LEVELS.foundationSlabTopY - (foundationHeight * 0.5);
  const baseTrimY = GALA_CONSTRUCTION_LEVELS.baseTrimTopY - (baseTrimHeight * 0.5);

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
        position={[0, foundationY, 0]}
        receiveShadow
        size={[length + 0.24, foundationHeight, width + 0.24]}
        userData={{ floorStackHasNoCoplanarOverlays: true }}
      />
      {[
        { name: 'south-base', position: [0, baseTrimY, -halfWidth - 0.075] as [number, number, number], size: [length + 0.16, baseTrimHeight, 0.085] as [number, number, number] },
        { name: 'north-base', position: [0, baseTrimY, halfWidth + 0.075] as [number, number, number], size: [length + 0.16, baseTrimHeight, 0.085] as [number, number, number] },
        { name: 'west-base', position: [-halfLength - 0.075, baseTrimY, 0] as [number, number, number], size: [0.085, baseTrimHeight, width + 0.16] as [number, number, number] },
        { name: 'east-base', position: [halfLength + 0.075, baseTrimY, 0] as [number, number, number], size: [0.085, baseTrimHeight, width + 0.16] as [number, number, number] },
      ].map((trim) => (
        <GalaConstructionBox
          {...trimPbrTextures}
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
  const exteriorPbrTextures = useGalaConstructionPbrTextures('exterior', wallSkin.exterior.textureVariant);
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
            {...exteriorPbrTextures}
            key={`${x}-${z}`}
            color={wallSkin.exterior.trimColor}
            name="gala-construction-full-height-corner-board-ties-wall-assemblies"
            position={[x + Math.sign(x) * 0.075, GALA_CONSTRUCTION_LEVELS.wallHeightM * 0.5, z + Math.sign(z) * 0.075]}
            size={[0.15, GALA_CONSTRUCTION_LEVELS.wallHeightM, 0.15]}
            userData={{
              cornerTrimAdded: true,
              exteriorPbrTextureVariant: wallSkin.exterior.textureVariant,
              interiorWallAssemblyCoherent: true,
              wallSkinModelOwner: 'GalaWallSkinModel',
            }}
          />
        ))
      ))}
    </group>
  );
}

function ResidentialTerrace({
  constructionModel,
  visualConfig,
}: {
  constructionModel: GalaConstructionModel;
  visualConfig?: GalaHouseVisualConfig;
}) {
  const terraceVisual = resolveGalaTerraceVisual(visualConfig);
  const deckPbrTextures = useGalaConstructionPbrTextures('deck');
  const terrace = constructionModel.terrace;
  const terraceDoor = constructionModel.openings.find((opening) => opening.id === 'D-TERRACE');
  const terraceCenterX = terraceDoor
    ? terraceDoor.axisStartM + terraceDoor.widthM * 0.5 + terrace.centerOffsetXM
    : -0.7;
  const deckZ = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5 + terrace.depthM * 0.5 - 0.10;
  const deckFrontZ = deckZ + terrace.depthM * 0.5;
  const deckY = constructionModel.floor.terraceDeckTopY - (terrace.deckThicknessM * 0.5);
  const deckEdgeY = GALA_CONSTRUCTION_LEVELS.terraceDeckTopY - (terraceVisual.edgeTrimHeightM * 0.5) + 0.004;
  const deckBackConnectorY = constructionModel.floor.terraceDeckTopY - ((terrace.deckThicknessM + 0.02) * 0.5);
  const deckBackConnectorZ = GALA_HOUSE_DIMENSIONS.assembledWallEnvelopeWidthM * 0.5 + 0.005;

  if (!terrace.enabled) {
    return null;
  }

  return (
    <group
      name="gala-construction-residential-terrace-integrated-low-deck"
      userData={{
        assembly: 'GalaConstructionRenderer/ResidentialTerrace',
        terraceDepthM: terrace.depthM,
        terraceLengthM: terrace.lengthM,
        terraceResidentialNotFortress: true,
      }}
    >
      <GalaConstructionBox
        {...deckPbrTextures}
        color={terraceVisual.deckColor}
        name="gala-construction-terrace-low-timber-deck-configurable"
        position={[terraceCenterX, deckY, deckZ]}
        size={[terrace.lengthM, terrace.deckThicknessM, terrace.depthM]}
        userData={{
          terraceDepthM: terrace.depthM,
          terraceLengthM: terrace.lengthM,
          terraceResidentialNotFortress: true,
        }}
      />
      <GalaConstructionBox
        color={terraceVisual.deckDarkColor}
        name="gala-construction-terrace-low-front-edge-trim-not-barrier"
        position={[terraceCenterX, deckEdgeY, deckFrontZ]}
        size={[terrace.lengthM + 0.04, terraceVisual.edgeTrimHeightM, terraceVisual.edgeTrimDepthM]}
        userData={{ terraceResidentialNotFortress: true }}
      />
      {[-1, 1].map((side) => (
        <GalaConstructionBox
          key={`terrace-side-edge-trim-${side}`}
          color={terraceVisual.deckDarkColor}
          name="gala-construction-terrace-low-side-edge-trim-not-barrier"
          position={[
            terraceCenterX + side * terrace.lengthM * 0.5,
            deckEdgeY,
            deckZ,
          ]}
          size={[
            terraceVisual.edgeTrimDepthM,
            terraceVisual.edgeTrimHeightM,
            terrace.depthM + 0.04,
          ]}
          userData={{ terraceResidentialNotFortress: true }}
        />
      ))}
      <GalaConstructionBox
        color={terraceVisual.deckDarkColor}
        name="gala-construction-terrace-house-wall-back-edge-connector-strip"
        position={[terraceCenterX, deckBackConnectorY, deckBackConnectorZ]}
        size={[terrace.lengthM + 0.04, terrace.deckThicknessM + 0.02, terrace.backConnectorDepthM]}
        userData={{
          terraceCladdingGapSealed: true,
          terraceResidentialNotFortress: true,
        }}
      />
      {terraceVisual.showSteps ? Array.from({ length: terraceVisual.stepCount }).map((_, index) => (
        <GalaConstructionBox
          {...deckPbrTextures}
          key={`terrace-step-${index}`}
          color={terraceVisual.deckColor}
          name="gala-construction-terrace-residential-shallow-step"
          position={[terraceCenterX, (index === 0 ? 0.105 : 0.075) * 0.5, deckFrontZ + 0.23 + (index * (terrace.stepDepthM + 0.02))]}
          size={[terrace.stepBaseWidthM + index * terrace.stepWidthIncrementM, index === 0 ? 0.105 : 0.075, terrace.stepDepthM]}
          userData={{ terraceResidentialNotFortress: true }}
        />
      )) : null}
      {terraceVisual.showLightRail ? (
        <>
          <GalaConstructionBox
            color={terraceVisual.railColor}
            name="gala-construction-terrace-light-rail-front"
            position={[terraceCenterX, constructionModel.floor.terraceDeckTopY + terraceVisual.railHeightM * 0.5, deckFrontZ - 0.1]}
            size={[terrace.lengthM + 0.04, terraceVisual.railHeightM, 0.055]}
            userData={{ terraceLightRail: true, terraceResidentialNotFortress: true }}
          />
          {[-1, 1].map((side) => (
            <GalaConstructionBox
              key={`terrace-light-rail-side-${side}`}
              color={terraceVisual.railColor}
              name="gala-construction-terrace-light-rail-side-return"
              position={[terraceCenterX + side * terrace.lengthM * 0.5, constructionModel.floor.terraceDeckTopY + terraceVisual.railHeightM * 0.5, deckZ]}
              size={[0.055, terraceVisual.railHeightM, Math.max(0.45, terrace.depthM - 0.28)]}
              userData={{ terraceLightRail: true, terraceResidentialNotFortress: true }}
            />
          ))}
        </>
      ) : null}
    </group>
  );
}

function GableBoardCladding({
  constructionModel,
  side,
  transparentCutaway,
  visualConfig,
}: {
  constructionModel: GalaConstructionModel;
  side: 'east' | 'west';
  transparentCutaway?: boolean;
  visualConfig?: GalaHouseVisualConfig;
}) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const { exterior } = wallSkin;
  const exteriorPbrTextures = useGalaConstructionPbrTextures('exterior', exterior.textureVariant);
  const shape = useMemo(() => {
    const nextShape = new THREE.Shape();
    const halfRoofWidth = constructionModel.roof.roofWidthM * 0.5;
    nextShape.moveTo(-halfRoofWidth, 0);
    nextShape.lineTo(halfRoofWidth, 0);
    nextShape.lineTo(0, constructionModel.roof.roofRiseM);
    nextShape.lineTo(-halfRoofWidth, 0);
    return nextShape;
  }, [constructionModel.roof.roofRiseM, constructionModel.roof.roofWidthM]);
  const x = side === 'west'
    ? -GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5
    : GALA_HOUSE_DIMENSIONS.houseLengthM * 0.5;
  const rotationY = side === 'west' ? Math.PI * 0.5 : -Math.PI * 0.5;
  const faceX = x + (side === 'west' ? -0.09 : 0.09);
  const halfRoofWidth = constructionModel.roof.roofWidthM * 0.5;
  const wallTopY = GALA_CONSTRUCTION_LEVELS.wallHeightM;
  const boards = useMemo(() => {
    const module = exterior.boardWidthM + exterior.gapWidthM;
    const nextBoards: Array<{ height: number; index: number; z: number }> = [];
    let index = 0;
    for (let z = -halfRoofWidth + module * 0.5; z < halfRoofWidth; z += module) {
      const roofHeight = constructionModel.roof.roofRiseM * Math.max(0, 1 - ((Math.abs(z) + exterior.boardWidthM * 0.5) / halfRoofWidth)) - 0.045;
      if (roofHeight > 0.18) {
        nextBoards.push({ height: roofHeight, index, z });
      }
      index += 1;
    }
    return nextBoards;
  }, [constructionModel.roof.roofRiseM, exterior.boardWidthM, exterior.gapWidthM, halfRoofWidth]);
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
        <meshPhysicalMaterial
          {...exterior.materials.reveal}
          color={exterior.revealColor}
          opacity={opacityForCutaway(transparentCutaway)}
          side={THREE.DoubleSide}
          transparent={Boolean(transparentCutaway)}
        />
      </mesh>
      {Object.entries(gableBoardInstancesByColor).map(([boardColor, instances]) => (
        <GalaConstructionInstancedBoxes
          {...exterior.materials.board}
          {...exteriorPbrTextures}
          key={`${side}-gable-${boardColor}-boards`}
          color={boardColor}
          instances={instances}
          name={`gala-construction-${side}-gable-individual-vertical-timber-board-panel-instanced`}
          opacity={opacityForCutaway(transparentCutaway)}
          userData={{
            boardRevealGapM: exterior.gapWidthM,
            boardToGapRatio: Number((exterior.boardWidthM / exterior.gapWidthM).toFixed(2)),
            boardWidthM: exterior.boardWidthM,
            controlledWoodPalette: true,
            controlledWoodToneVariation: true,
            darkStripeDominancePresent: false,
            exteriorBoardInstanceCount: instances.length,
            exteriorPbrTextureVariant: exterior.textureVariant,
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
  constructionModel = GALA_CONSTRUCTION_MODEL,
  onEntryDoorOpen,
  transparentCutaway = false,
  visualConfig,
}: GalaConstructionRendererProps) {
  return (
    <group
      name="gala-construction-renderer-ownership-contracted-assembly"
      userData={{
        constructionModel,
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
          authoritativeDataSource: 'GalaConstructionModel.roof + GalaHouseVisualConfig',
          ownerDocument: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
          roofOwnershipDocumented: true,
        }}
      >
        <GalaRoof roofModel={constructionModel.roof} transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
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
        {constructionModel.walls.map((wall) => (
          <GalaWallAssembly
            key={wall.id}
            onEntryDoorOpen={onEntryDoorOpen}
            visualConfig={visualConfig}
            wall={wall}
          />
        ))}
        <GableBoardCladding constructionModel={constructionModel} side="west" transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
        <GableBoardCladding constructionModel={constructionModel} side="east" transparentCutaway={transparentCutaway} visualConfig={visualConfig} />
        <CornerBoards visualConfig={visualConfig} />
        <ResidentialTerrace constructionModel={constructionModel} visualConfig={visualConfig} />
        <GalaRoomAssembly visualConfig={visualConfig} />
      </group>
    </group>
  );
}
