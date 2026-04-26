import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityTower } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function shadeHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value * (1 - ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function WorldArchitecturalMassMaterial({
  fallbackColor,
  globalHudAccent,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  globalHudAccent: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const base = emissiveIntensity > 0.012
    ? tintHex(fallbackColor, 0.1)
    : tintHex(shadeHex(fallbackColor, 0.08), 0.04);
  const color = emissiveIntensity > 0.02 ? tintHex(base, 0.04) : base;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.66 : 0.74}
      metalness={0.06}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity + (emissiveIntensity > 0 && emissive === globalHudAccent ? 0.004 : 0)}
    />
  );
}

export function WorldCityTowers({
  towers,
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  towers: CityTower[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  void _stadiumReserve;
  return (
    <>
      {towers
        .map((tower) => {
          const primitives = tower.renderIntent?.primitives ?? [];

          return (
          <group key={tower.id} name={`city-tower:${tower.id}`} position={[tower.position[0], 0, tower.position[2]]}>
            {primitives.map((primitive, index) => {
              if (primitive.kind === 'box') {
                return (
                  <mesh key={`${tower.id}:box:${index}`} position={primitive.position} rotation={primitive.rotation} receiveShadow>
                    <boxGeometry args={primitive.size} />
                    <WorldArchitecturalMassMaterial
                      fallbackColor={primitive.color}
                      globalHudAccent={visualProfile.global.hudAccent}
                      emissive={primitive.emissive}
                      emissiveIntensity={primitive.emissiveIntensity}
                    />
                  </mesh>
                );
              }

              if (primitive.kind === 'cylinder') {
                return (
                  <mesh key={`${tower.id}:cylinder:${index}`} position={primitive.position} rotation={primitive.rotation}>
                    <cylinderGeometry args={[primitive.radiusTop, primitive.radiusBottom, primitive.height, primitive.radialSegments ?? 12]} />
                    <meshStandardMaterial color={primitive.color} emissive={primitive.emissive} emissiveIntensity={primitive.emissiveIntensity ?? 0} metalness={primitive.metalness ?? 0.16} roughness={primitive.roughness ?? 0.34} />
                  </mesh>
                );
              }

              return null;
            })}
          </group>
        )})}
    </>
  );
}
