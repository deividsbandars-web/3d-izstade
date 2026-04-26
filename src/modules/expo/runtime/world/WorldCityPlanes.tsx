import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityPlane, StadiumReserve } from './WorldCitySkeletonLayout';

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function resolveStructuralCityPlaneTone(id: string, visualProfile: ExpoWorldVisualProfile) {
  if (id.startsWith('arrival-')) {
    return tintHex(visualProfile.global.groundBase, 0.08);
  }

  return visualProfile.global.groundBase;
}

function filterVisibleStructuralCityPlanes(planes: CityPlane[]) {
  return planes.filter((plane) => plane.role === 'structural');
}

function PlaneLayer({
  planes,
  roughness,
  visualProfile,
}: {
  planes: CityPlane[];
  roughness: number;
  visualProfile: ExpoWorldVisualProfile;
}) {
  return (
    <>
      {planes.map((plane) => (
        <group key={plane.id} name={`city-plane:${plane.id}`} position={plane.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={8}>
            <planeGeometry args={plane.size} />
            <meshStandardMaterial
              color={resolveStructuralCityPlaneTone(plane.id, visualProfile)}
              roughness={Math.max(roughness, 0.88)}
              metalness={0.01}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function WorldCityPlanes({
  planes,
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  planes: CityPlane[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  void _stadiumReserve;
  // Stadium/city perimeter connectors are owned by ExpoRearCampus, not by city structural planes.
  const structuralPlanes = filterVisibleStructuralCityPlanes(planes);

  return (
    <group name="world-ground:city-structural-planes">
      <PlaneLayer planes={structuralPlanes} roughness={0.72} visualProfile={visualProfile} />
    </group>
  );
}
