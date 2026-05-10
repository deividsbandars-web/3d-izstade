import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityPlane, StadiumReserve } from './WorldCitySkeletonLayout';
import {
  CITY_STRUCTURAL_GROUND_ARRIVAL_OPACITY,
  CITY_STRUCTURAL_GROUND_OPACITY,
} from './WorldGroundLayout';

function parseHex(hex: string) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
}

function formatHex(channels: number[]) {
  return `#${channels.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
}

function tintHex(hex: string, ratio: number) {
  const channels = parseHex(hex);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return formatHex(channels.map(mix));
}

function blendHex(source: string, target: string, targetRatio: number) {
  const sourceChannels = parseHex(source);
  const targetChannels = parseHex(target);
  return formatHex(sourceChannels.map((value, index) => value + ((targetChannels[index] - value) * targetRatio)));
}

function resolveStructuralCityPlaneTone(plane: CityPlane, visualProfile: ExpoWorldVisualProfile) {
  const authoredTone = plane.color || visualProfile.global.groundBase;
  const unifiedTone = blendHex(authoredTone, visualProfile.global.groundBase, 0.82);
  if (plane.id.startsWith('arrival-')) {
    return tintHex(unifiedTone, 0.012);
  }

  return unifiedTone;
}

function resolveStructuralCityPlaneOpacity(plane: CityPlane) {
  return plane.id.startsWith('arrival-')
    ? CITY_STRUCTURAL_GROUND_ARRIVAL_OPACITY
    : CITY_STRUCTURAL_GROUND_OPACITY;
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
              color={resolveStructuralCityPlaneTone(plane, visualProfile)}
              depthWrite={false}
              metalness={0.01}
              opacity={resolveStructuralCityPlaneOpacity(plane)}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
              roughness={Math.max(roughness, 0.88)}
              transparent
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
