import { resolveGalaInteriorVisual, type GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GalaBedFabricBox,
  GalaBedWoodBox,
  GalaCoffeeTableModel,
  GalaLivingSofaModel,
} from '../GalaInteriorFurniture';
import {
  GALA_BATHROOM_WEST_PARTITION_LOCAL_X,
  GALA_CONSTRUCTION_LEVELS,
  GALA_FURNITURE_LAYOUT,
} from './GalaConstructionModel';
import { GalaConstructionBox, GalaConstructionCylinder } from './GalaConstructionPrimitives';

type GalaRoomDetailLevel = 'full' | 'reduced';

type GalaRoomAssemblyProps = {
  detailLevel?: GalaRoomDetailLevel;
  visualConfig?: GalaHouseVisualConfig;
};

const FIXTURE_CERAMIC = '#f2eee6';
const FIXTURE_CERAMIC_SHADOW = '#ddd3c4';
const FIXTURE_GLASS = '#d4e4e7';
const FIXTURE_METAL = '#8f9698';
const FURNITURE_HANDLE = '#2f2922';
const FURNITURE_CLEARANCE_USER_DATA = {
  clearanceMinMeters: 0.03,
  furnitureClearanceSubject: 'furniture',
  furniturePlacementOwner: 'GalaConstructionModel/GALA_FURNITURE_LAYOUT',
} as const;
const FIXTURE_CLEARANCE_USER_DATA = {
  clearanceMinMeters: 0.03,
  fixtureClearanceSubject: 'fixture',
  fixturePlacementOwner: 'GalaConstructionModel/GALA_FURNITURE_LAYOUT',
} as const;
const WALL_MOUNTED_CLEARANCE_USER_DATA = {
  clearanceMinMeters: 0.03,
  fixturePlacementOwner: 'GalaConstructionModel/GALA_FURNITURE_LAYOUT',
  wallMountedFixture: true,
} as const;

