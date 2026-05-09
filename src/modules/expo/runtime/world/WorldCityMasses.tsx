import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityMass } from '../planning/types';
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
    ? tintHex(fallbackColor, 0.12)
    : tintHex(shadeHex(fallbackColor, 0.08), 0.04);
  const color = emissiveIntensity > 0.018 ? tintHex(base, 0.04) : base;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.68 : 0.74}
      metalness={0.06}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity + (emissiveIntensity > 0 && emissive === globalHudAccent ? 0.004 : 0)}
    />
  );
}

export function WorldCityMasses({
  masses,
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  masses: CityMass[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  void _stadiumReserve;

  return (
    <>
      {masses.map((mass) => {
          const intent = mass.renderIntent;

          if (intent?.skipBase) {
            return null;
          }

          return (
            <group
              key={mass.id}
              name={`city-mass:${mass.id}`}
              position={[mass.position[0], 0, mass.position[2]]}
              rotation={mass.rotation ?? [0, 0, 0]}
            >
              <mesh receiveShadow position={[0, mass.size[1] * 0.5, 0]}>
                <boxGeometry args={mass.size} />
                <WorldArchitecturalMassMaterial
                  fallbackColor={mass.color}
                  globalHudAccent={visualProfile.global.hudAccent}
                  emissive={intent?.emissive ?? '#000000'}
                  emissiveIntensity={intent?.emissiveIntensity ?? 0}
                />
              </mesh>
              {intent?.showHorizontalCap && (
                <mesh position={[0, mass.size[1] + 0.4, 0]}>
                  <boxGeometry args={[mass.size[0] * 0.78, 0.9, mass.size[2] * 0.78]} />
                  <meshStandardMaterial color="#96a5b0" roughness={0.58} metalness={0.14} />
                </mesh>
              )}
              {intent?.showSignatureBand && (
                <mesh position={[0, mass.size[1] * 0.28, mass.size[2] * 0.18]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.28), Math.max(8, mass.size[1] * 0.08), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8f9ea9" emissive="#bdd7e6" emissiveIntensity={0.012} roughness={0.46} metalness={0.18} />
                </mesh>
              )}
              {intent?.showSideInset && (
                <>
                  <mesh position={[-mass.size[0] * 0.24, mass.size[1] * 0.54, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.1), Math.max(16, mass.size[1] * 0.24), Math.max(8, mass.size[2] * 0.16)]} />
                    <meshStandardMaterial color="#90a0ab" roughness={0.46} metalness={0.18} />
                  </mesh>
                  <mesh position={[mass.size[0] * 0.24, mass.size[1] * 0.5, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.08), Math.max(14, mass.size[1] * 0.2), Math.max(8, mass.size[2] * 0.14)]} />
                    <meshStandardMaterial color="#8a99a4" emissive="#b5cfde" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                  </mesh>
                </>
              )}
              {intent?.showSignatureBand && mass.size[1] > 48 && (
                <mesh position={[0, mass.size[1] * 0.62, 0]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.16), Math.max(18, mass.size[1] * 0.18), Math.max(8, mass.size[2] * 0.16)]} />
                  <meshStandardMaterial color="#93a2ac" emissive="#b9d4e3" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                </mesh>
              )}
              {intent?.showRearSpine && (
                <mesh position={[0, mass.size[1] * 0.68, -mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.12), Math.max(18, mass.size[1] * 0.18), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8897a2" emissive="#b5cfde" emissiveIntensity={0.01} roughness={0.48} metalness={0.14} />
                </mesh>
              )}
              {intent?.showFrontWing && (
                <mesh position={[0, mass.size[1] * 0.34, mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.26), Math.max(10, mass.size[1] * 0.12), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#91a0ab" emissive="#bdd7e6" emissiveIntensity={0.01} roughness={0.46} metalness={0.16} />
                </mesh>
              )}
            </group>
          );
        })}
    </>
  );
}
