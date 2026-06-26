import { GALA_MATERIALS } from './GalaMaterials';
import {
  planXToLocalX,
  rectCenter,
  rectSize,
  rectToLocalRect,
  type Rect,
} from './GalaFloorplan';
import type { GalaInteriorVisualSpec } from './GalaHouseConfig';

export type FurnitureAnchor =
  | 'againstWall'
  | 'underWindow'
  | 'centeredOnRug'
  | 'besideBed'
  | 'bathroomWall';

type FurnitureBoxProps = {
  anchor: FurnitureAnchor;
  color: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  userData?: Record<string, unknown>;
};

function FurnitureBox({ anchor, color, name, position, size, userData }: FurnitureBoxProps) {
  return (
    <mesh
      castShadow
      name={name}
      position={position}
      receiveShadow
      userData={{
        anchor,
        furnitureAlignedToWalls: anchor === 'againstWall' || anchor === 'underWindow' || anchor === 'bathroomWall',
        furnitureIsReadable: true,
        furnitureNotFloating: true,
        ...userData,
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}

function FurnitureCylinder({
  anchor,
  color,
  name,
  position,
  radiusBottom,
  radiusTop,
  scale = [1, 1, 1],
  sizeY,
  userData,
}: {
  anchor: FurnitureAnchor;
  color: string;
  name: string;
  position: [number, number, number];
  radiusBottom: number;
  radiusTop: number;
  scale?: [number, number, number];
  sizeY: number;
  userData?: Record<string, unknown>;
}) {
  return (
    <mesh
      castShadow
      name={name}
      position={position}
      receiveShadow
      scale={scale}
      userData={{
        anchor,
        furnitureAlignedToWalls: anchor === 'againstWall' || anchor === 'underWindow' || anchor === 'bathroomWall',
        furnitureIsReadable: true,
        furnitureNotFloating: true,
        ...userData,
      }}
    >
      <cylinderGeometry args={[radiusTop, radiusBottom, sizeY, 16]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}

function LegSet({
  anchor,
  color,
  depth,
  name,
  x,
  y,
  z,
}: {
  anchor: FurnitureAnchor;
  color: string;
  depth: number;
  name: string;
  x: number;
  y: number;
  z: number;
}) {
  const legSize: [number, number, number] = [0.055, y, 0.055];
  return (
    <>
      {[-0.5, 0.5].flatMap((xSign) => (
        [-0.5, 0.5].map((zSign) => (
          <FurnitureBox
            key={`${name}-${xSign}-${zSign}`}
            anchor={anchor}
            color={color}
            name={`${name}-leg`}
            position={[x + xSign * 0.52, y * 0.5, z + zSign * depth]}
            size={legSize}
          />
        ))
      ))}
    </>
  );
}

export function GalaKitchenFurniture({ visual }: { visual: GalaInteriorVisualSpec }) {
  const counterRect: Rect = { xMin: 3.05, xMax: 4.05, zMin: -2.38, zMax: -1.86 };
  const counterLocal = rectToLocalRect(counterRect);
  const [counterCenterX, counterCenterZ] = rectCenter(counterLocal);
  const [counterWidth, counterDepth] = rectSize(counterLocal);
  const cabinetDoorWidth = counterWidth / 3;

  return (
    <group
      name="gala-readable-kitchen-furniture-under-window-against-wall"
      userData={{
        furnitureAnchor: 'underWindow',
        furnitureDoesNotBlockDoors: true,
        furnitureDoesNotClipWindows: true,
        furnitureIsReadable: true,
        semantic: 'gala kitchen base cabinets countertop sink cooktop handles under window',
      }}
    >
      <FurnitureBox anchor="underWindow" color={visual.cabinetColor} name="gala-kitchen-lower-cabinet-run-with-plinth" position={[counterCenterX, 0.39, counterCenterZ]} size={[counterWidth, 0.72, counterDepth]} />
      <FurnitureBox anchor="underWindow" color="#6f4a2f" name="gala-kitchen-cabinet-toe-kick-on-floor" position={[counterCenterX, 0.06, counterCenterZ + 0.23]} size={[counterWidth - 0.08, 0.12, 0.05]} />
      {[-1, 0, 1].map((index) => (
        <FurnitureBox
          key={`kitchen-cabinet-front-${index}`}
          anchor="underWindow"
          color="#b8895c"
          name="gala-kitchen-readable-cabinet-door-front"
          position={[counterCenterX + index * cabinetDoorWidth, 0.45, counterCenterZ + counterDepth * 0.51]}
          size={[cabinetDoorWidth - 0.035, 0.54, 0.035]}
        />
      ))}
      {[-0.22, 0.12, 0.46].map((offset) => (
        <FurnitureBox key={`kitchen-handle-${offset}`} anchor="underWindow" color="#1f2937" name="gala-kitchen-small-dark-cabinet-handle" position={[counterCenterX + offset, 0.55, counterCenterZ + counterDepth * 0.55]} size={[0.11, 0.025, 0.035]} />
      ))}
      <FurnitureBox anchor="underWindow" color={visual.counterColor} name="gala-kitchen-continuous-countertop-seated-on-cabinets" position={[counterCenterX, 0.86, counterCenterZ]} size={[counterWidth + 0.08, 0.12, counterDepth + 0.06]} />
      <FurnitureBox anchor="underWindow" color="#dbeafe" name="gala-kitchen-recessed-sink-basin-cue" position={[planXToLocalX(3.32), 0.94, -2.12]} size={[0.34, 0.045, 0.3]} />
      <FurnitureBox anchor="underWindow" color="#94a3b8" name="gala-kitchen-sink-rim-cue" position={[planXToLocalX(3.32), 0.975, -2.12]} size={[0.44, 0.028, 0.39]} />
      <FurnitureBox anchor="underWindow" color="#111827" name="gala-kitchen-cooktop-glass-cue" position={[planXToLocalX(3.76), 0.94, -2.12]} size={[0.34, 0.035, 0.32]} />
      <FurnitureBox anchor="underWindow" color="#374151" name="gala-kitchen-cooktop-burner-lines-cue" position={[planXToLocalX(3.76), 0.98, -2.12]} size={[0.26, 0.015, 0.02]} />
      <FurnitureBox anchor="againstWall" color={visual.kitchenBacksplashColor} name="gala-kitchen-backsplash-panel-seated-on-wall" position={[counterCenterX, 1.26, -2.43]} size={[counterWidth + 0.12, 0.64, 0.045]} />
      <FurnitureBox anchor="againstWall" color={visual.cabinetColor} name="gala-kitchen-upper-cabinet-with-readable-gap" position={[counterCenterX, 1.78, -2.3]} size={[counterWidth - 0.16, 0.38, 0.22]} />
      <FurnitureBox anchor="againstWall" color="#1f2937" name="gala-kitchen-upper-cabinet-handle-line" position={[counterCenterX, 1.64, -2.18]} size={[counterWidth - 0.32, 0.025, 0.035]} />
    </group>
  );
}

export function GalaLivingFurniture({ visual }: { visual: GalaInteriorVisualSpec }) {
  return (
    <group
      name="gala-readable-living-furniture-cushions-table-rug"
      userData={{
        furnitureAnchor: 'centeredOnRug',
        furnitureDoesNotBlockDoors: true,
        furnitureIsReadable: true,
        semantic: 'gala sofa cushions arms legs coffee table rug storage not random blocks',
      }}
    >
      <FurnitureBox
        anchor="centeredOnRug"
        color="#9a7445"
        name="gala-living-rug-small-raised-mat-not-room-floor-overlay"
        position={[planXToLocalX(2.38), 0.046, 0.15]}
        size={[1.9, 0.016, 1.06]}
        userData={{ floorDuplicateOrOverlayRemoved: true, floorMaterialStableWhileWalking: true, noBlueFloorOverlay: true, noFloorZFighting: true }}
      />
      <FurnitureBox anchor="centeredOnRug" color={visual.sofaColor} name="gala-living-sofa-seat-cushion" position={[planXToLocalX(1.93), 0.28, 0.03]} size={[1.74, 0.28, 0.62]} />
      <FurnitureBox anchor="centeredOnRug" color={visual.sofaBackColor} name="gala-living-sofa-back-cushion-against-seat" position={[planXToLocalX(1.93), 0.62, -0.28]} size={[1.82, 0.58, 0.16]} />
      <FurnitureBox anchor="centeredOnRug" color={visual.sofaBackColor} name="gala-living-sofa-left-arm" position={[planXToLocalX(1.0), 0.43, 0.03]} size={[0.16, 0.5, 0.66]} />
      <FurnitureBox anchor="centeredOnRug" color={visual.sofaBackColor} name="gala-living-sofa-right-arm" position={[planXToLocalX(2.86), 0.43, 0.03]} size={[0.16, 0.5, 0.66]} />
      <LegSet anchor="centeredOnRug" color="#3f3024" depth={0.24} name="gala-living-sofa" x={planXToLocalX(1.93)} y={0.16} z={0.12} />
      <FurnitureBox anchor="centeredOnRug" color={visual.tableColor} name="gala-living-coffee-table-top" position={[planXToLocalX(3.35), 0.34, 0.18]} size={[0.82, 0.08, 0.56]} />
      <LegSet anchor="centeredOnRug" color="#3f3024" depth={0.22} name="gala-living-coffee-table" x={planXToLocalX(3.35)} y={0.3} z={0.18} />
      <FurnitureBox anchor="againstWall" color={visual.wardrobeColor} name="gala-living-wall-storage-carcass" position={[planXToLocalX(3.08), 0.72, 2.18]} size={[0.56, 1.08, 0.28]} />
      <FurnitureBox anchor="againstWall" color="#1f2937" name="gala-living-storage-shelf-dark-inset" position={[planXToLocalX(3.08), 0.88, 2.02]} size={[0.46, 0.52, 0.035]} />
    </group>
  );
}

export function GalaBathroomFurniture({ visual }: { visual: GalaInteriorVisualSpec }) {
  return (
    <group
      name="gala-readable-bathroom-fixtures-vanity-wc-shower"
      userData={{
        furnitureAnchor: 'bathroomWall',
        furnitureDoesNotBlockDoors: true,
        furnitureIsReadable: true,
        semantic: 'gala bathroom vanity sink wc shower cues not random white blocks',
      }}
    >
      <FurnitureBox anchor="bathroomWall" color={visual.bathroomAccentColor} name="gala-bathroom-shower-back-wall-panel-integrated-with-south-wall" position={[planXToLocalX(5.58), 0.92, -2.43]} size={[0.78, 1.72, 0.055]} userData={{ randomWhitePanelRemovedOrIntegrated: true, showerPanelIntegratedOrRemoved: true }} />
      <FurnitureBox anchor="bathroomWall" color="#dbeafe" name="gala-bathroom-shower-side-glass-panel-integrated-not-random-white-board" position={[planXToLocalX(5.92), 0.82, -1.58]} size={[0.045, 1.42, 0.72]} userData={{ randomWhitePanelRemovedOrIntegrated: true, showerPanelIntegratedOrRemoved: true }} />
      <FurnitureBox anchor="bathroomWall" color="#f8fafc" name="gala-bathroom-vanity-cabinet" position={[planXToLocalX(6.75), 0.36, -2.1]} size={[0.48, 0.56, 0.36]} />
      <FurnitureBox anchor="bathroomWall" color="#e2e8f0" name="gala-bathroom-sink-basin-readable" position={[planXToLocalX(6.75), 0.68, -2.1]} size={[0.42, 0.11, 0.3]} />
      <FurnitureBox anchor="bathroomWall" color="#94a3b8" name="gala-bathroom-faucet-cue" position={[planXToLocalX(6.75), 0.81, -2.25]} size={[0.06, 0.18, 0.06]} />
      <FurnitureBox
        anchor="bathroomWall"
        color="#e2e8f0"
        name="gala-bathroom-wc-low-plinth-against-east-wall"
        position={[planXToLocalX(6.98), 0.16, -1.18]}
        size={[0.38, 0.16, 0.38]}
        userData={{ bathroomFixturesReadable: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotCenteredInRoom: true, wcNotRandomCubes: true }}
      />
      <FurnitureCylinder
        anchor="bathroomWall"
        color="#f8fafc"
        name="gala-bathroom-wc-rounded-bowl-cue-against-wall"
        position={[planXToLocalX(6.98), 0.33, -1.18]}
        radiusBottom={0.2}
        radiusTop={0.23}
        scale={[1.08, 1, 1.36]}
        sizeY={0.17}
        userData={{ bathroomFixturesReadable: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotCenteredInRoom: true, wcNotRandomCubes: true }}
      />
      <FurnitureCylinder
        anchor="bathroomWall"
        color="#475569"
        name="gala-bathroom-wc-dark-bowl-inset-cue"
        position={[planXToLocalX(6.98), 0.43, -1.18]}
        radiusBottom={0.11}
        radiusTop={0.13}
        scale={[1.0, 1, 1.22]}
        sizeY={0.025}
        userData={{ bathroomFixturesReadable: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotCenteredInRoom: true, wcNotRandomCubes: true }}
      />
      <FurnitureBox
        anchor="bathroomWall"
        color="#e2e8f0"
        name="gala-bathroom-wc-cistern-tight-to-east-wall"
        position={[planXToLocalX(7.12), 0.72, -1.18]}
        size={[0.11, 0.46, 0.5]}
        userData={{ bathroomFixturesReadable: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotCenteredInRoom: true, wcNotRandomCubes: true }}
      />
      <FurnitureBox
        anchor="bathroomWall"
        color="#94a3b8"
        name="gala-bathroom-wc-flush-button-cue"
        position={[planXToLocalX(7.055), 0.89, -1.18]}
        size={[0.018, 0.025, 0.12]}
        userData={{ bathroomFixturesReadable: true, bathroomFixturesWallAligned: true, wcAgainstWall: true, wcNotRandomCubes: true }}
      />
      <FurnitureBox anchor="bathroomWall" color="#6b7280" name="gala-bathroom-compact-floor-drain-cue-not-blue-floor-patch" position={[planXToLocalX(5.82), 0.052, -1.9]} size={[0.14, 0.014, 0.14]} userData={{ floorMaterialStableWhileWalking: true, noBlueDebugFloorPatches: true }} />
    </group>
  );
}

export function GalaBedroomFurniture({ visual }: { visual: GalaInteriorVisualSpec }) {
  return (
    <group
      name="gala-readable-bedroom-furniture-bed-wardrobe"
      userData={{
        furnitureAnchor: 'besideBed',
        furnitureDoesNotBlockDoors: true,
        furnitureIsReadable: true,
        bedAndWardrobeLayoutImproved: true,
        bedroomWalkPathClear: true,
        semantic: 'gala bedroom bed frame mattress pillow blanket wardrobe bedside table final fit layout',
      }}
    >
      <FurnitureBox anchor="againstWall" color="#5f4631" name="gala-bedroom-bed-frame-headboard-side-against-south-wall-clear-path-from-door" position={[planXToLocalX(8.68), 0.16, -1.74]} size={[1.72, 0.22, 1.18]} userData={{ bedAndWardrobeLayoutImproved: true, bedHeadboardAgainstWall: true, bedroomLayoutImproved: true, bedroomWalkPathClear: true, furnitureDoesNotClipWindows: true }} />
      <LegSet anchor="againstWall" color="#3f3024" depth={0.45} name="gala-bedroom-bed-frame" x={planXToLocalX(8.68)} y={0.18} z={-1.72} />
      <FurnitureBox anchor="againstWall" color={visual.bedBaseColor} name="gala-bedroom-mattress-readable-headboard-against-south-wall" position={[planXToLocalX(8.68), 0.38, -1.74]} size={[1.58, 0.24, 1.06]} userData={{ bedAndWardrobeLayoutImproved: true, bedHeadboardAgainstWall: true, bedroomLayoutImproved: true, bedroomWalkPathClear: true, furnitureDoesNotClipWindows: true }} />
      <FurnitureBox anchor="againstWall" color={visual.blanketColor} name="gala-bedroom-folded-blanket-cue" position={[planXToLocalX(8.68), 0.58, -1.42]} size={[1.18, 0.1, 0.58]} userData={{ bedAndWardrobeLayoutImproved: true, bedroomLayoutImproved: true }} />
      <FurnitureBox anchor="againstWall" color={GALA_MATERIALS.pillow} name="gala-bedroom-pillow-pair-left-at-headboard-wall" position={[planXToLocalX(8.34), 0.68, -2.08]} size={[0.42, 0.14, 0.28]} userData={{ bedAndWardrobeLayoutImproved: true, bedHeadboardAgainstWall: true, bedroomLayoutImproved: true }} />
      <FurnitureBox anchor="againstWall" color={GALA_MATERIALS.pillow} name="gala-bedroom-pillow-pair-right-at-headboard-wall" position={[planXToLocalX(8.92), 0.68, -2.08]} size={[0.42, 0.14, 0.28]} userData={{ bedAndWardrobeLayoutImproved: true, bedHeadboardAgainstWall: true, bedroomLayoutImproved: true }} />
      <FurnitureBox anchor="againstWall" color="#6f4b2c" name="gala-bedroom-low-headboard-on-south-wall-behind-pillows" position={[planXToLocalX(8.68), 0.56, -2.36]} size={[1.78, 0.62, 0.08]} userData={{ bedAndWardrobeLayoutImproved: true, bedHeadboardAgainstWall: true, bedroomLayoutImproved: true }} />
      <FurnitureBox anchor="againstWall" color={visual.wardrobeColor} name="gala-bedroom-wardrobe-against-east-wall-clear-of-bed-and-window" position={[planXToLocalX(9.95), 0.98, 1.12]} size={[0.34, 1.72, 1.18]} userData={{ bedAndWardrobeLayoutImproved: true, bedroomLayoutImproved: true, bedroomWalkPathClear: true }} />
      <FurnitureBox anchor="againstWall" color="#1f2937" name="gala-bedroom-wardrobe-vertical-handle" position={[planXToLocalX(9.76), 1.02, 1.12]} size={[0.045, 0.56, 0.035]} userData={{ bedAndWardrobeLayoutImproved: true, bedroomLayoutImproved: true }} />
      <FurnitureBox anchor="besideBed" color={visual.tableColor} name="gala-bedroom-bedside-cabinet-at-headboard-side" position={[planXToLocalX(7.72), 0.34, -2.04]} size={[0.44, 0.08, 0.34]} userData={{ bedAndWardrobeLayoutImproved: true, bedsideCabinetAtHeadboardSide: true, bedroomLayoutImproved: true }} />
      <LegSet anchor="besideBed" color="#3f3024" depth={0.12} name="gala-bedroom-bedside-cabinet" x={planXToLocalX(7.72)} y={0.3} z={-2.04} />
      <FurnitureBox anchor="againstWall" color="#1f2937" name="gala-bedroom-wall-mounted-tv-opposite-bed" position={[planXToLocalX(8.68), 1.26, 2.36]} size={[1.02, 0.58, 0.045]} userData={{ bedAndWardrobeLayoutImproved: true, bedroomLayoutImproved: true, tvOppositeBedAddedOrJustified: true }} />
    </group>
  );
}
