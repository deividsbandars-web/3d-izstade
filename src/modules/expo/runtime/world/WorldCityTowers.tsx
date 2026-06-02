import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityTower } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(hex: string, targetHex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const target = targetHex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (value: string, index: number) => parseInt(value.slice(index, index + 2), 16);
  const mix = (value: number, targetValue: number) => Math.max(0, Math.min(255, Math.round(value + ((targetValue - value) * ratio))));
  return `#${[
    mix(channel(normalized, 0), channel(target, 0)),
    mix(channel(normalized, 2), channel(target, 2)),
    mix(channel(normalized, 4), channel(target, 4)),
  ].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
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
    ? mixHex(tintHex(fallbackColor, 0.22), globalHudAccent, 0.24)
    : mixHex(tintHex(fallbackColor, 0.12), globalHudAccent, 0.16);
  const color = emissiveIntensity > 0.02 ? tintHex(base, 0.08) : base;
  const materialEmissive = emissiveIntensity > 0 ? emissive : globalHudAccent;
  const materialEmissiveIntensity = emissiveIntensity > 0
    ? emissiveIntensity + (emissive === globalHudAccent ? 0.004 : 0)
    : 0.008;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.58 : 0.64}
      metalness={0.08}
      emissive={materialEmissive}
      emissiveIntensity={materialEmissiveIntensity}
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
                const hasEmissive = (primitive.emissiveIntensity ?? 0) > 0;
                const color = mixHex(tintHex(primitive.color, hasEmissive ? 0.08 : 0.03), visualProfile.global.hudAccent, hasEmissive ? 0.2 : 0.14);
                const emissive = primitive.emissive ?? visualProfile.global.hudAccent;
                const emissiveIntensity = (primitive.emissiveIntensity ?? 0) + (primitive.emissive ? 0 : 0.008);

                return (
                  <mesh key={`${tower.id}:cylinder:${index}`} position={primitive.position} rotation={primitive.rotation}>
                    <cylinderGeometry args={[primitive.radiusTop, primitive.radiusBottom, primitive.height, primitive.radialSegments ?? 12]} />
                    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} metalness={primitive.metalness ?? 0.18} roughness={primitive.roughness ?? 0.32} />
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
