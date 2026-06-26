import { resolveGalaInteriorVisual, type GalaHouseVisualConfig } from '../GalaHouseConfig';
import { GALA_FURNITURE_LAYOUT } from './GalaConstructionModel';
import { GalaConstructionBox, GalaConstructionCylinder } from './GalaConstructionPrimitives';

type GalaRoomAssemblyProps = {
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

function LegSet({
  color,
  namePrefix,
  x,
  z,
}: {
  color: string;
  namePrefix: string;
  x: number;
  z: number;
}) {
  return (
    <>
      {[
        [-0.7, -0.48],
        [0.7, -0.48],
        [-0.7, 0.48],
        [0.7, 0.48],
      ].map(([dx, dz], index) => (
        <GalaConstructionBox
          key={`${namePrefix}-leg-${index}`}
          color={color}
          name={`${namePrefix}-floor-touching-leg`}
          position={[x + dx, 0.16, z + dz]}
          size={[0.07, 0.28, 0.07]}
          userData={{ furnitureNotFloating: true }}
        />
      ))}
    </>
  );
}

export function GalaRoomAssembly({ visualConfig }: GalaRoomAssemblyProps) {
  const visual = resolveGalaInteriorVisual(visualConfig);
  const layout = GALA_FURNITURE_LAYOUT;

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
      }}
    >
      <GalaConstructionBox
        color="#9b7044"
        name="gala-construction-living-rug-raised-separate-from-floor"
        position={layout.livingRug.position}
        size={layout.livingRug.size}
        userData={{ floorStackHasNoCoplanarOverlays: true, noBlueFloorOverlay: true }}
      />
      <GalaConstructionBox color={visual.sofaColor} name="gala-construction-living-sofa-seat-cushion" position={layout.livingSofaSeat.position} size={layout.livingSofaSeat.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureAnchor: 'againstWall', furnitureIsReadable: true }} />
      <GalaConstructionBox color={visual.sofaBackColor} name="gala-construction-living-sofa-back-cushion" position={layout.livingSofaBack.position} size={layout.livingSofaBack.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true }} />
      <GalaConstructionBox color={visual.sofaBackColor} name="gala-construction-living-sofa-left-arm" position={layout.livingSofaLeftArm.position} size={layout.livingSofaLeftArm.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true }} />
      <GalaConstructionBox color={visual.sofaBackColor} name="gala-construction-living-sofa-right-arm" position={layout.livingSofaRightArm.position} size={layout.livingSofaRightArm.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true }} />
      {[-0.24, 0.24].map((offset) => (
        <GalaConstructionBox
          key={`living-sofa-cushion-seam-${offset}`}
          castShadow={false}
          color="#3a5b51"
          name="gala-construction-living-sofa-seat-cushion-separation"
          position={[layout.livingSofaSeat.position[0] + offset, 0.568, layout.livingSofaSeat.position[2]]}
          size={[0.026, 0.018, 0.56]}
          userData={{ furnitureFidelityImproved: true, furnitureIsReadable: true }}
        />
      ))}
      <GalaConstructionBox color="#d2bea0" name="gala-construction-living-sofa-left-throw-pillow" position={layout.livingSofaLeftThrowPillow.position} size={layout.livingSofaLeftThrowPillow.size} userData={{ furnitureFidelityImproved: true, furnitureIsReadable: true }} />
      <GalaConstructionBox color="#bfa37f" name="gala-construction-living-sofa-right-throw-pillow" position={layout.livingSofaRightThrowPillow.position} size={layout.livingSofaRightThrowPillow.size} userData={{ furnitureFidelityImproved: true, furnitureIsReadable: true }} />
      <GalaConstructionBox color={visual.tableColor} name="gala-construction-living-coffee-table-top" position={layout.livingCoffeeTableTop.position} size={layout.livingCoffeeTableTop.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureIsReadable: true, furnitureNotFloating: true }} />
      <LegSet color={visual.tableColor} namePrefix="gala-construction-living-coffee-table" x={layout.livingCoffeeTableTop.position[0]} z={layout.livingCoffeeTableTop.position[2]} />

      <GalaConstructionBox color={visual.cabinetColor} name="gala-construction-kitchen-base-cabinets-against-south-wall" position={layout.kitchenBaseCabinets.position} size={layout.kitchenBaseCabinets.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureAnchor: 'againstWall', kitchenAlignedToWall: true }} />
      <GalaConstructionBox color={visual.counterColor} name="gala-construction-kitchen-countertop-wall-aligned" position={layout.kitchenCountertop.position} size={layout.kitchenCountertop.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, kitchenAlignedToWall: true }} />
      {[-0.5, 0, 0.5].map((offset) => (
        <GalaConstructionBox
          key={`kitchen-door-front-${offset}`}
          castShadow={false}
          color="#b17a47"
          name="gala-construction-kitchen-readable-cabinet-door-front"
          position={[layout.kitchenBaseCabinets.position[0] + offset, 0.49, -2.012]}
          size={[0.44, 0.5, 0.026]}
          userData={{ furnitureFidelityImproved: true, kitchenAlignedToWall: true }}
        />
      ))}
      {[-0.66, -0.16, 0.34].map((offset) => (
        <GalaConstructionBox
          key={`kitchen-door-handle-${offset}`}
          castShadow={false}
          color={FURNITURE_HANDLE}
          name="gala-construction-kitchen-small-dark-cabinet-handle"
          position={[layout.kitchenBaseCabinets.position[0] + offset, 0.55, -1.994]}
          size={[0.12, 0.026, 0.02]}
          userData={{ furnitureFidelityImproved: true, kitchenAlignedToWall: true }}
        />
      ))}
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-kitchen-sink-basin-cue" position={layout.kitchenSinkCue.position} size={layout.kitchenSinkCue.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, mainFurnitureOrFixtureVisible: true }} />
      <GalaConstructionBox color="#25211c" name="gala-construction-kitchen-cooktop-cue" position={layout.kitchenCooktopCue.position} size={layout.kitchenCooktopCue.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, mainFurnitureOrFixtureVisible: true }} />
      <GalaConstructionBox color={visual.kitchenBacksplashColor} name="gala-construction-kitchen-backsplash-wall-panel" position={layout.kitchenBacksplash.position} size={layout.kitchenBacksplash.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, interiorWallAssemblyCoherent: true }} />
      <GalaConstructionBox color={visual.cabinetColor} name="gala-construction-kitchen-upper-cabinet-with-readable-gap" position={layout.kitchenUpperCabinet.position} size={layout.kitchenUpperCabinet.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureFidelityImproved: true, kitchenAlignedToWall: true }} />
      <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-kitchen-upper-cabinet-handle-line" position={layout.kitchenUpperCabinetHandle.position} size={layout.kitchenUpperCabinetHandle.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, furnitureFidelityImproved: true, kitchenAlignedToWall: true }} />

      <GalaConstructionBox color="#5f432b" name="gala-construction-bedroom-bed-frame-headboard-against-south-wall" position={layout.bedroomBedFrame.position} size={layout.bedroomBedFrame.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true, bedroomLayoutReadable: true }} />
      <GalaConstructionBox color={visual.bedBaseColor} name="gala-construction-bedroom-mattress-head-against-wall" position={layout.bedroomMattress.position} size={layout.bedroomMattress.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true, furnitureNotFloating: true }} />
      <GalaConstructionBox color={visual.blanketColor} name="gala-construction-bedroom-blanket-readable" position={layout.bedroomBlanket.position} size={layout.bedroomBlanket.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedroomLayoutReadable: true }} />
      <GalaConstructionBox castShadow={false} color="#7f96a7" name="gala-construction-bedroom-blanket-folded-edge-cue" position={[layout.bedroomBlanket.position[0], 0.626, -1.18]} size={[1.08, 0.024, 0.05]} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
      <GalaConstructionBox color="#f4eadb" name="gala-construction-bedroom-left-pillow-at-headboard-wall" position={layout.bedroomLeftPillow.position} size={layout.bedroomLeftPillow.size} userData={{ bedHeadboardAgainstWall: true }} />
      <GalaConstructionBox color="#f4eadb" name="gala-construction-bedroom-right-pillow-at-headboard-wall" position={layout.bedroomRightPillow.position} size={layout.bedroomRightPillow.size} userData={{ bedHeadboardAgainstWall: true }} />
      <GalaConstructionBox color="#6f4b2c" name="gala-construction-bedroom-headboard-on-south-wall" position={layout.bedroomHeadboard.position} size={layout.bedroomHeadboard.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bedHeadboardAgainstWall: true }} />
      <GalaConstructionBox color={visual.tableColor} name="gala-construction-bedroom-bedside-cabinet-at-headboard-side" position={layout.bedroomBedsideCabinet.position} size={layout.bedroomBedsideCabinet.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedsideCabinetAtHeadboardSide: true }} />
      <GalaConstructionBox color={visual.wardrobeColor} name="gala-construction-bedroom-wardrobe-against-east-wall" position={layout.bedroomWardrobe.position} size={layout.bedroomWardrobe.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bedroomLayoutReadable: true, furnitureAnchor: 'againstWall' }} />
      <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bedroom-wardrobe-door-split-line" position={layout.bedroomWardrobeDoorSplit.position} size={layout.bedroomWardrobeDoorSplit.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
      <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bedroom-wardrobe-vertical-handle-pair" position={layout.bedroomWardrobeHandleLower.position} size={layout.bedroomWardrobeHandleLower.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
      <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bedroom-wardrobe-vertical-handle-pair" position={layout.bedroomWardrobeHandleUpper.position} size={layout.bedroomWardrobeHandleUpper.size} userData={{ bedroomLayoutReadable: true, furnitureFidelityImproved: true }} />
      <GalaConstructionBox color="#26231f" name="gala-construction-bedroom-tv-opposite-bed-on-north-wall" position={layout.bedroomTv.position} size={layout.bedroomTv.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bedroomLayoutReadable: true, tvOppositeBedAddedOrJustified: true }} />

      <GalaConstructionBox color={visual.bathroomAccentColor} name="gala-construction-bathroom-shower-back-panel-integrated-with-wall" position={layout.bathroomShowerBackPanel.position} size={layout.bathroomShowerBackPanel.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, showerPanelIntegratedOrRemoved: true }} />
      <GalaConstructionBox color={FIXTURE_GLASS} name="gala-construction-bathroom-shower-side-glass-panel" opacity={0.48} position={layout.bathroomShowerSidePanel.position} size={layout.bathroomShowerSidePanel.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, showerPanelIntegratedOrRemoved: true }} />
      <GalaConstructionBox color={FIXTURE_METAL} name="gala-construction-bathroom-shower-riser-and-head-pipe" position={layout.bathroomShowerRiser.position} size={layout.bathroomShowerRiser.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
      <GalaConstructionCylinder color={FIXTURE_METAL} height={layout.bathroomShowerHead.size[1]} name="gala-construction-bathroom-round-shower-head-cue" position={layout.bathroomShowerHead.position} radiusBottom={layout.bathroomShowerHead.size[0] * 0.5} radiusTop={layout.bathroomShowerHead.size[0] * 0.43} rotation={[Math.PI * 0.5, 0, 0]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
      <GalaConstructionBox color={visual.cabinetColor} name="gala-construction-bathroom-vanity-against-wall" position={layout.bathroomVanity.position} size={layout.bathroomVanity.size} userData={{ ...FURNITURE_CLEARANCE_USER_DATA, bathroomFixturesWallAligned: true, bathroomLayoutReadable: true }} />
      <GalaConstructionBox castShadow={false} color="#946a3f" name="gala-construction-bathroom-vanity-drawer-front-and-handle" position={layout.bathroomVanityDrawerFront.position} size={layout.bathroomVanityDrawerFront.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
      <GalaConstructionBox castShadow={false} color={FURNITURE_HANDLE} name="gala-construction-bathroom-vanity-drawer-handle" position={layout.bathroomVanityDrawerHandle.position} size={layout.bathroomVanityDrawerHandle.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-bathroom-sink-basin-readable" position={layout.bathroomSink.position} size={layout.bathroomSink.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true }} />
      <GalaConstructionBox color={FIXTURE_METAL} name="gala-construction-bathroom-sink-faucet-cue" position={layout.bathroomSinkFaucet.position} size={layout.bathroomSinkFaucet.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomLayoutReadable: true }} />
      <GalaConstructionBox color="#c6d0cf" metalness={0.08} name="gala-construction-bathroom-wall-mirror-above-vanity" position={layout.bathroomMirror.position} size={layout.bathroomMirror.size} userData={{ ...WALL_MOUNTED_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true }} />
      <GalaConstructionBox color={FIXTURE_CERAMIC_SHADOW} name="gala-construction-bathroom-wc-low-bowl-against-east-wall" position={layout.bathroomWcBowl.position} size={layout.bathroomWcBowl.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomLayoutReadable: true, wcAgainstWall: true }} />
      <GalaConstructionCylinder color={FIXTURE_CERAMIC} height={layout.bathroomWcRoundedBowl.size[1]} name="gala-construction-bathroom-wc-rounded-bowl-cue-against-wall" position={layout.bathroomWcRoundedBowl.position} radiusBottom={layout.bathroomWcRoundedBowl.size[0] * 0.5} radiusTop={layout.bathroomWcRoundedBowl.size[0] * 0.5} scale={[1, 1, layout.bathroomWcRoundedBowl.size[2] / layout.bathroomWcRoundedBowl.size[0]]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotRandomCubes: true }} />
      <GalaConstructionCylinder castShadow={false} color="#4a4f52" height={layout.bathroomWcDarkBowlInset.size[1]} name="gala-construction-bathroom-wc-dark-bowl-inset-cue" position={layout.bathroomWcDarkBowlInset.position} radiusBottom={layout.bathroomWcDarkBowlInset.size[0] * 0.5} radiusTop={layout.bathroomWcDarkBowlInset.size[0] * 0.5} scale={[1, 1, layout.bathroomWcDarkBowlInset.size[2] / layout.bathroomWcDarkBowlInset.size[0]]} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotRandomCubes: true }} />
      <GalaConstructionBox color={FIXTURE_CERAMIC} name="gala-construction-bathroom-wc-seat-inset" position={layout.bathroomWcSeat.position} size={layout.bathroomWcSeat.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, wcAgainstWall: true, wcNotRandomCubes: true }} />
      <GalaConstructionBox color={FIXTURE_CERAMIC_SHADOW} name="gala-construction-bathroom-wc-cistern-connected-to-east-wall" position={layout.bathroomWcCistern.position} size={layout.bathroomWcCistern.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixturesWallAligned: true, wcAgainstWall: true }} />
      <GalaConstructionBox castShadow={false} color={FIXTURE_METAL} name="gala-construction-bathroom-wc-flush-button-cue" position={layout.bathroomWcFlushButton.position} size={layout.bathroomWcFlushButton.size} userData={{ ...FIXTURE_CLEARANCE_USER_DATA, bathroomFixtureFidelityImproved: true, bathroomFixturesWallAligned: true, wcAgainstWall: true }} />
    </group>
  );
}
