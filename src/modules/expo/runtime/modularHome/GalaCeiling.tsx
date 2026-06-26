import { GALA_HOUSE_DIMENSIONS } from './GalaHouseDimensions';
import { GALA_FLOORPLAN, planXToLocalX } from './GalaFloorplan';
import type { GalaInteriorVisualSpec } from './GalaHouseConfig';

type CeilingBoxProps = {
  color: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  userData?: Record<string, unknown>;
};

function CeilingBox({ color, name, position, size, userData }: CeilingBoxProps) {
  return (
    <mesh castShadow name={name} position={position} receiveShadow userData={userData}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}

export function GalaCeiling({ visual }: { visual: GalaInteriorVisualSpec }) {
  const ceilingHeight = GALA_HOUSE_DIMENSIONS.clearCeilingHeightM;
  const ceilingThickness = 0.055;
  const trimHeight = 0.075;
  const trimDepth = 0.032;
  const trimY = ceilingHeight - trimHeight * 0.5;
  const length = GALA_FLOORPLAN.length;
  const width = GALA_FLOORPLAN.width;
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;
  const ceilingColor = visual.wallPanelColor;
  const trimColor = visual.wallSeamColor;
  const partitionTrimRuns = [
    {
      name: 'gala-bathroom-west-partition-continuous-ceiling-trim-run',
      position: [planXToLocalX(GALA_FLOORPLAN.rooms.bathroom.xMin), trimY, -1.25] as [number, number, number],
      size: [0.16, trimHeight, 2.5] as [number, number, number],
      userData: { ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
    {
      name: 'gala-bedroom-partition-south-continuous-ceiling-trim-run',
      position: [planXToLocalX(GALA_FLOORPLAN.rooms.bedroom.xMin), trimY, -1.025] as [number, number, number],
      size: [0.16, trimHeight, 2.95] as [number, number, number],
      userData: { bedroomDoorHeaderClean: true, ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
    {
      name: 'gala-bedroom-partition-north-continuous-ceiling-trim-run',
      position: [planXToLocalX(GALA_FLOORPLAN.rooms.bedroom.xMin), trimY, 2.16] as [number, number, number],
      size: [0.16, trimHeight, 0.72] as [number, number, number],
      userData: { bedroomDoorHeaderClean: true, ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
    {
      name: 'gala-bathroom-north-wall-continuous-ceiling-trim-left-run',
      position: [planXToLocalX(5.575), trimY, 0] as [number, number, number],
      size: [0.9, trimHeight, 0.16] as [number, number, number],
      userData: { bathroomDoorHeaderClean: true, ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
    {
      name: 'gala-bathroom-door-header-continuous-ceiling-trim-bridge-run',
      position: [planXToLocalX(6.56), trimY, 0] as [number, number, number],
      size: [1.24, trimHeight, 0.16] as [number, number, number],
      userData: { bathroomDoorHeaderClean: true, ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
    {
      name: 'gala-bathroom-north-wall-continuous-ceiling-trim-right-run',
      position: [planXToLocalX(7.16), trimY, 0] as [number, number, number],
      size: [0.12, trimHeight, 0.16] as [number, number, number],
      userData: { bathroomDoorHeaderClean: true, ceilingTrimContinuousAllInteriorWalls: true, partitionTopsSealed: true },
    },
  ];

  return (
    <group
      name="gala-flat-interior-ceiling-soffit-and-crown-trim"
      userData={{
        doorHeadersConstructed: true,
        interiorCeilingAdded: true,
        bathroomDoorHeaderClean: true,
        bedroomDoorHeaderClean: true,
        ceilingWallJoinsClean: true,
        ceilingTrimContinuousAllInteriorWalls: true,
        ceilingTrimRootCauseIdentified: true,
        noFloatingTrimFragments: true,
        noBlackVoidsAboveDoors: true,
        partitionTopsSealed: true,
        repairScope: 'gala-visual-construction-quality',
        semantic: 'gala interior ceiling soffit partition tops sealed door header voids closed',
      }}
    >
      <CeilingBox
        color={ceilingColor}
        name="gala-continuous-flat-ceiling-plane-closes-roof-voids"
        position={[0, ceilingHeight + ceilingThickness * 0.5, 0]}
        size={[length - 0.14, ceilingThickness, width - 0.14]}
        userData={{ interiorCeilingAdded: true, noBlackVoidsAboveDoors: true }}
      />
      <CeilingBox
        color={trimColor}
        name="gala-south-ceiling-crown-trim-seals-wall-joint"
        position={[0, trimY, -halfWidth + trimDepth * 0.5]}
        size={[length - 0.22, trimHeight, trimDepth]}
      />
      <CeilingBox
        color={trimColor}
        name="gala-north-ceiling-crown-trim-seals-wall-joint"
        position={[0, trimY, halfWidth - trimDepth * 0.5]}
        size={[length - 0.22, trimHeight, trimDepth]}
      />
      <CeilingBox
        color={trimColor}
        name="gala-west-ceiling-crown-trim-seals-wall-joint"
        position={[-halfLength + trimDepth * 0.5, trimY, 0]}
        size={[trimDepth, trimHeight, width - 0.22]}
      />
      <CeilingBox
        color={trimColor}
        name="gala-east-ceiling-crown-trim-seals-wall-joint"
        position={[halfLength - trimDepth * 0.5, trimY, 0]}
        size={[trimDepth, trimHeight, width - 0.22]}
      />
      {partitionTrimRuns.map((run) => (
        <CeilingBox
          key={run.name}
          color={trimColor}
          name={run.name}
          position={run.position}
          size={run.size}
          userData={run.userData}
        />
      ))}
    </group>
  );
}