export function GalaRoomAssembly({ detailLevel = 'full', visualConfig }: GalaRoomAssemblyProps) {
  const visual = resolveGalaInteriorVisual(visualConfig);
  const layout = GALA_FURNITURE_LAYOUT;
  const reducedDetail = detailLevel === 'reduced';
  const partitionAccentX = GALA_BATHROOM_WEST_PARTITION_LOCAL_X
    - (GALA_CONSTRUCTION_LEVELS.exteriorWallThicknessM * 0.5)
    - 0.026;
  const yAtFloor = (relativeY: number) => Number((
    GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + relativeY
  ).toFixed(4));

  return (
    <group
      name="gala-construction-room-assembly-furniture-anchors"
      userData={{
        assembly: 'GalaRoomAssembly',
        bathroomLayoutReadable: true,
        bathroomFixtureFidelityImproved: true,
        bedroomLayoutReadable: true,
        componentHint: 'construction/GalaRoomAssembly.tsx',
        furnitureFixtureFidelityImproved: true,
        galaRoomRenderDetailLevel: detailLevel,
      }}
    >
      {reducedDetail ? (
        <GalaConstructionBox
          castShadow={false}
          color={visual.sofaColor}
          name="gala-construction-living-sofa-low-detail-readable-proxy"
          position={[layout.livingSofaSeat.position[0], yAtFloor(0.42), layout.livingSofaSeat.position[2]]}
          size={[1.72, 0.48, 0.86]}
          userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureAnchor: 'againstWall', furnitureIsReadable: true, furnitureLowDetailProxy: true, furnitureNotFloating: true }}
        />
      ) : (
        <GalaLivingSofaModel
          name="gala-construction-living-sofa-high-quality-gltf"
          position={[layout.livingSofaSeat.position[0], yAtFloor(0.64), layout.livingSofaSeat.position[2]]}
          scale={[1.28, 1.12, 0.96]}
          size={[1.72, 1.15, 0.86]}
          userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureAnchor: 'againstWall', furnitureIsReadable: true, furnitureNotFloating: true, replacesPrimitiveSofaComposition: true }}
        />
      )}
      {reducedDetail ? (
        <GalaConstructionBox
          castShadow={false}
          color={visual.tableColor}
          name="gala-construction-living-coffee-table-low-detail-readable-proxy"
          position={[layout.livingCoffeeTableTop.position[0], yAtFloor(0.215), layout.livingCoffeeTableTop.position[2]]}
          size={[0.78, 0.16, 0.48]}
          userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true, furnitureLowDetailProxy: true, furnitureNotFloating: true }}
        />
      ) : (
        <GalaCoffeeTableModel
          name="gala-construction-living-coffee-table-high-quality-gltf"
          position={[layout.livingCoffeeTableTop.position[0], yAtFloor(0.215), layout.livingCoffeeTableTop.position[2]]}
          size={[0.78, 0.43, 0.48]}
          userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true, furnitureNotFloating: true, replacesPrimitiveCoffeeTableComposition: true }}
        />
      )}

      <GalaConstructionBox color={visual.cabinetColor} name="gala-construction-kitchen-base-cabinets-against-south-wall" position={layout.kitchenBaseCabinets.position} size={layout.kitchenBaseCabinets.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureAnchor: 'againstWall', kitchenAlignedToWall: true }} />
      <GalaConstructionBox color={visual.counterColor} name="gala-construction-kitchen-countertop-wall-aligned" position={layout.kitchenCountertop.position} size={layout.kitchenCountertop.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, kitchenAlignedToWall: true }} />
      {!reducedDetail && [-0.5, 0, 0.5].map((offset) => (
        <GalaConstructionBox
          key={`kitchen-door-front-${offset}`}
          castShadow={false}
          color="#b17a47"
          name="gala-construction-kitchen-readable-cabinet-door-front"
          position={[layout.kitchenBaseCabinets.position[0] + offset, yAtFloor(0.49), -2.012]}
          size={[0.44, 0.5, 0.026]}
          userData={{ furnitureFidelityImproved: true, kitchenAlignedToWall: true }}
        />
      ))}
      {!reducedDetail && [-0.66, -0.16, 0.34].map((offset) => (
        <GalaConstructionBox
          key={`kitchen-door-handle-${offset}`}
          castShadow={false}
          color={FURNITURE_HANDLE}
          name="gala-construction-kitchen-small-dark-cabinet-handle"
          position={[layout.kitchenBaseCabinets.position[0] + offset, yAtFloor(0.55), -1.994]}
          size={[0.12, 0.026, 0.02]}
          userData={{ furnitureFidelityImproved: true, kitchenAlignedToWall: true }}
        />
      ))}
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-kitchen-sink-basin-cue" position={layout.kitchenSinkCue.position} size={layout.kitchenSinkCue.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, mainFurnitureOrFixtureVisible: true }} />
      <GalaConstructionBox color="#25211c" name="gala-construction-kitchen-cooktop-cue" position={layout.kitchenCooktopCue.position} size={layout.kitchenCooktopCue.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, mainFurnitureOrFixtureVisible: true }} />
      <GalaConstructionBox
        castShadow={false}
        color={visual.rugColor}
        name="gala-construction-living-wall-material-swatch-panel"
        position={[partitionAccentX, yAtFloor(1.42), -1.18]}
        size={[0.032, 0.46, 1.08]}
        userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, interiorWallDecorAccent: true, materialSamplePanel: true }}
      />
      {[
        { color: visual.sofaColor, id: 'sofa-fabric', z: -1.46 },
        { color: visual.blanketColor, id: 'soft-accent', z: -1.18 },
        { color: visual.counterColor, id: 'counter-detail', z: -0.9 },
      ].map((swatch) => (
        <GalaConstructionBox
          key={swatch.id}
          castShadow={false}
          color={swatch.color}
          name={`gala-construction-living-wall-material-swatch-${swatch.id}`}
          position={[partitionAccentX - 0.006, yAtFloor(1.42), swatch.z]}
          size={[0.034, 0.32, 0.18]}
          userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, interiorWallDecorAccent: true, materialSamplePanel: true }}
        />
      ))}
      <GalaConstructionBox color="#5f432b" name="gala-construction-bedroom-bed-frame-headboard-against-south-wall" position={layout.bedroomBedFrame.position} size={layout.bedroomBedFrame.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true, bedroomLayoutReadable: true }} />
      <GalaBedFabricBox anchor="againstWall" color="#f0e7d7" name="gala-construction-bedroom-mattress-head-against-wall" position={layout.bedroomMattress.position} radius={0.055} size={layout.bedroomMattress.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true, furnitureNotFloating: true }} />
      {!reducedDetail ? (
        <>
          <GalaBedFabricBox anchor="againstWall" color="#c8beb0" name="gala-construction-bedroom-blanket-readable" position={layout.bedroomBlanket.position} radius={0.035} size={layout.bedroomBlanket.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedroomLayoutReadable: true }} />
          <GalaBedFabricBox anchor="againstWall" color="#eee7dc" name="gala-construction-bedroom-left-pillow-at-headboard-wall" position={layout.bedroomLeftPillow.position} radius={0.045} size={layout.bedroomLeftPillow.size} userData={{ bedHeadboardAgainstWall: true }} />
          <GalaBedFabricBox anchor="againstWall" color="#eee7dc" name="gala-construction-bedroom-right-pillow-at-headboard-wall" position={layout.bedroomRightPillow.position} radius={0.045} size={layout.bedroomRightPillow.size} userData={{ bedHeadboardAgainstWall: true }} />
          <GalaBedWoodBox anchor="againstWall" color="#ffffff" name="gala-construction-bedroom-headboard-on-south-wall" position={layout.bedroomHeadboard.position} radius={0.025} size={layout.bedroomHeadboard.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true }} verticalTexture />
          <GalaConstructionBox color={visual.tableColor} name="gala-construction-bedroom-bedside-cabinet-at-headboard-side" position={layout.bedroomBedsideCabinet.position} size={layout.bedroomBedsideCabinet.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedsideCabinetAtHeadboardSide: true }} />
        </>
      ) : null}
      <GalaConstructionBox color={visual.wardrobeColor} name="gala-construction-bedroom-built-in-wardrobe-clean-carcass-against-east-wall" position={layout.bedroomWardrobe.position} size={layout.bedroomWardrobe.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedroomLayoutReadable: true, furnitureAnchor: 'againstWall', furnitureIsReadable: true, furnitureNotFloating: true, replacesPrimitiveWardrobeComposition: true }} />
      {!reducedDetail ? (
        <>
          <GalaConstructionBox castShadow={false} color="#b9895b" name="gala-construction-bedroom-built-in-wardrobe-left-door-panel" position={layout.bedroomWardrobeLeftDoorPanel.position} size={layout.bedroomWardrobeLeftDoorPanel.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
          <GalaConstructionBox castShadow={false} color="#b9895b" name="gala-construction-bedroom-built-in-wardrobe-right-door-panel" position={layout.bedroomWardrobeRightDoorPanel.position} size={layout.bedroomWardrobeRightDoorPanel.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
          <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bedroom-built-in-wardrobe-door-handles" position={layout.bedroomWardrobeDoorHandles.position} size={layout.bedroomWardrobeDoorHandles.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
        </>
      ) : null}
      <GalaConstructionBox color={visual.bathroomAccentColor} name="gala-construction-bathroom-shower-back-panel-integrated-with-wall" position={layout.bathroomShowerBackPanel.position} size={layout.bathroomShowerBackPanel.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, showerPanelIntegratedOrRemoved: true }} />
      {!reducedDetail ? (
        <>
          <GalaConstructionBox color={FIXTURE_GLASS} name="gala-construction-bathroom-shower-side-glass-panel" opacity={0.48} position={layout.bathroomShowerSidePanel.position} size={layout.bathroomShowerSidePanel.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, showerPanelIntegratedOrRemoved: true }} />
          <GalaConstructionBox color={FIXTURE_METAL} name="gala-construction-bathroom-shower-riser-and-head-pipe" position={layout.bathroomShowerRiser.position} size={layout.bathroomShowerRiser.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
          <GalaConstructionCylinder color={FIXTURE_METAL} height={layout.bathroomShowerHead.size[1]} name="gala-construction-bathroom-round-shower-head-cue" position={layout.bathroomShowerHead.position} radiusBottom={layout.bathroomShowerHead.size[0] * 0.5} radiusTop={layout.bathroomShowerHead.size[0] * 0.43} rotation={[Math.PI * 0.5, 0, 0]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
        </>
      ) : null}
      <GalaConstructionBox color={visual.cabinetColor} name="gala-construction-bathroom-vanity-against-wall" position={layout.bathroomVanity.position} size={layout.bathroomVanity.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bathroomFixturesWallAligned: true, bathroomLayoutReadable: true }} />
      {!reducedDetail ? (
        <>
          <GalaConstructionBox castShadow={false} color="#946a3f" name="gala-construction-bathroom-vanity-drawer-front-and-handle" position={layout.bathroomVanityDrawerFront.position} size={layout.bathroomVanityDrawerFront.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
          <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bathroom-vanity-drawer-handle" position={layout.bathroomVanityDrawerHandle.position} size={layout.bathroomVanityDrawerHandle.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
        </>
      ) : null}
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-bathroom-sink-basin-readable" position={layout.bathroomSink.position} size={layout.bathroomSink.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true }} />
      {!reducedDetail ? (
        <>
          <GalaConstructionBox color={FIXTURE_METAL} name="gala-construction-bathroom-sink-faucet-cue" position={layout.bathroomSinkFaucet.position} size={layout.bathroomSinkFaucet.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
          <GalaConstructionBox color="#c6d0cf" metalness={0.08} name="gala-construction-bathroom-wall-mirror-above-vanity" position={layout.bathroomMirror.position} size={layout.bathroomMirror.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
        </>
      ) : null}
      <GalaConstructionBox color={FIXTURE_CERAMIC_SHADOW} name="gala-construction-bathroom-wc-low-bowl-against-east-wall" position={layout.bathroomWcBowl.position} size={layout.bathroomWcBowl.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, wcAgainstWall: true }} />
      <GalaConstructionCylinder color={FIXTURE_CERAMIC} height={layout.bathroomWcRoundedBowl.size[1]} name="gala-construction-bathroom-wc-rounded-bowl-cue-against-wall" position={layout.bathroomWcRoundedBowl.position} radialSegments={reducedDetail ? 10 : 20} radiusBottom={layout.bathroomWcRoundedBowl.size[0] * 0.5} radiusTop={layout.bathroomWcRoundedBowl.size[0] * 0.5} scale={[1, 1, layout.bathroomWcRoundedBowl.size[2] / layout.bathroomWcRoundedBowl.size[0]]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotRandomCubes: true }} />
      {!reducedDetail ? (
        <GalaConstructionCylinder castShadow={false} color="#4a4f52" height={layout.bathroomWcDarkBowlInset.size[1]} name="gala-construction-bathroom-wc-dark-bowl-inset-cue" position={layout.bathroomWcDarkBowlInset.position} radiusBottom={layout.bathroomWcDarkBowlInset.size[0] * 0.5} radiusTop={layout.bathroomWcDarkBowlInset.size[0] * 0.5} scale={[1, 1, layout.bathroomWcDarkBowlInset.size[2] / layout.bathroomWcDarkBowlInset.size[0]]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotRandomCubes: true }} />
      ) : null}
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-bathroom-wc-seat-inset" position={layout.bathroomWcSeat.position} size={layout.bathroomWcSeat.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, wcAgainstWall: true, wcNotRandomCubes: true }} />
      <GalaConstructionBox color={FIXTURE_CERAMIC_SHADOW} name="gala-construction-bathroom-wc-cistern-connected-to-east-wall" position={layout.bathroomWcCistern.position} size={layout.bathroomWcCistern.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixturesWallAligned: true, wcAgainstWall: true }} />
      {!reducedDetail ? (
        <GalaConstructionBox castShadow={false} color={FIXTURE_METAL} name="gala-construction-bathroom-wc-flush-button-cue" position={layout.bathroomWcFlushButton.position} size={layout.bathroomWcFlushButton.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true }} />
      ) : null}
    </group>
  );
}
