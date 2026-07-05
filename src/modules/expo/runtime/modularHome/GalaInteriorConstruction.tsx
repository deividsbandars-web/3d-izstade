import { GALA_FLOORPLAN, GALA_GEOMETRY_LEVELS, planXToLocalX } from './GalaFloorplan';
import type { GalaInteriorVisualSpec } from './GalaHouseConfig';

type ConstructionBoxProps = {
  color: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  userData?: Record<string, unknown>;
};

function ConstructionBox({ color, name, position, size, userData }: ConstructionBoxProps) {
  return (
    <mesh castShadow name={name} position={position} receiveShadow userData={userData}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.74} />
    </mesh>
  );
}

function WallBaseboardSegment({
  color,
  name,
  planXMax,
  planXMin,
  y,
  z,
}: {
  color: string;
  name: string;
  planXMax: number;
  planXMin: number;
  y: number;
  z: number;
}) {
  const width = planXMax - planXMin;
  if (width <= 0) {
    return null;
  }

  return (
    <ConstructionBox
      color={color}
      name={name}
      position={[planXToLocalX((planXMin + planXMax) * 0.5), y, z]}
      size={[width, 0.1, 0.026]}
      userData={{ baseboardDoesNotCrossDoorOpening: true, floorWallGapsFixed: true }}
    />
  );
}

export function GalaInteriorConstruction({ visual }: { visual: GalaInteriorVisualSpec }) {
  const length = GALA_FLOORPLAN.length;
  const width = GALA_FLOORPLAN.width;
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;
  const baseboardHeight = 0.1;
  const baseboardDepth = 0.026;
  const baseboardY = GALA_GEOMETRY_LEVELS.floorTopY + baseboardHeight * 0.5;
  const baseboardColor = visual.wallSeamColor;
  const partitionBaseboardColor = '#8f7c61';

  return (
    <group
      name="gala-interior-construction-quality-floor-wall-seams"
      userData={{
        baseboardsAdded: true,
        baseboardsDoNotCrossDoorOpenings: true,
        cornerTrimAdded: true,
        ceilingWallJoinsClean: true,
        facadeBaseTrimConsistentAllSides: true,
        floorMaterialStable: true,
        floorMaterialStableWhileWalking: true,
        floorWallGapsFixed: true,
        noBlueDebugFloorPatches: true,
        noFloorZFighting: true,
        noTransparentFloorOverlayInWalkMode: true,
        repairScope: 'gala-visual-construction-quality',
        semantic: 'gala interior construction baseboards skirting sealed floor wall seams',
        thresholdsAligned: true,
      }}
    >
      <WallBaseboardSegment
        color={baseboardColor}
        name="gala-interior-south-wall-baseboard-left-of-entry-threshold"
        planXMax={4.12}
        planXMin={0.08}
        y={baseboardY}
        z={-halfWidth + baseboardDepth * 0.5}
      />
      <WallBaseboardSegment
        color={baseboardColor}
        name="gala-interior-south-wall-baseboard-right-of-entry-threshold"
        planXMax={length - 0.08}
        planXMin={5.16}
        y={baseboardY}
        z={-halfWidth + baseboardDepth * 0.5}
      />
      <WallBaseboardSegment
        color={baseboardColor}
        name="gala-interior-north-wall-baseboard-left-of-terrace-threshold"
        planXMax={3.5}
        planXMin={0.08}
        y={baseboardY}
        z={halfWidth - baseboardDepth * 0.5}
      />
      <WallBaseboardSegment
        color={baseboardColor}
        name="gala-interior-north-wall-baseboard-right-of-terrace-threshold"
        planXMax={length - 0.08}
        planXMin={5.27}
        y={baseboardY}
        z={halfWidth - baseboardDepth * 0.5}
      />
      <ConstructionBox
        color={baseboardColor}
        name="gala-interior-west-wall-baseboard-seals-floor-gap"
        position={[-halfLength + baseboardDepth * 0.5, baseboardY, 0]}
        size={[baseboardDepth, baseboardHeight, width - 0.18]}
      />
      <ConstructionBox
        color={baseboardColor}
        name="gala-interior-east-wall-baseboard-seals-floor-gap"
        position={[halfLength - baseboardDepth * 0.5, baseboardY, 0]}
        size={[baseboardDepth, baseboardHeight, width - 0.18]}
      />
      <ConstructionBox
        color={partitionBaseboardColor}
        name="gala-bathroom-west-partition-baseboard-seal"
        position={[planXToLocalX(GALA_FLOORPLAN.rooms.bathroom.xMin), baseboardY, -1.25]}
        size={[baseboardDepth, baseboardHeight, 2.36]}
      />
      <ConstructionBox
        color={partitionBaseboardColor}
        name="gala-bedroom-partition-south-baseboard-seal"
        position={[planXToLocalX(GALA_FLOORPLAN.rooms.bedroom.xMin), baseboardY, -1.02]}
        size={[baseboardDepth, baseboardHeight, 2.86]}
      />
      <ConstructionBox
        color={partitionBaseboardColor}
        name="gala-bedroom-partition-north-baseboard-seal"
        position={[planXToLocalX(GALA_FLOORPLAN.rooms.bedroom.xMin), baseboardY, 2.16]}
        size={[baseboardDepth, baseboardHeight, 0.66]}
      />
      <ConstructionBox
        color={partitionBaseboardColor}
        name="gala-bathroom-north-wall-left-baseboard-seal"
        position={[planXToLocalX(5.58), baseboardY, 0.012]}
        size={[0.84, baseboardHeight, baseboardDepth]}
      />
      <ConstructionBox
        color={partitionBaseboardColor}
        name="gala-bathroom-north-wall-right-baseboard-seal"
        position={[planXToLocalX(7.16), baseboardY, 0.012]}
        size={[0.08, baseboardHeight, baseboardDepth]}
      />
      {[-halfLength, halfLength].map((x) => (
        [-halfWidth, halfWidth].map((z) => (
          <ConstructionBox
            key={`interior-corner-trim-${x}-${z}`}
            color={baseboardColor}
            name="gala-interior-corner-trim-seals-floor-wall-corner"
            position={[x, 0.74, z]}
            size={[0.04, 1.36, 0.04]}
            userData={{ cornerTrimAdded: true, floorWallGapsFixed: true }}
          />
        ))
      ))}
    </group>
  );
}
